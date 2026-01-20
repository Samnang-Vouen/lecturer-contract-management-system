import { Department } from '../model/index.js';
import Course from '../model/course.model.js';
import { Op, UniqueConstraintError } from 'sequelize';
import { HTTP_STATUS, PAGINATION_DEFAULT_LIMIT, PAGINATION_MAX_LIMIT } from '../config/constants.js';

function validateCourse(body) {
  const errors = [];
  if (!body.course_code || !body.course_code.trim()) errors.push('course_code required');
  if (!body.course_name || !body.course_name.trim()) errors.push('course_name required');
  return errors;
}

export const listCourses = async (req, res) => {
  try {
    const { dept_id, dept_name } = req.query;
    let where = {};
    // If superadmin, allow optional filtering by query params
    if (req.user.role === 'superadmin') {
      if (dept_id) where.dept_id = dept_id;
      if (!where.dept_id && dept_name) {
        const dept = await Department.findOne({ where: { dept_name: dept_name } });
        if (dept) where.dept_id = dept.id;
        else
          return res.json({
            data: [],
            page: 1,
            limit: PAGINATION_DEFAULT_LIMIT,
            total: 0,
            totalPages: 0,
            hasMore: false,
            note: 'Paginated courses list',
          });
      }
    } else {
      // For admins, always restrict to their own department
      if (req.user.department_name) {
        const dept = await Department.findOne({ where: { dept_name: req.user.department_name } });
        if (!dept) return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Your department not found' });
        where.dept_id = dept.id;
      } else {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Department not set on your account' });
      }
    }

    // Pagination params (default page=1, limit=10, max limit=50)
    let page = parseInt(req.query.page || '1', 10);
    let limit = parseInt(req.query.limit || String(PAGINATION_DEFAULT_LIMIT), 10);
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = PAGINATION_DEFAULT_LIMIT;
    if (limit > PAGINATION_MAX_LIMIT) limit = PAGINATION_MAX_LIMIT;
    const offset = (page - 1) * limit;

    // Sorting: default by course_code ASC, allow sortBy=name to sort by course_name ASC
    const sortBy = String(req.query.sortBy || 'code').toLowerCase();
    const orderField = sortBy === 'name' ? 'course_name' : 'course_code';

    // Filtering: optional filter by exact hours value(s), accepts single value or comma-separated list
    const hoursParam = req.query.hours;
    if (hoursParam !== undefined && hoursParam !== null && String(hoursParam).trim() !== '') {
      const list = String(hoursParam)
        .split(',')
        .map((s) => parseInt(s, 10))
        .filter((n) => Number.isFinite(n));
      if (list.length === 1) {
        where.hours = list[0];
      } else if (list.length > 1) {
        where.hours = { [Op.in]: list };
      }
    }

    const { rows, count } = await Course.findAndCountAll({
      where,
      order: [[orderField, 'ASC']],
      limit,
      offset,
    });
    const totalPages = Math.ceil(count / limit) || 1;
    const hasMore = page < totalPages;
    return res.json({
      data: rows.map((c) => ({
        id: c.id,
        course_code: c.course_code,
        course_name: c.course_name,
        description: c.description,
        hours: c.hours,
        credits: c.credits,
        dept_id: c.dept_id,
      })),
      page,
      limit,
      total: count,
      totalPages,
      hasMore,
      note: 'Server-side pagination enabled',
    });
  } catch (e) {
    console.error('listCourses error', e);
    return res.status(HTTP_STATUS.SERVER_ERROR).json({ message: 'Failed to list courses' });
  }
};

