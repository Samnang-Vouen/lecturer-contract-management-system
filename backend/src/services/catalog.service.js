import { Op } from 'sequelize';
import { Department } from '../model/index.js';
import Course from '../model/course.model.js';
import { ValidationError } from '../utils/errors.js';

export async function listDepartments() {
  const depts = await Department.findAll({
    where: { dept_name: { [Op.ne]: 'General' } },
    order: [['dept_name', 'ASC']],
  });
  return depts.map((d) => ({ id: d.id, dept_name: d.dept_name }));
}

export async function listCourses({ role, department_name }) {
  const where = {};

  if (role === 'admin' && department_name) {
    const dept = await Department.findOne({ where: { dept_name: department_name } });
    if (!dept) {
      throw new ValidationError('Your department not found', {
        payload: { message: 'Your department not found' },
      });
    }
    where.dept_id = dept.id;
  }

  const courses = await Course.findAll({
    where: Object.keys(where).length > 0 ? where : undefined,
    order: [['course_code', 'ASC']],
  });

  return courses.map((c) => ({
    id: c.id,
    course_code: c.course_code,
    course_name: c.course_name,
    dept_id: c.dept_id,
    hours: c.hours,
    credits: c.credits,
  }));
}
