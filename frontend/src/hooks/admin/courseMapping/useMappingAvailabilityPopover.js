import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAvailability } from './useAvailability.js';
import { usePopoverPosition } from './usePopoverPosition.js';

/**
 * Manages the Availability popover state + derived availability summary.
 * Keeps UI behavior consistent with the original MappingFormDialog implementation.
 */
export function useMappingAvailabilityPopover({ isOpen, availability, setForm }) {
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

  const availabilityMap = useMemo(() => parseAvailability(availability), [availability, parseAvailability]);
  const availabilitySummary = getAvailabilitySummary(availabilityMap);

  const toggleSession = useCallback(
    (day, sessionId) => {
      const current = parseAvailability(availability);
      const set = new Set(current.get(day) || []);
      if (set.has(sessionId)) set.delete(sessionId);
      else set.add(sessionId);
      if (set.size) current.set(day, set);
      else current.delete(day);
      setForm((f) => ({ ...f, availability: serializeAvailability(current) }));
    },
    [availability, parseAvailability, serializeAvailability, setForm]
  );

  const clearAvailability = useCallback(() => {
    setForm((f) => ({ ...f, availability: '' }));
  }, [setForm]);

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
    availabilityMap,
    availabilitySummary,
    availabilityOpen,
    setAvailabilityOpen,
    availBtnRef,
    popoverStyle,
    updatePosition,
    toggleSession,
    clearAvailability,
  };
}
