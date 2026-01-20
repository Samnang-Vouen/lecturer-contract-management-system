import ResearchField from '../model/researchField.model.js';
import { researchFieldsData } from './researchFieldsData.js';

export const seedResearchFields = async () => {
  try {
    // First, try to sync the model (create table if it doesn't exist)
    console.log('[seedResearchFields] Syncing ResearchField model...');
    await ResearchField.sync();
    console.log('[seedResearchFields] Model synced successfully');

    const existingCount = await ResearchField.count();

    if (existingCount > 0) {
      console.log(
        `[seedResearchFields] ${existingCount} research fields already exist, skipping seed`
      );
      return;
    }

    console.log('[seedResearchFields] Seeding research fields...');

    const fieldsToCreate = researchFieldsData.map((field) => ({ name: field.name }));

    await ResearchField.bulkCreate(fieldsToCreate, {
      ignoreDuplicates: true,
    });

    const totalCount = await ResearchField.count();
    console.log(`[seedResearchFields] Successfully seeded ${totalCount} research fields`);
  } catch (error) {
    console.error('[seedResearchFields] Error seeding research fields:', error.message);
    // Don't fail the entire startup if research fields seeding fails
  }
};
