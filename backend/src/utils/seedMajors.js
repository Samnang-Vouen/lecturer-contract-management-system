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

    await Major.bulkCreate(
      canonicalNames.map((name) => ({ name })),
      {
        ignoreDuplicates: true,
      }
    );

    // Only remove non-canonical majors in development or test environments to
    // avoid accidentally deleting custom/existing majors in production
    // or when NODE_ENV is unset/misconfigured.
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      await Major.destroy({
        where: {
          name: { [Op.notIn]: canonicalNames },
        },
      });
    }

    const totalCount = await Major.count();
    console.log(`[seedMajors] Canonical majors enforced. Total majors: ${totalCount}`);
  } catch (error) {
    console.error('[seedMajors] Error seeding majors:', error.message);
    // Don't fail the entire startup if majors seeding fails
  }
};
