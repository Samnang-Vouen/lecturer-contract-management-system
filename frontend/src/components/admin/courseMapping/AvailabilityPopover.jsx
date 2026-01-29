import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * AvailabilityPopover - Multi-day, multi-session availability selector
 */
export default function AvailabilityPopover({
  isOpen,
  onClose,
  triggerRef,
  popoverStyle,
  availabilityMap,
  onToggleSession,
  onClear,
  DAY_OPTIONS,
  SESSION_OPTIONS,
  idToTime,
}) {
  const popoverRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    function onDocPointerDown(e) {
      const btn = triggerRef?.current;
      const pop = popoverRef.current;
      if (btn && (e.target === btn || btn.contains(e.target))) return;
      if (pop && (e.target === pop || pop.contains(e.target))) return;
      onClose();
    }

    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }

    document.addEventListener('pointerdown', onDocPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDocPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen, triggerRef, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={popoverRef}
      className="z-[100]"
      style={{
        position: 'fixed',
        top: popoverStyle.top,
        left: popoverStyle.left,
        width: popoverStyle.width,
        transform: popoverStyle.placement === 'above' ? 'translateY(-100%)' : 'none',
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
      }}
    >
      <div
        className="overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg p-4"
        style={{ maxHeight: popoverStyle.maxHeight }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="font-medium text-gray-900">Select Availability</div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DAY_OPTIONS.map((day) => (
            <div key={day} className="border border-gray-200 rounded-md">
              <div className="px-3 py-2 border-b bg-gray-50 text-sm font-medium text-gray-700">{day}</div>
              <div className="p-2 flex flex-wrap gap-2">
                {SESSION_OPTIONS.map((s) => {
                  const active = !!(availabilityMap.get(day) && availabilityMap.get(day).has(s.id));
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        onToggleSession(day, s.id);
                      }}
                      onPointerUp={(e) => {
                        if (e.pointerType && e.pointerType !== 'mouse') {
                          onToggleSession(day, s.id);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          onToggleSession(day, s.id);
                        }
                      }}
                      className={`px-3 py-2 rounded-full border text-xs font-medium transition-colors text-center ${
                        active
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                      aria-pressed={active}
                      title={s.time}
                    >
                      <span className="block leading-tight">{s.label}</span>
                      <span
                        className={`block leading-tight text-[10px] ${active ? 'text-white/90' : 'text-gray-500'}`}
                      >
                        {(s.time || '').replace(/\s*–\s*/, '-')}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="px-3 pb-2 text-[11px] text-gray-500">
                {Array.from(availabilityMap.get(day) || [])
                  .sort()
                  .map((id) => idToTime[id] || id)
                  .join(', ') || 'No sessions'}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-2 text-[11px] text-gray-500">
          Sessions: S1 (08:00–09:30), S2 (09:50–11:30), S3 (12:10–13:40), S4 (13:50–15:20), S5 (15:30–17:00)
        </div>
      </div>
    </div>,
    document.body
  );
}
