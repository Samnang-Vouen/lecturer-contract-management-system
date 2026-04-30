import { Op } from 'sequelize';
import sequelize from '../config/db.js';
import {
  User,
  Role,
  LecturerProfile,
  Candidate,
  Department,
  TeachingContract,
  AdvisorContract,
  TeachingContractCourse,
  Course,
  LecturerCourse,
} from '../model/index.js';
import { touchPresence, countByDepartment, countAllOnline } from '../utils/presence.js';
import {
  DAY_MS,
  TIME_RANGE_LABELS,
  DASHBOARD_RECENT_USERS_LIMIT,
  DASHBOARD_RECENT_ADMIN_LOGINS_LIMIT,
  DASHBOARD_RECENT_CONTRACTS_LIMIT,
  DASHBOARD_RECENT_CANDIDATES_LIMIT,
  DASHBOARD_ACTIVITIES_SLICE_LIMIT,
  CANDIDATE_ACTIVE_STATUSES,
  CONTRACT_STATUS_ALIAS_MAP,
  DASHBOARD_OPEN_CONTRACT_STATUSES,
  DASHBOARD_MONTH_WINDOW,
} from '../config/constants.js';
import { UnauthorizedError, ValidationError } from '../utils/errors.js';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

async function resolveDeptId(deptName) {
  if (!deptName) return null;
  const deptRow = await Department.findOne({ where: { dept_name: deptName } });
  return deptRow?.id || null;
}

// Swallow sub-query errors so a single failing block doesn't break the whole response
async function safe(fn, fallback) {
  try {
    return await fn();
  } catch (e) {
    console.error('[dashboard.service] block failed:', e.message);
    return typeof fallback === 'function' ? fallback(e) : fallback;
  }
}

function buildTeachingContractScope(isSuper, deptId) {
  if (isSuper || !deptId) return [];
  return [
    {
      model: TeachingContractCourse,
      as: 'contractCourses',
      required: true,
      attributes: [],
      include: [{ model: Course, attributes: [], required: true, where: { dept_id: deptId } }],
    },
  ];
}

function buildAdvisorContractScope(isSuper, deptName) {
  if (isSuper || !deptName) return [];
  return [{ model: User, as: 'lecturer', required: true, attributes: [], where: { department_name: deptName } }];
}

async function countScopedContracts(baseWhere, isSuper, deptId, deptName) {
  if (isSuper) {
    return safe(() => TeachingContract.count({ where: baseWhere, distinct: true }), 0);
  }
  const [teachingCount, advisorCount] = await Promise.all([
    safe(() => TeachingContract.count({ where: { ...baseWhere, contract_type: 'TEACHING' }, include: buildTeachingContractScope(false, deptId), distinct: true }), 0),
    safe(() => TeachingContract.count({ where: { ...baseWhere, contract_type: 'ADVISOR' }, include: buildAdvisorContractScope(false, deptName), distinct: true }), 0),
  ]);
  return Number(teachingCount || 0) + Number(advisorCount || 0);
}

async function groupedScopedContractStatus(isSuper, deptId, deptName) {
  const normalizeRows = (rows) =>
    Array.isArray(rows)
      ? rows.map((row) => ({ status: String(row.get('status') || ''), count: Number(row.get('count') || 0) }))
      : [];

  const countAttr = [
    'status',
    [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('TeachingContract.id'))), 'count'],
  ];

  if (isSuper) {
    return safe(() => TeachingContract.findAll({ attributes: countAttr, group: ['TeachingContract.status'] }), []);
  }
  const [teachingRows, advisorRows] = await Promise.all([
    safe(() => TeachingContract.findAll({ attributes: countAttr, where: { contract_type: 'TEACHING' }, include: buildTeachingContractScope(false, deptId), group: ['TeachingContract.status'] }), []),
    safe(() => TeachingContract.findAll({ attributes: countAttr, where: { contract_type: 'ADVISOR' }, include: buildAdvisorContractScope(false, deptName), group: ['TeachingContract.status'] }), []),
  ]);
  return [...normalizeRows(teachingRows), ...normalizeRows(advisorRows)];
}

