// Course Mapping controller (lecturer-course-class assignments)
import CourseMapping from '../model/courseMapping.model.js';
import ClassModel from '../model/class.model.js';
import Course from '../model/course.model.js';
import { LecturerProfile, Department } from '../model/index.js';
import ExcelJS from 'exceljs';

// Helper to resolve department id based on admin's department
async function resolveDeptId(req) {
  if (req.user?.role === 'admin' && req.user.department_name) {
    const dept = await Department.findOne({ where: { dept_name: req.user.department_name } });
    return dept ? dept.id : null;
  }
  return null;
}

export const listCourseMappings = async (req, res) => {
  try {
    const academicYear = (req.query.academic_year || '').trim();
    const statusFilter = (req.query.status || '').trim();
    const deptId = await resolveDeptId(req);
    const where = {};
    if (deptId) where.dept_id = deptId;
    if (academicYear) where.academic_year = academicYear;
    if (statusFilter) where.status = statusFilter;

    // Pagination params (default 10 per page for infinite scroll)
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100); // cap at 100
    const offset = (page - 1) * limit;

    const { rows, count } = await CourseMapping.findAndCountAll({
      where,
      include: [
        {
          model: ClassModel,
          attributes: ['id', 'name', 'term', 'year_level', 'academic_year', 'total_class'],
        },
        { model: Course, attributes: ['id', 'course_code', 'course_name', 'hours', 'credits'] },
        { model: LecturerProfile, attributes: ['id', 'full_name_english', 'full_name_khmer'] },
      ],
      order: [['updated_at', 'DESC']],
      limit,
      offset,
    });

    const data = rows.map((r) => {
      // Prefer new fields when present; fall back to legacy type_hours/group_count
      const thGroups = Number.isFinite(r.theory_groups) ? r.theory_groups : null;
      const lbGroups = Number.isFinite(r.lab_groups) ? r.lab_groups : null;
      const type = String(r.type_hours || '').toLowerCase();
      const isTheoryLegacy = type.includes('theory') || type.includes('15h');
      const isLabLegacy = type.includes('lab') || type.includes('30h');
      const hasThGroups = thGroups !== null && thGroups !== undefined;
      const hasLbGroups = lbGroups !== null && lbGroups !== undefined;
      const theory_groups = hasThGroups ? thGroups : isTheoryLegacy ? r.group_count || 0 : 0;
      const lab_groups = hasLbGroups ? lbGroups : isLabLegacy ? r.group_count || 0 : 0;
      return {
        id: r.id,
        class_id: r.class_id,
        course_id: r.course_id,
        lecturer_profile_id: r.lecturer_profile_id,
        academic_year: r.academic_year,
        term: r.term,
        year_level: r.year_level,
        group_count: r.group_count,
        type_hours: r.type_hours,
        theory_hours:
          r.theory_hours ||
          (isTheoryLegacy ? (r.type_hours?.includes('15h') ? '15h' : '30h') : null),
        theory_groups,
        theory_15h_combined: r.theory_15h_combined,
        lab_hours: r.lab_hours || (isLabLegacy ? '30h' : null),
        lab_groups,
        availability: r.availability,
        status: r.status,
        contacted_by: r.contacted_by,
        comment: r.comment,
        class: r.Class
          ? {
              id: r.Class.id,
              name: r.Class.name,
              term: r.Class.term,
              year_level: r.Class.year_level,
              academic_year: r.Class.academic_year,
              total_class: r.Class.total_class,
            }
          : null,
        course: r.Course
          ? {
              id: r.Course.id,
              code: r.Course.course_code,
              name: r.Course.course_name,
              hours: r.Course.hours,
              credits: r.Course.credits,
            }
          : null,
        lecturer: r.LecturerProfile
          ? {
              id: r.LecturerProfile.id,
              name: r.LecturerProfile.full_name_english || r.LecturerProfile.full_name_khmer,
            }
          : null,
      };
    });

    const totalPages = Math.ceil(count / limit) || 1;
    const hasMore = page < totalPages;
    return res.json({
      data,
      page,
      limit,
      total: count,
      totalPages,
      hasMore,
      note: 'Paginated: server-side pagination with page & limit (default 10) for infinite scroll',
    });
  } catch (e) {
    console.error('[listCourseMappings]', e);
    return res.status(500).json({ message: 'Failed to list course mappings', error: e.message });
  }
};

