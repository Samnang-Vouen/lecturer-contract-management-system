import { Notification, TeachingContract } from '../model/index.js';
import { Op } from 'sequelize';
import { HTTP_STATUS } from '../config/constants.js';

export const getMyNotifications = async (req, res) => {
  try {
    const role = String(req.user?.role || '').toLowerCase();

    // Lecturers and advisors: return persisted Notification rows for this user
    if (role === 'lecturer' || role === 'advisor') {
      const rows = await Notification.findAll({
        where: { user_id: req.user.id },
        order: [['createdAt', 'DESC']],
        limit: 30,
      });
      return res.json(rows.map((n) => n.toJSON()));
    }

    // Admin and management: derive from pending contracts
    if (role === 'admin' || role === 'management') {
      const where = {
        status: { [Op.in]: ['WAITING_MANAGEMENT', 'LECTURER_SIGNED', 'REQUEST_REDO'] },
      };
      // Management only sees contracts in their department
      if (role === 'management' && req.user.department_name) {
        where.department_name = req.user.department_name;
      }
      const contracts = await TeachingContract.findAll({
        where,
        order: [['updated_at', 'DESC']],
        limit: 30,
        attributes: ['id', 'status', 'updated_at', 'department_name'],
      });
      const notifications = contracts.map((c) => ({
        id: null,
        message: `Contract #${c.id} is ${c.status.replace(/_/g, ' ').toLowerCase()}`,
        contract_id: c.id,
        createdAt: c.updated_at,
        type: 'status_change',
      }));
      return res.json(notifications);
    }

    return res.json([]);
  } catch (e) {
    console.error('getMyNotifications error', e.message);
    return res.status(HTTP_STATUS.SERVER_ERROR).json({ message: 'Failed to fetch notifications' });
  }
};
