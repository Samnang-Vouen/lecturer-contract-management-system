import { Op, Sequelize } from 'sequelize';
import fs from 'fs';
import path from 'path';
import { LecturerProfile, User, Department, Role } from '../model/index.js';
import Candidate from '../model/candidate.model.js';
import LecturerCourse from '../model/lecturerCourse.model.js';
import Course from '../model/course.model.js';
import { findOrCreateResearchFields } from './researchField.controller.js';
import { findOrCreateUniversities } from './university.controller.js';
import { findOrCreateMajors } from './major.controller.js';

/**
 * GET /api/lecturers
 * Returns lecturers sourced directly from Lecturer_Profiles + joined User.
 * Query params: page (1-based), limit (default 10), search
 */
export const getLecturers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
    const offset = (page - 1) * limit;
    const search = (req.query.search || '').trim();
    const statusFilter = (req.query.status || '').trim();
    const departmentFilter = (req.query.department || '').trim();
    // Position filtering removed (UI no longer supports it).
    const roleQuery = req.query.role;
    const roleFilters = (Array.isArray(roleQuery)
      ? roleQuery
      : typeof roleQuery === 'string'
        ? roleQuery.split(',')
        : [])
      .map((r) => String(r || '').trim().toLowerCase())
      .filter((r) => ['advisor', 'lecturer'].includes(r));

    // Build LecturerProfile where conditions safely (avoid spreading Sequelize.where objects).
    const profileAnd = [];

    if (search) {
      const like = `%${search}%`;
      profileAnd.push({
        [Op.or]: [
          // search stored full-name fields on LecturerProfile
          { full_name_english: { [Op.like]: like } },
          { full_name_khmer: { [Op.like]: like } },
          // also allow searching the user's display name or email
          Sequelize.where(Sequelize.col('User.display_name'), { [Op.like]: like }),
          Sequelize.where(Sequelize.col('User.email'), { [Op.like]: like }),
        ],
      });
    }

    void departmentFilter;

    const where = profileAnd.length
      ? profileAnd.length === 1
        ? profileAnd[0]
        : { [Op.and]: profileAnd }
      : undefined;

    // Filters that apply to User (status)
    const userWhere = {};
    if (statusFilter && ['active', 'inactive'].includes(statusFilter))
      userWhere.status = statusFilter;

    // Role filter is stored in user_roles + roles (not users table)
    const roleExistsLiteral = roleFilters.length
      ? Sequelize.literal(`EXISTS (
          SELECT 1
          FROM user_roles ur
          INNER JOIN roles r ON ur.role_id = r.id
          WHERE ur.user_id = User.id
          AND r.name IN (${roleFilters.map((r) => `'${r}'`).join(', ')})
        )`)
      : null;

    // For department admins, we'll add a where condition that checks if the lecturer
    // teaches any courses in the admin's department using EXISTS subquery
    let profileWhere = where;
    if (req.user?.role === 'admin' && req.user.department_name) {
      const dept = await Department.findOne({ where: { dept_name: req.user.department_name } });
      if (dept) {
        // Add a condition to only show lecturers who teach courses in this department.
        // Also include advisors who belong to this department (they may not have courses).
        const deptScopeCondition = {
          [Op.or]: [
            Sequelize.literal(`EXISTS (
              SELECT 1 
              FROM Lecturer_Courses lc 
              INNER JOIN Courses c ON lc.course_id = c.id 
              WHERE lc.lecturer_profile_id = LecturerProfile.id 
              AND c.dept_id = ${parseInt(dept.id)}
            )`),
            Sequelize.and(
              Sequelize.literal(`EXISTS (
                SELECT 1
                FROM user_roles ur
                INNER JOIN roles r ON ur.role_id = r.id
                WHERE ur.user_id = User.id
                AND r.name = 'advisor'
              )`),
              Sequelize.where(Sequelize.col('User.department_name'), req.user.department_name)
            ),
          ],
        };

        profileWhere = profileWhere
          ? { [Op.and]: [profileWhere, deptScopeCondition] }
          : deptScopeCondition;
      }
    }

    // Apply role filter last so it composes with search + department scoping.
    if (roleExistsLiteral) {
      const existingAnd = profileWhere?.[Op.and]
        ? profileWhere[Op.and]
        : profileWhere
          ? [profileWhere]
          : [];
      profileWhere = { [Op.and]: [...existingAnd, roleExistsLiteral] };
    }

    const { rows, count } = await LecturerProfile.findAndCountAll({
      attributes: [
        'id',
        'employee_id',
        'position',
        'status',
        'join_date',
        'cv_uploaded',
        'research_fields',
        'qualifications',
        'full_name_english',
        'full_name_khmer',
        'cv_file_path',
      ],
      include: [
        {
          model: User,
          attributes: [
            'id',
            'email',
            'status',
            'last_login',
            'department_name',
            'display_name',
            'created_at',
          ],
          where: Object.keys(userWhere).length ? userWhere : undefined,
          required: true,
          include: [
            {
              model: Role,
              as: 'Roles',
              attributes: ['role_type'],
              through: { attributes: [] },
              required: false,
            },
          ],
        },
      ],
      where: profileWhere,
      limit,
      offset,
      distinct: true,
      order: [['id', 'DESC']],
    });

    // Optionally compute course counts (only count courses from admin's department)
    const profileIds = rows.map((r) => r.id);
    let countsMap = new Map();
    if (profileIds.length) {
      if (req.user?.role === 'admin' && req.user.department_name) {
        const dept = await Department.findOne({ where: { dept_name: req.user.department_name } });
        if (dept) {
          // Count only courses from the admin's department
          const counts = await LecturerCourse.findAll({
            attributes: [
              'lecturer_profile_id',
              [Sequelize.fn('COUNT', Sequelize.col('LecturerCourse.id')), 'cnt'],
            ],
            where: { lecturer_profile_id: { [Op.in]: profileIds } },
            include: [
              {
                model: Course,
                where: { dept_id: dept.id },
                attributes: [],
              },
            ],
            group: ['lecturer_profile_id'],
          });
          counts.forEach((c) =>
            countsMap.set(c.lecturer_profile_id, parseInt(c.get('cnt'), 10) || 0)
          );
        }
      } else {
        // For superadmins, count all courses
        const counts = await LecturerCourse.findAll({
          attributes: [
            'lecturer_profile_id',
            [Sequelize.fn('COUNT', Sequelize.col('LecturerCourse.id')), 'cnt'],
          ],
          where: { lecturer_profile_id: { [Op.in]: profileIds } },
          group: ['lecturer_profile_id'],
        });
        counts.forEach((c) =>
          countsMap.set(c.lecturer_profile_id, parseInt(c.get('cnt'), 10) || 0)
        );
      }
    }

    // Fetch LecturerCourse rows with Course include (filter by department for admins)
    let coursesMap = new Map();
    if (profileIds.length) {
      let courseInclude = [
        {
          model: Course,
          attributes: ['id', 'course_code', 'course_name', 'dept_id'],
        },
      ];

      // For department admins, filter courses to only show courses from their department
      if (req.user?.role === 'admin' && req.user.department_name) {
        const dept = await Department.findOne({ where: { dept_name: req.user.department_name } });
        if (dept) {
          courseInclude[0].where = { dept_id: dept.id };
          courseInclude[0].required = false; // Use LEFT JOIN to still show lecturers even if no courses in this department
        }
      }

      const lcRows = await LecturerCourse.findAll({
        where: { lecturer_profile_id: { [Op.in]: profileIds } },
        include: courseInclude,
        order: [['id', 'ASC']],
      });

      lcRows.forEach((lc) => {
        const pid = lc.lecturer_profile_id;
        const courseObj = lc.Course
          ? {
              id: lc.Course.id,
              course_code: lc.Course.course_code,
              course_name: lc.Course.course_name,
              dept_id: lc.Course.dept_id,
            }
          : null;
        if (!coursesMap.has(pid)) coursesMap.set(pid, []);
        if (courseObj) coursesMap.get(pid).push(courseObj);
      });
    }

    const data = rows.map((lp) => {
      const name =
        lp.full_name_english ||
        lp.full_name_khmer ||
        lp.User?.display_name ||
        (lp.User?.email ? lp.User.email.split('@')[0].replace(/\./g, ' ') : 'Unknown');

      const roleTypes = Array.isArray(lp.User?.Roles)
        ? lp.User.Roles.map((r) => r?.role_type).filter(Boolean)
        : [];

      // Keep role filtering inclusive: a dual-role user should still appear for either filter.
      // For UX, if a single role filter is active (?role=lecturer), reflect that in the returned `role`.
      const singleRoleFilter = roleFilters.length === 1 ? roleFilters[0] : null;
      const role =
        singleRoleFilter && roleTypes.includes(singleRoleFilter)
          ? singleRoleFilter
          : roleTypes.includes('advisor')
            ? 'advisor'
            : roleTypes.includes('lecturer')
              ? 'lecturer'
              : roleTypes[0] || 'lecturer';
      // For department admins, show their department instead of lecturer's original department
      const displayDepartment =
        req.user?.role === 'admin' && req.user.department_name
          ? req.user.department_name
          : lp.User?.department_name || 'General';

      // Get research fields from the new relationship, fallback to legacy comma-separated field
      const researchFields =
        lp.ResearchFields && lp.ResearchFields.length > 0
          ? lp.ResearchFields.map((rf) => rf.name)
          : lp.research_fields
            ? lp.research_fields
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            : [];

      return {
        id: lp.User?.id,
        lecturerProfileId: lp.id,
        name,
        email: lp.User?.email,
        role,
        roles: roleTypes,
        department: displayDepartment,
        status: lp.User?.status || 'active',
        lastLogin: lp.User?.last_login || 'Never',
        employeeId: lp.employee_id,
        position: lp.position,
        joinedAt: lp.join_date,
        cvUploaded: lp.cv_uploaded,
        coursesCount: countsMap.get(lp.id) || 0,
        // attach course objects when available so UI can show names
        courses: (coursesMap && coursesMap.get(lp.id)) || [],
        specializations: researchFields.slice(0, 5),
        researchFields: researchFields,
      };
    });

    const totalPages = Math.ceil(count / limit) || 1;
    return res.status(200).json({ data, meta: { page, limit, total: count, totalPages } });
  } catch (error) {
    console.error('[getLecturers] error', error.message, error.stack);
    if (error.parent) {
      console.error('[getLecturers] parent', error.parent.message);
      console.error('[getLecturers] sql', error.sql);
    }
    return res.status(500).json({ message: 'Failed to fetch lecturers', error: error.message });
  }
};

