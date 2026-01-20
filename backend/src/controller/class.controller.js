import ClassModel from '../model/class.model.js';
import Course from '../model/course.model.js';
import { Department } from '../model/index.js';

// Helper to enrich a Class instance with totals derived from associated courses
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
    // On any error, fall back to base JSON without totals
    const obj = classInstance.toJSON();
    return {
      ...obj,
      total_courses_count: Array.isArray(obj.courses) ? obj.courses.length : 0,
      total_hours: 0,
      total_credits: 0,
    };
  }
}

const ClassController = {
  async getAllClasses(req, res) {
    try {
      const where = {};
      // Scope to admin's department if present (superadmin would not use this route currently)
      if (req.user?.role === 'admin' && req.user.department_name) {
        // Need dept id; fetch once
        const dept = await Department.findOne({ where: { dept_name: req.user.department_name } });
        if (dept) where.dept_id = dept.id;
        else where.dept_id = null; // fallback none
      }
      // Pagination params (default page=1, limit=10, cap at 50)
      let page = parseInt(req.query.page || '1', 10);
      let limit = parseInt(req.query.limit || '10', 10);
      if (isNaN(page) || page < 1) page = 1;
      if (isNaN(limit) || limit < 1) limit = 10;
      if (limit > 50) limit = 50;
      const offset = (page - 1) * limit;

      const { rows, count } = await ClassModel.findAndCountAll({
        where,
        order: [['created_at', 'DESC']],
        limit,
        offset,
      });
      const enrichedRows = await Promise.all(rows.map(enrichWithTotals));
      const totalPages = Math.ceil(count / limit) || 1;
      const hasMore = page < totalPages;
      res.json({
        data: enrichedRows,
        page,
        limit,
        total: count,
        totalPages,
        hasMore,
        note: 'Server-side pagination enabled',
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch classes.' });
    }
  },
  async getClassById(req, res) {
    try {
      const classItem = await ClassModel.findByPk(req.params.id);
      if (!classItem) return res.status(404).json({ error: 'Class not found.' });
      if (req.user?.role === 'admin' && req.user.department_name) {
        const dept = await Department.findOne({ where: { dept_name: req.user.department_name } });
        if (dept && classItem.dept_id !== dept.id)
          return res.status(403).json({ error: 'Access denied: different department' });
      }
      const enriched = await enrichWithTotals(classItem);
      res.json(enriched);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch class.' });
    }
  },
  async createClass(req, res) {
    try {
      const payload = req.body;
      if (!payload.name) {
        return res.status(400).json({ error: 'Name is required' });
      }
      // Normalize numeric fields
      const totalClass = Number.isFinite(+payload.total_class) ? +payload.total_class : null;
      console.log(
        '[ClassController] create payload',
        payload,
        'normalized total_class',
        totalClass
      );
      // Basic sanitization / picking allowed fields
      const courses = Array.isArray(payload.courses) ? payload.courses : [];
      let deptId = payload.dept_id || null;
      if (req.user?.role === 'admin' && req.user.department_name) {
        const dept = await Department.findOrCreate({
          where: { dept_name: req.user.department_name },
          defaults: { dept_name: req.user.department_name },
        });
        deptId = dept[0].id;
      }
      const newClass = await ClassModel.create({
        name: payload.name,
        term: payload.term,
        year_level: payload.year_level,
        academic_year: payload.academic_year,
        total_class: totalClass,
        dept_id: deptId,
        courses,
      });
      const enriched = await enrichWithTotals(newClass);
      res.status(201).json(enriched);
    } catch (err) {
      console.error(
        'Create class error:',
        err?.message,
        err?.stack,
        '\nOriginal:',
        err?.original?.sqlMessage
      );
      res.status(500).json({ error: 'Failed to create class.', details: err?.message });
    }
  },
  async updateClass(req, res) {
    try {
      const classItem = await ClassModel.findByPk(req.params.id);
      if (!classItem) return res.status(404).json({ error: 'Class not found.' });
      // Department scoping with backfill: if the class has no dept yet, assign it to the admin's dept on first update
      if (req.user?.role === 'admin' && req.user.department_name) {
        const dept = await Department.findOne({ where: { dept_name: req.user.department_name } });
        if (dept) {
          if (!classItem.dept_id) {
            await classItem.update({ dept_id: dept.id });
          } else if (classItem.dept_id !== dept.id) {
            return res.status(403).json({ error: 'Access denied: different department' });
          }
        }
      }
      if (req.body.total_class !== undefined) {
        const parsed = Number.parseInt(req.body.total_class, 10);
        req.body.total_class =
          Number.isFinite(parsed) && parsed > 0 ? parsed : classItem.total_class;
      }
      await classItem.update(req.body);
      const enriched = await enrichWithTotals(classItem);
      res.json(enriched);
    } catch (err) {
      console.error(
        'Update class error:',
        err?.message,
        err?.stack,
        '\nOriginal:',
        err?.original?.sqlMessage
      );
      res.status(500).json({
        error: 'Failed to update class.',
        details: err?.original?.sqlMessage || err?.message,
      });
    }
  },
  async deleteClass(req, res) {
    try {
      const classItem = await ClassModel.findByPk(req.params.id);
      if (!classItem) return res.status(404).json({ error: 'Class not found.' });
      if (req.user?.role === 'admin' && req.user.department_name) {
        const dept = await Department.findOne({ where: { dept_name: req.user.department_name } });
        if (dept && classItem.dept_id !== dept.id)
          return res.status(403).json({ error: 'Access denied: different department' });
      }
      await classItem.destroy();
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete class.' });
    }
  },
  async assignCourses(req, res) {
    try {
      const classItem = await ClassModel.findByPk(req.params.id);
      if (!classItem) return res.status(404).json({ error: 'Class not found.' });
      // Department scoping with backfill: if missing dept_id, attach it to admin's department on first assignment
      if (req.user?.role === 'admin' && req.user.department_name) {
        const dept = await Department.findOne({ where: { dept_name: req.user.department_name } });
        if (dept) {
          if (!classItem.dept_id) {
            await classItem.update({ dept_id: dept.id });
          } else if (classItem.dept_id !== dept.id) {
            return res.status(403).json({ error: 'Access denied: different department' });
          }
        }
      }
      const courses = Array.isArray(req.body.courses) ? req.body.courses : [];
      await classItem.update({ courses });
      {
        const enriched = await enrichWithTotals(classItem);
        res.json(enriched);
      }
    } catch (err) {
      res.status(500).json({ error: 'Failed to assign courses.' });
    }
  },
};

export default ClassController;
