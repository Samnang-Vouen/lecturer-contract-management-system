import ClassModel from '../model/class.model.js';
import Course from '../model/course.model.js';
import Group from '../model/group.model.js';
import Specialization from '../model/specialization.model.js';
import { Department } from '../model/index.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors.js';

// ---------------------------------------------------------------------------
// Pure helpers (no DB)
// ---------------------------------------------------------------------------

function normalizeDateOnly(value) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const s = String(value ?? '').trim();
  if (!s) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return undefined;
  return s;
}

function assertTermDateRange(start_term, end_term) {
  if (start_term && end_term && String(start_term) > String(end_term)) {
    throw new ValidationError('Start term must be on or before End term', {
      payload: { error: 'Start term must be on or before End term' },
    });
  }
}

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------

async function findDept(department_name) {
  return Department.findOne({ where: { dept_name: department_name } });
}

async function findOrCreateDept(department_name) {
  const [dept] = await Department.findOrCreate({
    where: { dept_name: department_name },
    defaults: { dept_name: department_name },
  });
  return dept;
}

async function resolveSpecializationIdFromPayload(payload, deptId) {
  if (!payload || typeof payload !== 'object') return undefined;

  const hasOwn = (k) => Object.prototype.hasOwnProperty.call(payload, k);
  const hasAny =
    hasOwn('specialization_id') ||
    hasOwn('specializationId') ||
    hasOwn('specialization') ||
    hasOwn('specialization_name') ||
    hasOwn('specializationName');

  if (!hasAny) return undefined;

  const rawId = payload.specialization_id ?? payload.specializationId;
  if (rawId !== undefined && rawId !== null && String(rawId).trim() !== '') {
    const parsed = Number.parseInt(String(rawId), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  const rawName = payload.specialization ?? payload.specialization_name ?? payload.specializationName;
  const name = String(rawName ?? '').trim();
  if (!name) return null;

  const where = deptId ? { name, dept_id: deptId } : { name };
  const defaults = deptId ? { name, dept_id: deptId } : { name };
  const [spec, created] = await Specialization.findOrCreate({ where, defaults });
  if (created) {
    console.warn('resolveSpecializationIdFromPayload: created new specialization', { name, deptId });
  }
  return spec?.id ?? null;
}

async function enrichWithTotals(classInstance) {
  try {
    const obj = classInstance.toJSON();
    const codes = Array.isArray(obj.courses) ? obj.courses : [];
    const total_courses_count = codes.length;
    let total_hours = 0;
    let total_credits = 0;
    if (codes.length) {
      const where = { course_code: codes };
      if (obj.dept_id) where.dept_id = obj.dept_id;
      const courseRows = await Course.findAll({
        where,
        attributes: ['course_code', 'hours', 'credits', 'dept_id'],
      });
      for (const c of courseRows) {
        total_hours += Number.isFinite(+c.hours) ? +c.hours : 0;
        total_credits += Number.isFinite(+c.credits) ? +c.credits : 0;
      }
    }
    return { ...obj, total_courses_count, total_hours, total_credits };
  } catch {
    const obj = classInstance.toJSON();
    return {
      ...obj,
      total_courses_count: Array.isArray(obj.courses) ? obj.courses.length : 0,
      total_hours: 0,
      total_credits: 0,
    };
  }
}

const CLASS_INCLUDES = [
  { model: Specialization, attributes: ['id', 'name'], required: false },
  { model: Group, attributes: ['id', 'class_id', 'name', 'num_of_student', 'created_at'], required: false },
];

async function fetchEnriched(id) {
  const row = await ClassModel.findByPk(id, {
    include: CLASS_INCLUDES,
    order: [[Group, 'created_at', 'ASC']],
  });
  return row ? enrichWithTotals(row) : null;
}

// ---------------------------------------------------------------------------
// listClasses
// ---------------------------------------------------------------------------

export async function listClasses({ role, department_name, page: rawPage, limit: rawLimit }) {
  const where = {};
  if (role === 'admin' && department_name) {
    const dept = await findDept(department_name);
    where.dept_id = dept ? dept.id : null;
  }

  let page = parseInt(rawPage || '1', 10);
  let limit = parseInt(rawLimit || '10', 10);
  if (Number.isNaN(page) || page < 1) page = 1;
  if (Number.isNaN(limit) || limit < 1) limit = 10;
  if (limit > 50) limit = 50;
  const offset = (page - 1) * limit;

  const { rows, count } = await ClassModel.findAndCountAll({
    where,
    include: [{ model: Specialization, attributes: ['id', 'name'], required: false }],
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });

  const classIds = rows.map((r) => r.id).filter(Boolean);
  if (classIds.length) {
    const groups = await Group.findAll({
      where: { class_id: classIds },
      attributes: ['id', 'class_id', 'name', 'num_of_student', 'created_at'],
      order: [['class_id', 'ASC'], ['created_at', 'ASC']],
    });
    const byClassId = new Map();
    for (const g of groups) {
      if (!byClassId.has(g.class_id)) byClassId.set(g.class_id, []);
      byClassId.get(g.class_id).push(g);
    }
    for (const row of rows) row.setDataValue('Groups', byClassId.get(row.id) || []);
  } else {
    for (const row of rows) row.setDataValue('Groups', []);
  }

  const enrichedRows = await Promise.all(rows.map(enrichWithTotals));
  const totalPages = Math.ceil(count / limit) || 1;
  return {
    data: enrichedRows,
    page,
    limit,
    total: count,
    totalPages,
    hasMore: page < totalPages,
    note: 'Server-side pagination enabled',
  };
}

// ---------------------------------------------------------------------------
// getClass
// ---------------------------------------------------------------------------

export async function getClass({ id, role, department_name }) {
  const classItem = await ClassModel.findByPk(id, {
    include: CLASS_INCLUDES,
    order: [[Group, 'created_at', 'ASC']],
  });
  if (!classItem) {
    throw new NotFoundError('Class not found.', { payload: { error: 'Class not found.' } });
  }
  if (role === 'admin' && department_name) {
    const dept = await findDept(department_name);
    if (dept && classItem.dept_id !== dept.id) {
      throw new ForbiddenError('Access denied: different department', {
        payload: { error: 'Access denied: different department' },
      });
    }
  }
  return enrichWithTotals(classItem);
}

// ---------------------------------------------------------------------------
// createClass
// ---------------------------------------------------------------------------

export async function createClassRecord({ payload, role, department_name }) {
  if (!payload.name) {
    throw new ValidationError('Name is required', { payload: { error: 'Name is required' } });
  }

  const start_term = normalizeDateOnly(payload.start_term ?? payload.startTerm);
  const end_term = normalizeDateOnly(payload.end_term ?? payload.endTerm);

  if (start_term === undefined) {
    throw new ValidationError('Invalid Start term date format (expected YYYY-MM-DD)', {
      payload: { error: 'Invalid Start term date format (expected YYYY-MM-DD)' },
    });
  }
  if (end_term === undefined) {
    throw new ValidationError('Invalid End term date format (expected YYYY-MM-DD)', {
      payload: { error: 'Invalid End term date format (expected YYYY-MM-DD)' },
    });
  }
  if (!start_term) {
    throw new ValidationError('Start term is required', { payload: { error: 'Start term is required' } });
  }
  if (!end_term) {
    throw new ValidationError('End term is required', { payload: { error: 'End term is required' } });
  }

  assertTermDateRange(start_term, end_term);

  const totalClass = Number.isFinite(+payload.total_class) ? +payload.total_class : null;
  const courses = Array.isArray(payload.courses) ? payload.courses : [];

  let deptId = payload.dept_id || null;
  if (role === 'admin' && department_name) {
    const dept = await findOrCreateDept(department_name);
    deptId = dept.id;
  }

  const specializationId = await resolveSpecializationIdFromPayload(payload, deptId);

  const newClass = await ClassModel.create({
    name: payload.name,
    term: payload.term,
    year_level: payload.year_level,
    academic_year: payload.academic_year,
    start_term,
    end_term,
    total_class: totalClass,
    dept_id: deptId,
    specialization_id: specializationId ?? null,
    courses,
  });

  return fetchEnriched(newClass.id);
}

// ---------------------------------------------------------------------------
// updateClass
// ---------------------------------------------------------------------------

export async function updateClassRecord({ id, body, role, department_name }) {
  const classItem = await ClassModel.findByPk(id);
  if (!classItem) {
    throw new NotFoundError('Class not found.', { payload: { error: 'Class not found.' } });
  }

  let effectiveDeptId = classItem.dept_id || null;
  if (role === 'admin' && department_name) {
    const dept = await findDept(department_name);
    if (dept) {
      if (!classItem.dept_id) {
        await classItem.update({ dept_id: dept.id });
        effectiveDeptId = dept.id;
      } else if (classItem.dept_id !== dept.id) {
        throw new ForbiddenError('Access denied: different department', {
          payload: { error: 'Access denied: different department' },
        });
      } else {
        effectiveDeptId = dept.id;
      }
    }
  }

  const updates = { ...body };

  const specializationId = await resolveSpecializationIdFromPayload(updates, effectiveDeptId);
  if (specializationId !== undefined) updates.specialization_id = specializationId;
  delete updates.specialization;
  delete updates.specialization_name;
  delete updates.specializationName;
  delete updates.specializationId;
  delete updates.Specialization;

  const hasOwn = (k) => Object.prototype.hasOwnProperty.call(body, k);
  if (hasOwn('start_term') || hasOwn('startTerm')) {
    const v = normalizeDateOnly(updates.start_term ?? updates.startTerm);
    if (v === undefined) {
      throw new ValidationError('Invalid Start term date format (expected YYYY-MM-DD)', {
        payload: { error: 'Invalid Start term date format (expected YYYY-MM-DD)' },
      });
    }
    updates.start_term = v;
  }
  if (hasOwn('end_term') || hasOwn('endTerm')) {
    const v = normalizeDateOnly(updates.end_term ?? updates.endTerm);
    if (v === undefined) {
      throw new ValidationError('Invalid End term date format (expected YYYY-MM-DD)', {
        payload: { error: 'Invalid End term date format (expected YYYY-MM-DD)' },
      });
    }
    updates.end_term = v;
  }
  delete updates.startTerm;
  delete updates.endTerm;

  const effectiveStart = updates.start_term !== undefined ? updates.start_term : classItem.start_term;
  const effectiveEnd = updates.end_term !== undefined ? updates.end_term : classItem.end_term;
  assertTermDateRange(effectiveStart, effectiveEnd);

  if (updates.total_class !== undefined) {
    const parsed = Number.parseInt(updates.total_class, 10);
    updates.total_class = Number.isFinite(parsed) && parsed > 0 ? parsed : classItem.total_class;
  }

  await classItem.update(updates);
  return fetchEnriched(classItem.id);
}

// ---------------------------------------------------------------------------
// deleteClass
// ---------------------------------------------------------------------------

export async function deleteClassRecord({ id, role, department_name }) {
  const classItem = await ClassModel.findByPk(id);
  if (!classItem) {
    throw new NotFoundError('Class not found.', { payload: { error: 'Class not found.' } });
  }
  if (role === 'admin' && department_name) {
    const dept = await findDept(department_name);
    if (dept && classItem.dept_id !== dept.id) {
      throw new ForbiddenError('Access denied: different department', {
        payload: { error: 'Access denied: different department' },
      });
    }
  }
  await classItem.destroy();
}

// ---------------------------------------------------------------------------
// assignCourses
// ---------------------------------------------------------------------------

export async function assignCoursesToClass({ id, courses: rawCourses, role, department_name }) {
  const classItem = await ClassModel.findByPk(id);
  if (!classItem) {
    throw new NotFoundError('Class not found.', { payload: { error: 'Class not found.' } });
  }
  if (role === 'admin' && department_name) {
    const dept = await findDept(department_name);
    if (dept) {
      if (!classItem.dept_id) {
        await classItem.update({ dept_id: dept.id });
      } else if (classItem.dept_id !== dept.id) {
        throw new ForbiddenError('Access denied: different department', {
          payload: { error: 'Access denied: different department' },
        });
      }
    }
  }
  const courses = Array.isArray(rawCourses) ? rawCourses : [];
  await classItem.update({ courses });
  return enrichWithTotals(classItem);
}

// ---------------------------------------------------------------------------
// upgradeClass
// ---------------------------------------------------------------------------

export async function upgradeClassRecord({ id, payload: rawPayload, role, department_name }) {
  const source = await ClassModel.findByPk(id);
  if (!source) {
    throw new NotFoundError('Class not found.', { payload: { error: 'Class not found.' } });
  }

  let effectiveDeptId = source.dept_id || null;
  if (role === 'admin' && department_name) {
    const dept = await findDept(department_name);
    if (dept) {
      if (!source.dept_id) {
        await source.update({ dept_id: dept.id });
        effectiveDeptId = dept.id;
      } else if (source.dept_id !== dept.id) {
        throw new ForbiddenError('Access denied: different department', {
          payload: { error: 'Access denied: different department' },
        });
      } else {
        effectiveDeptId = dept.id;
      }
    }
  }

  const payload = rawPayload && typeof rawPayload === 'object' ? rawPayload : {};

  const name = String(payload.name ?? source.name ?? '').trim();
  if (!name) throw new ValidationError('Name is required', { payload: { error: 'Name is required' } });

  const term = String(payload.term ?? source.term ?? '').trim();
  const year_level = String(payload.year_level ?? source.year_level ?? '').trim();
  const academic_year = String(payload.academic_year ?? source.academic_year ?? '').trim();

  if (!term) throw new ValidationError('Term is required', { payload: { error: 'Term is required' } });
  if (!year_level) throw new ValidationError('Year level is required', { payload: { error: 'Year level is required' } });
  if (!academic_year) throw new ValidationError('Academic year is required', { payload: { error: 'Academic year is required' } });

  const start_term = normalizeDateOnly(payload.start_term ?? payload.startTerm ?? source.start_term);
  const end_term = normalizeDateOnly(payload.end_term ?? payload.endTerm ?? source.end_term);

  if (start_term === undefined) {
    throw new ValidationError('Invalid Start term date format (expected YYYY-MM-DD)', {
      payload: { error: 'Invalid Start term date format (expected YYYY-MM-DD)' },
    });
  }
  if (end_term === undefined) {
    throw new ValidationError('Invalid End term date format (expected YYYY-MM-DD)', {
      payload: { error: 'Invalid End term date format (expected YYYY-MM-DD)' },
    });
  }
  if (!start_term) throw new ValidationError('Start term is required', { payload: { error: 'Start term is required' } });
  if (!end_term) throw new ValidationError('End term is required', { payload: { error: 'End term is required' } });

  assertTermDateRange(start_term, end_term);

  const parsedTotal = Number.parseInt(String(payload.total_class ?? source.total_class ?? ''), 10);
  const total_class = Number.isFinite(parsedTotal) && parsedTotal > 0 ? parsedTotal : null;
  if (!total_class) {
    throw new ValidationError('Total Groups must be a positive number', {
      payload: { error: 'Total Groups must be a positive number' },
    });
  }

  let specialization_id = await resolveSpecializationIdFromPayload(payload, effectiveDeptId);
  if (specialization_id === undefined) specialization_id = source.specialization_id ?? null;

  const courses = Array.isArray(payload.courses)
    ? payload.courses
    : Array.isArray(source.courses) ? source.courses : [];

  const created = await ClassModel.create({
    name, term, year_level, academic_year,
    start_term, end_term, total_class,
    dept_id: effectiveDeptId,
    specialization_id: specialization_id ?? null,
    courses,
  });

  return fetchEnriched(created.id);
}
