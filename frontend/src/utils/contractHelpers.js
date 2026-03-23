/**
 * Contract Helper Utilities
 * Pure helper functions for contract calculations and formatting
 */

export const toInt = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export const toBool = (v) => {
  if (v == null) return false;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  const s = String(v).trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'yes' || s === 'y';
};

export const normId = (v) => (v == null ? null : String(v));

export const lecturerUserIdFromMapping = (m) => {
  return normId(
    m?.lecturer_user_id ??
    m?.lecturer?.user_id ??
    m?.lecturer?.id ??
    m?.user_id ?? null
  );
};

export const lecturerDisplayFromMapping = (m) => {
  const title = m?.lecturer?.title || m?.lecturer?.academic_title || m?.lecturer?.title_english || m?.lecturer?.title_khmer || '';
  const name = m?.lecturer?.display_name || m?.lecturer?.full_name || m?.lecturer?.full_name_english || m?.lecturer?.full_name_khmer || m?.lecturer?.name || m?.lecturer?.email || '';
  return `${title ? `${title} ` : ''}${name || ''}`.trim();
};

export const getMappingTheoryHourLabel = (m) => {
  const theoryHours = String(m?.theory_hours || '').trim().toLowerCase();
  if (theoryHours === '15h' || theoryHours === '30h') return theoryHours;
  const typeHours = String(m?.type_hours || '');
  if (/15h/i.test(typeHours)) return '15h';
  if (/30h/i.test(typeHours) && /theory/i.test(typeHours)) return '30h';
  return '';
};

export const getMappingTheoryGroupCount = (m) => {
  if (Array.isArray(m?._theoryGroupIds) && m._theoryGroupIds.length) return m._theoryGroupIds.length;
  if (Array.isArray(m?.theory_group_ids) && m.theory_group_ids.length) return m.theory_group_ids.length;
  return toInt(m?.theory_groups ?? m?.groups_15h ?? m?.groups_theory ?? m?.group_count_theory ?? 0);
};

export const getMappingLabGroupCount = (m) => {
  if (Array.isArray(m?._labGroupIds) && m._labGroupIds.length) return m._labGroupIds.length;
  if (Array.isArray(m?.lab_group_ids) && m.lab_group_ids.length) return m.lab_group_ids.length;
  return toInt(m?.lab_groups ?? m?.practice_groups ?? m?.practical_groups ?? m?.groups_30h ?? m?.groups_lab ?? m?.group_count_lab ?? 0);
};

export const canCombineTheoryFromMapping = (m) => {
  const theoryHours = getMappingTheoryHourLabel(m);
  return (theoryHours === '15h' || theoryHours === '30h') && getMappingTheoryGroupCount(m) > 1;
};

