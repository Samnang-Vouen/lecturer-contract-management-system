import sequelize from '../config/db.js';
import { Department } from '../model/user.model.js';
import Course from '../model/course.model.js';

const desiredDepartments = [
  'Computer Science',
  'Telecommunications and Networking',
  'Digital Business',
];

const desiredCourses = [
  {
    course_code: 'NET401',
    course_name: 'Advanced Networking',
    dept_name: 'Telecommunications and Networking',
    credits: 3,
    hours: 45,
  },
  {
    course_code: 'CS302',
    course_name: 'Object-Oriented Programming',
    dept_name: 'Computer Science',
    credits: 3,
    hours: 45,
  },
];

(async () => {
  try {
    await sequelize.authenticate();
    const existingDepts = await Department.findAll();
    const deptMap = new Map(existingDepts.map((d) => [d.dept_name.toLowerCase(), d]));

    for (const name of desiredDepartments) {
      if (!deptMap.has(name.toLowerCase())) {
        const created = await Department.create({ dept_name: name });
        console.log('Created department:', created.dept_name);
        deptMap.set(name.toLowerCase(), created);
      } else {
        console.log('Department exists:', name);
      }
    }

    for (const c of desiredCourses) {
      const dept = deptMap.get(c.dept_name.toLowerCase());
      if (!dept) {
        console.warn('Skipping course, missing department:', c.course_name, '->', c.dept_name);
        continue;
      }
      // Check if course with same normalized name already exists
      const exists = await Course.findOne({ where: { course_name: c.course_name } });
      if (exists) {
        console.log('Course exists:', c.course_name);
        continue;
      }
      const createdCourse = await Course.create({
        dept_id: dept.id,
        course_code: c.course_code,
        course_name: c.course_name,
        description: c.description || null,
        hours: c.hours || null,
        credits: c.credits || null,
      });
      console.log('Created course:', createdCourse.course_name);
    }
  } catch (e) {
    console.error('Seeding error', e);
  } finally {
    await sequelize.close();
  }
})();
