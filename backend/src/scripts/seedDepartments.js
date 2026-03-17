import Department from '../model/department.model.js';

const departmentsData = [
  { dept_name: 'Computer Science', dept_name_khmer: 'វិទ្យាសាស្ត្រកុំព្យូទ័រ' },
  { dept_name: 'Digital Business', dept_name_khmer: 'អាជីវកម្មឌីជីថល' },
  { dept_name: 'Telecommunications and Networking', dept_name_khmer: 'ទូរគមនាគមន៍ និងបណ្តាញ' },
  { dept_name: 'Foundation', dept_name_khmer: 'ថ្នាក់មូលដ្ធាន' },
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