/**
 * GET /api/lecturers/:id/detail
 * Returns extended lecturer info including departments & assigned courses.
 * :id is User.id for consistency with existing routes.
 */
export const getLecturerDetail = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (!userId) return res.status(400).json({ message: 'Invalid id' });

    // Some admin-only routes (e.g. advisor management) reuse this controller but should not
    // apply the course-based department access restriction.
    const skipDeptCourseAccessCheck = Boolean(req.skipDeptCourseAccessCheck);

    // Build course include with department filtering for admins
    let lecturerCourseInclude = [
      {
        model: Course,
        attributes: ['id', 'course_code', 'course_name', 'dept_id', 'hours', 'credits'],
      },
    ];

    // For department admins, filter courses to only show courses from their department
    if (!skipDeptCourseAccessCheck && req.user?.role === 'admin' && req.user.department_name) {
      const dept = await Department.findOne({ where: { dept_name: req.user.department_name } });
      if (dept) {
        lecturerCourseInclude[0].where = { dept_id: dept.id };
        lecturerCourseInclude[0].required = false; // Use LEFT JOIN to still show lecturer even if no courses in this department
      }
    }

    const profile = await LecturerProfile.findOne({
      where: { user_id: userId },
      include: [
        { model: User, attributes: ['id', 'email', 'status', 'department_name', 'last_login'] },
        { model: Department, attributes: ['id', 'dept_name'], through: { attributes: [] } },
        { model: LecturerCourse, include: lecturerCourseInclude },
      ],
    });
    if (!profile) return res.status(404).json({ message: 'Lecturer not found' });

    // Updated access control: admin can view lecturers who teach courses in their department
    if (!skipDeptCourseAccessCheck && req.user?.role === 'admin' && req.user.department_name) {
      const dept = await Department.findOne({ where: { dept_name: req.user.department_name } });
      if (dept) {
        // Check if this lecturer teaches any courses in the admin's department
        const hasCoursesInDepartment = await LecturerCourse.findOne({
          where: { lecturer_profile_id: profile.id },
          include: [
            {
              model: Course,
              where: { dept_id: dept.id },
              attributes: ['id'],
            },
          ],
        });

        if (!hasCoursesInDepartment) {
          return res
            .status(403)
            .json({ message: 'Access denied: lecturer does not teach in your department' });
        }
      }
    }
    const departments = profile.Departments?.map((d) => ({ id: d.id, name: d.dept_name })) || [];
    const courses =
      profile.LecturerCourses?.map((lc) => ({
        id: lc.Course?.id,
        course_id: lc.Course?.id,
        course_code: lc.Course?.course_code,
        course_name: lc.Course?.course_name,
        hours: lc.Course?.hours,
        credits: lc.Course?.credits,
        dept_id: lc.Course?.dept_id,
      })) || [];

    // For department admins, show their department instead of lecturer's original department
    const displayDepartment =
      req.user?.role === 'admin' && req.user.department_name
        ? req.user.department_name
        : profile.User?.department_name || 'General';

    // Lookup candidate by email first (most reliable), fallback to name matching
    let candidateId = null;
    let hourlyRateThisYear = null;
    try {
      let cand = null;
      
      // Primary: Try email match first (most reliable)
      if (profile.User?.email) {
        cand = await Candidate.findOne({ 
          where: { email: profile.User.email },
          attributes: ['id', 'fullName', 'email', 'hourlyRate']
        });
        console.log(`[getLecturerDetail] Email lookup for ${profile.User.email}:`, cand ? `Found (id: ${cand.id}, hourlyRate: ${cand.hourlyRate})` : 'Not found');
      }
      
      // Fallback: Try name matching with title normalization
      if (!cand && (profile.full_name_english || profile.User?.display_name)) {
        const rawName = profile.full_name_english || profile.User?.display_name || '';
        
        if (rawName) {
          // Try exact match first (case-insensitive)
          cand = await Candidate.findOne({
            where: Sequelize.where(
              Sequelize.fn('LOWER', Sequelize.fn('TRIM', Sequelize.col('fullName'))),
              Sequelize.fn('LOWER', rawName.trim())
            ),
            attributes: ['id', 'fullName', 'email', 'hourlyRate']
          });
          
          // If no exact match, try fuzzy matching by removing titles from both sides
          if (!cand) {
            const allCandidates = await Candidate.findAll({
              attributes: ['id', 'fullName', 'email', 'hourlyRate']
            });
            
            const titleRegex = /^(mr\.?|ms\.?|mrs\.?|dr\.?|prof\.?|professor|miss)\s+/i;
            const normalizeName = (s = '') =>
              String(s).trim().replace(titleRegex, '').replace(/\s+/g, ' ').trim().toLowerCase();
            
            const targetNormalized = normalizeName(rawName);
            cand = allCandidates.find(c => normalizeName(c.fullName) === targetNormalized);
          }
          
          console.log(`[getLecturerDetail] Name lookup for "${rawName}":`, cand ? `Found (id: ${cand.id}, hourlyRate: ${cand.hourlyRate})` : 'Not found');
        }
      }
      
      if (cand) {
        candidateId = cand.id;
        if (cand.hourlyRate != null) {
          hourlyRateThisYear = String(cand.hourlyRate);
        } else {
          console.warn(`[getLecturerDetail] Candidate found but hourlyRate is null for user ${profile.User?.email}`);
        }
      } else {
        console.warn(`[getLecturerDetail] No candidate record found for user ${profile.User?.email} / ${profile.full_name_english}`);
      }
    } catch (candErr) {
      console.error('[getLecturerDetail] candidate lookup failed:', candErr.message);
    }

    return res.json({
      id: profile.User?.id,
      lecturerProfileId: profile.id,
      name:
        profile.full_name_english ||
        profile.full_name_khmer ||
        profile.User?.display_name ||
        'Unknown',
      // Onboarding fields (return raw values so admin can view everything a user submitted)
      full_name_english: profile.full_name_english || null,
      full_name_khmer: profile.full_name_khmer || null,
      personal_email: profile.personal_email || null,
      email: profile.User?.email,
      status: profile.User?.status,
      department: displayDepartment,
      position: profile.position,
      occupation: profile.occupation || null,
      place: profile.place || null,
      phone: profile.phone_number || null,
      short_bio: profile.short_bio || null,
      country: profile.country || null,
      latest_degree: profile.latest_degree || null,
      degree_year: profile.degree_year || null,
      major: profile.major || null,
      university: profile.university || null,
      departments,
      courses,
      coursesCount: courses.length,
      candidateId,
      hourlyRateThisYear,
      // Derive a single education entry from normalized profile columns so UI (which expects an array) can render it
      education:
        profile.latest_degree || profile.university || profile.major || profile.degree_year
          ? [
              {
                id: `edu-${profile.id}`,
                degree: profile.latest_degree || null,
                institution: profile.university || null,
                major: profile.major || null,
                year: profile.degree_year || null,
              },
            ]
          : [],
      // Placeholder experience array (no dedicated schema yet). Extend later if/when experience history is modeled.
      experience: [],
      qualifications: profile.qualifications || null,
      research_fields: profile.research_fields || null,
      researchFields: profile.research_fields
        ? profile.research_fields
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      cvUploaded: profile.cv_uploaded,
      cvFilePath: profile.cv_file_path
        ? String(profile.cv_file_path).replace(/\\/g, '/').replace(/^\//, '')
        : null,
      syllabusUploaded: profile.upload_syllabus || false,
      syllabusFilePath: profile.course_syllabus
        ? String(profile.course_syllabus).replace(/\\/g, '/').replace(/^\//, '')
        : null,
      // Bank / payroll fields (read from Lecturer_Profiles)
      bank_name: profile.bank_name || null,
      account_name: profile.account_name || null,
      account_number: profile.account_number || null,
      payrollPath: profile.pay_roll_in_riel
        ? String(profile.pay_roll_in_riel).replace(/\\/g, '/').replace(/^\//, '')
        : null,
      lastLogin: profile.User?.last_login || 'Never',
    });
  } catch (e) {
    console.error('[getLecturerDetail] error', e);
    return res.status(500).json({ message: 'Failed to get detail', error: e.message });
  }
};

/**
 * PUT /api/lecturers/:id/courses { course_ids: number[] }
 * Replaces lecturer's assigned courses.
 */
export const updateLecturerCourses = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const courseIdsRaw = req.body.course_ids;
    if (!Array.isArray(courseIdsRaw))
      return res.status(400).json({ message: 'course_ids array required' });
    const courseIds = courseIdsRaw.map((n) => parseInt(n, 10)).filter((n) => Number.isInteger(n));
    if (!courseIds.length) {
      return res.status(400).json({ message: 'At least one course id required' });
    }

    const profile = await LecturerProfile.findOne({ where: { user_id: userId } });
    if (!profile) return res.status(404).json({ message: 'Lecturer not found' });

    // For department admins, validate that all courses belong to their department
    let coursesWhere = { id: courseIds };
    if (req.user?.role === 'admin' && req.user.department_name) {
      const dept = await Department.findOne({ where: { dept_name: req.user.department_name } });
      if (!dept) {
        return res.status(400).json({ message: 'Your department not found' });
      }
      coursesWhere.dept_id = dept.id;
    }

    const courses = await Course.findAll({ where: coursesWhere });

    // Validate that all requested courses were found (and belong to admin's department if applicable)
    if (courses.length !== courseIds.length) {
      const foundIds = courses.map((c) => c.id);
      const missingIds = courseIds.filter((id) => !foundIds.includes(id));
      return res.status(400).json({
        message:
          req.user?.role === 'admin'
            ? 'Some courses not found in your department or do not exist'
            : 'Some courses not found',
        missingIds,
      });
    }

    // For department admins, only destroy courses from their own department
    // This allows lecturers to have courses from multiple departments simultaneously
    if (req.user?.role === 'admin' && req.user.department_name) {
      const dept = await Department.findOne({ where: { dept_name: req.user.department_name } });
      if (dept) {
        // Only destroy LecturerCourse entries for courses in this admin's department
        const existingCoursesInDept = await LecturerCourse.findAll({
          where: { lecturer_profile_id: profile.id },
          include: [
            {
              model: Course,
              where: { dept_id: dept.id },
              attributes: ['id'],
            },
          ],
        });
        const existingIds = existingCoursesInDept.map((lc) => lc.id);
        if (existingIds.length > 0) {
          await LecturerCourse.destroy({ where: { id: existingIds } });
        }
      }
    } else {
      // Superadmins can destroy all lecturer courses
      await LecturerCourse.destroy({ where: { lecturer_profile_id: profile.id } });
    }

    await LecturerCourse.bulkCreate(
      courses.map((c) => ({ lecturer_profile_id: profile.id, course_id: c.id }))
    );
    return res.json({
      message: 'Courses updated',
      count: courses.length,
      course_ids: courses.map((c) => c.id),
    });
  } catch (e) {
    console.error('[updateLecturerCourses] error', e);
    return res.status(500).json({ message: 'Failed to update courses', error: e.message });
  }
};

