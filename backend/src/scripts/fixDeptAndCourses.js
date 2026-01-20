import sequelize from '../config/db.js';
import { Department, LecturerProfile } from '../model/user.model.js';
import Course from '../model/course.model.js';
import LecturerCourse from '../model/lecturerCourse.model.js';

async function run() {
  try {
    await sequelize.authenticate();
    console.log('DB connected');
    // 1. Fix department name
    const telecomOld = await Department.findOne({
      where: { dept_name: 'Telecommunications and Network' },
    });
    let telecom = await Department.findOne({
      where: { dept_name: 'Telecommunications and Networking' },
    });
    if (telecomOld && !telecom) {
      await telecomOld.update({ dept_name: 'Telecommunications and Networking' });
      telecom = telecomOld;
      console.log('Renamed department to Telecommunications and Networking');
    } else if (!telecom && !telecomOld) {
      telecom = await Department.create({ dept_name: 'Telecommunications and Networking' });
      console.log('Created department Telecommunications and Networking');
    } else if (telecom) {
      console.log('Target department already correct');
    }

    const cs = await Department.findOne({ where: { dept_name: 'Computer Science' } });
    if (!cs) throw new Error('Computer Science department missing');

    // 2. Ensure courses exist
    const ensureCourse = async ({ code, name, dept }) => {
      let c = await Course.findOne({ where: { course_name: name } });
      if (!c) {
        c = await Course.create({
          dept_id: dept.id,
          course_code: code,
          course_name: name,
          credits: 3,
          hours: 45,
        });
        console.log('Created course', name);
      } else {
        console.log('Course exists', name);
      }
      return c;
    };

    const advNet = await ensureCourse({
      code: 'NET401',
      name: 'Advanced Networking',
      dept: telecom,
    });
    const oop = await ensureCourse({
      code: 'CS302',
      name: 'Object-Oriented Programming',
      dept: cs,
    });

    // 3. Attach to lecturer profile id 16
    const profileId = 16;
    const profile = await LecturerProfile.findByPk(profileId);
    if (!profile) throw new Error('LecturerProfile id 16 not found');

    // Departments: ensure both CS and Telecom present
    const existingDepts = await profile.getDepartments();
    const existingIds = new Set(existingDepts.map((d) => d.id));
    const targetDeptIds = [cs.id, telecom.id];
    const missing = targetDeptIds.filter((id) => !existingIds.has(id));
    if (missing.length) {
      await profile.addDepartments(missing);
      console.log('Added missing department IDs', missing);
    } else {
      console.log('All target departments already linked');
    }

    // Courses: ensure lecturer has these two by creating LecturerCourse rows if absent
    const existingLC = await LecturerCourse.findAll({ where: { lecturer_profile_id: profileId } });
    const existingCourseIds = new Set(existingLC.map((lc) => lc.course_id));
    const toAdd = [advNet.id, oop.id].filter((id) => !existingCourseIds.has(id));
    if (toAdd.length) {
      await LecturerCourse.bulkCreate(
        toAdd.map((course_id) => ({ lecturer_profile_id: profileId, course_id }))
      );
      console.log('Added lecturer courses for course IDs', toAdd);
    } else {
      console.log('Lecturer already linked to target courses');
    }

    console.log('Fix complete');
  } catch (e) {
    console.error('Fix script error', e);
  } finally {
    await sequelize.close();
  }
}

run();
