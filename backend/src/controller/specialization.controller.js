import Specialization from '../model/specialization.model.js';
import { Department } from '../model/index.js';

const SpecializationController = {
  async list(req, res) {
    try {
      const where = {};

      // Admin is always scoped to their department
      if ((req.user?.role || '').toLowerCase() === 'admin') {
        const deptName = req.user?.department_name;
        if (!deptName) return res.json([]);
        const dept = await Department.findOne({ where: { dept_name: deptName } });
        if (!dept) return res.json([]);
        where.dept_id = dept.id;
      }

      // Optional superadmin filtering
      if ((req.user?.role || '').toLowerCase() === 'superadmin') {
        const deptId = req.query.dept_id ?? req.query.deptId;
        if (deptId !== undefined && deptId !== null && String(deptId).trim() !== '') {
          const parsed = Number.parseInt(String(deptId), 10);
          if (Number.isFinite(parsed) && parsed > 0) where.dept_id = parsed;
        }
      }

      const rows = await Specialization.findAll({
        where,
        attributes: ['id', 'name', 'dept_id'],
        order: [['name', 'ASC']],
      });

      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch specializations.' });
    }
  },
};

export default SpecializationController;
