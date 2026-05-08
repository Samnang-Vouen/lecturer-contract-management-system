import { Op, UniqueConstraintError } from 'sequelize';
import sequelize from '../config/db.js';
import { Department, ClassModel } from '../model/index.js';
import Course from '../model/course.model.js';
import { PAGINATION_DEFAULT_LIMIT, PAGINATION_MAX_LIMIT } from '../config/constants.js';
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors.js';

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function validateCourseBody(body) {
  const errors = [];
  if (!body.course_code || !String(body.course_code).trim()) errors.push('course_code required');
  if (!body.course_name || !String(body.course_name).trim()) errors.push('course_name required');
  return errors;
}

async function resolveDeptId({ role, department_name, dept_id, dept_name }) {
  if (role === 'superadmin') {
    if (dept_id) return dept_id;
    if (dept_name) {
      const dept = await Department.findOne({ where: { dept_name } });
      if (!dept) {
        throw new ValidationError('Unknown department name', {
          payload: { message: 'Unknown department name' },
        });
      }
      return dept.id;
    }
  }
  // admin (or superadmin without explicit dept): resolve from user's department
  if (!department_name) {
    throw new ValidationError('Department not set on your account', {
      payload: { message: 'Department not set on your account' },
    });
  }
  const dept = await Department.findOne({ where: { dept_name: department_name } });
  if (!dept) {
    throw new ValidationError('Your department not found', {
      payload: { message: 'Your department not found' },
    });
  }
  return dept.id;
}

function dupConflictMessage(e) {
  const field = e?.errors?.[0]?.path || '';
  if (field.includes('course_code')) return 'Course code already exists in your department';
  if (field.includes('course_name')) return 'Course name already exists in your department';
  return 'Duplicate value in your department';
}

// ---------------------------------------------------------------------------
// listCourses
// ---------------------------------------------------------------------------

export async function listCoursesRecords({ role, department_name, query }) {
  const { dept_id, dept_name, page: rawPage, limit: rawLimit, sortBy: rawSortBy, hours: hoursParam } = query;
  const where = {};

  if (role === 'superadmin') {
    if (dept_id) where.dept_id = dept_id;
    if (!where.dept_id && dept_name) {
      const dept = await Department.findOne({ where: { dept_name } });
      if (dept) {
        where.dept_id = dept.id;
      } else {
        return { data: [], page: 1, limit: PAGINATION_DEFAULT_LIMIT, total: 0, totalPages: 0, hasMore: false, note: 'Paginated courses list' };
      }
    }
  } else {
    if (!department_name) {
      throw new ValidationError('Department not set on your account', {
        payload: { message: 'Department not set on your account' },
      });
    }
    const dept = await Department.findOne({ where: { dept_name: department_name } });
    if (!dept) {
      throw new ValidationError('Your department not found', {
        payload: { message: 'Your department not found' },
      });
    }
    where.dept_id = dept.id;
  }

  let page = parseInt(rawPage || '1', 10);
  let limit = parseInt(rawLimit || String(PAGINATION_DEFAULT_LIMIT), 10);
  if (Number.isNaN(page) || page < 1) page = 1;
  if (Number.isNaN(limit) || limit < 1) limit = PAGINATION_DEFAULT_LIMIT;
  if (limit > PAGINATION_MAX_LIMIT) limit = PAGINATION_MAX_LIMIT;
  const offset = (page - 1) * limit;

  const sortBy = String(rawSortBy || 'code').toLowerCase();
  const orderField = sortBy === 'name' ? 'course_name' : 'course_code';

  if (hoursParam !== undefined && hoursParam !== null && String(hoursParam).trim() !== '') {
    const list = String(hoursParam).split(',').map((s) => parseInt(s, 10)).filter((n) => Number.isFinite(n));
    if (list.length === 1) where.hours = list[0];
    else if (list.length > 1) where.hours = { [Op.in]: list };
  }

  const { rows, count } = await Course.findAndCountAll({
    where,
    order: [[orderField, 'ASC']],
    limit,
    offset,
  });

  let classCountByCode = null;
  if (where.dept_id) {
    classCountByCode = new Map();
    const classRows = await ClassModel.findAll({
      where: { dept_id: where.dept_id },
      attributes: ['id', 'courses'],
    });
    for (const cls of classRows) {
      const codes = Array.isArray(cls.courses) ? cls.courses : [];
      const uniqueCodes = new Set(codes.filter(Boolean).map((x) => String(x).trim()).filter(Boolean));
      for (const code of uniqueCodes) {
        classCountByCode.set(code, (classCountByCode.get(code) || 0) + 1);
      }
    }
  }

  const totalPages = Math.ceil(count / limit) || 1;
  return {
    data: rows.map((c) => ({
      id: c.id,
      course_code: c.course_code,
      course_name: c.course_name,
      description: c.description,
      hours: c.hours,
      credits: c.credits,
      dept_id: c.dept_id,
      assigned_class_count: classCountByCode ? (classCountByCode.get(c.course_code) || 0) : 0,
    })),
    page,
    limit,
    total: count,
    totalPages,
    hasMore: page < totalPages,
    note: 'Server-side pagination enabled',
  };
}

