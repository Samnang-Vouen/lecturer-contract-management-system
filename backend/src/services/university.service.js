import University from '../model/university.model.js';
import { ValidationError, ConflictError } from '../utils/errors.js';

export async function getUniversitiesData() {
  return University.findAll({ order: [['name', 'ASC']] });
}

export async function createUniversityData(name) {
  if (!name || !String(name).trim()) {
    throw new ValidationError('University name is required', {
      payload: { error: 'University name is required' },
    });
  }

  const trimmedName = String(name).trim();

  const existingUniversity = await University.findOne({ where: { name: trimmedName } });
  if (existingUniversity) {
    throw new ConflictError('University already exists', {
      payload: { error: 'University already exists' },
    });
  }

  return University.create({ name: trimmedName });
}

export async function findOrCreateUniversities(universityNames) {
  const results = [];

  for (const name of universityNames) {
    if (!name || !String(name).trim()) continue;
    const trimmedName = String(name).trim();

    let university = await University.findOne({ where: { name: trimmedName } });

    if (!university) {
      try {
        university = await University.create({ name: trimmedName });
      } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
          university = await University.findOne({ where: { name: trimmedName } });
        } else {
          throw error;
        }
      }
    }

    if (university) results.push(university);
  }

  return results;
}