async function groupedLegacyAdvisorContractStatus(isSuper, deptName) {
  const rows = await safe(
    () =>
      AdvisorContract.count
        ? AdvisorContract.findAll({
            attributes: [
              'status',
              [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('AdvisorContract.id'))), 'count'],
            ],
            include: buildAdvisorContractScope(isSuper, deptName),
            group: ['AdvisorContract.status'],
          })
        : [],
    []
  );
  return Array.isArray(rows)
    ? rows.map((row) => {
        const rawStatus = String(row.get('status') || '').toUpperCase().replace(/\s+/g, '_');
        return { status: rawStatus === 'DRAFT' ? 'WAITING_ADVISOR' : rawStatus, count: Number(row.get('count') || 0) };
      })
    : [];
}

async function resolveActiveLecturers(isSuper, deptName, deptId) {
  if (isSuper) return safe(() => LecturerProfile.count({ where: { status: 'active' } }), 0);
  if (!deptName || !deptId) return 0;
  const [assigned, teaching] = await Promise.all([
    safe(() => LecturerProfile.findAll({ attributes: ['id'], where: { status: 'active' }, include: [{ model: Department, attributes: [], through: { attributes: [] }, where: { dept_name: deptName }, required: true }], raw: true }), []),
    safe(() => LecturerProfile.findAll({ attributes: ['id'], where: { status: 'active' }, include: [{ model: LecturerCourse, attributes: [], required: true, include: [{ model: Course, attributes: [], required: true, where: { dept_id: deptId } }] }], raw: true }), []),
  ]);
  return new Set([...assigned.map((r) => r.id), ...teaching.map((r) => r.id)]).size;
}

function buildContractStatusBuckets(statusRows) {
  const contractStatus = { WAITING_LECTURER: 0, WAITING_ADVISOR: 0, WAITING_MANAGEMENT: 0, COMPLETED: 0 };
  for (const r of statusRows) {
    const raw = String(typeof r.get === 'function' ? r.get('status') || '' : r.status || '').toUpperCase().replace(/\s+/g, '_');
    const count = typeof r.get === 'function' ? Number(r.get('count') || 0) : Number(r.count || 0);
    const normalized = CONTRACT_STATUS_ALIAS_MAP[raw] || raw;
    if (contractStatus[normalized] !== undefined) contractStatus[normalized] += count;
  }
  return contractStatus;
}

async function buildMonthlyTrends(isSuper, deptName, deptId, tcIncludeCourses) {
  const now = new Date();
  const months = [];
  for (let i = DASHBOARD_MONTH_WINDOW - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
    const nextStart = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
    months.push({ label: start.toLocaleString('en-US', { month: 'short' }), start, nextStart });
  }

  const trends = [];
  for (const m of months) {
    const whereRange = (col = 'created_at') => ({ [col]: { [Op.gte]: m.start, [Op.lt]: m.nextStart } });

    const contractsCount = await safe(
      () => TeachingContract.count({ where: { status: 'COMPLETED', [Op.or]: [{ management_signed_at: { [Op.gte]: m.start, [Op.lt]: m.nextStart } }, { end_date: { [Op.gte]: m.start, [Op.lt]: m.nextStart } }] }, include: tcIncludeCourses, distinct: true }),
      0
    );

    let lecturersCount = 0;
    if (isSuper) {
      lecturersCount = await safe(() => LecturerProfile.count({ where: { status: 'active', ...whereRange('created_at') }, distinct: true, col: 'LecturerProfile.id' }), 0);
    } else if (deptName && deptId) {
      const [a, t] = await Promise.all([
        safe(() => LecturerProfile.findAll({ attributes: ['id'], where: { status: 'active', ...whereRange('created_at') }, include: [{ model: Department, attributes: [], through: { attributes: [] }, where: { dept_name: deptName }, required: true }], raw: true }), []),
        safe(() => LecturerProfile.findAll({ attributes: ['id'], where: { status: 'active', ...whereRange('created_at') }, include: [{ model: LecturerCourse, attributes: [], required: true, include: [{ model: Course, attributes: [], required: true, where: { dept_id: deptId } }] }], raw: true }), []),
      ]);
      lecturersCount = new Set([...a.map((r) => r.id), ...t.map((r) => r.id)]).size;
    }

    const candWhereMonth = whereRange('created_at');
    if (!isSuper && deptId) candWhereMonth.dept_id = deptId;
    const applicationsMonth = await safe(() => Candidate.count({ where: candWhereMonth }), 0);
    trends.push({ month: m.label, lecturers: lecturersCount, contracts: contractsCount, applications: applicationsMonth });
  }
  return trends;
}