// ---------------------------------------------------------------------------
// createCourse
// ---------------------------------------------------------------------------

export async function createCourseRecord({ body, role, department_name }) {
  const errors = validateCourseBody(body);
  if (errors.length) {
    throw new ValidationError('Validation failed', { payload: { message: 'Validation failed', errors } });
  }

  const deptId = await resolveDeptId({ role, department_name, dept_id: body.dept_id, dept_name: body.dept_name });

  const code = String(body.course_code).trim();
  const name = String(body.course_name).trim();

  const existingCode = await Course.findOne({
    where: {
      [Op.and]: [
        { dept_id: deptId },
        sequelize.where(sequelize.fn('LOWER', sequelize.col('course_code')), sequelize.fn('LOWER', code)),
      ],
    },
  });
  if (existingCode) {
    throw new ConflictError('Course code already exists in your department', {
      payload: { message: 'Course code already exists in your department' },
    });
  }

  const existingName = await Course.findOne({
    where: {
      [Op.and]: [
        { dept_id: deptId },
        sequelize.where(sequelize.fn('LOWER', sequelize.col('course_name')), sequelize.fn('LOWER', name)),
      ],
    },
  });
  if (existingName) {
    throw new ConflictError('Course name already exists in your department', {
      payload: { message: 'Course name already exists in your department' },
    });
  }

  try {
    const created = await Course.create({
      dept_id: deptId,
      course_code: code,
      course_name: name,
      description: body.description || null,
      hours: body.hours || null,
      credits: body.credits || null,
    });
    return created;
  } catch (e) {
    if (e instanceof UniqueConstraintError) {
      throw new ConflictError(dupConflictMessage(e), { payload: { message: dupConflictMessage(e) } });
    }
    throw e;
  }
}

// ---------------------------------------------------------------------------
// updateCourse
// ---------------------------------------------------------------------------

const UPDATABLE_COURSE_FIELDS = ['course_code', 'course_name', 'description', 'hours', 'credits'];

export async function updateCourseRecord({ id, body }) {
  const course = await Course.findByPk(id);
  if (!course) {
    throw new NotFoundError('Course not found', { payload: { message: 'Course not found' } });
  }

  const payload = {};
  for (const f of UPDATABLE_COURSE_FIELDS) {
    if (body[f] !== undefined) payload[f] = body[f];
  }
  if (Object.keys(payload).length === 0) {
    throw new ValidationError('No fields to update', { payload: { message: 'No fields to update' } });
  }

  if (payload.course_code) payload.course_code = String(payload.course_code).trim();
  if (payload.course_name) payload.course_name = String(payload.course_name).trim();

  if (payload.course_code) {
    const exists = await Course.findOne({
      where: {
        [Op.and]: [
          { dept_id: course.dept_id },
          { id: { [Op.ne]: id } },
          sequelize.where(sequelize.fn('LOWER', sequelize.col('course_code')), sequelize.fn('LOWER', payload.course_code)),
        ],
      },
    });
    if (exists) {
      throw new ConflictError('Course code already exists in your department', {
        payload: { message: 'Course code already exists in your department' },
      });
    }
  }

  if (payload.course_name) {
    const exists = await Course.findOne({
      where: {
        [Op.and]: [
          { dept_id: course.dept_id },
          { id: { [Op.ne]: id } },
          sequelize.where(sequelize.fn('LOWER', sequelize.col('course_name')), sequelize.fn('LOWER', payload.course_name)),
        ],
      },
    });
    if (exists) {
      throw new ConflictError('Course name already exists in your department', {
        payload: { message: 'Course name already exists in your department' },
      });
    }
  }

  try {
    await course.update(payload);
  } catch (e) {
    if (e instanceof UniqueConstraintError) {
      throw new ConflictError(dupConflictMessage(e), { payload: { message: dupConflictMessage(e) } });
    }
    throw e;
  }

  return course;
}

// ---------------------------------------------------------------------------
// deleteCourse
// ---------------------------------------------------------------------------

export async function deleteCourseRecord({ id }) {
  const course = await Course.findByPk(id);
  if (!course) {
    throw new NotFoundError('Course not found', { payload: { message: 'Course not found' } });
  }
  await course.destroy();
}
