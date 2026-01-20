import sequelize from '../config/db.js';
import { User, LecturerProfile, Department } from '../model/user.model.js';
import Course from '../model/course.model.js';
import LecturerCourse from '../model/lecturerCourse.model.js';

const email = process.argv[2];
if (!email) {
  console.error('Usage: node src/scripts/dumpLecturer.js <email>');
  process.exit(1);
}

(async () => {
  try {
    await sequelize.authenticate();
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log('No user found for email', email);
      process.exit(0);
    }
    const profile = await LecturerProfile.findOne({ where: { user_id: user.id } });
    if (!profile) {
      console.log('User found but no lecturer profile yet');
      process.exit(0);
    }
    const departments = (await profile.getDepartments?.()) || [];
    const lecturerCourses = await LecturerCourse.findAll({
      where: { lecturer_profile_id: profile.id },
      include: [{ model: Course }],
    });

    const out = {
      user: user.toJSON(),
      profile: profile.toJSON(),
      departments: departments.map((d) => d.toJSON()),
      courses: lecturerCourses.map((lc) => ({ id: lc.id, course: lc.Course?.toJSON() })),
    };
    console.log(JSON.stringify(out, null, 2));
  } catch (e) {
    console.error('Error dumping lecturer', e);
  } finally {
    await sequelize.close();
  }
})();
