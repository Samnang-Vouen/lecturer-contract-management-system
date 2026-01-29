import { useMemo, useCallback } from 'react';

const DAY_OPTIONS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const SESSION_OPTIONS = [
  { id: 'S1', label: 'Session 1', time: '08:00 – 09:30' },
  { id: 'S2', label: 'Session 2', time: '09:50 – 11:30' },
  { id: 'S3', label: 'Session 3', time: '12:10 – 13:40' },
  { id: 'S4', label: 'Session 4', time: '13:50 – 15:20' },
  { id: 'S5', label: 'Session 5', time: '15:30 – 17:00' },
];

/**
 * Hook to parse, manipulate, and serialize availability strings
 * Format: "Monday: S1, S2; Tuesday: S3"
 */
export function useAvailability() {
  const timeToId = useMemo(
    () => Object.fromEntries(SESSION_OPTIONS.map((s) => [s.time.replace(/\s/g, '').toLowerCase(), s.id])),
    []
  );

  const idToTime = useMemo(
    () => Object.fromEntries(SESSION_OPTIONS.map((s) => [s.id, s.time])),
    []
  );

  const parseAvailability = useCallback(
    (str) => {
      const map = new Map();
      if (!str) return map;
      const raw = String(str);

      // If previous format was just comma-separated days, treat as all sessions selected for those days
      const hasColon = raw.includes(':');
      if (!hasColon && /monday|tuesday|wednesday|thursday|friday/i.test(raw)) {
        const tokens = raw.split(/[,;|]/).map((t) => t.trim()).filter(Boolean);
        tokens.forEach((tok) => {
          const day = DAY_OPTIONS.find((d) => d.toLowerCase().startsWith(tok.toLowerCase()));
          if (day) map.set(day, new Set(SESSION_OPTIONS.map((s) => s.id)));
        });
        return map;
      }

      // Expected format: "Monday: S1, S2; Tuesday: 08:00 – 09:30"
      raw
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((chunk) => {
          const sepIdx = chunk.indexOf(':');
          const dayPart = sepIdx >= 0 ? chunk.slice(0, sepIdx) : chunk;
          const rest = sepIdx >= 0 ? chunk.slice(sepIdx + 1) : '';
          const day = DAY_OPTIONS.find((d) => d.toLowerCase().startsWith((dayPart || '').trim().toLowerCase()));
          if (!day) return;

          const set = map.get(day) || new Set();
          (rest || '')
            .split(',')
            .map((x) => x.trim())
            .filter(Boolean)
            .forEach((tok) => {
              // Accept S1..S5 OR time label
              const upper = tok.toUpperCase();
              if (/^S[1-5]$/.test(upper)) {
                set.add(upper);
              } else {
                const key = tok.replace(/\s/g, '').toLowerCase();
                const id = timeToId[key];
                if (id) set.add(id);
              }
            });
          if (set.size) map.set(day, set);
        });
      return map;
    },
    [timeToId]
  );

  const serializeAvailability = useCallback((map) => {
    if (!map || !(map instanceof Map)) return '';
    const parts = [];
    for (const day of DAY_OPTIONS) {
      const set = map.get(day);
      if (!set || set.size === 0) continue;
      // Store compact S-codes to DB (S1–S5). Parser accepts both S-codes and times.
      const codes = Array.from(set).sort().join(', ');
      parts.push(`${day}: ${codes}`);
    }
    return parts.join('; ');
  }, []);

  const getAvailabilitySummary = useCallback(
    (availabilityMap) => {
      if (!availabilityMap || availabilityMap.size === 0) return '';
      const short = [];
      for (const day of DAY_OPTIONS) {
        const set = availabilityMap.get(day);
        if (set && set.size) {
          short.push(`${day.slice(0, 3)} ${Array.from(set).sort().join(',')}`);
        }
      }
      return short.join('; ');
    },
    []
  );

  return {
    DAY_OPTIONS,
    SESSION_OPTIONS,
    timeToId,
    idToTime,
    parseAvailability,
    serializeAvailability,
    getAvailabilitySummary,
  };
}
