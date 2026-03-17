import Major from '../model/major.model.js';
import { Op, col, fn, where } from 'sequelize';

const CANONICAL_MAJORS = [
  'Software Engineering',
  'Data Science',
  'Digital Business',
  'Telecom and Networking Engineering',
  'Cyber Security',
];

const MAJOR_ALIAS_TO_CANONICAL = {
  'software engineering': 'Software Engineering',
  'data science': 'Data Science',
  'digital business': 'Digital Business',
  'digital business management': 'Digital Business',
  'telecom and networking engineering': 'Telecom and Networking Engineering',
  'telecommunications engineering': 'Telecom and Networking Engineering',
  'network engineering': 'Telecom and Networking Engineering',
  cybersecurity: 'Cyber Security',
  'cyber security': 'Cyber Security',
};

function canonicalizeMajorName(name) {
  const raw = String(name || '').trim();
  if (!raw) return null;

  // Remove trailing abbreviation in parentheses, e.g. "Software Engineering (SE)" -> "Software Engineering"
  const withoutAbbreviation = raw.replace(/\s*\([^)]+\)\s*$/u, '');

  const normalized = withoutAbbreviation.toLowerCase();
  return MAJOR_ALIAS_TO_CANONICAL[normalized] || null;
}

function canonicalMajorPrefixWhere(canonicalName) {
  return where(fn('LOWER', col('name')), {
    [Op.like]: `${String(canonicalName).toLowerCase()}%`,
  });
}

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

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Major name is required' });
    }

    const canonicalName = canonicalizeMajorName(name);
    if (!canonicalName || !CANONICAL_MAJORS.includes(canonicalName)) {
      return res.status(400).json({
        error: `Only the predefined ${CANONICAL_MAJORS.length} majors are allowed`,
        allowedMajors: CANONICAL_MAJORS,
      });
    }

    // Check if major already exists (case-insensitive, allow seeded names with abbreviations)
    const existingMajor = await Major.findOne({
      where: canonicalMajorPrefixWhere(canonicalName),
    });

    if (existingMajor) {
      return res.status(409).json({ error: 'Major already exists' });
    }

    const newMajor = await Major.create({ name: canonicalName });
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
    const canonicalName = canonicalizeMajorName(name);
    if (!canonicalName || !CANONICAL_MAJORS.includes(canonicalName)) continue;

    // Try to find existing major (case-insensitive, allow seeded names with abbreviations)
    let major = await Major.findOne({
      where: canonicalMajorPrefixWhere(canonicalName),
    });

    // If not found, create it
    if (!major) {
      try {
        major = await Major.create({ name: canonicalName });
      } catch (error) {
        // Handle unique constraint error in case of race condition
        if (error.name === 'SequelizeUniqueConstraintError') {
          major = await Major.findOne({
            where: canonicalMajorPrefixWhere(canonicalName),
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