/**
 * PATCH /api/lecturers/:id/profile
 * Body: { qualifications?, research_fields? (array|string), university?, major? }
 */
export const updateLecturerProfile = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (!userId) return res.status(400).json({ message: 'Invalid id' });
    const profile = await LecturerProfile.findOne({ where: { user_id: userId } });
    if (!profile) return res.status(404).json({ message: 'Lecturer not found' });

    const {
      qualifications,
      short_bio,
      research_fields,
      phone_number,
      university,
      major,
      bank_name,
      account_name,
      account_number,
    } = req.body;
    const patch = {};

    if (typeof qualifications === 'string') patch.qualifications = qualifications;
    if (typeof short_bio === 'string') patch.short_bio = short_bio;
    if (typeof phone_number === 'string') patch.phone_number = phone_number.trim();
    if (typeof bank_name === 'string') patch.bank_name = bank_name.trim();
    if (typeof account_name === 'string') patch.account_name = account_name.trim();
    if (typeof account_number === 'string') patch.account_number = account_number.trim();

    // Handle research fields
    if (research_fields) {
      let fieldNames = [];

      if (Array.isArray(research_fields)) {
        fieldNames = research_fields.map((s) => String(s).trim()).filter(Boolean);
      } else if (typeof research_fields === 'string') {
        fieldNames = research_fields
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }

      if (fieldNames.length > 0) {
        // Ensure all research fields exist in the database
        await findOrCreateResearchFields(fieldNames);

        // Store as comma-separated string
        patch.research_fields = fieldNames.join(', ');
      } else {
        // Clear research fields
        patch.research_fields = '';
      }
    }

    // Handle university
    if (university !== undefined) {
      if (typeof university === 'string' && university.trim()) {
        const trimmedUniversity = university.trim();
        // Ensure university exists in the database
        await findOrCreateUniversities([trimmedUniversity]);
        patch.university = trimmedUniversity;
      } else {
        // Clear university
        patch.university = null;
      }
    }

    // Handle major
    if (major !== undefined) {
      if (typeof major === 'string' && major.trim()) {
        const trimmedMajor = major.trim();
        // Ensure major exists in the database
        await findOrCreateMajors([trimmedMajor]);
        patch.major = trimmedMajor;
      } else {
        // Clear major
        patch.major = null;
      }
    }

    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ message: 'No updatable fields supplied' });
    }

    await profile.update(patch);

    const currentResearchFields = profile.research_fields
      ? profile.research_fields
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    return res.json({
      message: 'Profile updated',
      qualifications: profile.qualifications,
      short_bio: profile.short_bio,
      research_fields: profile.research_fields,
      researchFields: currentResearchFields,
      university: profile.university,
      major: profile.major,
      bank_name: profile.bank_name,
      account_name: profile.account_name,
      account_number: profile.account_number,
    });
  } catch (e) {
    console.error('[updateLecturerProfile] error', e);
    return res.status(500).json({ message: 'Failed to update lecturer profile', error: e.message });
  }
};

