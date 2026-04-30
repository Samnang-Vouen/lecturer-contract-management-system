import { Op, Sequelize } from 'sequelize';
import {
  TeachingContract,
  TeachingContractCourse,
  LecturerProfile,
  User,
  Candidate,
} from '../model/index.js';
import { ForbiddenError } from '../utils/errors.js';

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

const ALLOWED_ROLES = ['lecturer', 'advisor', 'admin', 'management', 'superadmin'];

async function resolveAndAuthorizeLecturerUserId({ role, selfId, requestedId, selfDeptName }) {
  if (!ALLOWED_ROLES.includes(role)) {
    throw new ForbiddenError('Forbidden', { payload: { message: 'Forbidden' } });
  }

  const lecturerUserId =
    role === 'lecturer' || role === 'advisor'
      ? selfId
      : parseInt(requestedId, 10) || selfId;

  if (role === 'management' && lecturerUserId !== selfId) {
    const target = await User.findByPk(lecturerUserId, { attributes: ['id', 'department_name'] });
    if (!target || String(target.department_name || '') !== String(selfDeptName || '')) {
      throw new ForbiddenError('Access denied', { payload: { message: 'Access denied' } });
    }
  }

  return lecturerUserId;
}

async function getLatestPeriod(lecturerUserId) {
  const latest = await TeachingContract.findOne({
    where: { lecturer_user_id: lecturerUserId },
    order: [['created_at', 'DESC']],
  });
  if (!latest) return { term: null, academic_year: null };
  return { term: latest.term, academic_year: latest.academic_year };
}

// ---------------------------------------------------------------------------
// Service: getLecturerDashboardSummaryData
// ---------------------------------------------------------------------------

