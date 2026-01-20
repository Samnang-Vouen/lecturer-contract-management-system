import sequelize from '../config/db.js';
import { User, LecturerProfile, Department } from '../model/user.model.js';
import Course from '../model/course.model.js';
import LecturerCourse from '../model/lecturerCourse.model.js';

const userId = parseInt(process.argv[2], 10);
const profileId = parseInt(process.argv[3], 10);
if (!userId && !profileId) {
  console.error('Usage: node src/scripts/dumpLecturerByIds.js <userId> <profileId?>');
  process.exit(1);
}

(async () => {
  try {
    await sequelize.authenticate();
    const whereP = {};
    if (profileId) whereP.id = profileId;
    if (userId) whereP.user_id = userId;

    let profile = null;
    if (Object.keys(whereP).length) {
      profile = await LecturerProfile.findOne({ where: whereP });
    }
    let user = null;
    if (userId) {
      user = await User.findByPk(userId);
    } else if (profile) {
      user = await User.findByPk(profile.user_id);
    }

    if (!profile) {
      console.log('No profile found for criteria', whereP);
      if (user) console.log('User exists without profile', user.toJSON());
      process.exit(0);
    }

    const departments = (await profile.getDepartments?.()) || [];
    const lecturerCourses = await LecturerCourse.findAll({
      where: { lecturer_profile_id: profile.id },
      include: [{ model: Course }],
    });

    const out = {
      user: user ? user.toJSON() : null,
      profile: profile.toJSON(),
      departments: departments.map((d) => d.toJSON()),
      courses: lecturerCourses.map((lc) => ({ id: lc.id, course: lc.Course?.toJSON() })),
      counts: { deptCount: departments.length, courseLinkCount: lecturerCourses.length },
    };
    console.log(JSON.stringify(out, null, 2));
  } catch (e) {
    console.error('Error', e);
  } finally {
    await sequelize.close();
  }
})();
