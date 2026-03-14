import { useState, useEffect, useCallback } from 'react';
import { getAcceptedMappings, listCourseMappings } from '../../../services/courseMapping.service';
import { listLecturers } from '../../../services/lecturer.service';
import { normId, lecturerDisplayFromMapping } from '../../../utils/contractHelpers';

/**
 * Custom hook for managing course mappings and lecturer data
 */
export function useContractMappings(academicYear) {
  const [mappings, setMappings] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [mappingsByYear, setMappingsByYear] = useState({});
  const [profileToUser, setProfileToUser] = useState({});

  const mappingUserId = useCallback((m) => {
    return normId(
      m?.lecturer_user_id ??
      (m?.lecturer_profile_id != null ? profileToUser[m.lecturer_profile_id] : null) ??
      m?.lecturer?.user_id ??
      m?.user_id ?? null
    );
  }, [profileToUser]);

  const resolveLecturerUserId = useCallback((lecturerKey) => {
    const raw = String(lecturerKey || '').trim();
    if (!raw) return null;
    if (raw.startsWith('profile:')) {
      const pid = raw.slice('profile:'.length);
      return normId(profileToUser?.[pid] ?? profileToUser?.[Number(pid)] ?? null);
    }
    return normId(raw);
  }, [profileToUser]);

  // Fetch mappings for current academic year
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const limit = 100;

        const dedupePush = (out, seen, row) => {
          const id = row?.id;
          if (id == null) return;
          const key = String(id);
          if (seen.has(key)) return;
          seen.add(key);
          out.push(row);
        };

        const yearMatches = (m, year) => {
          const y = String(year || '').trim();
          const my = String(m?.academic_year || '').trim();
          const cy = String(m?.class?.academic_year || '').trim();
          return (my && my === y) || (!my && cy && cy === y);
        };

        const fetchAllPages = async (fetchPage) => {
          let page = 1;
          let totalPages = 1;
          const out = [];
          const seen = new Set();
          do {
            const body = await fetchPage(page);
            const rows = Array.isArray(body?.data) ? body.data : [];
            for (const r of rows) dedupePush(out, seen, r);

            if (typeof body?.hasMore === 'boolean') {
              if (!body.hasMore) break;
            }
            totalPages = body?.totalPages || totalPages;
            if (page >= totalPages) break;
            page += 1;
          } while (page <= totalPages);
          return out;
        };

        // Primary (fast) path: ask server for Accepted mappings of this academic year.
        let collected = await fetchAllPages((page) => getAcceptedMappings({ academic_year: academicYear, limit, page }));

        // Fallback: some records may have mapping.academic_year empty but class.academic_year set.
        if (collected.length === 0) {
          const allAccepted = await fetchAllPages((page) =>
            listCourseMappings({ status: 'Accepted', limit: 200, page })
          );
          collected = allAccepted.filter((m) => yearMatches(m, academicYear));
        }

        if (!cancelled) setMappings(collected);
      } catch {
        if (!cancelled) setMappings([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [academicYear]);

  // Extract unique lecturers from mappings
  useEffect(() => {
    const map = new Map();
    for (const m of (mappings || [])) {
      const st = String(m.status || '').toLowerCase();
      if (st !== 'accepted') continue;
      const uid = mappingUserId(m);
      const pid = normId(m?.lecturer_profile_id ?? m?.lecturer?.id);
      const key = uid || (pid ? `profile:${pid}` : null);
      if (!key) continue;
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          userId: uid || null,
          profileId: pid || null,
          name: lecturerDisplayFromMapping(m) || m?.lecturer?.name || '',
        });
      }
    }
    setLecturers(Array.from(map.values()));
  }, [mappings, mappingUserId]);

  // Fetch profile-to-user mapping for accepted mappings
  useEffect(() => {
    const accepted = (mappings || []).filter(m => String(m.status || '').toLowerCase() === 'accepted');
    const profileIds = Array.from(new Set(accepted.map(m => m.lecturer_profile_id).filter(Boolean)));
    const missing = profileIds.filter(pid => !(pid in profileToUser));
    if (missing.length === 0) return;
    
    (async () => {
      try {
        let page = 1;
        let totalPages = 1;
        const collected = {};
        do {
          const body = await listLecturers({ page, limit: 100 });
          const data = body?.data || [];
          for (const it of data) {
            if (it?.lecturerProfileId && it?.id) {
              collected[it.lecturerProfileId] = it.id;
            }
          }
          totalPages = body?.meta?.totalPages || page;
          const covered = missing.every(pid => (collected[pid] || profileToUser[pid]));
          if (covered) break;
          page += 1;
        } while (page <= totalPages);
        if (Object.keys(collected).length) {
          setProfileToUser(prev => ({ ...prev, ...collected }));
        }
      } catch {
        // ignore mapping failures
      }
    })();
  }, [mappings, profileToUser]);

  // Fetch mappings for contracts with different academic years
  const fetchMappingsForYear = useCallback(async (year) => {
    if (year in mappingsByYear) return;
    try {
      const limit = 100;

      const yearMatches = (m, yearVal) => {
        const y = String(yearVal || '').trim();
        const my = String(m?.academic_year || '').trim();
        const cy = String(m?.class?.academic_year || '').trim();
        return (my && my === y) || (!my && cy && cy === y);
      };

      const fetchAllPages = async (fetchPage) => {
        let page = 1;
        let totalPages = 1;
        const out = [];
        const seen = new Set();
        do {
          const body = await fetchPage(page);
          const rows = Array.isArray(body?.data) ? body.data : [];
          for (const r of rows) {
            const id = r?.id;
            if (id == null) continue;
            const key = String(id);
            if (seen.has(key)) continue;
            seen.add(key);
            out.push(r);
          }
          if (typeof body?.hasMore === 'boolean') {
            if (!body.hasMore) break;
          }
          totalPages = body?.totalPages || totalPages;
          if (page >= totalPages) break;
          page += 1;
        } while (page <= totalPages);
        return out;
      };

      let collected = await fetchAllPages((page) => getAcceptedMappings({ academic_year: year, limit, page }));
      if (collected.length === 0) {
        const allAccepted = await fetchAllPages((page) => listCourseMappings({ status: 'Accepted', limit: 200, page }));
        collected = allAccepted.filter((m) => yearMatches(m, year));
      }

      setMappingsByYear(prev => ({ ...prev, [year]: collected }));
    } catch {
      setMappingsByYear(prev => ({ ...prev, [year]: [] }));
    }
  }, [mappingsByYear]);

  return {
    mappings,
    lecturers,
    mappingsByYear,
    setMappingsByYear,
    mappingUserId,
    resolveLecturerUserId,
    fetchMappingsForYear,
  };
}