export async function getLecturerDashboardSummaryData({
  role,
  selfId,
  requestedId,
  selfDeptName,
  query: { term: rawTerm, academic_year: rawAcademicYear, year_level: rawYearLevel },
}) {
  const lecturerUserId = await resolveAndAuthorizeLecturerUserId({
    role,
    selfId,
    requestedId,
    selfDeptName,
  });

  const totalContracts = await TeachingContract.count({
    where: { lecturer_user_id: lecturerUserId },
  });
  const signedContracts = await TeachingContract.count({
    where: {
      lecturer_user_id: lecturerUserId,
      status: { [Op.in]: ['WAITING_MANAGEMENT', 'COMPLETED'] },
    },
  });
  const waitingManagement = await TeachingContract.count({
    where: { lecturer_user_id: lecturerUserId, status: 'WAITING_MANAGEMENT' },
  });
  const pendingSignatures = await TeachingContract.count({
    where: { lecturer_user_id: lecturerUserId, status: 'WAITING_LECTURER' },
  });

  const profile = await LecturerProfile.findOne({
    where: { user_id: lecturerUserId },
    attributes: ['id', 'upload_syllabus', 'course_syllabus', 'full_name_english'],
  });
  const syllabusUploaded = Boolean(profile?.upload_syllabus) || Boolean(profile?.course_syllabus);
  const syllabusReminder =
    role === 'advisor'
      ? { needed: false, uploaded: true, message: null }
      : {
          needed: !syllabusUploaded,
          uploaded: syllabusUploaded,
          message: syllabusUploaded ? 'Syllabus uploaded' : 'Please upload your course syllabus',
        };

  let term = rawTerm;
  let academic_year = rawAcademicYear;
  if (!term || !academic_year) {
    const latest = await getLatestPeriod(lecturerUserId);
    if (!term) term = latest.term;
    if (!academic_year) academic_year = latest.academic_year;
  }

  const contractStatuses = ['WAITING_MANAGEMENT', 'COMPLETED'];
  const courseWhere = {};
  if (term) courseWhere.term = term;
  if (academic_year) courseWhere.academic_year = academic_year;
  if (rawYearLevel) courseWhere.year_level = rawYearLevel;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const courseRows = await TeachingContractCourse.findAll({
    where: courseWhere,
    include: [
      {
        model: TeachingContract,
        required: true,
        where: {
          lecturer_user_id: lecturerUserId,
          status: { [Op.in]: contractStatuses },
          [Op.or]: [{ end_date: null }, { end_date: { [Op.gte]: today } }],
        },
        attributes: ['id', 'term', 'academic_year', 'status', 'end_date'],
      },
    ],
    order: [['created_at', 'DESC']],
  });

  const currentTeachingCourses = courseRows.map((r) => ({
    id: r.id,
    contract_id: r.contract_id,
    course_id: r.course_id,
    course_name: r.course_name,
    year_level: r.year_level,
    term: r.term,
    academic_year: r.academic_year,
    hours: r.hours,
    contract_end_date: r.TeachingContract?.end_date || null,
  }));

  return {
    totalContracts,
    signedContracts,
    waitingManagement,
    pendingSignatures,
    syllabusReminder,
    currentTeachingCourses,
    period: { term: term || null, academic_year: academic_year || null },
    lastUpdated: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Service: getLecturerRealtimeData
// ---------------------------------------------------------------------------

export async function getLecturerRealtimeData({ role, selfId, requestedId, selfDeptName }) {
  const lecturerUserId = await resolveAndAuthorizeLecturerUserId({
    role,
    selfId,
    requestedId,
    selfDeptName,
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activeContracts = await TeachingContract.count({
    where: {
      lecturer_user_id: lecturerUserId,
      [Op.and]: [
        { [Op.or]: [{ start_date: null }, { start_date: { [Op.lte]: today } }] },
        { [Op.or]: [{ end_date: null }, { end_date: { [Op.gte]: today } }] },
      ],
    },
  });

  const expiredContracts = await TeachingContract.count({
    where: {
      lecturer_user_id: lecturerUserId,
      end_date: { [Op.lt]: today },
    },
  });

  return { activeContracts, expiredContracts, systemHealth: 'good' };
}

// ---------------------------------------------------------------------------
// Service: getLecturerActivitiesData
// ---------------------------------------------------------------------------

export async function getLecturerActivitiesData({ role, selfId, requestedId, selfDeptName }) {
  const lecturerUserId = await resolveAndAuthorizeLecturerUserId({
    role,
    selfId,
    requestedId,
    selfDeptName,
  });

  const rows = await TeachingContractCourse.findAll({
    include: [
      {
        model: TeachingContract,
        required: true,
        where: { lecturer_user_id: lecturerUserId },
        attributes: [],
      },
    ],
    order: [['updated_at', 'DESC']],
    limit: 10,
  });

  return rows.map((r) => ({
    type: 'class',
    title: `Updated ${r.course_name}`,
    time: new Date(r.updated_at).toISOString(),
  }));
}

// ---------------------------------------------------------------------------
// Service: getLecturerSalaryAnalysisData
// ---------------------------------------------------------------------------

export async function getLecturerSalaryAnalysisData({ role, selfId, requestedId, selfDeptName }) {
  const lecturerUserId = await resolveAndAuthorizeLecturerUserId({
    role,
    selfId,
    requestedId,
    selfDeptName,
  });

  const lecturerUser = await User.findByPk(lecturerUserId, {
    attributes: ['id', 'email', 'display_name'],
  });

  let hourlyRateUsd = 0;
  try {
    let cand = null;
    if (lecturerUser?.email) {
      cand = await Candidate.findOne({ where: { email: lecturerUser.email } });
    }
    if (!cand && lecturerUser?.display_name) {
      const titleRegex = /^(mr\.?|ms\.?|mrs\.?|dr\.?|prof\.?|professor|miss)\s+/i;
      const cleaned = lecturerUser.display_name
        .replace(titleRegex, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
      cand = await Candidate.findOne({
        where: Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.fn('TRIM', Sequelize.col('fullName'))),
          cleaned
        ),
      });
    }
    if (cand !== null && cand !== undefined && cand.hourlyRate !== null && cand.hourlyRate !== undefined) {
      const parsed = parseFloat(String(cand.hourlyRate).replace(/[^0-9.]/g, ''));
      if (Number.isFinite(parsed)) hourlyRateUsd = parsed;
    }
  } catch {
    // hourlyRateUsd stays 0
  }

  const usdToKhr = parseFloat(process.env.USD_TO_KHR || process.env.EXCHANGE_RATE_KHR || '4100');
  const rate = Number.isFinite(usdToKhr) ? usdToKhr : 4100;

  const contracts = await TeachingContract.findAll({
    where: { lecturer_user_id: lecturerUserId },
    include: [{ model: TeachingContractCourse, as: 'contractCourses', attributes: ['hours'] }],
    order: [['created_at', 'DESC']],
  });

  const byContract = [];
  const byMonth = new Map();
  let totalHours = 0;
  let totalUsd = 0;
  let totalKhr = 0;

  const enumerateMonths = (start, end) => {
    const out = [];
    if (!start || !end) return out;
    const s = new Date(start);
    s.setDate(1);
    s.setHours(0, 0, 0, 0);
    const e = new Date(end);
    e.setDate(1);
    e.setHours(0, 0, 0, 0);
    while (s <= e) {
      out.push(`${s.getFullYear()}-${String(s.getMonth() + 1).padStart(2, '0')}`);
      s.setMonth(s.getMonth() + 1);
    }
    return out;
  };

  for (const c of contracts) {
    const hours = (c.contractCourses || []).reduce(
      (a, cur) => a + (Number.isFinite(+cur.hours) ? +cur.hours : 0),
      0
    );
    const hasRange = Boolean(c.start_date) && Boolean(c.end_date);
    const amountUsdRaw = hours * (hourlyRateUsd || 0);
    const amountUsd = hasRange ? amountUsdRaw : 0;
    const amountKhr = Math.round(amountUsd * rate);

    if (hasRange) {
      totalHours += hours;
      totalUsd += amountUsd;
      totalKhr += amountKhr;
    }

    const label =
      `${c.academic_year || ''}${c.term ? ` • Term ${c.term}` : ''}`.trim() || `#${c.id}`;
    byContract.push({
      contractId: c.id,
      label,
      hours,
      amountUsd,
      amountKhr,
      start_date: c.start_date,
      end_date: c.end_date,
    });

    if (hasRange && amountUsd > 0) {
      const months = enumerateMonths(c.start_date, c.end_date);
      const perMonthUsd = months.length ? amountUsd / months.length : amountUsd;
      const perMonthKhr = months.length ? amountKhr / months.length : amountKhr;
      for (const m of months) {
        const cur = byMonth.get(m) || { usd: 0, khr: 0 };
        cur.usd += perMonthUsd;
        cur.khr += perMonthKhr;
        byMonth.set(m, cur);
      }
    }
  }

  const byMonthArr = Array.from(byMonth.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, v]) => ({ month, usd: Math.round(v.usd), khr: Math.round(v.khr) }));

  return {
    currency: 'KHR',
    exchangeRate: rate,
    hourlyRateUsd,
    totals: {
      contracts: contracts.length,
      hours: totalHours,
      usd: Math.round(totalUsd),
      khr: Math.round(totalKhr),
    },
    byContract,
    byMonth: byMonthArr,
  };
}
