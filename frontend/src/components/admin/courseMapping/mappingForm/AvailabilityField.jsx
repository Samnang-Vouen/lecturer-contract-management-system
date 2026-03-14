import React from 'react';
import AvailabilityPopover from '../AvailabilityPopover.jsx';

export default function AvailabilityField({
  availabilityOpen,
  setAvailabilityOpen,
  availBtnRef,
  updatePosition,
  popoverStyle,
  availabilityMap,
  toggleSession,
  clearAvailability,
  DAY_OPTIONS,
  SESSION_OPTIONS,
  idToTime,
  availabilitySummary,
  form,
  setForm,
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
          availabilityMap={availabilityMap}
          onToggleSession={toggleSession}
          onClear={clearAvailability}
          DAY_OPTIONS={DAY_OPTIONS}
          SESSION_OPTIONS={SESSION_OPTIONS}
          idToTime={idToTime}
        />
      </div>
      <input
        id="mappingAvailability"
        name="availability"
        value={form.availability}
        onChange={(e) => setForm((f) => ({ ...f, availability: e.target.value }))}
        className="sr-only"
        readOnly
      />
    </div>
  );
}