// ---------------------------------------------------------------------------
// getDashboardStats
// ---------------------------------------------------------------------------

export async function getDashboardStatsData({ role, department_name, query }) {
  const roleNorm = (role || '').toLowerCase();
  const deptName = department_name || null;
  const isSuper = roleNorm === 'superadmin';

  let deptId = null;
  if (!isSuper && deptName) deptId = await safe(() => resolveDeptId(deptName), null);

  const scopedUserWhere = !isSuper && deptName ? { department_name: deptName } : undefined;
  const tcIncludeCourses = buildTeachingContractScope(isSuper, deptId);
  const LEGACY_ADVISOR_OPEN_STATUSES = ['DRAFT', 'WAITING_MANAGEMENT'];

  const today = new Date();
  const tcWhere = { status: { [Op.in]: DASHBOARD_OPEN_CONTRACT_STATUSES }, [Op.or]: [{ end_date: null }, { end_date: { [Op.gte]: today } }] };

  // Parallel top-level counts
  const [activeLecturersCount, totalUsersCount, teachingActive] = await Promise.all([
    resolveActiveLecturers(isSuper, deptName, deptId),
    safe(() => User.count({ where: scopedUserWhere }), 0),
    countScopedContracts(tcWhere, isSuper, deptId, deptName),
  ]);

  const pendingContractsCount =
    (await countScopedContracts({ status: { [Op.in]: DASHBOARD_OPEN_CONTRACT_STATUSES } }, isSuper, deptId, deptName)) +
    (await safe(
      () => AdvisorContract.count({ where: { status: { [Op.in]: LEGACY_ADVISOR_OPEN_STATUSES } }, include: buildAdvisorContractScope(isSuper, deptName), distinct: true }),
      0
    ));

  const candWhere = { status: { [Op.in]: CANDIDATE_ACTIVE_STATUSES } };
  if (!isSuper && deptId) candWhere.dept_id = deptId;
  const recruitmentInProgressCount = await safe(() => Candidate.count({ where: candWhere }), 0);

  // Contract status distribution
  const statusRows = [
    ...(await groupedScopedContractStatus(isSuper, deptId, deptName)),
    ...(await groupedLegacyAdvisorContractStatus(isSuper, deptName)),
  ];
  const contractStatus = buildContractStatusBuckets(statusRows);

  // Applications total (optionally time-range filtered)
  const { timeRange } = query || {};
  const since = timeRange && TIME_RANGE_LABELS[timeRange] ? new Date(Date.now() - TIME_RANGE_LABELS[timeRange]) : null;
  const candWhereTotal = {};
  if (since) candWhereTotal.created_at = { [Op.gte]: since };
  if (!isSuper && deptId) candWhereTotal.dept_id = deptId;
  const applicationsCount = await safe(() => Candidate.count({ where: candWhereTotal }), 0);

  // Recent activities (last 24 h)
  const since24h = new Date(Date.now() - DAY_MS);
  const [recentUsers, recentAdminLogins, recentSimpleContracts, recentCandidates] = await Promise.all([
    safe(() => User.findAll({ where: { ...(scopedUserWhere || {}), created_at: { [Op.gte]: since24h } }, attributes: ['id', 'email', 'display_name', 'created_at', 'status', 'department_name'], include: [{ model: Role, attributes: ['role_type'], through: { attributes: [] } }], order: [['created_at', 'DESC']], limit: DASHBOARD_RECENT_USERS_LIMIT }), []),
    safe(() => User.findAll({ where: { ...(scopedUserWhere || {}), last_login: { [Op.gte]: since24h } }, attributes: ['id', 'email', 'display_name', 'last_login', 'department_name'], include: [{ model: Role, attributes: ['role_type'], through: { attributes: [] }, where: { role_type: 'admin' }, required: true }], order: [['last_login', 'DESC']], limit: DASHBOARD_RECENT_ADMIN_LOGINS_LIMIT }), []),
    safe(() => TeachingContract.findAll({ where: { created_at: { [Op.gte]: since24h } }, attributes: ['id', 'created_at', 'updated_at', 'status', 'end_date', 'academic_year', 'term'], include: [...(tcIncludeCourses || []), { model: User, as: 'lecturer', attributes: ['display_name', 'email', 'department_name'] }], order: [['created_at', 'DESC']], limit: DASHBOARD_RECENT_CONTRACTS_LIMIT }), []),
    safe(() => Candidate.findAll({ where: { ...(candWhere || {}), created_at: { [Op.gte]: since24h } }, order: [['created_at', 'DESC']], limit: DASHBOARD_RECENT_CANDIDATES_LIMIT }), []),
  ]);

  const activities = [];
  for (const u of recentUsers) {
    const roles = Array.isArray(u.Roles) ? u.Roles.map((r) => String(r.role_type || '').toLowerCase()) : [];
    activities.push({
      id: `user-${u.id}`,
      type: roles.includes('lecturer') ? 'lecturer' : 'user',
      title: roles.includes('lecturer') ? 'Lecturer Created' : roles.includes('admin') ? 'Admin Created' : 'User Created',
      name: u.display_name || u.email,
      time: u.created_at,
      status: u.status === 'active' ? 'completed' : 'pending',
    });
  }
  for (const a of recentAdminLogins) {
    activities.push({ id: `admin-login-${a.id}-${new Date(a.last_login).getTime()}`, type: 'user', title: 'Admin Login', name: a.display_name || a.email, time: a.last_login, status: 'completed' });
  }
  for (const c of recentSimpleContracts) {
    const rawStatus = String(c.status || '').toUpperCase();
    activities.push({ id: `contract-${c.id}`, type: 'contract', title: rawStatus === 'COMPLETED' ? 'Contract Approved' : 'Contract Created', name: c.lecturer?.display_name || c.lecturer?.email || 'Lecturer', time: c.created_at, status: !c.end_date || new Date(c.end_date) >= today ? 'in-progress' : 'expired' });
  }
  for (const cand of recentCandidates) {
    activities.push({ id: `candidate-${cand.id}`, type: 'candidate', title: 'Candidate Application', name: cand.fullName, time: cand.created_at, status: cand.status === 'interview' ? 'scheduled' : cand.status === 'pending' ? 'pending' : 'completed' });
  }

  // Department distribution (global)
  const allDepartments = await safe(() => Department.findAll({ attributes: ['id', 'dept_name'], order: [['dept_name', 'ASC']] }), []);
  const departmentDistribution = [];
  for (const dept of allDepartments) {
    const [assigned, teaching] = await Promise.all([
      safe(() => LecturerProfile.findAll({ attributes: ['id'], include: [{ model: Department, attributes: [], through: { attributes: [] }, where: { id: dept.id }, required: true }], raw: true }), []),
      safe(() => LecturerProfile.findAll({ attributes: ['id'], include: [{ model: LecturerCourse, attributes: [], required: true, include: [{ model: Course, attributes: [], required: true, where: { dept_id: dept.id } }] }], raw: true }), []),
    ]);
    departmentDistribution.push({ name: dept.dept_name, value: new Set([...assigned.map((r) => r.id), ...teaching.map((r) => r.id)]).size });
  }

  const monthlyTrends = await buildMonthlyTrends(isSuper, deptName, deptId, tcIncludeCourses);

  const activities24h = activities
    .filter((a) => { const t = new Date(a.time).getTime(); return !Number.isNaN(t) && t >= since24h.getTime(); })
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return {
    scope: isSuper ? 'global' : 'department',
    department: isSuper ? null : deptName,
    activeLecturers: { count: activeLecturersCount, change: 0 },
    pendingContracts: { count: pendingContractsCount, change: 0 },
    activeContracts: { count: teachingActive, change: 0 },
    recruitmentInProgress: { count: recruitmentInProgressCount, change: 0 },
    totalUsers: { count: totalUsersCount, change: 0 },
    recentActivities: activities24h.slice(0, DASHBOARD_ACTIVITIES_SLICE_LIMIT),
    applications: { count: applicationsCount, change: 0 },
    monthlyTrends,
    departmentStats: { totalDepartments: Array.isArray(allDepartments) ? allDepartments.length : 0, distribution: departmentDistribution },
    contractStatus,
  };
}