export const createCourseMapping = async (req, res) => {
  try {
    const {
      class_id,
      course_id,
      lecturer_profile_id,
      academic_year,
      term,
      year_level,
      group_count,
      type_hours,
      availability,
      status,
      contacted_by,
      comment,
      theory_hours,
      theory_groups,
      lab_hours,
      lab_groups,
      theory_15h_combined,
    } = req.body;
    console.log('[createCourseMapping] incoming', req.body);
    if (!class_id || !course_id || !academic_year || !term) {
      return res.status(400).json({ message: 'class_id, course_id, academic_year, term required' });
    }
    // Ensure referenced class exists & in same department scope
    const cls = await ClassModel.findByPk(class_id);
    if (!cls) return res.status(400).json({ message: 'Invalid class_id' });
    // course_id may be a numeric id or an embedded object index; only accept integer
    const parsedCourseId = parseInt(course_id, 10);
    if (!Number.isInteger(parsedCourseId)) {
      return res.status(400).json({ message: 'course_id must be an existing Course numeric id' });
    }
    const course = await Course.findByPk(parsedCourseId);
    if (!course) return res.status(400).json({ message: 'Invalid course_id (Course not found)' });
    // Validate dual fields (new) with backward compatibility
    let thGroupsIn = parseInt(theory_groups, 10);
    let lbGroupsIn = parseInt(lab_groups, 10);
    if (!Number.isFinite(thGroupsIn) || thGroupsIn < 0) thGroupsIn = 0;
    if (!Number.isFinite(lbGroupsIn) || lbGroupsIn < 0) lbGroupsIn = 0;
    const theorySelected =
      thGroupsIn > 0 || (typeof theory_hours === 'string' && theory_hours.trim());
    const labSelected = lbGroupsIn > 0 || (typeof lab_hours === 'string' && lab_hours.trim());
    if (!theorySelected && !labSelected) {
      // fallback to legacy fields if provided
      let typeValueLegacy = String(type_hours || '').trim();
      if (/only\s*15h/i.test(typeValueLegacy)) typeValueLegacy = 'Theory (15h)';
      if (/only\s*30h/i.test(typeValueLegacy)) typeValueLegacy = 'Lab (30h)';
      if (!['Theory (15h)', 'Lab (30h)'].includes(typeValueLegacy)) {
        return res.status(400).json({ message: 'Select Theory and/or Lab with group counts' });
      }
      // derive new fields from legacy
      const legacyGroups = Math.max(1, parseInt(group_count, 10) || 1);
      if (typeValueLegacy.includes('Theory')) {
        thGroupsIn = legacyGroups;
      } else {
        lbGroupsIn = legacyGroups;
      }
    }
    // Normalize hours strings
    let thHoursIn = null;
    if (thGroupsIn > 0) {
      const v = String(theory_hours || '')
        .trim()
        .toLowerCase();
      thHoursIn = v === '30h' ? '30h' : '15h';
    }
    let lbHoursIn = null;
    if (lbGroupsIn > 0) {
      // Lab is fixed 30h
      lbHoursIn = '30h';
    }
    // Sanitize strings
    const contactedBySan = contacted_by ? String(contacted_by).slice(0, 255) : null;
    const commentSan = comment ? String(comment).slice(0, 1000) : null;
    const deptId = await resolveDeptId(req);
    // Legacy compatibility fields
    let legacyType = 'Theory (15h)';
    let legacyGroups = 1;
    if (thGroupsIn > 0 && lbGroupsIn === 0) {
      legacyType = thHoursIn === '30h' ? 'Lab (30h)' : 'Theory (15h)'; // if theory 30h we still cannot represent; keep Theory (15h) vs Lab (30h) best-effort
      legacyGroups = thGroupsIn;
    } else if (lbGroupsIn > 0 && thGroupsIn === 0) {
      legacyType = 'Lab (30h)';
      legacyGroups = lbGroupsIn;
    } else if (lbGroupsIn > 0 && thGroupsIn > 0) {
      // both selected: pick theory-based label, groups from theory for legacy field
      legacyType = thHoursIn === '30h' ? 'Lab (30h)' : 'Theory (15h)';
      legacyGroups = thGroupsIn;
    }

    const created = await CourseMapping.create({
      class_id,
      course_id: parsedCourseId,
      lecturer_profile_id: lecturer_profile_id || null,
      academic_year,
      term,
      year_level: year_level || null,
      group_count: legacyGroups,
      type_hours: legacyType,
      theory_hours: thHoursIn,
      theory_groups: thGroupsIn,
      theory_15h_combined: !!theory_15h_combined,
      lab_hours: lbHoursIn,
      lab_groups: lbGroupsIn,
      availability: availability || null,
      status: status || 'Pending',
      contacted_by: contactedBySan,
      comment: commentSan,
      dept_id: deptId,
    });
    return res.status(201).json({ id: created.id });
  } catch (e) {
    console.error('[createCourseMapping] error', e?.message, e?.stack, e?.original?.sqlMessage);
    // Provide clearer FK error surface
    if (
      e?.original?.code === 'ER_NO_REFERENCED_ROW_2' ||
      /a foreign key constraint fails/i.test(e?.original?.sqlMessage || '')
    ) {
      return res
        .status(400)
        .json({ message: 'Foreign key constraint failed (check class_id and course_id exist)' });
    }
    return res.status(500).json({ message: 'Failed to create mapping', error: e.message });
  }
};

