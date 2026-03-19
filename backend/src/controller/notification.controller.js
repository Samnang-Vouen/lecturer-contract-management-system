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
      // Persisted notification rows are scoped by user_id and assumed to be created
      // only for department-authorized management users.
      const persisted = await Notification.findAll({
        where: { user_id: req.user.id },
        order: [['createdAt', 'DESC']],
        limit: 30,
      });

      // Do not derive notifications from raw contract data here, to avoid exposing
      // contracts from departments the current user is not authorized to view.
      return res.json(persisted.map((n) => n.toJSON()));
    }

    return res.json([]);
  } catch (e) {
    console.error('getMyNotifications error', e.message);
    return res.status(HTTP_STATUS.SERVER_ERROR).json({ message: 'Failed to fetch notifications' });
  }
};
