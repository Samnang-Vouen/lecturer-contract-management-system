import sequelize from '../config/db.js';
import { NewContract, ContractItem, User } from '../model/index.js';
import { ValidationError, ForbiddenError, NotFoundError } from '../utils/errors.js';

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

async function assertDeptScope(actorRole, actorDept, lecturerId, t) {
  if (!['admin', 'management'].includes(actorRole)) return;

  if (!actorDept) {
    await t.rollback();
    throw new ForbiddenError('Your account is missing a department', {
      payload: { message: 'Your account is missing a department' },
    });
  }

  const lecturer = await User.findByPk(lecturerId, { attributes: ['id', 'department_name'] });
  if (!lecturer) {
    await t.rollback();
    throw new ValidationError('Invalid lecturerId', { payload: { message: 'Invalid lecturerId' } });
  }

  if (String(lecturer.department_name || '') !== String(actorDept)) {
    await t.rollback();
    throw new ForbiddenError('You can only create contracts for lecturers in your department', {
      payload: { message: 'You can only create contracts for lecturers in your department' },
    });
  }
}

// ---------------------------------------------------------------------------
// createContract
// ---------------------------------------------------------------------------

export async function createContractRecord({ lecturerId, items, start_date, end_date, salary, actorRole, actorDept, actorId }) {
  if (!lecturerId || !Array.isArray(items) || items.length === 0) {
    throw new ValidationError('lecturerId and at least one item are required', {
      payload: { message: 'lecturerId and at least one item are required' },
    });
  }

  const t = await sequelize.transaction();

  await assertDeptScope(actorRole, actorDept, lecturerId, t);

  const contract = await NewContract.create(
    {
      lecturer_user_id: lecturerId,
      start_date: start_date || null,
      end_date: end_date || null,
      salary: salary || null,
      created_by: actorId,
    },
    { transaction: t }
  );

  const rows = items.filter(Boolean).map((it) => ({ contract_id: contract.id, item: String(it) }));
  if (rows.length) {
    await ContractItem.bulkCreate(rows, { transaction: t });
  }

  await t.commit();

  return NewContract.findByPk(contract.id, {
    include: [
      { model: ContractItem, as: 'items' },
      { model: User, as: 'lecturer', attributes: ['id', 'display_name', 'email'] },
    ],
  });
}

// ---------------------------------------------------------------------------
// getContract
// ---------------------------------------------------------------------------

export async function getContractRecord({ id, actorRole, actorDept }) {
  const found = await NewContract.findByPk(parseInt(id, 10), {
    include: [
      { model: ContractItem, as: 'items' },
      { model: User, as: 'lecturer', attributes: ['id', 'display_name', 'email', 'department_name'] },
    ],
  });

  if (!found) {
    throw new NotFoundError('Not found', { payload: { message: 'Not found' } });
  }

  if (['admin', 'management'].includes(actorRole)) {
    if (String(found.lecturer?.department_name || '') !== String(actorDept || '')) {
      throw new ForbiddenError('Access denied', { payload: { message: 'Access denied' } });
    }
  }

  return found;
}
