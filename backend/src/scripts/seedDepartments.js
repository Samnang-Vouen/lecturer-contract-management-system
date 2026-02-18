import Department from '../model/department.model.js';

const departmentsData = [
  { dept_name: 'Computer Science' },
  { dept_name: 'Digital Business' },
  { dept_name: 'Telecommunication and Networking' },
];

export const seedDepartments = async () => {
  try {
    // First, try to sync the model (create table if it doesn't exist)
    console.log('[seedDepartments] Syncing Department model...');
    await Department.sync();
    console.log('[seedDepartments] Model synced successfully');

    const existingCount = await Department.count();

    if (existingCount > 0) {
      console.log(`[seedDepartments] ${existingCount} departments already exist, skipping seed`);
      return;
    }

    console.log('[seedDepartments] Seeding departments...');

    await Department.bulkCreate(departmentsData, {
      ignoreDuplicates: true,
    });

    const totalCount = await Department.count();
    console.log(`[seedDepartments] Successfully seeded ${totalCount} departments`);
  } catch (error) {
    console.error('[seedDepartments] Error seeding departments:', error.message);
    // Don't fail the entire startup if departments seeding fails
  }
};