// ---------------------------------------------------------------------------
// getDashboardRealtime
// ---------------------------------------------------------------------------

export async function getDashboardRealtimeData({ role, department_name }) {
  const roleNorm = (role || '').toLowerCase();
  const deptName = department_name || null;
  const isSuper = roleNorm === 'superadmin';

  let deptId = null;
  if (!isSuper && deptName) {
    deptId = await safe(() => resolveDeptId(deptName), null);
  }

  const onlineUsers = isSuper ? countAllOnline() : countByDepartment(deptName);

  const today = new Date();
  const tcWhere = { status: { [Op.in]: DASHBOARD_OPEN_CONTRACT_STATUSES }, [Op.or]: [{ end_date: null }, { end_date: { [Op.gte]: today } }] };
  const teachingActive = await safe(() => countScopedContracts(tcWhere, isSuper, deptId, deptName), 0);

  const tcIncludeCourses = buildTeachingContractScope(isSuper, deptId);
  const expiredContracts = await safe(
    () => TeachingContract.count({ where: { end_date: { [Op.lt]: today } }, include: tcIncludeCourses, distinct: true }),
    0
  );

  return { onlineUsers, activeContracts: teachingActive, expiredContracts, systemHealth: 'good' };
}

// ---------------------------------------------------------------------------
// postDashboardPresence
// ---------------------------------------------------------------------------

