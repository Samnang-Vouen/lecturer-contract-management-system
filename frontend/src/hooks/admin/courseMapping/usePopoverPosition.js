import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to manage popover positioning relative to a trigger button
 */
export function usePopoverPosition() {
  const [popoverStyle, setPopoverStyle] = useState({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: 0,
    placement: 'above',
  });

  const computePopover = useCallback((btn) => {
    if (!btn) return { top: 0, left: 0, width: 0, maxHeight: 0, placement: 'above' };
    
    const rect = btn.getBoundingClientRect();
    const padding = 8;
    const width = Math.min(640, Math.floor(window.innerWidth * 0.9));
    let left = Math.max(padding, Math.min(rect.left, window.innerWidth - width - padding));
    const availableAbove = Math.max(0, rect.top - 2 * padding);
    const top = Math.max(padding, rect.top - padding);
    const maxHeight = Math.min(Math.max(120, availableAbove), Math.floor(window.innerHeight * 0.9));
    
    return { top, left, width, maxHeight, placement: 'above' };
  }, []);

  const updatePosition = useCallback((btnRef) => {
    if (btnRef?.current) {
      setPopoverStyle(computePopover(btnRef.current));
    }
  }, [computePopover]);

  return {
    popoverStyle,
    setPopoverStyle,
    computePopover,
    updatePosition,
  };
}
