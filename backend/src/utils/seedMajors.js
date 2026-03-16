import Major from '../model/major.model.js';
import { majorsData } from './majorsData.js';
import { Op } from 'sequelize';

export const seedMajors = async () => {
  try {
    // First, try to sync the model (create table if it doesn't exist)
    console.log('[seedMajors] Syncing Major model...');
    await Major.sync();
    console.log('[seedMajors] Model synced successfully');

    console.log('[seedMajors] Enforcing canonical majors list...');
    const canonicalNames = majorsData.map((major) => major.name);

    const shouldEnforceCanonicalMajors =
      process.env.SEED_MAJORS_ENFORCE_CANONICAL === 'true' ||
      process.env.NODE_ENV === 'development' ||
      process.env.NODE_ENV === 'test';

    await Major.bulkCreate(
      canonicalNames.map((name) => ({ name })),
      {
        ignoreDuplicates: true,
      }
    );

    if (shouldEnforceCanonicalMajors) {
      console.log('[seedMajors] Deleting non-canonical majors (enforcement enabled)...');
      await Major.destroy({
        where: {
          name: { [Op.notIn]: canonicalNames },
        },
      });
    } else {
      console.log(
        '[seedMajors] Skipping deletion of non-canonical majors (set SEED_MAJORS_ENFORCE_CANONICAL=true to enable).'
      );
    }

    const totalCount = await Major.count();
    console.log(`[seedMajors] Canonical majors enforced. Total majors: ${totalCount}`);
  } catch (error) {
    console.error('[seedMajors] Error seeding majors:', error.message);
    // Don't fail the entire startup if majors seeding fails
  }
};
