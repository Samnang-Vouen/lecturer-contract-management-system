import { Department } from '../model/index.js';
import Course from '../model/course.model.js';
import { Op } from 'sequelize';

// Public (to authenticated roles) catalog endpoints for onboarding etc.
export const catalogDepartments = async (req, res) => {
  try {
    const depts = await Department.findAll({
      where: { dept_name: { [Op.ne]: 'General' } },
      order: [['dept_name', 'ASC']],
    });
    return res.json(depts.map((d) => ({ id: d.id, dept_name: d.dept_name })));
  } catch (e) {
    console.error('catalogDepartments error', e);
    return res.status(500).json({ message: 'Failed to list departments' });
  }
};

export const catalogCourses = async (req, res) => {
  try {
    let where = {};

    // For department admins, only show courses from their own department
    if (req.user?.role === 'admin' && req.user.department_name) {
      const dept = await Department.findOne({ where: { dept_name: req.user.department_name } });
      if (dept) {
        where.dept_id = dept.id;
      } else {
        return res.status(400).json({ message: 'Your department not found' });
      }
    }
    // Superadmins see all courses (no where clause restriction)

    const courses = await Course.findAll({
      where: Object.keys(where).length > 0 ? where : undefined,
      order: [['course_code', 'ASC']],
    });
    return res.json(
      courses.map((c) => ({
        id: c.id,
        course_code: c.course_code,
        course_name: c.course_name,
        dept_id: c.dept_id,
        hours: c.hours,
        credits: c.credits,
      }))
    );
  } catch (e) {
    console.error('catalogCourses error', e);
    return res.status(500).json({ message: 'Failed to list courses' });
  }
};
