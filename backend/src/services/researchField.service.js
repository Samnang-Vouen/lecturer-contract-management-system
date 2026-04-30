import ResearchField from '../model/researchField.model.js';
import { ValidationError, ConflictError } from '../utils/errors.js';

export async function getResearchFieldsData() {
  return ResearchField.findAll({ order: [['name', 'ASC']] });
}

export async function createResearchFieldData(name) {
  if (!name || !String(name).trim()) {
    throw new ValidationError('Research field name is required', {
      payload: { error: 'Research field name is required' },
    });
  }

  const trimmedName = String(name).trim();

  const existingField = await ResearchField.findOne({ where: { name: trimmedName } });
  if (existingField) {
    throw new ConflictError('Research field already exists', {
      payload: { error: 'Research field already exists' },
    });
  }

  return ResearchField.create({ name: trimmedName });
}

export async function findOrCreateResearchFields(fieldNames) {
  const results = [];

  for (const name of fieldNames) {
    if (!name || !String(name).trim()) continue;
    const trimmedName = String(name).trim();

    let field = await ResearchField.findOne({ where: { name: trimmedName } });

    if (!field) {
      try {
        field = await ResearchField.create({ name: trimmedName });
      } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
          field = await ResearchField.findOne({ where: { name: trimmedName } });
        } else {
          throw error;
        }
      }
    }

    if (field) results.push(field);
  }

  return results;
}