export const createCourse = async (req, res) => {
  try {
    const errors = validateCourse(req.body);
    if (errors.length) return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Validation failed', errors });
    // Department enforcement: if superadmin provided dept_id or dept_name use it, else resolve from user
    let deptId = null;
    if (req.user.role === 'superadmin') {
      if (req.body.dept_id) {
        deptId = req.body.dept_id;
      } else if (req.body.dept_name) {
        const dept = await Department.findOne({ where: { dept_name: req.body.dept_name } });
        if (dept) deptId = dept.id;
        else return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Unknown department name' });
      }
    }
    if (!deptId) {
      if (!req.user.department_name)
        return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Department not set on your account' });
      const dept = await Department.findOne({ where: { dept_name: req.user.department_name } });
      if (!dept) return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'Your department not found' });
      deptId = dept.id;
    }

    const code = req.body.course_code.trim();
    const name = req.body.course_name.trim();
    // Department-scoped duplicate checks (also enforced by DB composite unique indexes)
    const existingCode = await Course.findOne({ where: { course_code: code, dept_id: deptId } });
    if (existingCode)
      return res.status(HTTP_STATUS.CONFLICT).json({ message: 'Course code already exists in your department' });
    const existingName = await Course.findOne({ where: { course_name: name, dept_id: deptId } });
    if (existingName)
      return res.status(HTTP_STATUS.CONFLICT).json({ message: 'Course name already exists in your department' });

    const created = await Course.create({
      dept_id: deptId,
      course_code: code,
      course_name: name,
      description: req.body.description || null,
      hours: req.body.hours || null,
      credits: req.body.credits || null,
    });
    return res.status(HTTP_STATUS.CREATED).json({ message: 'Course created', course: created });
  } catch (e) {
    if (e instanceof UniqueConstraintError) {
      const field = e?.errors?.[0]?.path || 'unique field';
      const msg = field?.includes('course_code')
        ? 'Course code already exists in your department'
        : field?.includes('course_name')
          ? 'Course name already exists in your department'
          : 'Duplicate value in your department';
      return res.status(HTTP_STATUS.CONFLICT).json({ message: msg });
    }
    console.error('createCourse error', e);
    return res.status(HTTP_STATUS.SERVER_ERROR).json({ message: 'Failed to create course' });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const id = req.params.id;
    const course = await Course.findByPk(id);
    if (!course) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Course not found' });
    const payload = {};
    ['course_code', 'course_name', 'description', 'hours', 'credits'].forEach((f) => {
      if (req.body[f] !== undefined) payload[f] = req.body[f];
    });
    if (Object.keys(payload).length === 0)
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ message: 'No fields to update' });
    // Normalize inputs
    if (payload.course_code) payload.course_code = String(payload.course_code).trim();
    if (payload.course_name) payload.course_name = String(payload.course_name).trim();
    // Duplicate checks for updates
    if (payload.course_code) {
      const existsCode = await Course.findOne({
        where: { course_code: payload.course_code, dept_id: course.dept_id, id: { [Op.ne]: id } },
      });
      if (existsCode)
        return res.status(HTTP_STATUS.CONFLICT).json({ message: 'Course code already exists in your department' });
    }
    if (payload.course_name) {
      const existsName = await Course.findOne({
        where: { course_name: payload.course_name, dept_id: course.dept_id, id: { [Op.ne]: id } },
      });
      if (existsName)
        return res.status(HTTP_STATUS.CONFLICT).json({ message: 'Course name already exists in your department' });
    }
    try {
      await course.update(payload);
    } catch (e) {
      if (e instanceof UniqueConstraintError) {
        const field = e?.errors?.[0]?.path || 'unique field';
        const msg = field?.includes('course_code')
          ? 'Course code already exists in your department'
          : field?.includes('course_name')
            ? 'Course name already exists in your department'
            : 'Duplicate value in your department';
        return res.status(HTTP_STATUS.CONFLICT).json({ message: msg });
      }
      throw e;
    }
    return res.json({ message: 'Course updated', course });
  } catch (e) {
    console.error('updateCourse error', e);
    return res.status(HTTP_STATUS.SERVER_ERROR).json({ message: 'Failed to update course' });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const id = req.params.id;
    const course = await Course.findByPk(id);
    if (!course) return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Course not found' });
    await course.destroy();
    return res.json({ message: 'Course deleted' });
  } catch (e) {
    console.error('deleteCourse error', e);
    return res.status(HTTP_STATUS.SERVER_ERROR).json({ message: 'Failed to delete course' });
  }
};