export const updateCourseMapping = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const mapping = await CourseMapping.findByPk(id);
    if (!mapping) return res.status(404).json({ message: 'Mapping not found' });
    const deptId = await resolveDeptId(req);
    if (deptId && mapping.dept_id !== deptId)
      return res.status(403).json({ message: 'Access denied' });
    const allowed = [
      'lecturer_profile_id',
      'group_count',
      'type_hours',
      'availability',
      'status',
      'contacted_by',
      'comment',
      'theory_hours',
      'theory_groups',
      'lab_hours',
      'lab_groups',
      'theory_15h_combined',
    ];
    const patch = {};
    for (const k of allowed) if (k in req.body) patch[k] = req.body[k];
    if ('group_count' in patch) {
      let groups = parseInt(patch.group_count, 10);
      if (!Number.isFinite(groups) || groups < 1) groups = 1;
      patch.group_count = groups;
    }
    if ('type_hours' in patch) {
      let typeValue = String(patch.type_hours || '').trim();
      if (/only\s*15h/i.test(typeValue)) typeValue = 'Theory (15h)';
      if (/only\s*30h/i.test(typeValue)) typeValue = 'Lab (30h)';
      if (!['Theory (15h)', 'Lab (30h)'].includes(typeValue)) {
        typeValue = 'Theory (15h)';
      }
      patch.type_hours = typeValue;
    }
    // New fields sanitation
    if ('theory_groups' in patch) {
      let g = parseInt(patch.theory_groups, 10);
      if (!Number.isFinite(g) || g < 0) g = 0;
      patch.theory_groups = g;
      if (g === 0) {
        patch.theory_hours = null;
      } else if (!('theory_hours' in patch)) {
        patch.theory_hours = mapping.theory_hours || '15h';
      }
      if (
        patch.theory_hours &&
        !['15h', '30h'].includes(String(patch.theory_hours).toLowerCase())
      ) {
        patch.theory_hours = '15h';
      }
    }
    if ('lab_groups' in patch) {
      let g = parseInt(patch.lab_groups, 10);
      if (!Number.isFinite(g) || g < 0) g = 0;
      patch.lab_groups = g;
      if (g === 0) {
        patch.lab_hours = null;
      } else {
        patch.lab_hours = '30h';
      }
    }
    if (
      'contacted_by' in patch &&
      patch.contacted_by !== null &&
      patch.contacted_by !== undefined
    ) {
      patch.contacted_by = String(patch.contacted_by).slice(0, 255);
    }
    if ('comment' in patch && patch.comment !== null && patch.comment !== undefined) {
      patch.comment = String(patch.comment).slice(0, 1000);
    }
    // Keep legacy fields roughly in sync for compatibility
    if (
      'theory_groups' in patch ||
      'lab_groups' in patch ||
      'theory_hours' in patch ||
      'lab_hours' in patch
    ) {
      const tGroups = 'theory_groups' in patch ? patch.theory_groups : mapping.theory_groups || 0;
      const lGroups = 'lab_groups' in patch ? patch.lab_groups : mapping.lab_groups || 0;
      const tHours = 'theory_hours' in patch ? patch.theory_hours : mapping.theory_hours;
      if (tGroups > 0 && lGroups === 0) {
        patch.type_hours = tHours === '30h' ? 'Lab (30h)' : 'Theory (15h)';
        patch.group_count = tGroups;
      } else if (lGroups > 0 && tGroups === 0) {
        patch.type_hours = 'Lab (30h)';
        patch.group_count = lGroups;
      } else if (lGroups > 0 && tGroups > 0) {
        patch.type_hours = tHours === '30h' ? 'Lab (30h)' : 'Theory (15h)';
        patch.group_count = Math.max(tGroups, lGroups);
      }
    }

    await mapping.update(patch);
    return res.json({ message: 'Updated' });
  } catch (e) {
    console.error('[updateCourseMapping]', e);
    return res.status(500).json({ message: 'Failed to update mapping', error: e.message });
  }
};

