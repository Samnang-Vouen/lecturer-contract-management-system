import { Op } from 'sequelize';
import Candidate from '../model/candidate.model.js';
import { Department } from '../model/index.js';
import { NotFoundError, ValidationError, ForbiddenError, ConflictError } from '../utils/errors.js';

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

async function resolveDeptId(departmentName) {
  if (!departmentName) return null;
  const [dept] = await Department.findOrCreate({
    where: { dept_name: departmentName },
    defaults: { dept_name: departmentName },
  });
  return dept.id;
}

async function findDeptId(departmentName) {
  if (!departmentName) return null;
  const dept = await Department.findOne({ where: { dept_name: departmentName } });
  return dept ? dept.id : null;
}

function assertDeptAccess(candidate, deptId) {
  if (deptId !== null && candidate.dept_id !== deptId) {
    throw new ForbiddenError('Access denied: different department', {
      payload: { message: 'Access denied: different department' },
    });
  }
}

// ---------------------------------------------------------------------------
// listCandidates
// ---------------------------------------------------------------------------

export async function listCandidates({ page: rawPage, limit: rawLimit, status, search, role, department_name }) {
  const page = parseInt(rawPage, 10) > 0 ? parseInt(rawPage, 10) : 1;
  const limit = parseInt(rawLimit, 10) > 0 ? Math.min(parseInt(rawLimit, 10), 100) : 10;
  const offset = (page - 1) * limit;

  const where = {};

  if (role === 'admin' && department_name) {
    const dept = await Department.findOne({ where: { dept_name: department_name } });
    where.dept_id = dept ? dept.id : -1;
  }

  const trimmedStatus = (status || '').trim();
  if (trimmedStatus) where.status = trimmedStatus;
  where.imported_from_file = false;

  const trimmedSearch = (search || '').trim();
  const queryWhere = trimmedSearch
    ? {
        ...where,
        [Op.or]: [
          { fullName: { [Op.like]: `%${trimmedSearch}%` } },
          { email: { [Op.like]: `%${trimmedSearch}%` } },
        ],
      }
    : where;

  const { rows, count } = await Candidate.findAndCountAll({
    where: queryWhere,
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });

  return {
    data: rows,
    page,
    limit,
    total: count,
    totalPages: Math.ceil(count / limit) || 1,
    hasMore: page * limit < count,
  };
}

// ---------------------------------------------------------------------------
// createCandidate
// ---------------------------------------------------------------------------

export async function createCandidateRecord({ fullName, email, phone, positionAppliedFor, interviewDate, role, department_name }) {
  if (!fullName || !email) {
    throw new ValidationError('fullName and email are required', {
      payload: { message: 'fullName and email are required' },
    });
  }
  if (!String(email).includes('@')) {
    throw new ValidationError('Email must contain @', {
      payload: { message: 'Email must contain @' },
    });
  }

  let dept_id = null;
  if (role === 'admin' && department_name) {
    dept_id = await resolveDeptId(department_name);
  }

  try {
    const candidate = await Candidate.create({
      fullName,
      email,
      phone,
      positionAppliedFor,
      interviewDate: interviewDate ? new Date(interviewDate) : null,
      status: 'pending',
      dept_id,
    });
    return candidate;
  } catch (err) {
    if (err?.name === 'SequelizeUniqueConstraintError') {
      throw new ConflictError('Email already exists', {
        payload: { message: 'Email already exists' },
      });
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// updateCandidate
// ---------------------------------------------------------------------------

const UPDATABLE_FIELDS = [
  'fullName', 'email', 'phone', 'positionAppliedFor', 'interviewDate',
  'status', 'interviewScore', 'rejectionReason', 'hourlyRate', 'rateReason', 'evaluator',
];

export async function updateCandidateRecord({ id, updates: rawUpdates, role, department_name }) {
  const updates = {};
  for (const key of UPDATABLE_FIELDS) {
    if (key in rawUpdates) updates[key] = rawUpdates[key];
  }

  if ('email' in updates && updates.email !== null && updates.email !== undefined && !String(updates.email).includes('@')) {
    throw new ValidationError('Email must contain @', {
      payload: { message: 'Email must contain @' },
    });
  }
  if ('interviewDate' in updates && updates.interviewDate) {
    updates.interviewDate = new Date(updates.interviewDate);
  }

  const candidate = await Candidate.findByPk(id);
  if (!candidate) {
    throw new NotFoundError('Candidate not found', {
      payload: { message: 'Candidate not found' },
    });
  }

  if (role === 'admin' && department_name) {
    const deptId = await findDeptId(department_name);
    assertDeptAccess(candidate, deptId);
  }

  await candidate.update(updates);
  return candidate;
}

// ---------------------------------------------------------------------------
// deleteCandidate
// ---------------------------------------------------------------------------

export async function deleteCandidateRecord({ id, role, department_name }) {
  const candidate = await Candidate.findByPk(id);
  if (!candidate) {
    throw new NotFoundError('Candidate not found', {
      payload: { message: 'Candidate not found' },
    });
  }

  if (role === 'admin' && department_name) {
    const deptId = await findDeptId(department_name);
    assertDeptAccess(candidate, deptId);
  }

  await candidate.destroy();
}
