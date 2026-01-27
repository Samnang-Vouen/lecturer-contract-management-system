import University from '../model/university.model.js';

export const getUniversities = async (req, res) => {
  try {
    const universities = await University.findAll({
      order: [['name', 'ASC']],
    });

    res.json(universities);
  } catch (error) {
    console.error('Error fetching universities:', error);
    res.status(500).json({ error: 'Failed to fetch universities' });
  }
};

export const createUniversity = async (req, res) => {
  try {
    const { name } = req.body;
    const trimmedName = name.trim();

    // Check if university already exists (case-insensitive)
    const existingUniversity = await University.findOne({
      where: {
        name: trimmedName,
      },
    });

    if (existingUniversity) {
      return res.status(409).json({ error: 'University already exists' });
    }

    const newUniversity = await University.create({ name: trimmedName });
    res.status(201).json(newUniversity);
  } catch (error) {
    console.error('Error creating university:', error);
    res.status(500).json({ error: 'Failed to create university' });
  }
};

export const findOrCreateUniversities = async (universityNames) => {
  const results = [];

  for (const name of universityNames) {
    if (!name || !name.trim()) continue;

    const trimmedName = name.trim();

    // Try to find existing university (case-insensitive)
    let university = await University.findOne({
      where: {
        name: trimmedName,
      },
    });

    // If not found, create it
    if (!university) {
      try {
        university = await University.create({ name: trimmedName });
      } catch (error) {
        // Handle unique constraint error in case of race condition
        if (error.name === 'SequelizeUniqueConstraintError') {
          university = await University.findOne({
            where: {
              name: trimmedName,
            },
          });
        } else {
          throw error;
        }
      }
    }

    if (university) {
      results.push(university);
    }
  }

  return results;
};
