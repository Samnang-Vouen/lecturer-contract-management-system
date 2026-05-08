import Major from '../model/major.model.js';
import { Op, col, fn, where } from 'sequelize';
import { ValidationError, ConflictError } from '../utils/errors.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CANONICAL_MAJORS = [
  'Software Engineering',
  'Data Science',
  'Digital Business',
  'Telecom and Networking Engineering',
  'Cyber Security',
];

const MAJOR_ALIAS_TO_CANONICAL = {
  'software engineering': 'Software Engineering',
  'software engineering (se)': 'Software Engineering',
  'data science': 'Data Science',
  'data science (ds)': 'Data Science',
  'digital business': 'Digital Business',
  'digital business (db)': 'Digital Business',
  'digital business management': 'Digital Business',
  'telecom and networking engineering': 'Telecom and Networking Engineering',
  'telecom and networking engineering (tne)': 'Telecom and Networking Engineering',
  'telecommunications engineering': 'Telecom and Networking Engineering',
  'network engineering': 'Telecom and Networking Engineering',
  cybersecurity: 'Cyber Security',
  'cyber security': 'Cyber Security',
  'cyber security (cs)': 'Cyber Security',
};

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function canonicalizeMajorName(name) {
  const raw = String(name || '').trim();
  if (!raw) return null;
  const withoutAbbreviation = raw.replace(/\s*\([^)]+\)\s*$/u, '');
  const normalized = withoutAbbreviation.toLowerCase();
  return MAJOR_ALIAS_TO_CANONICAL[normalized] || null;
}

function canonicalMajorPrefixWhere(canonicalName) {
  return where(fn('LOWER', col('name')), {
    [Op.like]: `${String(canonicalName).toLowerCase()}%`,
  });
}

// ---------------------------------------------------------------------------
// Service: getMajorsData
// ---------------------------------------------------------------------------

export async function getMajorsData() {
  return Major.findAll({ order: [['name', 'ASC']] });
}

// ---------------------------------------------------------------------------
// Service: createMajorData
// ---------------------------------------------------------------------------

export async function createMajorData(name) {
  if (!name || !String(name).trim()) {
    throw new ValidationError('Major name is required', {
      payload: { error: 'Major name is required' },
    });
  }

  const canonicalName = canonicalizeMajorName(name);
  if (!canonicalName || !CANONICAL_MAJORS.includes(canonicalName)) {
    throw new ValidationError('Only predefined majors are allowed', {
      payload: {
        error: `Only the predefined ${CANONICAL_MAJORS.length} majors are allowed`,
        allowedMajors: CANONICAL_MAJORS,
      },
    });
  }

  const existingMajor = await Major.findOne({ where: canonicalMajorPrefixWhere(canonicalName) });
  if (existingMajor) {
    throw new ConflictError('Major already exists', {
      payload: { error: 'Major already exists' },
    });
  }

  return Major.create({ name: canonicalName });
}

// ---------------------------------------------------------------------------
// Service: findOrCreateMajors (utility — used by other services)
// ---------------------------------------------------------------------------

export async function findOrCreateMajors(majorNames) {
  const results = [];

  for (const name of majorNames) {
    if (!name || !String(name).trim()) continue;
    const canonicalName = canonicalizeMajorName(name);
    if (!canonicalName || !CANONICAL_MAJORS.includes(canonicalName)) continue;

    let major = await Major.findOne({ where: canonicalMajorPrefixWhere(canonicalName) });

    if (!major) {
      try {
        major = await Major.create({ name: canonicalName });
      } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
          major = await Major.findOne({ where: canonicalMajorPrefixWhere(canonicalName) });
        } else {
          throw error;
        }
      }
    }

    if (major) results.push(major);
  }

  return results;
}
