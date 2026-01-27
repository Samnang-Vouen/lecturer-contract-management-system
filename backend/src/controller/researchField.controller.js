import ResearchField from '../model/researchField.model.js';
import { Op } from 'sequelize';

export const getResearchFields = async (req, res) => {
  try {
    const fields = await ResearchField.findAll({
      order: [['name', 'ASC']],
    });

    res.json(fields);
  } catch (error) {
    console.error('Error fetching research fields:', error);
    res.status(500).json({ error: 'Failed to fetch research fields' });
  }
};

export const createResearchField = async (req, res) => {
  try {
    const { name } = req.body;
    const trimmedName = name.trim();

    // Check if field already exists (case-insensitive)
    const existingField = await ResearchField.findOne({
      where: {
        name: trimmedName,
      },
    });

    if (existingField) {
      return res.status(409).json({ error: 'Research field already exists' });
    }

    const newField = await ResearchField.create({ name: trimmedName });
    res.status(201).json(newField);
  } catch (error) {
    console.error('Error creating research field:', error);
    res.status(500).json({ error: 'Failed to create research field' });
  }
};

export const findOrCreateResearchFields = async (fieldNames) => {
  const results = [];

  for (const name of fieldNames) {
    if (!name || !name.trim()) continue;

    const trimmedName = name.trim();

    // Try to find existing field (case-insensitive)
    let field = await ResearchField.findOne({
      where: {
        name: trimmedName,
      },
    });

    // If not found, create it
    if (!field) {
      try {
        field = await ResearchField.create({ name: trimmedName });
      } catch (error) {
        // Handle unique constraint error in case of race condition
        if (error.name === 'SequelizeUniqueConstraintError') {
          field = await ResearchField.findOne({
            where: {
              name: trimmedName,
            },
          });
        } else {
          throw error;
        }
      }
    }

    if (field) {
      results.push(field);
    }
  }

  return results;
};