export const aggregateContractMappings = (rows, getExtraKey) => {
  const grouped = new Map();

  for (const row of Array.isArray(rows) ? rows : []) {
    const courseId = normId(row?.course?.id ?? row?.course_id);
    const classId = normId(row?.class?.id ?? row?.class_id);
    const yearLevel = String(row?.year_level ?? '').trim();
    const term = String(row?.term ?? '').trim();
    const academicYear = String(row?.academic_year ?? row?.class?.academic_year ?? '').trim();
    const extraKey = typeof getExtraKey === 'function' ? normId(getExtraKey(row)) : null;
    const key = [courseId || '', classId || '', yearLevel, term, academicYear, extraKey || ''].join('|');
    if (!key) continue;

    if (!grouped.has(key)) {
      grouped.set(key, {
        first: row,
        ids: [],
        theoryGroupIds: new Set(),
        labGroupIds: new Set(),
        fallbackTheoryGroups: 0,
        fallbackLabGroups: 0,
        theoryHours: '',
        labHours: '',
        theoryCombined: false,
      });
    }

    const current = grouped.get(key);
    current.ids.push(row?.id);

    const groupId = normId(row?.group?.id ?? row?.group_id);
    const theoryGroups = getMappingTheoryGroupCount(row);
    const labGroups = getMappingLabGroupCount(row);

    if (groupId) {
      if (theoryGroups > 0) current.theoryGroupIds.add(groupId);
      if (labGroups > 0) current.labGroupIds.add(groupId);
    } else {
      current.fallbackTheoryGroups = Math.max(current.fallbackTheoryGroups, theoryGroups);
      current.fallbackLabGroups = Math.max(current.fallbackLabGroups, labGroups);
    }

    const theoryHours = getMappingTheoryHourLabel(row);
    if (!current.theoryHours && theoryHours) current.theoryHours = theoryHours;
    if (!current.labHours && String(row?.lab_hours || '').trim()) current.labHours = String(row.lab_hours).trim().toLowerCase();
    current.theoryCombined = current.theoryCombined || toBool(row?.theory_combined ?? row?.theory_15h_combined ?? row?.combine_theory_groups);
  }

  return Array.from(grouped.entries()).map(([key, current]) => {
    const theoryGroups = current.theoryGroupIds.size || current.fallbackTheoryGroups;
    const labGroups = current.labGroupIds.size || current.fallbackLabGroups;
    const first = current.first;
    return {
      ...first,
      id: current.ids.length === 1 && first?.id != null ? first.id : `agg:${key}`,
      ids: current.ids.filter((value) => value != null),
      theory_hours: current.theoryHours || first?.theory_hours || '',
      theory_groups: theoryGroups,
      lab_hours: current.labHours || first?.lab_hours || '',
      lab_groups: labGroups,
      theory_combined: current.theoryCombined,
      _theoryGroupIds: Array.from(current.theoryGroupIds),
      _labGroupIds: Array.from(current.labGroupIds),
    };
  });
};

export const hoursFromMapping = (m) => {
  if (!m || typeof m !== 'object') return 0;
  const theoryHoursLabel = getMappingTheoryHourLabel(m);
  const theory15 = theoryHoursLabel === '15h';
  const theory30 = theoryHoursLabel === '30h';
  const theoryGroups = getMappingTheoryGroupCount(m);
  const labGroups = getMappingLabGroupCount(m);
  const theoryCombined = toBool(m.theory_combined ?? m.theory_15h_combined ?? m.combine_theory_groups ?? m.combined_theory ?? m.combine);
  let theoryHours = 0;
  if (theory15) theoryHours = theoryCombined ? (theoryGroups > 0 ? 15 : 0) : (15 * theoryGroups);
  else if (theory30) theoryHours = theoryCombined ? (theoryGroups > 0 ? 30 : 0) : (30 * theoryGroups);
  const labHours = labGroups * 30;
  const computed = theoryHours + labHours;
  if (!computed) {
    const raw = toInt(m.hours ?? m.course?.hours);
    return raw;
  }
  return computed;
};

export const totalHoursFromContract = (contract, mappingsByYear) => {
  const arr = Array.isArray(contract?.courses) ? contract.courses : [];
  const year = contract?.academic_year;
  const yearMaps = (year && mappingsByYear?.[year]) ? mappingsByYear[year] : [];
  return arr.reduce((sum, item) => {
    const match = yearMaps.find(m => {
      const mCourseId = normId(m.course?.id ?? m.course_id);
      const mClassId = normId(m.class?.id ?? m.class_id);
      const iCourseId = normId(item.course_id ?? item.course?.id);
      const iClassId = normId(item.class_id ?? item.class?.id);
      const mLecturerId = lecturerUserIdFromMapping(m);
      const cLecturerId = normId(contract?.lecturer_user_id ?? contract?.lecturer?.user_id ?? contract?.lecturer?.id);
      const sameCourseClass = mCourseId && iCourseId && mCourseId === iCourseId && mClassId && iClassId && mClassId === iClassId;
      const sameLecturer = !mLecturerId || !cLecturerId ? true : (mLecturerId === cLecturerId);
      return sameCourseClass && sameLecturer;
    });
    const explicit = toInt(item?.hours);
    if (explicit > 0) return sum + explicit;
    const merged = match ? { ...match, theory_combined: (item?.theory_combined ?? match?.theory_combined) } : item;
    return sum + hoursFromMapping(merged);
  }, 0);
};

