import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * AvailabilityPopover
 * - Group mode: assign sessions per Theory/Lab group with strict rules
 * - Legacy mode: multi-day, multi-session selector for a single availability string
 */
export default function AvailabilityPopover({
  isOpen,
  onClose,
  triggerRef,
  popoverStyle,
  DAY_OPTIONS,
  SESSION_OPTIONS,
  idToTime,

  // group mode
  hasGroupTargets,
  targets,
  activeTargetKey,
  setActiveTargetKey,
  activeTarget,
  getAssignedForTarget,
  onToggleSessionGrouped,
  onClearGrouped,
  validation,
  getSlotTag,
  slotToTarget,
  allowTheorySlotSharing,

  // legacy
  availabilityMap,
  onToggleSessionLegacy,
  onClearLegacy,
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

  const isComplete = !!validation?.isComplete;

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
          <div className="font-medium text-gray-900">{hasGroupTargets ? 'Assign Sessions by Group' : 'Select Availability'}</div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (hasGroupTargets) onClearGrouped?.();
                else onClearLegacy?.();
              }}
              className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Clear
            </button>
            <button
              type="button"
              disabled={hasGroupTargets ? !isComplete : false}
              onClick={(e) => {
                e.stopPropagation();
                if (hasGroupTargets && !isComplete) return;
                onClose();
              }}
              className={`text-xs px-2 py-1 rounded ${
                hasGroupTargets
                  ? isComplete
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Done
            </button>
          </div>
        </div>

        {hasGroupTargets ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1 border border-gray-200 rounded-md overflow-hidden">
              <div className="px-3 py-2 border-b bg-gray-50 text-sm font-medium text-gray-700">Groups</div>
              <div className="max-h-[22rem] overflow-auto">
                {(Array.isArray(targets) ? targets : []).map((t) => {
                  const count = (getAssignedForTarget?.(t) || []).length;
                  const min = Number.isFinite(t?.min) ? t.min : 1;
                  const max = Number.isFinite(t?.max) ? t.max : min;
                  const done = count >= min && count <= max;
                  const active = t.key === activeTargetKey;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setActiveTargetKey?.(t.key)}
                      className={`w-full px-3 py-2 text-left text-sm border-b last:border-b-0 flex items-center justify-between gap-2 ${
                        active ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <span className={`min-w-0 truncate ${active ? 'text-blue-800 font-medium' : 'text-gray-800'}`}>{t.label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                      >
                        {count}/{max}
                      </span>
                    </button>
                  );
                })}
                {(!targets || targets.length === 0) && (
                  <div className="px-3 py-2 text-sm text-gray-500">Select Theory/Lab groups first.</div>
                )}
              </div>
            </div>

            <div className="sm:col-span-2 border border-gray-200 rounded-md">
              <div className="px-3 py-2 border-b bg-gray-50 text-sm font-medium text-gray-700">
                {activeTarget ? activeTarget.label : 'Pick a group'}
              </div>
              <div className="p-3">
                {!activeTarget ? (
                  <div className="text-sm text-gray-500">Choose a group on the left.</div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {DAY_OPTIONS.map((day) => {
                      const currentCount = (getAssignedForTarget?.(activeTarget) || []).length;
                      const max = Number.isFinite(activeTarget?.max) ? activeTarget.max : 1;
                      return (
                        <div key={day} className="border border-gray-200 rounded-md">
                          <div className="px-3 py-2 border-b bg-gray-50 text-sm font-medium text-gray-700">{day}</div>
                          <div className="p-2 flex flex-wrap gap-2">
                            {SESSION_OPTIONS.map((s) => {
                              const slotKey = `${day}|${s.id}`;
                              const assignedTo = slotToTarget?.get?.(slotKey);
                              const isActive = !!(assignedTo && assignedTo.has && assignedTo.has(activeTargetKey));
                              const owners = assignedTo ? Array.from(assignedTo) : [];
                              const hasOwners = owners.length > 0;
                              const hasLabOwner = owners.some((k) => String(k).endsWith('|LAB'));
                              const allTheoryOwners = owners.length > 0 && owners.every((k) => String(k).endsWith('|THEORY'));

                              const treatTaken = (() => {
                                if (!hasOwners) return false;
                                if (isActive) return false;
                                if (hasLabOwner) return true;
                                // Theory 15h: allow sharing between theory groups (manual)
                                if (allowTheorySlotSharing && activeTarget?.groupType === 'THEORY' && allTheoryOwners) return false;
                                return true;
                              })();

                              const disabled = treatTaken || (!isActive && currentCount >= max);
                              const tag = getSlotTag?.(day, s.id);
                              return (
                                <button
                                  key={s.id}
                                  type="button"
                                  disabled={disabled}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    if (disabled) return;
                                    onToggleSessionGrouped?.(day, s.id);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (disabled) return;
                                      onToggleSessionGrouped?.(day, s.id);
                                    }
                                  }}
                                  className={`px-3 py-2 rounded-full border text-xs font-medium transition-colors text-center relative ${
                                    isActive
                                      ? 'bg-blue-600 text-white border-blue-600'
                                      : disabled
                                      ? 'bg-gray-50 text-gray-400 border-gray-200'
                                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                  }`}
                                  aria-pressed={isActive}
                                  title={s.time}
                                >
                                  <span className="block leading-tight">{s.label}</span>
                                  <span className={`block leading-tight text-[10px] ${isActive ? 'text-white/90' : disabled ? 'text-gray-300' : 'text-gray-500'}`}
                                  >
                                    {(s.time || '').replace(/\s*–\s*/, '-')}
                                  </span>
                                  {tag ? (
                                    <span className="mt-1 block text-[10px] leading-tight">
                                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'}`}
                                      >
                                        {tag}
                                      </span>
                                    </span>
                                  ) : null}
                                </button>
                              );
                            })}
                          </div>
                          <div className="px-3 pb-2 text-[11px] text-gray-500">
                            {(() => {
                              const list = (getAssignedForTarget?.(activeTarget) || []).filter((x) => String(x?.day) === String(day));
                              const ids = list.map((x) => String(x?.sessionId || x?.session || '').toUpperCase()).filter(Boolean).sort();
                              return ids.length ? ids.map((id) => idToTime?.[id] || id).join(', ') : 'No sessions';
                            })()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-2 text-[11px] text-gray-500">
                  Rule: Theory 15h = 1 session (can be combined across groups). Theory 30h = 1–2 sessions per group. Lab = 2 sessions per group. A slot can’t be reused with Lab, and can’t be reused across groups unless combining Theory 15h.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
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
                            onToggleSessionLegacy?.(day, s.id);
                          }}
                          onPointerUp={(e) => {
                            if (e.pointerType && e.pointerType !== 'mouse') {
                              onToggleSessionLegacy?.(day, s.id);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              onToggleSessionLegacy?.(day, s.id);
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
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
