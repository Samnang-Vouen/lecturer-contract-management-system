import { Op } from 'sequelize';
import {
  TeachingContract,
  TeachingContractCourse,
  CourseMapping,
  Course,
  LecturerProfile,
} from '../model/index.js';

// GET /api/lecturer/courses
// Returns courses for the logged-in lecturer, limited to active signed contracts
export async function getMyCourses(req, res) {
  try {
    const lecturerUserId = req.user?.id;
    if (!lecturerUserId) return res.status(401).json({ message: 'Unauthorized' });

    const { term, academic_year, year_level, activeOnly = 'true' } = req.query;

    const whereCourse = {};
    if (term) whereCourse.term = term;
    if (academic_year) whereCourse.academic_year = academic_year;
    if (year_level) whereCourse.year_level = year_level;

    const includeWhere = {
      lecturer_user_id: lecturerUserId,
      status: { [Op.in]: ['WAITING_MANAGEMENT', 'COMPLETED'] },
    };
    if (String(activeOnly) !== 'false') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      includeWhere[Op.or] = [{ end_date: null }, { end_date: { [Op.gte]: today } }];
    }

    const rows = await TeachingContractCourse.findAll({
      where: whereCourse,
      include: [
        {
          model: TeachingContract,
          required: true,
          where: includeWhere,
          attributes: ['id', 'term', 'academic_year', 'status', 'end_date'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    const items = rows.map((r) => ({
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

    return res.json(items);
  } catch (e) {
    console.error('[getMyCourses] error', e);
    return res.status(500).json({ message: 'Failed to fetch courses', error: e.message });
  }
}

// GET /api/lecturer/course-mappings
// Returns Course_Mappings assigned to the logged-in lecturer (by lecturer_profile_id)
export async function getMyCourseMappings(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    // find lecturer_profile_id for this user
    const profile = await LecturerProfile.findOne({
      where: { user_id: userId },
      attributes: ['id'],
    });
    if (!profile) return res.json([]);

    const { term, academic_year, year_level } = req.query;
    const where = { lecturer_profile_id: profile.id };
    if (term) where.term = term;
    if (academic_year) where.academic_year = academic_year;
    if (year_level) where.year_level = year_level;

    const rows = await CourseMapping.findAll({
      where,
      include: [{ model: Course, required: false, attributes: ['id', 'course_name'] }],
      order: [['updated_at', 'DESC']],
    });

    // Fetch relevant contract courses to resolve contract end dates
    const includeWhere = {
      lecturer_user_id: userId,
      status: { [Op.in]: ['WAITING_MANAGEMENT', 'COMPLETED'] },
    };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    includeWhere[Op.or] = [{ end_date: null }, { end_date: { [Op.gte]: today } }];

    const tccWhere = {};
    if (term) tccWhere.term = term;
    if (academic_year) tccWhere.academic_year = academic_year;
    if (year_level) tccWhere.year_level = year_level;

    // First, fetch contract courses matching the mapping filters to identify contract_ids
    const contractCourses = await TeachingContractCourse.findAll({
      where: tccWhere,
      attributes: ['course_id', 'term', 'academic_year', 'year_level', 'contract_id', 'hours'],
      include: [
        {
          model: TeachingContract,
          required: true,
          attributes: ['end_date', 'status', 'id'],
          where: includeWhere,
        },
      ],
    });

    // Build a lookup for end dates by key (exclude year_level to be more tolerant)
    const normalizeTerm = (t) =>
      String(t ?? '')
        .toLowerCase()
        .replace(/^term\s*/, '')
        .trim();
    const normCourseId = (id) => {
      const n = Number(id);
      return Number.isFinite(n) ? n : String(id ?? '').trim();
    };
    const keyOf = (c) =>
      `${normCourseId(c.course_id)}|${normalizeTerm(c.term)}|${String(c.academic_year ?? '').trim()}`;
    const endDateByKey = new Map();
    const contractIdByKey = new Map();
    const totalHoursByContractId = new Map();
    const relevantContractIds = new Set();
    for (const c of contractCourses) {
      const k = keyOf(c);
      const ed = c.TeachingContract?.end_date || null;
      if (!endDateByKey.has(k)) endDateByKey.set(k, ed);
      if (!contractIdByKey.has(k)) contractIdByKey.set(k, c.contract_id);
      relevantContractIds.add(c.contract_id);
    }

    // Now, compute totals across all courses for those contracts (ignoring year_level/other filters)
    if (relevantContractIds.size > 0) {
      const allCoursesForContracts = await TeachingContractCourse.findAll({
        where: { contract_id: { [Op.in]: Array.from(relevantContractIds) } },
        attributes: ['contract_id', 'hours'],
        include: [
          {
            model: TeachingContract,
            required: true,
            attributes: ['id', 'status', 'end_date'],
            where: includeWhere,
          },
        ],
      });
      for (const row of allCoursesForContracts) {
        const h = Number.isFinite(+row.hours) ? +row.hours : 0;
        totalHoursByContractId.set(
          row.contract_id,
          (totalHoursByContractId.get(row.contract_id) || 0) + h
        );
      }
    }

    const items = rows.map((r) => {
      const endDateKey = `${normCourseId(r.course_id)}|${normalizeTerm(r.term)}|${String(r.academic_year ?? '').trim()}`;
      const contract_end_date = endDateByKey.get(endDateKey) || null;
      const contract_id = contractIdByKey.get(endDateKey) || null;
      const contract_total_hours =
        contract_id != null ? totalHoursByContractId.get(contract_id) || 0 : null;
      const parts = [];
      // Ensure numeric hour fields and a consistent text with 'h'
      const toNumber = (v) => {
        if (v == null) return null;
        const s = String(v);
        const m = s.match(/(\d+)/);
        const n = m ? Number(m[1]) : Number(v);
        return Number.isFinite(n) ? n : null;
      };
      const thNum =
        toNumber(r.theory_hours) ??
        (r.type_hours?.includes('15h') ? 15 : r.type_hours?.includes('30h') ? 30 : null);
      const lhNum = toNumber(r.lab_hours) ?? 30;
      const th = thNum != null ? `${thNum}h` : null;
      const lh = lhNum != null ? `${lhNum}h` : null;
      const tg = Number(r.theory_groups) || 0;
      const lg = Number(r.lab_groups) || 0;
      if (tg > 0 && th) parts.push(`Theory ${th} × ${tg}`);
      if (lg > 0) parts.push(`Lab ${lh} × ${lg}`);
      if (!parts.length && r.group_count && th) {
        parts.push(`Theory ${th} × ${r.group_count}`);
      }
      return {
        id: r.id,
        course_id: r.course_id,
        course_name: r.Course?.course_name || 'Unknown Course',
        theory_groups: tg,
        lab_groups: lg,
        theory_hours: thNum,
        lab_hours: lhNum,
        year_level: r.year_level,
        term: r.term,
        academic_year: r.academic_year,
        hours_text: parts.join(' '),
        contract_end_date,
        contract_id,
        contract_total_hours,
      };
    });

    return res.json(items);
  } catch (e) {
    console.error('[getMyCourseMappings] error', e);
    return res.status(500).json({ message: 'Failed to fetch course mappings', error: e.message });
  }
}
