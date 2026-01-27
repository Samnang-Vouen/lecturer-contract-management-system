import sequelize from '../config/db.js';
import { NewContract, ContractItem, User, Department } from '../model/index.js';

export async function createContract(req, res) {
  const t = await sequelize.transaction();
  try {
    const { lecturerId, items, start_date, end_date, salary } = req.body || {};
    // Management/Admin scoping: ensure the target lecturer is within the same department
    const actorRole = String(req.user?.role || '').toLowerCase();
    if (['admin', 'management'].includes(actorRole)) {
      const actorDept = req.user?.department_name || null;
      if (!actorDept) {
        await t.rollback();
        return res.status(403).json({ message: 'Your account is missing a department' });
      }
      const lecturer = await User.findByPk(lecturerId, { attributes: ['id', 'department_name'] });
      if (!lecturer) {
        await t.rollback();
        return res.status(400).json({ message: 'Invalid lecturerId' });
      }
      if (String(lecturer.department_name || '') !== String(actorDept)) {
        await t.rollback();
        return res
          .status(403)
          .json({ message: 'You can only create contracts for lecturers in your department' });
      }
    }

    const contract = await NewContract.create(
      {
        lecturer_user_id: lecturerId,
        start_date: start_date || null,
        end_date: end_date || null,
        salary: salary || null,
        created_by: req.user.id,
      },
      { transaction: t }
    );

    const rows = items
      .filter(Boolean)
      .map((it) => ({ contract_id: contract.id, item: String(it) }));
    if (rows.length) {
      await ContractItem.bulkCreate(rows, { transaction: t });
    }

    await t.commit();

    const created = await NewContract.findByPk(contract.id, {
      include: [
        { model: ContractItem, as: 'items' },
        { model: User, as: 'lecturer', attributes: ['id', 'display_name', 'email'] },
      ],
    });
    return res.status(201).json(created);
  } catch (e) {
    await t.rollback();
    console.error('[createContract]', e);
    return res.status(500).json({ message: 'Failed to create contract', error: e.message });
  }
}

export async function getContractById(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const found = await NewContract.findByPk(id, {
      include: [
        { model: ContractItem, as: 'items' },
        {
          model: User,
          as: 'lecturer',
          attributes: ['id', 'display_name', 'email', 'department_name'],
        },
      ],
    });
    if (!found) return res.status(404).json({ message: 'Not found' });
    // Scope for admin/management: only same-department lecturers
    const actorRole = String(req.user?.role || '').toLowerCase();
    if (['admin', 'management'].includes(actorRole)) {
      if (
        String(found.lecturer?.department_name || '') !== String(req.user?.department_name || '')
      ) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    return res.json(found);
  } catch (e) {
    console.error('[getContractById]', e);
    return res.status(500).json({ message: 'Failed to fetch contract', error: e.message });
  }
}
