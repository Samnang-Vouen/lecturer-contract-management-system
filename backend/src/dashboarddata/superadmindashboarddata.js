import { Op } from 'sequelize';
import { User, LecturerProfile, TeachingContract, Candidate } from '../model/index.js';

/**
 * Get Superadmin-wide dashboard stats (system totals).
 * Counts all entities across departments.
 */
export async function getSuperAdminDashboardData() {
  // Active lecturers (unique global count)
  const activeLecturers = await LecturerProfile.count({ where: { status: 'active' } });

  // Contracts by status/time windows
  const today = new Date();

  const pendingContracts = await TeachingContract.count({
    where: { status: { [Op.in]: ['WAITING_LECTURER', 'WAITING_MANAGEMENT'] } },
  });

  const activeContracts = await TeachingContract.count({
    where: {
      status: { [Op.in]: ['WAITING_LECTURER', 'WAITING_MANAGEMENT'] },
      [Op.or]: [{ end_date: null }, { end_date: { [Op.gte]: today } }],
    },
  });

  const expiredContracts = await TeachingContract.count({
    where: { end_date: { [Op.lt]: today } },
  });

  // Candidates and users (global)
  const candidates = await Candidate.count();
  const totalUsers = await User.count();

  return {
    activeLecturers,
    pendingContracts,
    activeContracts,
    expiredContracts,
    candidates,
    totalUsers,
  };
}

/**
 * Express handler for superadmin summary.
 */
export async function superAdminDashboardDataHandler(_req, res) {
  try {
    const data = await getSuperAdminDashboardData();
    return res.json(data);
  } catch (err) {
    console.error('[superadmin.dashboard.data] error:', err);
    return res.status(500).json({ message: 'Failed to fetch superadmin dashboard data' });
  }
}
