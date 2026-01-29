import { useMemo } from 'react';

export function useCourseMappingFilters(mappings, courseMap, academicYearFilter, termFilter, statusFilter) {
  const grouped = useMemo(() => {
    const by = {};
    (Array.isArray(mappings) ? mappings : []).forEach(m => {
      const key = `${String(m.class?.id || m.class_id || 'unknown')}-${String(m.term || '')}-${String(m.academic_year || '')}`;
      if (!by[key]) {
        by[key] = {
          key,
          class: m.class,
          entries: [],
          stats: { total: 0, assigned: 0, pending: 0, hoursAssigned: 0, hoursNeeded: 0 }
        };
      }
      by[key].entries.push(m);
    });

    // Helper extractors with legacy fallbacks
    const getTheoryGroups = (e) => {
      if (Number.isFinite(e?.theory_groups)) return Math.max(0, e.theory_groups);
      if (/theory|15h/i.test(String(e?.type_hours || ''))) return Math.max(0, e?.group_count || 0);
      return 0;
    };

    const getLabGroups = (e) => {
      if (Number.isFinite(e?.lab_groups)) return Math.max(0, e.lab_groups);
      if (/lab|30h/i.test(String(e?.type_hours || ''))) return Math.max(0, e?.group_count || 0);
      return 0;
    };

    const getTheoryPerGroup = (e) => {
      const th = String(e?.theory_hours || '').toLowerCase();
      if (th.includes('15')) return 15;
      if (th.includes('30')) return 30;
      // legacy fallback via type_hours
      return String(e?.type_hours || '').includes('15h') ? 15 : 30;
    };

    // Apply entry-level filters (term & status) then rebuild stats
    const filteredGroups = [];
    Object.values(by).forEach(group => {
      let entries = group.entries;
      if (termFilter !== 'ALL') entries = entries.filter(e => (e.term || '') === termFilter);
      if (statusFilter !== 'ALL') entries = entries.filter(e => (e.status || '') === statusFilter);
      if (academicYearFilter !== 'ALL') entries = entries.filter(e => (e.academic_year || '') === academicYearFilter);
      if (!entries.length) return; // skip empty group after filters

      // Compute hoursNeeded per subject (course): groups × subject_hours
      const perCourseGroups = new Map(); // course_id -> groups
      for (const e of entries) {
        const cid = e.course_id ?? e.course?.id;
        if (!cid) continue;
        const thG = getTheoryGroups(e);
        const lbG = getLabGroups(e);
        let candidate = Math.max(thG, lbG);
        if (!candidate) candidate = Math.max(0, e?.group_count || 0);
        const prev = perCourseGroups.get(cid) || 0;
        if (candidate > prev) perCourseGroups.set(cid, candidate);
      }

      let hoursNeeded = 0;
      for (const [cid, groupsCnt] of perCourseGroups.entries()) {
        const crs = (courseMap && courseMap[cid]) || {};
        const subjectHoursRaw = crs.hours;
        const subjectHours = Number.isFinite(subjectHoursRaw) 
          ? subjectHoursRaw 
          : parseInt(String(subjectHoursRaw || '0'), 10) || 0;
        hoursNeeded += groupsCnt * subjectHours;
      }

      // Compute hoursAssigned from Accepted entries only
      const hoursAssigned = entries.reduce((sum, e) => {
        if (String(e.status) !== 'Accepted') return sum;
        const theoryGroups = getTheoryGroups(e);
        const labGroups = getLabGroups(e);
        let add = 0;
        if (theoryGroups > 0) {
          const perGroup = getTheoryPerGroup(e);
          add += theoryGroups * perGroup;
        }
        if (labGroups > 0) {
          add += labGroups * 30; // Lab always 30h per group
        }
        return sum + add;
      }, 0);

      const stats = {
        total: entries.length,
        pending: entries.filter(e => e.status === 'Pending').length,
        assigned: entries.filter(e => e.status === 'Accepted' && e.lecturer_profile_id).length,
        hoursAssigned,
        hoursNeeded
      };

      filteredGroups.push({ ...group, entries, stats });
    });

    return filteredGroups.sort(
      (a, b) => (b.class?.academic_year || '').localeCompare(a.class?.academic_year || '') ||
                (a.class?.name || '').localeCompare(b.class?.name || '')
    );
  }, [mappings, academicYearFilter, termFilter, statusFilter, courseMap]);

  return { grouped };
}
