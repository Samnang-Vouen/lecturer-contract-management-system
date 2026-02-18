import Specialization from '../model/specialization.model.js';
import Department from '../model/department.model.js';

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

    // Get departments first
    const cs = await Department.findOne({ where: { dept_name: 'Computer Science' } });
    const db = await Department.findOne({ where: { dept_name: 'Digital Business' } });
    const tn = await Department.findOne({ where: { dept_name: 'Telecommunication and Networking' } });

    if (!cs || !db || !tn) {
      console.error('[seedSpecializations] Required departments not found. Please seed departments first.');
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
      { name: 'Telecommunication and Networking', dept_id: tn.id },
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