/**
 * POST /api/lecturers/:id/payroll (admin only)
 * Uploads/replaces a lecturer's payroll file. Expects multipart/form-data with field name 'payroll'.
 * :id refers to the User.id associated with the LecturerProfile.
 */
export const uploadLecturerPayroll = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (!userId) return res.status(400).json({ message: 'Invalid id' });

    // Ensure file present
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'Missing payroll file' });

    // Find lecturer profile and include user to help compute slug if needed
    const profile = await LecturerProfile.findOne({
      where: { user_id: userId },
      include: [{ model: User, attributes: ['email', 'display_name'] }],
    });
    if (!profile) return res.status(404).json({ message: 'Lecturer not found' });

    // Compute storage folder
    const baseName =
      profile.full_name_english ||
      profile.User?.display_name ||
      (profile.User?.email ? profile.User.email.split('@')[0] : `lecturer_${userId}`);
    const folderSlug =
      (profile.storage_folder || baseName)
        .toString()
        .replace(/[^a-zA-Z0-9\-_ ]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 80) || `lecturer_${userId}`;
    const destRoot = path.join(process.cwd(), 'uploads', 'lecturers', folderSlug);
    await fs.promises.mkdir(destRoot, { recursive: true });

    const ext = file.originalname ? path.extname(file.originalname) : '.pdf';
    const target = path.join(destRoot, `payroll${ext || ''}`);
    await fs.promises.writeFile(target, file.buffer);
    const rel = target.replace(process.cwd() + path.sep, '').replace(/\\/g, '/');

    await profile.update({ pay_roll_in_riel: rel, storage_folder: folderSlug });

    return res.json({
      message: 'Payroll uploaded',
      path: rel,
      payrollFilePath: rel,
      profile: { id: profile.id, pay_roll_in_riel: rel },
    });
  } catch (e) {
    console.error('[uploadLecturerPayroll] error', e);
    return res.status(500).json({ message: 'Failed to upload payroll', error: e.message });
  }
};
