import {
  User,
  Role,
  Department,
  UserRole,
  DepartmentProfile,
  LecturerProfile,
} from '../model/index.js';
import bcrypt from 'bcrypt';
import { Sequelize, Op } from 'sequelize';
import sequelize from '../config/db.js';
import fs from 'fs';
import path from 'path';

/**
 * Get all users with pagination
 * Query params: page (1-based), limit, role, department, search
 */
export const getAllUsers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
    const offset = (page - 1) * limit;

    const roleFilter = (req.query.role || '').trim().toLowerCase();
    const deptFilter = (req.query.department || '').trim();
    const search = (req.query.search || '').trim();

    const roleInclude = {
      model: Role,
      attributes: ['role_type'],
      through: { attributes: [] },
      required: false,
    };

    const andConditions = [];
    // Department scoping & role visibility configuration
    let includeSuperAdmin = true;
    let effectiveDeptFilter = deptFilter;
    const actorRole = (req.user?.role || '').toLowerCase();
    if (actorRole === 'admin' || actorRole === 'management') {
      // Force to admin's own department; hide superadmin entirely
      effectiveDeptFilter = req.user.department_name || null;
      includeSuperAdmin = false;
    }
    if (effectiveDeptFilter && effectiveDeptFilter !== 'all') {
      andConditions.push({ department_name: effectiveDeptFilter });
    }
    if (search) {
      andConditions.push({
        [Op.or]: [
          { email: { [Op.like]: `%${search}%` } },
          { display_name: { [Op.like]: `%${search}%` } },
        ],
      });
    }

    // Enforce allowed return roles (admin & management); superadmin handled separately
    const ALLOWED_RETURN_ROLES = ['admin', 'management'];

    // Force the include to filter by allowed roles; we'll fetch superadmin separately if needed
    roleInclude.required = true;
    roleInclude.where = { role_type: { [Op.in]: ALLOWED_RETURN_ROLES } };

    // If client explicitly filters by a specific allowed role, tighten the list
    if (roleFilter && roleFilter !== 'all') {
      if (roleFilter === 'superadmin') {
        // Only superadmin itself may request this filter
        if (req.user?.role !== 'superadmin') {
          return res.status(403).json({ message: 'Access denied' });
        }
        andConditions.push({ email: 'superadmin@cadt.edu.kh' });
        roleInclude.required = false;
        delete roleInclude.where;
      } else if (ALLOWED_RETURN_ROLES.includes(roleFilter)) {
        roleInclude.where = { role_type: roleFilter };
      }
    }

    const where = andConditions.length ? { [Op.and]: andConditions } : undefined;

    console.log(
      `Getting users page=${page} limit=${limit} role=${roleFilter || '*'} dept=${deptFilter || '*'} search=${search || '*'}`
    );

    let { rows, count } = await User.findAndCountAll({
      attributes: [
        'id',
        'email',
        'status',
        'created_at',
        'display_name',
        'department_name',
        'last_login',
      ],
      include: [roleInclude],
      where,
      limit,
      offset,
      distinct: true,
      order: [['created_at', 'DESC']],
    });

    // Optionally append superadmin if not already included and no explicit role filter different from superadmin
    if (includeSuperAdmin && (!roleFilter || roleFilter === 'all')) {
      const superAdminEmail = 'superadmin@cadt.edu.kh';
      const superAlready = rows.some((r) => r.email === superAdminEmail);
      if (!superAlready) {
        const superRow = await User.findOne({ where: { email: superAdminEmail } });
        if (superRow) {
          rows = [superRow, ...rows];
          count += 1;
        }
      }
    }

    const formattedUsers = rows.map((user) => {
      let role = user.Roles && user.Roles.length ? user.Roles[0].role_type : 'User';
      let name = user.display_name;
      if (!name) {
        const emailName = user.email.split('@')[0].replace(/\./g, ' ');
        name = emailName
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }
      let department = user.department_name || 'General';
      if (user.email === 'superadmin@cadt.edu.kh') {
        role = 'superadmin';
        name = 'Super Admin';
        department = 'Administration';
      }
      return {
        id: user.id,
        name,
        email: user.email,
        role,
        department,
        status: user.status || 'active',
        createdAt: user.created_at,
        lastLogin: user.last_login ? user.last_login : 'Never',
      };
    });

    const totalPages = Math.ceil(count / limit) || 1;
    res.status(200).json({ data: formattedUsers, meta: { page, limit, total: count, totalPages } });
  } catch (error) {
    console.error('Error fetching users - Details:', error);
    if (error.parent) {
      console.error('Database error:', error.parent.message);
      console.error('SQL:', error.sql);
    }
    res.status(500).json({
      message: 'Error fetching users',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

/**
 * Create a new user
 * @route POST /api/users
 * @access Private (Super Admin only)
 */
export const createUser = async (req, res) => {
  try {
    let { fullName, email, role, department, position } = req.body;
    const errors = {};
    if (!fullName || !fullName.trim()) errors.fullName = 'Full name is required';
    if (!email || !email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@cadt\.edu\.kh$/i.test(email)) {
      errors.email = 'Email must be a CADT address (example@cadt.edu.kh)';
    } else if (await User.findOne({ where: { email } })) {
      errors.email = 'Email is already registered';
    }
    // Force lecturer role if not supplied
    if (!role) role = 'lecturer';
    // Infer department from creating admin if not supplied; do NOT fall back to 'General'
    if (!department) {
      if (req.user?.department_name) {
        department = req.user.department_name;
      } else {
        errors.department = 'Department missing (assign admin a department first)';
      }
    }
    // Validate position field for lecturers
    if (role.toLowerCase() === 'lecturer') {
      if (!position || !position.trim()) {
        errors.position = 'Position is required for lecturers';
      } else if (!['Lecturer', 'Teaching Assistant (TA)'].includes(position.trim())) {
        errors.position = "Position must be either 'Lecturer' or 'Teaching Assistant (TA)'";
      }
    }
    if (Object.keys(errors).length > 0)
      return res.status(400).json({ message: 'Validation failed', errors });

    // Generate a random temporary password (>= 8 chars)
    const TEMP_LEN = 10; // >6 requirement
    let tempPassword = '';
    while (tempPassword.length < TEMP_LEN) {
      tempPassword += Math.random().toString(36).slice(2); // append chunk
    }
    tempPassword = tempPassword.slice(0, TEMP_LEN);
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    console.log(`[createUser] Start creation email=${email} role=${role} dept=${department}`);
    const timing = Date.now();
    const result = await sequelize.transaction(async (t) => {
      console.log('[createUser] (tx) creating User row');
      const newUser = await User.create(
        {
          email,
          password_hash: passwordHash,
          display_name: fullName,
          department_name: department,
          status: 'active',
        },
        { transaction: t }
      );
      console.log('[createUser] (tx) user id', newUser.id);

      console.log('[createUser] (tx) ensuring Role');
      const [userRole, roleCreated] = await Role.findOrCreate({
        where: { role_type: role },
        defaults: { role_type: role },
        transaction: t,
      });
      console.log(`[createUser] (tx) role id=${userRole.id} created=${roleCreated}`);

      console.log('[createUser] (tx) ensuring Department');
      const [userDepartment, deptCreated] = await Department.findOrCreate({
        where: { dept_name: department },
        defaults: { dept_name: department },
        transaction: t,
      });
      console.log(`[createUser] (tx) department id=${userDepartment.id} created=${deptCreated}`);

      console.log('[createUser] (tx) linking UserRole');
      await UserRole.create({ user_id: newUser.id, role_id: userRole.id }, { transaction: t });

      let lecturerProfile = null;
      if (role.toLowerCase() === 'lecturer') {
        console.log('[createUser] (tx) creating LecturerProfile');
        lecturerProfile = await LecturerProfile.create(
          {
            user_id: newUser.id,
            employee_id: `EMP${Date.now().toString().slice(-6)}`,
            full_name_english: fullName,
            position: position.trim(),
            join_date: new Date(),
            status: 'active',
            cv_uploaded: false,
            cv_file_path: '',
            qualifications: '',
          },
          { transaction: t }
        );
        console.log('[createUser] (tx) lecturerProfile id', lecturerProfile.id);

        console.log('[createUser] (tx) linking DepartmentProfile');
        await DepartmentProfile.create(
          { dept_id: userDepartment.id, profile_id: lecturerProfile.id },
          { transaction: t }
        );
      }

      return {
        user: newUser,
        tempPassword,
        role: userRole.role_type,
        department: userDepartment.dept_name,
        lecturerProfile,
      };
    });
    console.log('[createUser] Success in', Date.now() - timing, 'ms');

    const responseData = {
      id: result.user.id,
      email: result.user.email,
      role: result.role,
      department: result.department,
      tempPassword: result.tempPassword,
    };
    if (result.lecturerProfile) {
      responseData.profile = {
        employeeId: result.lecturerProfile.employee_id,
        fullName: result.lecturerProfile.full_name_english,
        position: result.lecturerProfile.position,
      };
    }

    res.status(201).json(responseData);
  } catch (error) {
    console.error('[createUser] ERROR', error.message);
    if (error.parent) {
      console.error('[createUser] DB parent error message:', error.parent.message);
      console.error('[createUser] SQL:', error.sql);
      console.error('[createUser] Errno/Code:', error.parent.errno, error.parent.code);
    }
    res
      .status(500)
      .json({ message: 'Failed to create user', error: error.message, code: error.parent?.code });
  }
};

/**
 * Create a new lecturer from an accepted candidate
 * @route POST /api/lecturers/from-candidate/:id
 * @access Private (Admin only)
 */
export const createLecturerFromCandidate = async (req, res) => {
  try {
    const candId = parseInt(req.params.id, 10);
    if (!candId) return res.status(400).json({ message: 'Invalid candidate id' });
    const Candidate = (await import('../model/candidate.model.js')).default;
    const cand = await Candidate.findByPk(candId);
    if (!cand) return res.status(404).json({ message: 'Candidate not found' });
    if (cand.status !== 'accepted')
      return res
        .status(400)
        .json({ message: 'Candidate must be accepted before creating lecturer' });

    // Determine department from admin creating this account
    let department = req.user?.department_name;
    if (!department) return res.status(400).json({ message: 'Admin department is not set' });

    const role = 'lecturer';
    const fullName = cand.fullName;
    // Use admin-provided email, not candidate email; enforce CADT domain
    const sanitizeCadtEmail = (val) => {
      const raw = String(val || '')
        .trim()
        .toLowerCase();
      const local = raw.split('@')[0].replace(/[^a-z0-9._%+-]/g, '');
      return local ? `${local}@cadt.edu.kh` : '';
    };
    const providedEmail = sanitizeCadtEmail(req.body?.email);
    if (!providedEmail) return res.status(400).json({ message: 'Valid CADT email is required' });
    const email = providedEmail;
    // Normalize candidate's applied position to accepted values; default to 'Lecturer'
    const normalizePosition = (val) => {
      const s = String(val || '').trim();
      if (!s) return 'Lecturer';
      const lower = s.toLowerCase();
      // Map common variants to TA
      if (/\b(teaching\s*assistant|assistant|\bta\b)\b/i.test(s)) return 'Teaching Assistant (TA)';
      // Lecturer variants
      if (/(lecturer|instructor|teacher)/i.test(s)) return 'Lecturer';
      return 'Lecturer';
    };
    const position = normalizePosition(cand.positionAppliedFor);

    // Prefer admin-provided title/gender; fallback to simple heuristics/null
    let { title, gender } = req.body || {};
    if (!title) title = null;
    const nameLower = (fullName || '').toLowerCase();
    if (/^prof(\.|\b)/i.test(fullName)) title = 'Prof';
    else if (/^dr(\.|\b)/i.test(fullName)) title = 'Dr';
    else if (/^mr(\.|\b)/i.test(fullName)) title = 'Mr';
    else if (/^mrs(\.|\b)/i.test(fullName)) title = 'Mrs';
    else if (/^ms(\.|\b)/i.test(fullName)) title = 'Ms';

    await sequelize.transaction(async (t) => {
      // Create or get role & department
      const [roleRow] = await Role.findOrCreate({
        where: { role_type: role },
        defaults: { role_type: role },
        transaction: t,
      });
      const [deptRow] = await Department.findOrCreate({
        where: { dept_name: department },
        defaults: { dept_name: department },
        transaction: t,
      });

      // Ensure unique email
      const existing = await User.findOne({ where: { email }, transaction: t });
      if (existing) throw new Error('Email already exists for a user');

      // Generate temp password
      const TEMP_LEN = 10;
      let tempPassword = '';
      while (tempPassword.length < TEMP_LEN) tempPassword += Math.random().toString(36).slice(2);
      tempPassword = tempPassword.slice(0, TEMP_LEN);
      const passwordHash = await (await import('bcrypt')).default.hash(tempPassword, 10);

      // Create user
      const user = await User.create(
        {
          email,
          password_hash: passwordHash,
          display_name: fullName,
          department_name: deptRow.dept_name,
          status: 'active',
        },
        { transaction: t }
      );
      await UserRole.create({ user_id: user.id, role_id: roleRow.id }, { transaction: t });

      // Create LecturerProfile using candidate fields
      const lecturer = await LecturerProfile.create(
        {
          user_id: user.id,
          employee_id: `EMP${Date.now().toString().slice(-6)}`,
          full_name_english: fullName,
          position: position,
          join_date: new Date(),
          status: 'active',
          cv_uploaded: false,
          cv_file_path: '',
          qualifications: '',
          occupation: position,
          phone_number: cand.phone || null,
          personal_email: cand.email || null,
          title: title,
          gender: gender || null,
        },
        { transaction: t }
      );

      // Link department
      await DepartmentProfile.create(
        { dept_id: deptRow.id, profile_id: lecturer.id },
        { transaction: t }
      );

      // Mark candidate as done
      await cand.update({ status: 'done' }, { transaction: t });

      res.status(201).json({
        id: user.id,
        email: user.email,
        role: roleRow.role_type,
        department: deptRow.dept_name,
        tempPassword,
        profile: {
          employeeId: lecturer.employee_id,
          fullName: lecturer.full_name_english,
          position: lecturer.position,
        },
        candidateId: cand.id,
      });
    });
  } catch (error) {
    console.error('[createLecturerFromCandidate] error', error.message);
    if ((error.message || '').includes('Email already exists')) {
      return res.status(409).json({ message: 'Email already exists for another user' });
    }
    return res
      .status(500)
      .json({ message: 'Failed to create lecturer from candidate', error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, role, department } = req.body;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (email) user.email = email.toLowerCase();
    if (fullName) user.display_name = fullName;
    if (department) user.department_name = department;
    await user.save();

    // Update role if provided
    if (role) {
      const [roleModel] = await Role.findOrCreate({
        where: { role_type: role },
        defaults: { role_type: role },
      });
      // Remove existing
      await UserRole.destroy({ where: { user_id: user.id } });
      await UserRole.create({ user_id: user.id, role_id: roleModel.id });
    }
    return res.json({ message: 'User updated' });
  } catch (e) {
    console.error('updateUser error', e);
    return res.status(500).json({ message: 'Failed to update user' });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.status = user.status === 'active' ? 'inactive' : 'active';
    await user.save();
    return res.json({ message: 'Status updated', status: user.status });
  } catch (e) {
    console.error('toggleUserStatus error', e);
    return res.status(500).json({ message: 'Failed to update status' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Load potential lecturer profile first so we can remove files after DB ops
    const profile = await LecturerProfile.findOne({ where: { user_id: id } });
    const storageFolder = profile?.storage_folder || null;

    // Perform DB deletions in a transaction for consistency
    await sequelize.transaction(async (t) => {
      // If lecturer profile exists, remove related rows
      if (profile) {
        // Remove LecturerCourse links
        const LecturerCourse = (await import('../model/lecturerCourse.model.js')).default;
        await LecturerCourse.destroy({
          where: { lecturer_profile_id: profile.id },
          transaction: t,
        });
        // Remove DepartmentProfile links
        await DepartmentProfile.destroy({ where: { profile_id: profile.id }, transaction: t });
        // Finally remove the LecturerProfile row
        await profile.destroy({ transaction: t });
      }

      // Remove any user-role rows
      await UserRole.destroy({ where: { user_id: user.id }, transaction: t });

      // Remove the user record
      await user.destroy({ transaction: t });
    });

    // Remove any uploaded files on disk (best-effort)
    try {
      const uploadsRoot = path.join(process.cwd(), 'uploads', 'lecturers');
      if (storageFolder) {
        const destRoot = path.join(uploadsRoot, storageFolder);
        if (fs.existsSync(destRoot)) {
          await fs.promises.rm(destRoot, { recursive: true, force: true });
          console.log('[deleteUser] removed uploads for lecturer', destRoot);
        }
      }
    } catch (fsErr) {
      console.warn('[deleteUser] failed to remove uploads folder', fsErr.message);
    }

    return res.json({ message: 'User deleted' });
  } catch (e) {
    console.error('deleteUser error', e);
    return res.status(500).json({ message: 'Failed to delete user' });
  }
};

/**
 * Admin/Superadmin: Reset a user's password
 * @route POST /api/users/reset-password
 * @access Private (Admin + Superadmin)
 * Body: { email: string, newPassword?: string }
 */
export const resetUserPassword = async (req, res) => {
  try {
    let { email, newPassword } = req.body || {};
    email = String(email || '')
      .trim()
      .toLowerCase();
    if (!email) return res.status(400).json({ message: 'Email is required' });
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Only allow resetting non-superadmin unless actor is superadmin
    const isTargetSuper = email === 'superadmin@cadt.edu.kh';
    const actorRole = (req.user?.role || '').toLowerCase();
    if (isTargetSuper && actorRole !== 'superadmin') {
      return res.status(403).json({ message: 'Only superadmin can reset superadmin password' });
    }

    // Generate temp password if not provided
    if (!newPassword) {
      const TEMP_LEN = 10;
      let tmp = '';
      while (tmp.length < TEMP_LEN) tmp += Math.random().toString(36).slice(2);
      newPassword = tmp.slice(0, TEMP_LEN);
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await user.update({ password_hash: hashed });
    return res.json({
      message: 'Password reset successfully',
      email: user.email,
      tempPassword: newPassword,
    });
  } catch (e) {
    console.error('resetUserPassword error', e.message);
    return res.status(500).json({ message: 'Failed to reset password' });
  }
};
