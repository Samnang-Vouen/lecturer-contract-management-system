import { useState, useEffect, useCallback } from 'react';
import { getAcceptedMappings } from '../../../services/courseMapping.service';
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

  // Fetch mappings for current academic year
  useEffect(() => {
    getAcceptedMappings({ academic_year: academicYear, limit: 100 })
      .then(body => setMappings(body?.data || []))
      .catch(() => {});
  }, [academicYear]);

  // Extract unique lecturers from mappings
  useEffect(() => {
    const map = new Map();
    for (const m of (mappings || [])) {
      const st = String(m.status || '').toLowerCase();
      if (st !== 'accepted') continue;
      const uid = mappingUserId(m);
      if (!uid) continue;
      if (!map.has(uid)) {
        map.set(uid, { id: uid, name: lecturerDisplayFromMapping(m) });
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
      const body = await getAcceptedMappings({ academic_year: year, limit: 100 });
      setMappingsByYear(prev => ({ ...prev, [year]: body?.data || [] }));
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
    fetchMappingsForYear,
  };
}
