import { Notification, TeachingContract, AdvisorContract } from '../model/index.js';
import { Op } from 'sequelize';
import { HTTP_STATUS } from '../config/constants.js';

export const getMyNotifications = async (req, res) => {
  try {
    const role = String(req.user?.role || '').toLowerCase();

    if (role === 'lecturer' || role === 'advisor') {
      const persisted = await Notification.findAll({
        where: { user_id: req.user.id },
        order: [['createdAt', 'DESC']],
        limit: 30,
      });

      // Fallback: derive from pending AdvisorContracts assigned to this user
      const myAdvisorContracts = await AdvisorContract.findAll({
        where: {
          lecturer_user_id: req.user.id,
          status: { [Op.in]: ['DRAFT', 'WAITING_MANAGEMENT', 'REQUEST_REDO'] },
        },
        order: [['updated_at', 'DESC']],
        limit: 30,
        attributes: ['id', 'status', 'updated_at'],
      });

      const persistedContractIds = new Set(
        persisted.map((n) => n.contract_id).filter(Boolean)
      );

      const advisorStatusLabel = {
        DRAFT: 'waiting for your signature',
        WAITING_MANAGEMENT: 'signed by you, waiting for management',
        REQUEST_REDO: 'revision requested — please review',
      };

      const derived = myAdvisorContracts
        .filter((c) => !persistedContractIds.has(c.id))
        .map((c) => ({
          id: null,
          message: `Advisor contract #${c.id} — ${advisorStatusLabel[c.status] || c.status.replace(/_/g, ' ').toLowerCase()}`,
          contract_id: c.id,
          createdAt: c.updated_at,
          type: 'status_change',
        }));

      const combined = [...persisted.map((n) => n.toJSON()), ...derived]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 30);

      return res.json(combined);
    }

    if (role === 'admin' || role === 'management') {
      // 1. Persisted notification rows (created by notifyRole going forward)
      const persisted = await Notification.findAll({
        where: { user_id: req.user.id },
        order: [['createdAt', 'DESC']],
        limit: 30,
      });

      // 2. Currently-pending TeachingContracts as fallback (covers old data)
      const teachingContracts = await TeachingContract.findAll({
        where: {
          status: { [Op.in]: ['WAITING_LECTURER', 'WAITING_MANAGEMENT', 'REQUEST_REDO'] },
        },
        order: [['updated_at', 'DESC']],
        limit: 30,
        attributes: ['id', 'status', 'updated_at'],
      });

      // 3. Currently-pending AdvisorContracts as fallback (covers old data)
      const advisorContracts = await AdvisorContract.findAll({
        where: {
          status: { [Op.in]: ['DRAFT', 'WAITING_MANAGEMENT', 'REQUEST_REDO'] },
        },
        order: [['updated_at', 'DESC']],
        limit: 30,
        attributes: ['id', 'status', 'updated_at'],
      });

      // 4. Only include derived entries for contracts not already in persisted rows
      const persistedContractIds = new Set(
        persisted.map((n) => n.contract_id).filter(Boolean)
      );

      const derivedTeaching = teachingContracts
        .filter((c) => !persistedContractIds.has(c.id))
        .map((c) => ({
          id: null,
          message: `Contract #${c.id} is ${c.status.replace(/_/g, ' ').toLowerCase()}`,
          contract_id: c.id,
          createdAt: c.updated_at,
          type: 'status_change',
        }));

      const advisorStatusLabelMgmt = {
        DRAFT: 'waiting for advisor signature',
        WAITING_MANAGEMENT: 'advisor signed, awaiting your signature',
        REQUEST_REDO: 'revision requested',
      };

      const derivedAdvisor = advisorContracts
        .filter((c) => !persistedContractIds.has(c.id))
        .map((c) => ({
          id: null,
          message: `Advisor contract #${c.id} — ${advisorStatusLabelMgmt[c.status] || c.status.replace(/_/g, ' ').toLowerCase()}`,
          contract_id: c.id,
          createdAt: c.updated_at,
          type: 'status_change',
        }));

      const combined = [
        ...persisted.map((n) => n.toJSON()),
        ...derivedTeaching,
        ...derivedAdvisor,
      ]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 30);

      return res.json(combined);
    }

    return res.json([]);
  } catch (e) {
    console.error('getMyNotifications error', e.message);
    return res.status(HTTP_STATUS.SERVER_ERROR).json({ message: 'Failed to fetch notifications' });
  }
};