export const formatMDY = (value) => {
  if (!value) return '';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' });
  } catch {
    return '';
  }
};

export const formatRate = (n) => {
  if (n == null) return null;
  try {
    const v = Number(n);
    if (!Number.isFinite(v)) return null;
    return `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}/hr`;
  } catch {
    return null;
  }
};

export const formatMoney = (n) => {
  if (n == null) return null;
  try {
    const v = Number(n);
    if (!Number.isFinite(v)) return null;
    return `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  } catch {
    return null;
  }
};

export const lecturerFilename = (lecturer) => {
  if (!lecturer) return null;
  const rawTitle = lecturer?.LecturerProfile?.title || lecturer?.title || '';
  let base = lecturer?.display_name || lecturer?.full_name || lecturer?.full_name_english || lecturer?.full_name_khmer || lecturer?.name || lecturer?.email || '';
  if (base.includes('@')) base = base.split('@')[0];
  const norm = (s='') => String(s).toLowerCase().replace(/[\.]/g, '').trim();
  const t = norm(rawTitle);
  const prettyTitle = t === 'dr' ? 'Dr' : t === 'prof' || t === 'professor' ? 'Prof' : t === 'mr' ? 'Mr' : t === 'ms' || t === 'miss' ? 'Ms' : t === 'mrs' ? 'Mrs' : (rawTitle ? rawTitle : '');
  const parts = [];
  if (prettyTitle) parts.push(String(prettyTitle).replace(/[\.]/g, ''));
  if (base) parts.push(String(base));
  let combined = parts.join(' ').trim();
  combined = combined.replace(/[\/:*?"<>|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[\.]/g, '')
    .trim()
    .replace(/\s/g, '_')
    .replace(/_+/g, '_');
  if (!combined) return null;
  return `${combined}.pdf`;
};

export const formatContractId = (contract) => {
  const createdYear = contract.created_at ? new Date(contract.created_at).getFullYear() : new Date().getFullYear();
  const t = String(contract?.contract_type || '').toUpperCase();
  const prefix = t === 'ADVISOR' ? 'AC' : 'LC';
  return `${prefix}-${createdYear}-${String(contract.id).padStart(3, '0')}`;
};

export const getLecturerName = (lecturer) => {
  const lecturerTitle = lecturer?.LecturerProfile?.title || lecturer?.title || '';
  const lecturerNameBase = lecturer?.display_name || lecturer?.full_name || lecturer?.email;
  return `${lecturerTitle ? lecturerTitle + '. ' : ''}${lecturerNameBase || ''}`.trim();
};

export const getContractDepartment = (contract) => {
  return (contract.courses && contract.courses[0] && contract.courses[0].Course && contract.courses[0].Course.Department && contract.courses[0].Course.Department.dept_name)
    || contract.lecturer?.department_name || 'N/A';
};

export const getContractPeriod = (contract) => {
  return `Term ${contract.term} • ${contract.academic_year}`;
};

export const getContractStatus = (status) => {
  const st = String(status || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');

  const statusMap = {
    WAITING_MANAGEMENT: { label: 'Waiting Management', class: 'bg-blue-50 text-blue-700 border-blue-200', icon: 'Info' },
    WAITING_LECTURER: { label: 'Waiting Lecturer', class: 'bg-amber-50 text-amber-700 border-amber-200', icon: 'Clock' },
    MANAGEMENT_SIGNED: { label: 'Waiting Lecturer', class: 'bg-amber-50 text-amber-700 border-amber-200', icon: 'Clock' },
    LECTURER_SIGNED: { label: 'Waiting Management', class: 'bg-blue-50 text-blue-700 border-blue-200', icon: 'Info' },
    COMPLETED: { label: 'Completed', class: 'bg-green-50 text-green-700 border-green-200', icon: 'CheckCircle2' },
    CONTRACT_ENDED: { label: 'Contract Ended', class: 'bg-gray-100 text-red-700 border-red-200', icon: 'AlertCircle' },
  };
  return statusMap[st] || { label: String(status||'').toLowerCase(), class: 'bg-gray-100 text-gray-700 border-gray-200' };
};