export function recordPresence({ userId, department_name: userDept, bodyDept }) {
  if (!userId) throw new UnauthorizedError('Unauthorized');
  const dept = typeof bodyDept === 'string' && bodyDept.trim() ? bodyDept.trim() : userDept;
  if (!dept) throw new ValidationError('Missing department');
  touchPresence(userId, dept);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// getDashboardNotifications
// ---------------------------------------------------------------------------

export async function getDashboardNotificationsData({ role, department_name }) {
  const roleNorm = (role || '').toLowerCase();
  const deptName = department_name || null;
  const isSuper = roleNorm === 'superadmin';

  let deptId = null;
  if (!isSuper && deptName) deptId = await safe(() => resolveDeptId(deptName), null);

  const includeLecturerScope = buildTeachingContractScope(isSuper, deptId);
  const pending = await TeachingContract.findAll({
    where: { status: { [Op.in]: ['WAITING_MANAGEMENT', 'LECTURER_SIGNED'] } },
    include: includeLecturerScope,
    order: [['updated_at', 'DESC']],
    limit: DASHBOARD_ACTIVITIES_SLICE_LIMIT,
  });

  return pending.map((p) => ({
    type: 'contract',
    message: `Contract awaiting management signature for ${p.academic_year} ${p.term}`,
    time: p.updated_at,
  }));
}
