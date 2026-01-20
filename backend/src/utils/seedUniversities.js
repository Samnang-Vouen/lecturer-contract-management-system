import University from '../model/university.model.js';
import { universitiesData } from './universitiesData.js';

export const seedUniversities = async () => {
  try {
    // First, try to sync the model (create table if it doesn't exist)
    console.log('[seedUniversities] Syncing University model...');
    await University.sync();
    console.log('[seedUniversities] Model synced successfully');

    const existingCount = await University.count();

    if (existingCount > 0) {
      console.log(`[seedUniversities] ${existingCount} universities already exist, skipping seed`);
      return;
    }

    console.log('[seedUniversities] Seeding universities...');

    const universitiesToCreate = universitiesData.map((university) => ({ name: university.name }));

    await University.bulkCreate(universitiesToCreate, {
      ignoreDuplicates: true,
    });

    const totalCount = await University.count();
    console.log(`[seedUniversities] Successfully seeded ${totalCount} universities`);
  } catch (error) {
    console.error('[seedUniversities] Error seeding universities:', error.message);
    // Don't fail the entire startup if universities seeding fails
  }
};
