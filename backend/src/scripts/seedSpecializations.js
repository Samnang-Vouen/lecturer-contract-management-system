import Specialization from '../model/specialization.model.js';
import Department from '../model/department.model.js';
import sequelize from '../config/db.js';
import { fileURLToPath } from 'url';

export const seedSpecializations = async () => {
  try {
    console.log('[seedSpecializations] Syncing Specialization model...');
    await Specialization.sync();
    console.log('[seedSpecializations] Model synced successfully');

    const existingCount = await Specialization.count();

    if (existingCount > 0) {
      console.log(`[seedSpecializations] ${existingCount} specializations already exist, skipping seed`);
      return;
    }

    console.log('[seedSpecializations] Seeding specializations...');

    const departmentNames = [
      'Computer Science',
      'Digital Business',
      'Telecommunications and Network',
    ];
    const departments = await Department.findAll({
      where: { dept_name: departmentNames },
    });
    const departmentMap = new Map(departments.map((department) => [department.dept_name, department]));

    const cs = departmentMap.get('Computer Science');
    const db = departmentMap.get('Digital Business');
    const tn =
      departmentMap.get('Telecommunications and Network');

    if (!cs || !db || !tn) {
      const missingDepartments = [
        ['Computer Science', cs],
        ['Digital Business', db],
        ['Telecommunications and Network', tn],
      ]
        .filter(([, department]) => !department)
        .map(([name]) => name);

      console.error(
        `[seedSpecializations] Required departments not found: ${missingDepartments.join(', ')}. Please seed departments first.`
      );
      return;
    }

    const specializationsData = [
      // Computer Science specializations
      { name: 'Software Engineering', dept_id: cs.id },
      { name: 'Data Science', dept_id: cs.id },
      // Digital Business specializations
      { name: 'E-commerce', dept_id: db.id },
      // Telecommunication and Networking specializations
      { name: 'Cyber Security', dept_id: tn.id },
      { name: 'Telecommunications and Network', dept_id: tn.id },
    ];

    await Specialization.bulkCreate(specializationsData, {
      ignoreDuplicates: true,
    });

    const totalCount = await Specialization.count();
    console.log(`[seedSpecializations] Successfully seeded ${totalCount} specializations`);
  } catch (error) {
    console.error('[seedSpecializations] Error seeding specializations:', error.message);
    // Don't fail the entire startup if specializations seeding fails
  }
};

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  try {
    await sequelize.authenticate();
    await seedSpecializations();
  } catch (error) {
    console.error('[seedSpecializations] Script execution failed:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}
