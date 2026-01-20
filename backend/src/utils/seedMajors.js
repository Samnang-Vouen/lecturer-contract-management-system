import Major from '../model/major.model.js';
import { majorsData } from './majorsData.js';

export const seedMajors = async () => {
  try {
    // First, try to sync the model (create table if it doesn't exist)
    console.log('[seedMajors] Syncing Major model...');
    await Major.sync();
    console.log('[seedMajors] Model synced successfully');

    const existingCount = await Major.count();

    if (existingCount > 0) {
      console.log(`[seedMajors] ${existingCount} majors already exist, skipping seed`);
      return;
    }

    console.log('[seedMajors] Seeding majors...');

    const majorsToCreate = majorsData.map((major) => ({ name: major.name }));

    await Major.bulkCreate(majorsToCreate, {
      ignoreDuplicates: true,
    });

    const totalCount = await Major.count();
    console.log(`[seedMajors] Successfully seeded ${totalCount} majors`);
  } catch (error) {
    console.error('[seedMajors] Error seeding majors:', error.message);
    // Don't fail the entire startup if majors seeding fails
  }
};
