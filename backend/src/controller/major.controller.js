import Major from '../model/major.model.js';

export const getMajors = async (req, res) => {
  try {
    const majors = await Major.findAll({
      order: [['name', 'ASC']],
    });

    res.json(majors);
  } catch (error) {
    console.error('Error fetching majors:', error);
    res.status(500).json({ error: 'Failed to fetch majors' });
  }
};

export const createMajor = async (req, res) => {
  try {
    const { name } = req.body;
    const trimmedName = name.trim();

    // Check if major already exists (case-insensitive)
    const existingMajor = await Major.findOne({
      where: {
        name: trimmedName,
      },
    });

    if (existingMajor) {
      return res.status(409).json({ error: 'Major already exists' });
    }

    const newMajor = await Major.create({ name: trimmedName });
    res.status(201).json(newMajor);
  } catch (error) {
    console.error('Error creating major:', error);
    res.status(500).json({ error: 'Failed to create major' });
  }
};

export const findOrCreateMajors = async (majorNames) => {
  const results = [];

  for (const name of majorNames) {
    if (!name || !name.trim()) continue;

    const trimmedName = name.trim();

    // Try to find existing major (case-insensitive)
    let major = await Major.findOne({
      where: {
        name: trimmedName,
      },
    });

    // If not found, create it
    if (!major) {
      try {
        major = await Major.create({ name: trimmedName });
      } catch (error) {
        // Handle unique constraint error in case of race condition
        if (error.name === 'SequelizeUniqueConstraintError') {
          major = await Major.findOne({
            where: {
              name: trimmedName,
            },
          });
        } else {
          throw error;
        }
      }
    }

    if (major) {
      results.push(major);
    }
  }

  return results;
};
