import ClassModel from '../model/class.model.js';
import Course from '../model/course.model.js';
import Group from '../model/group.model.js';
import Specialization from '../model/specialization.model.js';
import { Department } from '../model/index.js';

async function resolveSpecializationIdFromPayload(payload, deptId) {
  if (!payload || typeof payload !== 'object') return undefined;

  const hasOwn = (k) => Object.prototype.hasOwnProperty.call(payload, k);
  const hasAny =
    hasOwn('specialization_id') ||
    hasOwn('specializationId') ||
    hasOwn('specialization') ||
    hasOwn('specialization_name') ||
    hasOwn('specializationName');

  if (!hasAny) return undefined; // nothing provided; don't touch

  const rawId = payload.specialization_id ?? payload.specializationId;
  if (rawId !== undefined && rawId !== null && String(rawId).trim() !== '') {
    const parsed = Number.parseInt(String(rawId), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  const rawName = payload.specialization ?? payload.specialization_name ?? payload.specializationName;
  const name = String(rawName ?? '').trim();
  if (!name) return null;

  // Find-or-create within department scope when available
  const where = deptId ? { name, dept_id: deptId } : { name };
  const defaults = deptId ? { name, dept_id: deptId } : { name };
  const [spec] = await Specialization.findOrCreate({ where, defaults });
  return spec?.id ?? null;
}

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
        include: [{ model: Specialization, attributes: ['id', 'name'], required: false }],
        order: [['created_at', 'DESC']],
        limit,
        offset,
      });

      // Attach groups without joining in the main query (avoids inflated counts with pagination)
      const classIds = rows.map((r) => r.id).filter((id) => id != null);
      if (classIds.length) {
        const groups = await Group.findAll({
          where: { class_id: classIds },
          attributes: ['id', 'class_id', 'name', 'num_of_student', 'created_at'],
          order: [
            ['class_id', 'ASC'],
            ['created_at', 'ASC'],
          ],
        });
        const byClassId = new Map();
        for (const g of groups) {
          const key = g.class_id;
          if (!byClassId.has(key)) byClassId.set(key, []);
          byClassId.get(key).push(g);
        }
        for (const row of rows) {
          row.setDataValue('Groups', byClassId.get(row.id) || []);
        }
      } else {
        for (const row of rows) {
          row.setDataValue('Groups', []);
        }
      }
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
      const classItem = await ClassModel.findByPk(req.params.id, {
        include: [
          { model: Specialization, attributes: ['id', 'name'], required: false },
          { model: Group, attributes: ['id', 'class_id', 'name', 'num_of_student', 'created_at'], required: false },
        ],
        order: [[Group, 'created_at', 'ASC']],
      });
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

      const specializationId = await resolveSpecializationIdFromPayload(payload, deptId);

      const newClass = await ClassModel.create({
        name: payload.name,
        term: payload.term,
        year_level: payload.year_level,
        academic_year: payload.academic_year,
        total_class: totalClass,
        dept_id: deptId,
        specialization_id: specializationId ?? null,
        courses,
      });

      const created = await ClassModel.findByPk(newClass.id, {
        include: [
          { model: Specialization, attributes: ['id', 'name'], required: false },
          { model: Group, attributes: ['id', 'class_id', 'name', 'num_of_student', 'created_at'], required: false },
        ],
        order: [[Group, 'created_at', 'ASC']],
      });
      const enriched = await enrichWithTotals(created || newClass);
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
      let effectiveDeptId = classItem.dept_id || null;
      if (req.user?.role === 'admin' && req.user.department_name) {
        const dept = await Department.findOne({ where: { dept_name: req.user.department_name } });
        if (dept) {
          if (!classItem.dept_id) {
            await classItem.update({ dept_id: dept.id });
            effectiveDeptId = dept.id;
          } else if (classItem.dept_id !== dept.id) {
            return res.status(403).json({ error: 'Access denied: different department' });
          } else {
            effectiveDeptId = dept.id;
          }
        }
      }

      // Resolve specialization from name or id into specialization_id, and strip unmapped keys
      const specializationId = await resolveSpecializationIdFromPayload(req.body, effectiveDeptId);
      if (specializationId !== undefined) {
        req.body.specialization_id = specializationId;
      }
      delete req.body.specialization;
      delete req.body.specialization_name;
      delete req.body.specializationName;
      delete req.body.specializationId;
      delete req.body.Specialization;

      if (req.body.total_class !== undefined) {
        const parsed = Number.parseInt(req.body.total_class, 10);
        req.body.total_class =
          Number.isFinite(parsed) && parsed > 0 ? parsed : classItem.total_class;
      }
      await classItem.update(req.body);

      const updated = await ClassModel.findByPk(classItem.id, {
        include: [
          { model: Specialization, attributes: ['id', 'name'], required: false },
          { model: Group, attributes: ['id', 'class_id', 'name', 'num_of_student', 'created_at'], required: false },
        ],
        order: [[Group, 'created_at', 'ASC']],
      });
      const enriched = await enrichWithTotals(updated || classItem);
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

  // POST /api/classes/:id/upgrade
  // Creates a new class record based on an existing class + provided overrides (original remains unchanged)
  async upgradeClass(req, res) {
    try {
      const source = await ClassModel.findByPk(req.params.id);
      if (!source) return res.status(404).json({ error: 'Class not found.' });

      // Department scoping (same as update): admin can only upgrade within their department.
      let effectiveDeptId = source.dept_id || null;
      if (req.user?.role === 'admin' && req.user.department_name) {
        const dept = await Department.findOne({ where: { dept_name: req.user.department_name } });
        if (dept) {
          if (!source.dept_id) {
            // If legacy source has no dept, assign it (so it can be safely used as upgrade base)
            await source.update({ dept_id: dept.id });
            effectiveDeptId = dept.id;
          } else if (source.dept_id !== dept.id) {
            return res.status(403).json({ error: 'Access denied: different department' });
          } else {
            effectiveDeptId = dept.id;
          }
        }
      }

      const payload = req.body && typeof req.body === 'object' ? req.body : {};

      const name = String(payload.name ?? source.name ?? '').trim();
      if (!name) return res.status(400).json({ error: 'Name is required' });

      const term = String(payload.term ?? source.term ?? '').trim();
      const year_level = String(payload.year_level ?? source.year_level ?? '').trim();
      const academic_year = String(payload.academic_year ?? source.academic_year ?? '').trim();
      if (!term) return res.status(400).json({ error: 'Term is required' });
      if (!year_level) return res.status(400).json({ error: 'Year level is required' });
      if (!academic_year) return res.status(400).json({ error: 'Academic year is required' });

      const parsedTotal = Number.parseInt(String(payload.total_class ?? source.total_class ?? ''), 10);
      const total_class = Number.isFinite(parsedTotal) && parsedTotal > 0 ? parsedTotal : null;
      if (!total_class) return res.status(400).json({ error: 'Total Groups must be a positive number' });

      // Resolve specialization override; if not provided, inherit from source
      let specialization_id = await resolveSpecializationIdFromPayload(payload, effectiveDeptId);
      if (specialization_id === undefined) specialization_id = source.specialization_id ?? null;

      const courses = Array.isArray(payload.courses)
        ? payload.courses
        : (Array.isArray(source.courses) ? source.courses : []);

      const created = await ClassModel.create({
        name,
        term,
        year_level,
        academic_year,
        total_class,
        dept_id: effectiveDeptId,
        specialization_id: specialization_id ?? null,
        courses,
      });

      const createdWithIncludes = await ClassModel.findByPk(created.id, {
        include: [
          { model: Specialization, attributes: ['id', 'name'], required: false },
          { model: Group, attributes: ['id', 'class_id', 'name', 'num_of_student', 'created_at'], required: false },
        ],
        order: [[Group, 'created_at', 'ASC']],
      });

      const enriched = await enrichWithTotals(createdWithIncludes || created);
      res.status(201).json(enriched);
    } catch (err) {
      console.error(
        'Upgrade class error:',
        err?.message,
        err?.stack,
        '\nOriginal:',
        err?.original?.sqlMessage
      );
      res.status(500).json({ error: 'Failed to upgrade class.', details: err?.message });
    }
  },
};

export default ClassController;
