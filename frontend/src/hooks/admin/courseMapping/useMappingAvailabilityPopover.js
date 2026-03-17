import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAvailability } from './useAvailability.js';
import { usePopoverPosition } from './usePopoverPosition.js';

const LIMITS = {
  THEORY_15H: { min: 1, max: 1 },
  THEORY_30H: { min: 1, max: 2 },
  LAB: { min: 2, max: 2 },
};

const normalizeIdArray = (arr) => Array.from(new Set((Array.isArray(arr) ? arr : []).map(String)));

/**
 * Manages the Availability popover state.
 *
 * New behavior (when Theory/Lab groups are selected):
 * - Theory: 1 session per selected group
 * - Lab: 2 sessions per selected group
 * - A time slot cannot be reused across groups/types
 *
 * Legacy fallback (when no groups are selected):
 * - behaves like the old multi-select availability string field
 */
export function useMappingAvailabilityPopover({ isOpen, form, setForm, groupsForSelectedClass }) {
  const {
    DAY_OPTIONS,
    SESSION_OPTIONS,
    idToTime,
    parseAvailability,
    serializeAvailability,
    getAvailabilitySummary,
  } = useAvailability();

  const { popoverStyle, updatePosition } = usePopoverPosition();
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const availBtnRef = useRef(null);

  const theoryGroupIds = useMemo(() => normalizeIdArray(form?.theory_group_ids), [form?.theory_group_ids]);
  const labGroupIds = useMemo(() => normalizeIdArray(form?.lab_group_ids), [form?.lab_group_ids]);
  const hasGroupTargets = theoryGroupIds.length > 0 || labGroupIds.length > 0;

  const theoryHours = useMemo(() => {
    const v = String(form?.theory_hours || '').trim().toLowerCase();
    if (v === '30h') return '30h';
    return '15h';
  }, [form?.theory_hours]);

  const allowTheorySlotSharing = hasGroupTargets && theoryHours === '15h';

  const groupNameById = useMemo(() => {
    const out = {};
    (Array.isArray(groupsForSelectedClass) ? groupsForSelectedClass : []).forEach((g) => {
      out[String(g.id)] = g?.name || `Group ${g.id}`;
    });
    return out;
  }, [groupsForSelectedClass]);

  // ----- Legacy string-based selection -----
  const availabilityMap = useMemo(
    () => parseAvailability(form?.availability),
    [form?.availability, parseAvailability]
  );
  const availabilitySummaryLegacy = getAvailabilitySummary(availabilityMap);

  const toggleSessionLegacy = useCallback(
    (day, sessionId) => {
      const current = parseAvailability(form?.availability);
      const set = new Set(current.get(day) || []);
      if (set.has(sessionId)) set.delete(sessionId);
      else set.add(sessionId);
      if (set.size) current.set(day, set);
      else current.delete(day);
      setForm((f) => ({ ...f, availability: serializeAvailability(current) }));
    },
    [form?.availability, parseAvailability, serializeAvailability, setForm]
  );

  const clearAvailabilityLegacy = useCallback(() => {
    setForm((f) => ({ ...f, availability: '' }));
  }, [setForm]);

  // ----- Structured per-group selection -----
  const assignmentsByGroup = useMemo(() => {
    const raw = form?.availability_assignments_by_group;
    return raw && typeof raw === 'object' ? raw : {};
  }, [form?.availability_assignments_by_group]);

  const targets = useMemo(() => {
    const out = [];
    for (const gid of theoryGroupIds) {
      const name = groupNameById[gid] || `Group ${gid}`;
      const limits = theoryHours === '30h' ? LIMITS.THEORY_30H : LIMITS.THEORY_15H;
      out.push({
        key: `${gid}|THEORY`,
        groupId: gid,
        groupType: 'THEORY',
        min: limits.min,
        max: limits.max,
        label: `Theory · ${name}`,
      });
    }
    for (const gid of labGroupIds) {
      const name = groupNameById[gid] || `Group ${gid}`;
      const limits = LIMITS.LAB;
      out.push({
        key: `${gid}|LAB`,
        groupId: gid,
        groupType: 'LAB',
        min: limits.min,
        max: limits.max,
        label: `Lab · ${name}`,
      });
    }
    return out;
  }, [theoryGroupIds, labGroupIds, groupNameById, theoryHours]);

  const [activeTargetKey, setActiveTargetKey] = useState('');

  useEffect(() => {
    if (!hasGroupTargets) {
      setActiveTargetKey('');
      return;
    }
    if (!targets.length) {
      setActiveTargetKey('');
      return;
    }
    if (activeTargetKey && targets.some((t) => t.key === activeTargetKey)) return;
    setActiveTargetKey(targets[0].key);
  }, [hasGroupTargets, targets, activeTargetKey]);

  // prune assignments when groups change
  useEffect(() => {
    if (!hasGroupTargets) return;
    const thSet = new Set(theoryGroupIds);
    const lbSet = new Set(labGroupIds);
    setForm((f) => {
      const raw = f?.availability_assignments_by_group;
      const cur = raw && typeof raw === 'object' ? raw : {};
      const next = {};
      for (const gid of new Set([...theoryGroupIds, ...labGroupIds])) {
        const src = cur[String(gid)] && typeof cur[String(gid)] === 'object' ? cur[String(gid)] : {};
        next[String(gid)] = {
          THEORY: thSet.has(String(gid)) ? (Array.isArray(src.THEORY) ? src.THEORY : []) : [],
          LAB: lbSet.has(String(gid)) ? (Array.isArray(src.LAB) ? src.LAB : []) : [],
        };
      }
      // If unchanged, keep original reference
      const sameKeys =
        Object.keys(cur).length === Object.keys(next).length &&
        Object.keys(next).every((k) => {
          const a = cur[k] || {};
          const b = next[k] || {};
          return (
            JSON.stringify(Array.isArray(a.THEORY) ? a.THEORY : []) === JSON.stringify(b.THEORY) &&
            JSON.stringify(Array.isArray(a.LAB) ? a.LAB : []) === JSON.stringify(b.LAB)
          );
        });
      if (sameKeys) return f;
      return { ...f, availability_assignments_by_group: next };
    });
  }, [hasGroupTargets, theoryGroupIds, labGroupIds, setForm]);

  const slotToTarget = useMemo(() => {
    const map = new Map(); // slotKey -> Set(targetKey)
    for (const t of targets) {
      const gid = t.groupId;
      const typ = t.groupType;
      const list = assignmentsByGroup?.[gid]?.[typ] || [];
      (Array.isArray(list) ? list : []).forEach((s) => {
        const day = String(s?.day || '').trim();
        const sessionId = String(s?.sessionId || s?.session || '').trim().toUpperCase();
        if (!day || !sessionId) return;
        const key = `${day}|${sessionId}`;
        if (!map.has(key)) map.set(key, new Set());
        map.get(key).add(t.key);
      });
    }
    return map;
  }, [targets, assignmentsByGroup]);

  const activeTarget = useMemo(() => targets.find((t) => t.key === activeTargetKey) || null, [targets, activeTargetKey]);

  const getAssignedForTarget = useCallback(
    (t) => {
      if (!t) return [];
      const gid = t.groupId;
      const typ = t.groupType;
      const list = assignmentsByGroup?.[gid]?.[typ] || [];
      return Array.isArray(list) ? list : [];
    },
    [assignmentsByGroup]
  );

  const setAssignedForTarget = useCallback(
    (t, nextList) => {
      if (!t) return;
      const gid = String(t.groupId);
      const typ = t.groupType;
      const clean = (Array.isArray(nextList) ? nextList : [])
        .map((s) => ({
          day: String(s?.day || '').trim(),
          sessionId: String(s?.sessionId || s?.session || '').trim().toUpperCase(),
        }))
        .filter((s) => s.day && s.sessionId);

      setForm((f) => {
        const cur = f?.availability_assignments_by_group && typeof f.availability_assignments_by_group === 'object' ? f.availability_assignments_by_group : {};
        const prevGroup = cur[gid] && typeof cur[gid] === 'object' ? cur[gid] : {};
        const nextGroup = {
          THEORY: Array.isArray(prevGroup.THEORY) ? prevGroup.THEORY : [],
          LAB: Array.isArray(prevGroup.LAB) ? prevGroup.LAB : [],
          [typ]: clean,
        };
        return {
          ...f,
          availability_assignments_by_group: {
            ...cur,
            [gid]: nextGroup,
          },
        };
      });
    },
    [setForm]
  );

  const toggleSessionGrouped = useCallback(
    (day, sessionId) => {
      if (!activeTarget) return;
      const d = String(day || '').trim();
      const sid = String(sessionId || '').trim().toUpperCase();
      if (!d || !sid) return;
      const slotKey = `${d}|${sid}`;

      const assignedToSet = slotToTarget.get(slotKey);
      const isAssignedToActive = !!(assignedToSet && assignedToSet.has(activeTarget.key));
      const hasOtherOwners = !!(assignedToSet && (assignedToSet.size > (isAssignedToActive ? 1 : 0)));

      // Slot reuse rules:
      // - Lab never shares
      // - Theory 15h may share with other THEORY groups (optional, user-driven)
      // - Theory 30h may not share
      if (hasOtherOwners) {
        const owners = Array.from(assignedToSet || []);
        const hasLabOwner = owners.some((k) => String(k).endsWith('|LAB'));
        if (hasLabOwner) return;

        const allTheory = owners.every((k) => String(k).endsWith('|THEORY'));
        const canShareTheorySlot =
          activeTarget.groupType === 'THEORY' && allowTheorySlotSharing && allTheory;
        if (!canShareTheorySlot) return;
      }

      const current = getAssignedForTarget(activeTarget);
      const exists = current.some((s) => String(s?.day).trim() === d && String(s?.sessionId || s?.session || '').trim().toUpperCase() === sid);
      if (exists) {
        setAssignedForTarget(
          activeTarget,
          current.filter(
            (s) => !(String(s?.day).trim() === d && String(s?.sessionId || s?.session || '').trim().toUpperCase() === sid)
          )
        );
        return;
      }

      const max = Number.isFinite(activeTarget.max) ? activeTarget.max : 1;
      if (current.length >= max) return;

      setAssignedForTarget(activeTarget, [...current, { day: d, sessionId: sid }]);
    },
    [
      activeTarget,
      slotToTarget,
      getAssignedForTarget,
      setAssignedForTarget,
      theoryHours,
      allowTheorySlotSharing,
    ]
  );

  const clearAvailabilityGrouped = useCallback(() => {
    setForm((f) => ({ ...f, availability_assignments_by_group: {} }));
  }, [setForm]);

  const validation = useMemo(() => {
    if (!hasGroupTargets) return { isComplete: !!availabilitySummaryLegacy, errors: [] };
    const errs = [];
    const pluralize = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

    // Ensure each target count is within [min,max]
    for (const t of targets) {
      const count = getAssignedForTarget(t).length;
      const min = Number.isFinite(t.min) ? t.min : 1;
      const max = Number.isFinite(t.max) ? t.max : min;
      if (count < min || count > max) {
        if (min === max) {
          errs.push(`${t.label}: select exactly ${pluralize(min, 'session')}.`);
        } else {
          errs.push(`${t.label}: select ${min}–${max} sessions.`);
        }
      }
    }

    // ensure no slot is reused across different targets, except Theory 15h sharing between theory groups
    for (const [slotKey, set] of slotToTarget.entries()) {
      if (!set || set.size <= 1) continue;
      const owners = Array.from(set);
      const allTheory = owners.every((k) => String(k).endsWith('|THEORY'));
      if (allTheory && allowTheorySlotSharing) continue;
      errs.push('A session cannot be assigned to more than one group.');
      break;
    }
    return { isComplete: errs.length === 0 && targets.length > 0, errors: errs };
  }, [
    hasGroupTargets,
    targets,
    getAssignedForTarget,
    slotToTarget,
    availabilitySummaryLegacy,
    allowTheorySlotSharing,
  ]);

  const availabilitySummary = useMemo(() => {
    if (!hasGroupTargets) return availabilitySummaryLegacy;
    const totalTargets = targets.length;
    const completeTargets = targets.filter((t) => {
      const c = getAssignedForTarget(t).length;
      const min = Number.isFinite(t.min) ? t.min : 1;
      const max = Number.isFinite(t.max) ? t.max : min;
      return c >= min && c <= max;
    }).length;
    if (!totalTargets) return '';
    return `${completeTargets}/${totalTargets} groups configured`;
  }, [hasGroupTargets, targets, getAssignedForTarget, availabilitySummaryLegacy]);

  const getSlotTag = useCallback(
    (day, sessionId) => {
      const d = String(day || '').trim();
      const sid = String(sessionId || '').trim().toUpperCase();
      const key = `${d}|${sid}`;
      const targetKeys = slotToTarget.get(key);
      if (!targetKeys || targetKeys.size === 0) return '';
      const owners = Array.from(targetKeys);
      if (owners.length > 1) {
        const allTheory = owners.every((k) => String(k).endsWith('|THEORY'));
        if (allTheory && allowTheorySlotSharing) return `T Shared (${owners.length})`;
      }

      const firstKey = owners[0];
      const t = targets.find((x) => x.key === firstKey);
      if (!t) return '';
      const short = t.groupType === 'THEORY' ? 'T' : 'L';
      return `${short} ${groupNameById[String(t.groupId)] || `G${t.groupId}`}`;
    },
    [slotToTarget, targets, groupNameById, allowTheorySlotSharing]
  );

  useEffect(() => {
    if (availabilityOpen) updatePosition(availBtnRef);
  }, [availabilityOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) setAvailabilityOpen(false);
  }, [isOpen]);

  useEffect(() => {
    function onWinChange() {
      if (availabilityOpen) updatePosition(availBtnRef);
    }
    window.addEventListener('resize', onWinChange);
    window.addEventListener('scroll', onWinChange, true);
    return () => {
      window.removeEventListener('resize', onWinChange);
      window.removeEventListener('scroll', onWinChange, true);
    };
  }, [availabilityOpen, updatePosition]);

  return {
    DAY_OPTIONS,
    SESSION_OPTIONS,
    idToTime,
    popoverStyle,
    updatePosition,
    availabilityOpen,
    setAvailabilityOpen,
    availBtnRef,

    // legacy
    availabilityMap,
    toggleSessionLegacy,
    clearAvailabilityLegacy,

    // grouped
    hasGroupTargets,
    targets,
    activeTargetKey,
    setActiveTargetKey,
    activeTarget,
    getAssignedForTarget,
    toggleSessionGrouped,
    clearAvailabilityGrouped,
    validation,
    availabilitySummary,
    getSlotTag,
    slotToTarget,

    // flags
    theoryHours,
    allowTheorySlotSharing,
  };
}
