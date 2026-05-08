import { Notification, TeachingContract, AdvisorContract } from '../model/index.js';
import { Op } from 'sequelize';

const LIMIT = 30;

const ADVISOR_STATUS_LABEL_LECTURER = {
  DRAFT: 'waiting for your signature',
  WAITING_MANAGEMENT: 'signed by you, waiting for management',
  REQUEST_REDO: 'revision requested — please review',
};

const ADVISOR_STATUS_LABEL_MGMT = {
  DRAFT: 'waiting for advisor signature',
  WAITING_MANAGEMENT: 'advisor signed, awaiting your signature',
  REQUEST_REDO: 'revision requested',
};

// ---------------------------------------------------------------------------
// Service: getMyNotificationsData
// ---------------------------------------------------------------------------

export async function getMyNotificationsData({ userId, role }) {
  const normalizedRole = String(role || '').toLowerCase();

  if (normalizedRole === 'lecturer' || normalizedRole === 'advisor') {
    const persisted = await Notification.findAll({
      where: { user_id: userId },
      order: [['createdAt', 'DESC']],
      limit: LIMIT,
    });

    const myAdvisorContracts = await AdvisorContract.findAll({
      where: {
        lecturer_user_id: userId,
        status: { [Op.in]: ['DRAFT', 'WAITING_MANAGEMENT', 'REQUEST_REDO'] },
      },
      order: [['updated_at', 'DESC']],
      limit: LIMIT,
      attributes: ['id', 'status', 'updated_at'],
    });

    const persistedContractIds = new Set(persisted.map((n) => n.contract_id).filter(Boolean));

    const derived = myAdvisorContracts
      .filter((c) => !persistedContractIds.has(c.id))
      .map((c) => ({
        id: null,
        message: `Advisor contract #${c.id} — ${ADVISOR_STATUS_LABEL_LECTURER[c.status] || c.status.replace(/_/g, ' ').toLowerCase()}`,
        contract_id: c.id,
        createdAt: c.updated_at,
        type: 'status_change',
      }));

    return [...persisted.map((n) => n.toJSON()), ...derived]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, LIMIT);
  }

  if (normalizedRole === 'admin' || normalizedRole === 'management') {
    const persisted = await Notification.findAll({
      where: { user_id: userId },
      order: [['createdAt', 'DESC']],
      limit: LIMIT,
    });

    const teachingContracts = await TeachingContract.findAll({
      where: { status: { [Op.in]: ['WAITING_LECTURER', 'WAITING_MANAGEMENT', 'REQUEST_REDO'] } },
      order: [['updated_at', 'DESC']],
      limit: LIMIT,
      attributes: ['id', 'status', 'updated_at'],
    });

    const advisorContracts = await AdvisorContract.findAll({
      where: { status: { [Op.in]: ['DRAFT', 'WAITING_MANAGEMENT', 'REQUEST_REDO'] } },
      order: [['updated_at', 'DESC']],
      limit: LIMIT,
      attributes: ['id', 'status', 'updated_at'],
    });

    const persistedContractIds = new Set(persisted.map((n) => n.contract_id).filter(Boolean));

    const derivedTeaching = teachingContracts
      .filter((c) => !persistedContractIds.has(c.id))
      .map((c) => ({
        id: null,
        message: `Contract #${c.id} is ${c.status.replace(/_/g, ' ').toLowerCase()}`,
        contract_id: c.id,
        createdAt: c.updated_at,
        type: 'status_change',
      }));

    const derivedAdvisor = advisorContracts
      .filter((c) => !persistedContractIds.has(c.id))
      .map((c) => ({
        id: null,
        message: `Advisor contract #${c.id} — ${ADVISOR_STATUS_LABEL_MGMT[c.status] || c.status.replace(/_/g, ' ').toLowerCase()}`,
        contract_id: c.id,
        createdAt: c.updated_at,
        type: 'status_change',
      }));

    return [...persisted.map((n) => n.toJSON()), ...derivedTeaching, ...derivedAdvisor]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, LIMIT);
  }

  return [];
}

export async function markNotificationsReadData({ userId, ids }) {
  const where = { user_id: userId, readAt: null };
  if (Array.isArray(ids) && ids.length > 0) {
    where.id = { [Op.in]: ids };
  }
  await Notification.update({ readAt: new Date() }, { where });
}
