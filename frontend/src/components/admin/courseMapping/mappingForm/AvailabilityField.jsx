import React from 'react';
import AvailabilityPopover from '../AvailabilityPopover.jsx';

export default function AvailabilityField({
  availabilityOpen,
  setAvailabilityOpen,
  availBtnRef,
  updatePosition,
  popoverStyle,
  DAY_OPTIONS,
  SESSION_OPTIONS,
  idToTime,
  availabilitySummary,
  hasGroupTargets,
  targets,
  activeTargetKey,
  setActiveTargetKey,
  activeTarget,
  getAssignedForTarget,
  toggleSessionGrouped,
  clearAvailabilityGrouped,
  validation,
  getSlotTag,
  slotToTarget,
  allowTheorySlotSharing,

  // legacy fallback
  availabilityMap,
  toggleSessionLegacy,
  clearAvailabilityLegacy,
}) {
  return (
    <div className="flex flex-col min-w-0">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Availability <span className="text-red-500" aria-hidden="true">*</span>
      </label>
      <div className="relative">
        <button
          ref={availBtnRef}
          type="button"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left text-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[3rem]"
          aria-haspopup="dialog"
          aria-expanded={availabilityOpen}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            updatePosition(availBtnRef);
            setAvailabilityOpen((v) => !v);
          }}
        >
          <span className="whitespace-pre-wrap break-words leading-snug text-gray-700">
            {availabilitySummary || <span className="text-gray-500">Choose Availability</span>}
          </span>
        </button>
        <AvailabilityPopover
          isOpen={availabilityOpen}
          onClose={() => setAvailabilityOpen(false)}
          triggerRef={availBtnRef}
          popoverStyle={popoverStyle}
          DAY_OPTIONS={DAY_OPTIONS}
          SESSION_OPTIONS={SESSION_OPTIONS}
          idToTime={idToTime}

          hasGroupTargets={hasGroupTargets}
          targets={targets}
          activeTargetKey={activeTargetKey}
          setActiveTargetKey={setActiveTargetKey}
          activeTarget={activeTarget}
          getAssignedForTarget={getAssignedForTarget}
          onToggleSessionGrouped={toggleSessionGrouped}
          onClearGrouped={clearAvailabilityGrouped}
          validation={validation}
          getSlotTag={getSlotTag}
          slotToTarget={slotToTarget}
          allowTheorySlotSharing={allowTheorySlotSharing}

          availabilityMap={availabilityMap}
          onToggleSessionLegacy={toggleSessionLegacy}
          onClearLegacy={clearAvailabilityLegacy}
        />
      </div>
    </div>
  );
}
