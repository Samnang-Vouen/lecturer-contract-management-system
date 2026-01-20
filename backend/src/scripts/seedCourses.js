import sequelize from '../config/db.js';
import { Op } from 'sequelize';
import Department from '../model/department.model.js';
import Course from '../model/course.model.js';

// Courses to seed (name-only; other fields use defaults)
const coursesToSeed = [
  'Introduction to Computer Science',
  'Programming Fundamentals',
  'Mathematics for Computing I',
  'Academic Writing',
  'Introduction to Management',
];

// Defaults
const DEFAULT_DEPT_NAME = 'Computer Science';
const DEFAULT_HOURS = 45; // placeholder, update later
const DEFAULT_CREDITS = 3; // placeholder, update later

async function ensureDepartment(name) {
  // Department model uses field dept_name (mapped to DB column `name`)
  let dept = await Department.findOne({ where: { dept_name: name } });
  if (!dept) {
    dept = await Department.create({ dept_name: name });
    console.log('Created department:', name);
  }
  return dept;
}

async function getNextCourseCode(prefix = 'CS', start = 101) {
  // Load existing codes with given prefix and compute next numeric suffix
  const codes = await Course.findAll({
    attributes: ['course_code'],
    where: { course_code: { [Op.like]: `${prefix}%` } },
    raw: true,
  });
  const used = new Set();
  for (const c of codes) {
    const m = String(c.course_code || '').match(new RegExp(`^${prefix}(\\d{3,})$`));
    if (m) used.add(parseInt(m[1], 10));
  }
  let n = start;
  while (used.has(n)) n++;
  return `${prefix}${n}`;
}

async function seedCourses() {
  await sequelize.authenticate();
  const dept = await ensureDepartment(DEFAULT_DEPT_NAME);

  // Build a set of existing course names to avoid duplicates (case-insensitive)
  const existing = await Course.findAll({ attributes: ['course_name'], raw: true });
  const existingNames = new Set(existing.map((c) => c.course_name.trim().toLowerCase()));

  for (const name of coursesToSeed) {
    const key = name.trim().toLowerCase();
    if (existingNames.has(key)) {
      console.log('Skipping existing course:', name);
      continue;
    }

    const course_code = await getNextCourseCode('CS', 101);
    const description = `Placeholder: ${name}. Update this description later.`;

    const created = await Course.create({
      dept_id: dept.id,
      course_code,
      course_name: name,
      description,
      hours: DEFAULT_HOURS,
      credits: DEFAULT_CREDITS,
    });
    console.log('Created course:', created.course_name, '->', created.course_code);
    // Mark as now existing to avoid duplicate code generation if names repeat in input
    existingNames.add(key);
  }
}

(async () => {
  try {
    await seedCourses();
  } catch (err) {
    console.error('Seeding courses failed:', err);
    process.exitCode = 1;
  } finally {
    try {
      await sequelize.close();
    } catch {}
  }
})();
