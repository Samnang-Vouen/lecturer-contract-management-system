import { Op } from 'sequelize';
import {
  User,
  Department,
  LecturerProfile,
  LecturerCourse,
  Course,
  TeachingContract,
  TeachingContractCourse,
  Candidate,
} from '../model/index.js';

/**
 * Normalize admin department(s) from a string or array into:
 * - deptNames: array of department names
 * - deptIds: array of department ids resolved from DB (may be [])
 */
async function resolveDepartments(input) {
  const deptNames = (
    Array.isArray(input) ? input : typeof input === 'string' && input.length ? input.split(',') : []
  )
    .map((s) => String(s).trim())
    .filter(Boolean);

  if (!deptNames.length) return { deptNames: [], deptIds: [] };
  const rows = await Department.findAll({ where: { dept_name: { [Op.in]: deptNames } } });
  const deptIds = rows.map((r) => r.id);
  return { deptNames, deptIds };
}

/**
 * Count contracts using the explicit association path TeachingContract -> courses (alias)
 * -> Course, with department filter; returns distinct count of contracts.
 */
async function countContractsViaCourses(where, deptIds) {
  if (!deptIds?.length) return 0;
  return TeachingContract.count({
    where,
    include: [
      {
        model: TeachingContractCourse,
        as: 'courses',
        required: true,
        attributes: [],
        include: [
          {
            model: Course,
            required: true,
            attributes: [],
            where: { dept_id: { [Op.in]: deptIds } },
          },
        ],
      },
    ],
    distinct: true,
    col: 'TeachingContract.id',
  });
}

/**
 * Get Admin-scoped dashboard stats for the provided department name(s).
 * Returns plain numeric totals.
 *
 * Counts include:
 * - activeLecturers: Active lecturers linked to admin dept(s) either by
 *   DepartmentProfile assignment or by actually teaching courses in those dept(s).
 * - pendingContracts: Contracts in WAITING_LECTURER or WAITING_MANAGEMENT with
 *   at least one course in admin dept(s).
 * - activeContracts: Non-expired (end_date null or >= today) contracts in
 *   WAITING_LECTURER or WAITING_MANAGEMENT with at least one course in admin dept(s).
 * - expiredContracts: Contracts with end_date < today and at least one course in admin dept(s).
 * - candidates: All candidates with dept_id in admin dept(s).
 * - totalUsers: Users whose department_name matches admin dept name(s).
 */
export async function getAdminDashboardDataForDepartments(departmentNames) {
  const { deptNames, deptIds } = await resolveDepartments(departmentNames);

  // If no departments resolved, return zeroes (admin without department)
  if (!deptIds.length) {
    return {
      activeLecturers: 0,
      pendingContracts: 0,
      activeContracts: 0,
      expiredContracts: 0,
      candidates: 0,
      totalUsers: 0,
    };
  }

  // 1) Active Lecturers — per-department unique count, summed across departments.
  // Within a single department, a lecturer is counted once even if assigned and teaching.
  // Across multiple departments, the same lecturer is counted once for each department they relate to.
  let activeLecturers = 0;
  for (const deptId of deptIds) {
    const [assignedIdsRows, teachingIdsRows] = await Promise.all([
      // A) Lecturer assigned to this department via DepartmentProfile
      LecturerProfile.findAll({
        attributes: ['id'],
        where: { status: 'active' },
        include: [
          {
            model: Department,
            attributes: [],
            through: { attributes: [] },
            where: { id: deptId },
            required: true,
          },
        ],
        raw: true,
      }),
      // B) Lecturer teaching any course in this department
      LecturerProfile.findAll({
        attributes: ['id'],
        where: { status: 'active' },
        include: [
          {
            model: LecturerCourse,
            attributes: [],
            required: true,
            include: [
              {
                model: Course,
                attributes: [],
                required: true,
                where: { dept_id: deptId },
              },
            ],
          },
        ],
        raw: true,
      }),
    ]);
    const setForDept = new Set([
      ...assignedIdsRows.map((r) => r.id),
      ...teachingIdsRows.map((r) => r.id),
    ]);
    activeLecturers += setForDept.size;
  }

  // 2) Pending Contracts — WAITING_LECTURER or WAITING_MANAGEMENT with at least one course in dept(s)
  const pendingWhere = { status: { [Op.in]: ['WAITING_LECTURER', 'WAITING_MANAGEMENT'] } };
  const pendingContracts = await countContractsViaCourses(pendingWhere, deptIds);

  // 3) Active Contracts — not expired and in active-like states
  const today = new Date();
  const activeWhere = {
    status: { [Op.in]: ['WAITING_LECTURER', 'WAITING_MANAGEMENT'] },
    [Op.or]: [{ end_date: null }, { end_date: { [Op.gte]: today } }],
  };
  const activeContracts = await countContractsViaCourses(activeWhere, deptIds);

  // 4) Expired Contracts — end_date < today
  const expiredWhere = { end_date: { [Op.lt]: today } };
  const expiredContracts = await countContractsViaCourses(expiredWhere, deptIds);

  // 5) Candidates — all candidates tied to these departments
  const candidates = await Candidate.count({ where: { dept_id: { [Op.in]: deptIds } } });

  // 6) Total Users — department_name matches any of deptNames
  const totalUsers = await User.count({ where: { department_name: { [Op.in]: deptNames } } });

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
 * Convenience function using the authenticated user object with department_name.
 */
export async function getAdminDashboardDataForUser(user) {
  const dept = user?.department_name || '';
  return getAdminDashboardDataForDepartments(dept);
}

/**
 * Optional Express handler
 */
export async function adminDashboardDataHandler(req, res) {
  try {
    const data = await getAdminDashboardDataForUser(req.user);
    // Ensure admins only see their own departments (superadmin not intended here)
    return res.json(data);
  } catch (err) {
    console.error('[admin.dashboard.data] error:', err);
    return res.status(500).json({ message: 'Failed to fetch admin dashboard data' });
  }
}
