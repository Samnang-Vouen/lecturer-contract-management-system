import sequelize from '../config/db.js';
import Department from '../model/department.model.js';
import Course from '../model/course.model.js';
import { Op } from 'sequelize';

// ============================================================================
// DEPARTMENTS TO SEED
// ============================================================================
const desiredDepartments = [
  'Computer Science',
  'Telecommunications and Network',
  'Digital Business',
  'Foundation'
];

// ============================================================================
// COURSES TO SEED (3 per department)
// ============================================================================
const desiredCourses = [
  // Computer Science Department
  {
    course_code: 'CS101',
    course_name: 'Introduction to Programming',
    dept_name: 'Computer Science',
    credits: 3,
    hours: 45,
    description: 'Fundamentals of programming using modern languages'
  },
  {
    course_code: 'CS201',
    course_name: 'Data Structures and Algorithms',
    dept_name: 'Computer Science',
    credits: 3,
    hours: 45,
    description: 'Essential data structures and algorithmic techniques'
  },
  {
    course_code: 'CS301',
    course_name: 'Database Management Systems',
    dept_name: 'Computer Science',
    credits: 3,
    hours: 45,
    description: 'Design and implementation of database systems'
  },

  // Telecommunications and Network Department
  {
    course_code: 'NET101',
    course_name: 'Network Fundamentals',
    dept_name: 'Telecommunications and Network',
    credits: 2,
    hours: 30,
    description: 'Basic concepts of computer networking'
  },
  {
    course_code: 'NET201',
    course_name: 'Wireless Communications',
    dept_name: 'Telecommunications and Network',
    credits: 3,
    hours: 45,
    description: 'Principles of wireless communication systems'
  },
  {
    course_code: 'NET301',
    course_name: 'Network Security',
    dept_name: 'Telecommunications and Network',
    credits: 3,
    hours: 45,
    description: 'Security protocols and network defense mechanisms'
  },

  // Digital Business Department
  {
    course_code: 'DB101',
    course_name: 'Digital Marketing',
    dept_name: 'Digital Business',
    credits: 3,
    hours: 45,
    description: 'Strategies for marketing in the digital age'
  },
  {
    course_code: 'DB201',
    course_name: 'E-Commerce Platforms',
    dept_name: 'Digital Business',
    credits: 3,
    hours: 45,
    description: 'Building and managing online business platforms'
  },
  {
    course_code: 'DB301',
    course_name: 'Business Analytics',
    dept_name: 'Digital Business',
    credits: 3,
    hours: 45,
    description: 'Data-driven decision making for business'
  },

  // Foundation Department
  {
    course_code: 'FND101',
    course_name: 'Mathematics for Computing',
    dept_name: 'Foundation',
    credits: 2,
    hours: 30,
    description: 'Essential mathematical concepts for IT students'
  },
  {
    course_code: 'FND102',
    course_name: 'Academic English',
    dept_name: 'Foundation',
    credits: 2,
    hours: 30,
    description: 'English language skills for academic success'
  },
  {
    course_code: 'FND103',
    course_name: 'Study Skills',
    dept_name: 'Foundation',
    credits: 1,
    hours: 15,
    description: 'Techniques for effective learning and time management'
  },
];

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================
(async () => {
  try {
    console.log('========================================');
    console.log('Starting Department & Course Seeding...');
    console.log('========================================\n');

    // Authenticate database connection
    await sequelize.authenticate();
    console.log('✓ Database connection authenticated\n');

    // ========================================================================
    // STEP 1: Seed Departments
    // ========================================================================
    console.log('--- SEEDING DEPARTMENTS ---');
    const existingDepts = await Department.findAll();
    const deptMap = new Map(existingDepts.map((d) => [d.dept_name.toLowerCase(), d]));

    let deptsCreated = 0;
    let deptsExisting = 0;

    for (const name of desiredDepartments) {
      const key = name.toLowerCase();
      if (!deptMap.has(key)) {
        const created = await Department.create({ dept_name: name });
        console.log(`  ✓ Created department: "${created.dept_name}" (ID: ${created.id})`);
        deptMap.set(key, created);
        deptsCreated++;
      } else {
        const existing = deptMap.get(key);
        console.log(`  → Department exists: "${existing.dept_name}" (ID: ${existing.id})`);
        deptsExisting++;
      }
    }

    console.log(`\nDepartments Summary: ${deptsCreated} created, ${deptsExisting} existing\n`);

    // ========================================================================
    // STEP 2: Seed Courses
    // ========================================================================
    console.log('--- SEEDING COURSES ---');
    let coursesCreated = 0;
    let coursesSkipped = 0;
    let coursesError = 0;

    for (const c of desiredCourses) {
      const dept = deptMap.get(c.dept_name.toLowerCase());
      
      // Check if department exists
      if (!dept) {
        console.warn(`  ✗ Skipped course "${c.course_name}" - Department not found: "${c.dept_name}"`);
        coursesSkipped++;
        continue;
      }

      try {
        // Check if course already exists (by code OR name within the department)
        const existingCourse = await Course.findOne({
          where: {
            dept_id: dept.id,
            [Op.or]: [
              { course_code: c.course_code },
              { course_name: c.course_name }
            ]
          }
        });

        if (existingCourse) {
          console.log(`  → Course exists: "${c.course_name}" (${c.course_code}) in "${c.dept_name}"`);
          coursesSkipped++;
          continue;
        }

        // Create the course
        const createdCourse = await Course.create({
          dept_id: dept.id,
          course_code: c.course_code,
          course_name: c.course_name,
          description: c.description || null,
          hours: c.hours || null,
          credits: c.credits || null,
        });

        console.log(`  ✓ Created course: "${createdCourse.course_name}" (${createdCourse.course_code}) in "${c.dept_name}"`);
        coursesCreated++;

      } catch (error) {
        console.error(`  ✗ Error creating course "${c.course_name}":`, error.message);
        coursesError++;
      }
    }

    console.log(`\nCourses Summary: ${coursesCreated} created, ${coursesSkipped} skipped, ${coursesError} errors\n`);

    console.log('========================================');
    console.log('✓ Seeding completed successfully!');
    console.log('========================================');

  } catch (error) {
    console.error('\n========================================');
    console.error('✗ SEEDING FAILED');
    console.error('========================================');
    console.error('Error details:', error);
    process.exit(1);
  } finally {
    try {
      await sequelize.close();
      console.log('\n✓ Database connection closed safely');
    } catch (closeError) {
      console.error('✗ Error closing database connection:', closeError);
      process.exit(1);
    }
  }
})();
