import Specialization from '../model/specialization.model.js';
import { Department } from '../model/index.js';

export async function listSpecializationsData({ role, departmentName, query }) {
  const normalizedRole = String(role || '').toLowerCase();
  const where = {};

  if (normalizedRole === 'admin') {
    if (!departmentName) return [];
    const dept = await Department.findOne({ where: { dept_name: departmentName } });
    if (!dept) return [];
    where.dept_id = dept.id;
  }

  if (normalizedRole === 'superadmin') {
    const deptId = query?.dept_id ?? query?.deptId;
    if (deptId !== undefined && deptId !== null && String(deptId).trim() !== '') {
      const parsed = Number.parseInt(String(deptId), 10);
      if (Number.isFinite(parsed) && parsed > 0) where.dept_id = parsed;
    }
  }

  return Specialization.findAll({
    where,
    attributes: ['id', 'name', 'dept_id'],
    order: [['name', 'ASC']],
  });
}