export const deleteCourseMapping = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const mapping = await CourseMapping.findByPk(id);
    if (!mapping) return res.status(404).json({ message: 'Mapping not found' });
    const deptId = await resolveDeptId(req);
    if (deptId && mapping.dept_id !== deptId)
      return res.status(403).json({ message: 'Access denied' });
    await mapping.destroy();
    return res.json({ message: 'Deleted' });
  } catch (e) {
    console.error('[deleteCourseMapping]', e);
    return res.status(500).json({ message: 'Failed to delete mapping', error: e.message });
  }
};

// Generate an official Excel export with styling, large dataset support
export const exportCourseMappings = async (req, res) => {
  try {
    const academicYear = (req.query.academic_year || '').trim();
    const termStart = (req.query.term_start || '').trim();
    const termEnd = (req.query.term_end || '').trim();
    const deptId = await resolveDeptId(req);

    const where = {};
    if (deptId) where.dept_id = deptId;
    if (academicYear) where.academic_year = academicYear;

    const rows = await CourseMapping.findAll({
      where,
      include: [
        {
          model: ClassModel,
          attributes: ['id', 'name', 'term', 'year_level', 'academic_year', 'total_class'],
        },
        { model: Course, attributes: ['id', 'course_code', 'course_name', 'hours', 'credits'] },
        { model: LecturerProfile, attributes: ['id', 'full_name_english', 'full_name_khmer'] },
      ],
      order: [
        [ClassModel, 'name', 'ASC'],
        ['term', 'ASC'],
        ['id', 'ASC'],
      ],
    });

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet('Course Mapping');

    // Top header (merged)
    ws.mergeCells('A1:P1');
    const topHeader = `${academicYear || 'Academic Year'} | CADT | IDT | CS Department | Terms Operate`;
    ws.getCell('A1').value = topHeader;
    ws.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getCell('A1').font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 14 };
    ws.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F3251' } };
    ws.getRow(1).height = 24;

    // Term start row (merged)
    ws.mergeCells('A2:P2');
    const termLine =
      termStart && termEnd
        ? `► Term Start : ${termStart} - ${termEnd}`
        : '► Term Start : [start - end]';
    ws.getCell('A2').value = termLine;
    ws.getCell('A2').alignment = { horizontal: 'center' };
    ws.getCell('A2').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFED7D31' } };
    ws.getCell('A2').font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Table header
    const headers = [
      'No',
      'Subject',
      'Hour',
      'Credit',
      'Total class',
      'Lecturers and TAs',
      'Group',
      'Theory',
      'Lab',
      'Only15h',
      'Only30h',
      'Status',
      'Availability',
      'Survey Form',
      'Contacted By',
      'Comments',
    ];
    const headerRow = ws.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D9D9D9' } };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
    ws.getRow(3).height = 18;

    // Build data
    let no = 1;
    for (const r of rows) {
      const cls = r.Class;
      const crs = r.Course;
      const lect = r.LecturerProfile;
      const subject = crs ? `${crs.course_name}` : `Course #${r.course_id}`;
      const hours = crs?.hours ?? '';
      const credits = crs?.credits ?? '';
      const totalClass = cls?.total_class ?? '';
      const lecturerName = lect ? lect.full_name_english || lect.full_name_khmer : '';
      const group = r.group_count ?? '';

      // Derive flags from type_hours
      const type = (r.type_hours || '').toLowerCase();
      const theory = type.includes('theory') || type.includes('15h') ? 1 : '';
      const lab = type.includes('lab') || type.includes('30h') ? 1 : '';
      const only15h = /only\s*15h/i.test(r.type_hours || '') ? 1 : '';
      const only30h = /only\s*30h/i.test(r.type_hours || '') ? 1 : '';

      const status = r.status || '';
      const availability = r.availability || '';
      const survey = '';
      const contactedBy = r.contacted_by || '';
      const comments = r.comment || '';

      const row = ws.addRow([
        no++,
        subject,
        hours,
        credits,
        totalClass,
        lecturerName,
        group,
        theory,
        lab,
        only15h,
        only30h,
        status,
        availability,
        survey,
        contactedBy,
        comments,
      ]);

      // Conditional fill for Status column (12)
      const statusCell = row.getCell(12);
      const st = String(status).toLowerCase();
      if (st === 'pending')
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC000' } };
      if (st === 'rejected')
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } };
      if (st === 'accepted')
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00B050' } };

      // Borders for all cells in this row
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    }

    // Auto width
    ws.columns = headers.map((h, i) => ({
      header: h,
      key: `c${i}`,
      width: Math.max(12, String(h).length + 2),
    }));

    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `CourseMapping_${academicYear || 'All'}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.send(Buffer.from(buffer));
  } catch (e) {
    console.error('[exportCourseMappings]', e);
    return res.status(500).json({ message: 'Failed to export course mappings', error: e.message });
  }
};
