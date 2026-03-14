import { useState, useEffect, useMemo, useRef } from 'react';
import { getClasses } from '../../../services/class.service.js';
import { getCourses } from '../../../services/course.service.js';
import { listLecturers } from '../../../services/lecturer.service.js';
import { listCourseMappings, createCourseMapping, updateCourseMapping, deleteCourseMapping } from '../../../services/courseMapping.service.js';

/**
 * Hook to manage course mapping data (CRUD operations, filtering, pagination)
 */
export function useCourseMappingData() {
  const [classes, setClasses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [academicYearFilter, setAcademicYearFilter] = useState('ALL');
  const [termFilter, setTermFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef(null);
  const [error, setError] = useState(null);

  // Quick lookup maps
  const classMap = useMemo(
    () => Object.fromEntries((Array.isArray(classes) ? classes : []).map((c) => [c.id, c])),
    [classes]
  );

  const courseMap = useMemo(
    () => Object.fromEntries((Array.isArray(courses) ? courses : []).map((c) => [c.id, c])),
    [courses]
  );

  // Filter options derived from data
  const academicYearOptions = useMemo(() => {
    const set = new Set();
    (Array.isArray(classes) ? classes : []).forEach((c) => {
      if (c.academic_year) set.add(String(c.academic_year));
    });
    (Array.isArray(mappings) ? mappings : []).forEach((m) => {
      if (m.academic_year) set.add(String(m.academic_year));
    });
    return Array.from(set).sort();
  }, [classes, mappings]);

  const termOptions = useMemo(() => {
    const set = new Set();
    (Array.isArray(classes) ? classes : []).forEach((c) => {
      if (c.term) set.add(String(c.term));
    });
    (Array.isArray(mappings) ? mappings : []).forEach((m) => {
      if (m.term) set.add(String(m.term));
    });
    return Array.from(set).sort();
  }, [classes, mappings]);

  const statusOptions = ['Pending', 'Contacting', 'Accepted', 'Rejected'];

  // Group mappings by class/term/year with applied filters
  const grouped = useMemo(() => {
    const by = {};
    (Array.isArray(mappings) ? mappings : []).forEach((m) => {
      const key = `${String(m.class?.id || m.class_id || 'unknown')}-${String(m.term || '')}-${String(m.academic_year || '')}`;
      if (!by[key]) {
        by[key] = {
          key,
          class: m.class,
          entries: [],
          stats: { total: 0, assigned: 0, pending: 0, hoursAssigned: 0, hoursNeeded: 0 },
        };
      }
      by[key].entries.push(m);
    });

    // Apply entry-level filters (term & status) then rebuild stats
    const filteredGroups = [];
    Object.values(by).forEach((group) => {
      let entries = group.entries;
      if (termFilter !== 'ALL') entries = entries.filter((e) => (e.term || '') === termFilter);
      if (statusFilter !== 'ALL') entries = entries.filter((e) => (e.status || '') === statusFilter);
      if (academicYearFilter !== 'ALL') entries = entries.filter((e) => (e.academic_year || '') === academicYearFilter);
      if (!entries.length) return; // skip empty group after filters

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

      // Compute hoursNeeded per subject (course): groups × subject_hours
      const perCourse = new Map();
      for (const e of entries) {
        const cid = e.course_id ?? e.course?.id;
        if (!cid) continue;
        if (!perCourse.has(cid)) perCourse.set(cid, []);
        perCourse.get(cid).push(e);
      }

      const perCourseGroups = new Map();
      for (const [cid, list] of perCourse.entries()) {
        // Prefer unique group_id count when data is per-group rows
        const unionGroupIds = new Set(list.map((x) => x.group_id).filter(Boolean).map(String));
        if (unionGroupIds.size) {
          perCourseGroups.set(cid, unionGroupIds.size);
          continue;
        }
        // Legacy fallback: use the maximum groups hinted by the entries
        let maxGroups = 0;
        for (const e of list) {
          const thG = getTheoryGroups(e);
          const lbG = getLabGroups(e);
          let candidate = Math.max(thG, lbG);
          if (!candidate) candidate = Math.max(0, e?.group_count || 0);
          if (candidate > maxGroups) maxGroups = candidate;
        }
        perCourseGroups.set(cid, maxGroups);
      }

      let hoursNeeded = 0;
      for (const [cid, groupsCnt] of perCourseGroups.entries()) {
        const crs = (courseMap && courseMap[cid]) || {};
        const subjectHoursRaw = crs.hours;
        const subjectHours = Number.isFinite(subjectHoursRaw) ? subjectHoursRaw : parseInt(String(subjectHoursRaw || '0'), 10) || 0;
        hoursNeeded += groupsCnt * subjectHours;
      }

      // Compute hoursAssigned from Accepted entries only
      let hoursAssigned = 0;
      for (const [_cid, list] of perCourse.entries()) {
        const accepted = list.filter((e) => String(e.status) === 'Accepted');
        if (!accepted.length) continue;

        const hasGroupIds = accepted.some((e) => !!e.group_id);
        if (hasGroupIds) {
          const theory15 = new Set();
          const theory30 = new Set();
          const lab = new Set();

          for (const e of accepted) {
            const gid = e.group_id ? String(e.group_id) : null;
            if (!gid) continue;
            const thG = getTheoryGroups(e);
            const lbG = getLabGroups(e);
            if (thG > 0) {
              const per = getTheoryPerGroup(e);
              if (per === 15) theory15.add(gid);
              else theory30.add(gid);
            }
            if (lbG > 0) lab.add(gid);
          }

          hoursAssigned += theory15.size * 15 + theory30.size * 30 + lab.size * 30;
        } else {
          // Legacy aggregate row without group_id
          const e = accepted[0];
          const theoryGroups = getTheoryGroups(e);
          const labGroups = getLabGroups(e);
          if (theoryGroups > 0) hoursAssigned += theoryGroups * getTheoryPerGroup(e);
          if (labGroups > 0) hoursAssigned += labGroups * 30;
        }
      }

      // Stats per course (not per mapping row) to avoid inflated counts in per-group mode.
      const totalCourses = perCourse.size;
      let pendingCourses = 0;
      let assignedCourses = 0;
      let acceptedCourses = 0;
      for (const list of perCourse.values()) {
        const anyPending = list.some((e) => String(e.status) === 'Pending');
        if (anyPending) pendingCourses += 1;
        const anyAcceptedAssigned = list.some(
          (e) => String(e.status) === 'Accepted' && !!e.lecturer_profile_id
        );
        if (anyAcceptedAssigned) assignedCourses += 1;

        // Course is considered Accepted only if all its mapping rows are Accepted.
        const allAccepted = list.length > 0 && list.every((e) => String(e.status) === 'Accepted');
        if (allAccepted) acceptedCourses += 1;
      }

      const stats = {
        total: totalCourses,
        pending: pendingCourses,
        assigned: assignedCourses,
        accepted: acceptedCourses,
        hoursAssigned,
        hoursNeeded,
      };
      filteredGroups.push({ ...group, entries, stats });
    });

    return filteredGroups.sort(
      (a, b) =>
        (b.class?.academic_year || '').localeCompare(a.class?.academic_year || '') ||
        (a.class?.name || '').localeCompare(b.class?.name || '')
    );
  }, [mappings, academicYearFilter, termFilter, statusFilter, courseMap]);

  const loadData = async (reset = false) => {
    try {
      setLoading(true);
      setError(null);
      const baseParams = { page: 1, limit: 200 };
      const [clsRes, lectBody, courseRes] = await Promise.all([
        getClasses(baseParams.page, baseParams.limit),
        listLecturers(baseParams),
        getCourses({ page: 1, limit: 500 }),
      ]);

      const clsPayload = clsRes.data;
      const classList = Array.isArray(clsPayload) ? clsPayload : Array.isArray(clsPayload?.data) ? clsPayload.data : [];
      console.log('[useCourseMappingData] Classes loaded:', classList.length);
      setClasses(classList);

      setLecturers(
        (lectBody?.data || []).map((l) => ({ id: l.lecturerProfileId, name: l.name, courses: l.courses || [] }))
      );
      console.log('[useCourseMappingData] Lecturers loaded:', lectBody?.data?.length || 0);

      const coursePayload = courseRes.data;
      const courseList = Array.isArray(coursePayload) ? coursePayload : Array.isArray(coursePayload?.data) ? coursePayload.data : [];
      console.log('[useCourseMappingData] Courses loaded:', courseList.length);
      setCourses(courseList);

      if (reset) {
        setPage(1);
      }

      const firstPage = reset ? 1 : page;
      const mapBody = await listCourseMappings({
        page: firstPage,
        limit: 10,
        ...(academicYearFilter && academicYearFilter !== 'ALL' ? { academic_year: academicYearFilter } : {}),
      });

      const mData = Array.isArray(mapBody) ? mapBody : Array.isArray(mapBody?.data) ? mapBody.data : [];
      console.log('[useCourseMappingData] Mappings loaded:', mData.length, 'Total:', mapBody?.total);
      setMappings(reset ? mData : [...mappings, ...mData]);
      setHasMore(!!mapBody?.hasMore);
    } catch (e) {
      console.error('[useCourseMappingData] Error loading data:', e);
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  const reloadForAcademicYear = async (year) => {
    try {
      setLoading(true);
      setError(null);
      const paramsCommon = { page: 1, limit: 500, ...(year ? { academic_year: year } : {}) };
      const [clsRes, lectBody, courseRes] = await Promise.all([
        getClasses(paramsCommon.page, paramsCommon.limit),
        listLecturers(paramsCommon),
        getCourses(paramsCommon),
      ]);

      const clsPayload = clsRes.data;
      const classList = Array.isArray(clsPayload) ? clsPayload : Array.isArray(clsPayload?.data) ? clsPayload.data : [];
      setClasses(classList);

      setLecturers(
        (lectBody?.data || []).map((l) => ({ id: l.lecturerProfileId, name: l.name, courses: l.courses || [] }))
      );

      const coursePayload = courseRes.data;
      const courseList = Array.isArray(coursePayload) ? coursePayload : Array.isArray(coursePayload?.data) ? coursePayload.data : [];
      setCourses(courseList);
    } catch (e) {
      console.error('reloadForAcademicYear failed', e);
    } finally {
      setLoading(false);
    }
  };

  // Initial & academic year change (reset)
  useEffect(() => {
    loadData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [academicYearFilter]);

  // Infinite scroll observer
  useEffect(() => {
    if (!hasMore || loading) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          (async () => {
            try {
              setLoading(true);
              setError(null);
              const nextPage = page + 1;
              const mapBody = await listCourseMappings({
                page: nextPage,
                limit: 10,
                ...(academicYearFilter && academicYearFilter !== 'ALL' ? { academic_year: academicYearFilter } : {}),
              });
              const mData = Array.isArray(mapBody) ? mapBody : Array.isArray(mapBody?.data) ? mapBody.data : [];
              setMappings((prev) => [...prev, ...mData]);
              setPage(nextPage);
              setHasMore(!!mapBody?.hasMore);
            } catch (e) {
              setError(e.response?.data?.message || e.message);
            } finally {
              setLoading(false);
            }
          })();
        }
      },
      { threshold: 1.0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, page, academicYearFilter]);

  const createMapping = async (payload) => {
    await createCourseMapping(payload);
    await loadData(true);
  };

  const updateMapping = async (idOrIds, payload) => {
    if (Array.isArray(idOrIds)) {
      const ids = idOrIds.map((x) => parseInt(String(x), 10)).filter((n) => Number.isInteger(n) && n > 0);
      if (!ids.length) return;
      await updateCourseMapping(ids[0], { ...payload, ids });
      await loadData(true);
      return;
    }
    await updateCourseMapping(idOrIds, payload);
    await loadData(true);
  };

  const deleteMapping = async (idOrIds) => {
    if (Array.isArray(idOrIds)) {
      const ids = idOrIds.map((x) => parseInt(String(x), 10)).filter((n) => Number.isInteger(n) && n > 0);
      if (!ids.length) return;
      await deleteCourseMapping(ids[0], { ids });
      await loadData(true);
      return;
    }
    await deleteCourseMapping(idOrIds);
    await loadData(true);
  };

  return {
    classes,
    lecturers,
    courses,
    mappings,
    grouped,
    classMap,
    courseMap,
    academicYearFilter,
    setAcademicYearFilter,
    termFilter,
    setTermFilter,
    statusFilter,
    setStatusFilter,
    academicYearOptions,
    termOptions,
    statusOptions,
    loading,
    error,
    hasMore,
    sentinelRef,
    loadData,
    reloadForAcademicYear,
    createMapping,
    updateMapping,
    deleteMapping,
  };
}
