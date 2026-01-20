import { Op } from 'sequelize';
import {
  TeachingContract,
  TeachingContractCourse,
  LecturerProfile,
  User,
  Candidate,
} from '../model/index.js';

// Determine default term/academic_year from the most recent contract
async function getLatestPeriod(lecturerUserId) {
  const latest = await TeachingContract.findOne({
    where: { lecturer_user_id: lecturerUserId },
    order: [['created_at', 'DESC']],
  });
  if (!latest) return { term: null, academic_year: null };
  return { term: latest.term, academic_year: latest.academic_year };
}

export async function getLecturerDashboardSummary(req, res) {
  try {
    const role = req.user?.role?.toLowerCase();
    if (!['lecturer', 'admin', 'management', 'superadmin'].includes(role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Scope to current lecturer by default; admins can pass ?userId=. Management is restricted to own dept only.
    let lecturerUserId =
      role === 'lecturer' ? req.user.id : parseInt(req.query.userId, 10) || req.user.id;
    if (role === 'management') {
      // If a different userId is requested, ensure it belongs to same department
      if (lecturerUserId !== req.user.id) {
        const target = await User.findByPk(lecturerUserId, {
          attributes: ['id', 'department_name'],
        });
        if (
          !target ||
          String(target.department_name || '') !== String(req.user.department_name || '')
        ) {
          return res.status(403).json({ message: 'Access denied' });
        }
      }
    }

    // Counts
    const totalContracts = await TeachingContract.count({
      where: { lecturer_user_id: lecturerUserId },
    });
    const signedContracts = await TeachingContract.count({
      where: {
        lecturer_user_id: lecturerUserId,
        status: { [Op.in]: ['WAITING_MANAGEMENT', 'COMPLETED'] },
      },
    });
    // Waiting Management = lecturer has signed, awaiting management signature
    const waitingManagement = await TeachingContract.count({
      where: { lecturer_user_id: lecturerUserId, status: 'WAITING_MANAGEMENT' },
    });
    // Pending lecturer signature = waiting for lecturer to sign (management already signed)
    const pendingSignatures = await TeachingContract.count({
      where: { lecturer_user_id: lecturerUserId, status: 'WAITING_LECTURER' },
    });

    // Syllabus reminder (if not uploaded in LecturerProfile)
    const profile = await LecturerProfile.findOne({
      where: { user_id: lecturerUserId },
      attributes: ['id', 'upload_syllabus', 'course_syllabus', 'full_name_english'],
    });
    const syllabusUploaded = Boolean(profile?.upload_syllabus) || Boolean(profile?.course_syllabus);
    const syllabusReminder = {
      needed: !syllabusUploaded,
      uploaded: syllabusUploaded,
      message: syllabusUploaded ? 'Syllabus uploaded' : 'Please upload your course syllabus',
    };

    // Determine current period filters
    let { term, academic_year, year_level } = req.query;
    if (!term || !academic_year) {
      const latest = await getLatestPeriod(lecturerUserId);
      if (!term) term = latest.term;
      if (!academic_year) academic_year = latest.academic_year;
    }

    // Only show courses from signed (active) contracts; exclude MANAGEMENT_SIGNED (waiting for lecturer)
    const contractStatuses = ['WAITING_MANAGEMENT', 'COMPLETED'];

    // Current teaching courses (active contracts in current term/year)
    const courseWhere = {};
    if (term) courseWhere.term = term;
    if (academic_year) courseWhere.academic_year = academic_year;
    if (year_level) courseWhere.year_level = year_level;

    // Active window: show rows where the parent contract hasn't ended
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

    return res.json({
      totalContracts,
      signedContracts,
      waitingManagement,
      pendingSignatures,
      syllabusReminder,
      currentTeachingCourses,
      period: { term: term || null, academic_year: academic_year || null },
      lastUpdated: new Date().toISOString(),
    });
  } catch (e) {
    console.error('[getLecturerDashboardSummary] error', e);
    return res.status(500).json({ message: 'Failed to load lecturer dashboard', error: e.message });
  }
}

// Lightweight realtime stats for lecturer dashboard
export async function getLecturerRealtime(req, res) {
  try {
    const role = req.user?.role?.toLowerCase();
    if (!['lecturer', 'admin', 'management', 'superadmin'].includes(role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    // Scope to current lecturer by default; admins can pass ?userId=
    let lecturerUserId =
      role === 'lecturer' ? req.user.id : parseInt(req.query.userId, 10) || req.user.id;
    if (role === 'management') {
      if (lecturerUserId !== req.user.id) {
        const target = await User.findByPk(lecturerUserId, {
          attributes: ['id', 'department_name'],
        });
        if (
          !target ||
          String(target.department_name || '') !== String(req.user.department_name || '')
        ) {
          return res.status(403).json({ message: 'Access denied' });
        }
      }
    }

    // Compute counts based on start_date/end_date window
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Active = today within [start_date, end_date] (inclusive). Missing boundaries are treated as open.
    const activeContracts = await TeachingContract.count({
      where: {
        lecturer_user_id: lecturerUserId,
        [Op.and]: [
          { [Op.or]: [{ start_date: null }, { start_date: { [Op.lte]: today } }] },
          { [Op.or]: [{ end_date: null }, { end_date: { [Op.gte]: today } }] },
        ],
      },
    });

    // Expired = end_date strictly before today
    const expiredContracts = await TeachingContract.count({
      where: {
        lecturer_user_id: lecturerUserId,
        end_date: { [Op.lt]: today },
      },
    });

    const data = {
      activeContracts,
      expiredContracts,
      systemHealth: 'good',
    };
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ message: 'Failed to load realtime info', error: e.message });
  }
}

// Recent activities for lecturer dashboard
export async function getLecturerActivities(req, res) {
  try {
    const role = req.user?.role?.toLowerCase();
    if (!['lecturer', 'admin', 'management', 'superadmin'].includes(role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    let lecturerUserId =
      role === 'lecturer' ? req.user.id : parseInt(req.query.userId, 10) || req.user.id;
    if (role === 'management') {
      if (lecturerUserId !== req.user.id) {
        const target = await User.findByPk(lecturerUserId, {
          attributes: ['id', 'department_name'],
        });
        if (
          !target ||
          String(target.department_name || '') !== String(req.user.department_name || '')
        ) {
          return res.status(403).json({ message: 'Access denied' });
        }
      }
    }
    // Use recent changes in TeachingContractCourse as pseudo-activities
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
    const activities = rows.map((r) => ({
      type: 'class',
      title: `Updated ${r.course_name}`,
      time: new Date(r.updated_at).toISOString(),
    }));
    return res.json(activities);
  } catch (e) {
    return res.status(500).json({ message: 'Failed to load activities', error: e.message });
  }
}

// Salary analysis across all teaching contracts for the lecturer
export async function getLecturerSalaryAnalysis(req, res) {
  try {
    const role = req.user?.role?.toLowerCase();
    if (!['lecturer', 'admin', 'management', 'superadmin'].includes(role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const lecturerUserId =
      role === 'lecturer' ? req.user.id : parseInt(req.query.userId, 10) || req.user.id;

    // Fetch lecturer user to determine email/name for hourly rate lookup
    const lecturerUser = await User.findByPk(lecturerUserId, {
      attributes: ['id', 'email', 'display_name'],
    });

    // Lookup hourly rate (USD) from Candidate by email first, then by normalized fullName
    let hourlyRateUsd = 0;
    try {
      let cand = null;
      if (lecturerUser?.email) {
        cand = await Candidate.findOne({ where: { email: lecturerUser.email } });
      }
      if (!cand && lecturerUser?.display_name) {
        const Sequelize = (await import('sequelize')).default;
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
      if (cand && cand.hourlyRate != null) {
        const parsed = parseFloat(String(cand.hourlyRate).replace(/[^0-9.]/g, ''));
        if (Number.isFinite(parsed)) hourlyRateUsd = parsed;
      }
    } catch {}

    const usdToKhr = parseFloat(process.env.USD_TO_KHR || process.env.EXCHANGE_RATE_KHR || '4100');
    const rate = Number.isFinite(usdToKhr) ? usdToKhr : 4100;

    // Fetch contracts with their courses to sum hours
    const contracts = await TeachingContract.findAll({
      where: { lecturer_user_id: lecturerUserId },
      include: [{ model: TeachingContractCourse, as: 'courses', attributes: ['hours'] }],
      order: [['created_at', 'DESC']],
    });

    const byContract = [];
    const byMonth = new Map(); // key YYYY-MM -> { usd, khr }
    let totalHours = 0;
    let totalUsd = 0;
    let totalKhr = 0;

    const monthKey = (d) => new Date(d).toISOString().slice(0, 7);
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
      const hours = (c.courses || []).reduce(
        (a, cur) => a + (Number.isFinite(+cur.hours) ? +cur.hours : 0),
        0
      );
      const hasRange = Boolean(c.start_date) && Boolean(c.end_date);
      const amountUsdRaw = hours * (hourlyRateUsd || 0);
      const amountUsd = hasRange ? amountUsdRaw : 0; // Only count salary within defined start–end date
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

      // Distribute by month only when date range is present
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

    return res.json({
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
    });
  } catch (e) {
    console.error('[getLecturerSalaryAnalysis] error', e);
    return res.status(500).json({ message: 'Failed to compute salary analysis', error: e.message });
  }
}
