import React from 'react';

/**
 * TeachingTypeSelector - Dual selector for Theory (15h/30h) and Lab (30h) with group counts
 */
export default function TeachingTypeSelector({
  theorySelected,
  onTheorySelectedChange,
  theoryHour,
  onTheoryHourChange,
  theoryGroups,
  onTheoryGroupsChange,
  labSelected,
  onLabSelectedChange,
  labGroups,
  onLabGroupsChange,
}) {
  return (
    <div className="col-span-1 sm:col-span-2 flex flex-col gap-4">
      <span className="block text-sm font-medium text-gray-700">
        Teaching Type <span className="text-red-500" aria-hidden="true">*</span>
      </span>

      {/* Theories block */}
      <div
        className={`rounded-xl border transition-all shadow-sm ${
          theorySelected
            ? 'border-blue-400 ring-1 ring-blue-100 bg-blue-50/30'
            : 'border-gray-300 hover:border-blue-300'
        }`}
      >
        <div className="flex items-center justify-between p-3 sm:p-4 gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={theorySelected}
              onChange={(e) => onTheorySelectedChange(e.target.checked)}
            />
            <span
              aria-hidden
              className="h-4 w-4 rounded-[4px] border border-gray-300 bg-white grid place-content-center peer-focus:ring-2 peer-focus:ring-blue-500 peer-checked:bg-blue-600 peer-checked:border-blue-600"
            >
              <svg
                className="h-3 w-3 text-white opacity-0 peer-checked:opacity-100"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <span className="font-medium text-gray-900">Theory</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Hours</span>
            <div className="inline-flex overflow-hidden rounded-full border border-gray-300 shadow-sm">
              <button
                type="button"
                disabled={!theorySelected}
                aria-pressed={theoryHour === '15h'}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  theoryHour === '15h'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } ${!theorySelected ? 'opacity-60 cursor-not-allowed' : ''}`}
                onClick={() => onTheoryHourChange('15h')}
              >
                15h
              </button>
              <button
                type="button"
                disabled={!theorySelected}
                aria-pressed={theoryHour === '30h'}
                className={`px-3 py-1.5 text-sm transition-colors border-l border-gray-300 ${
                  theoryHour === '30h'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } ${!theorySelected ? 'opacity-60 cursor-not-allowed' : ''}`}
                onClick={() => onTheoryHourChange('30h')}
              >
                30h
              </button>
            </div>
          </div>
        </div>
        {theorySelected && (
          <div className="px-3 sm:px-4 pb-3 sm:pb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Theory groups</label>
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={theoryGroups}
                onChange={(e) => onTheoryGroupsChange(e.target.value)}
                className="block w-full h-10 border border-gray-300 rounded-md pl-3 pr-16 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. 2"
              />
              <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-gray-500">
                groups
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Labs block */}
      <div
        className={`rounded-xl border transition-all shadow-sm ${
          labSelected
            ? 'border-blue-400 ring-1 ring-blue-100 bg-blue-50/30'
            : 'border-gray-300 hover:border-blue-300'
        }`}
      >
        <div className="flex items-center justify-between p-3 sm:p-4 gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={labSelected}
              onChange={(e) => onLabSelectedChange(e.target.checked)}
            />
            <span
              aria-hidden
              className="h-4 w-4 rounded-[4px] border border-gray-300 bg-white grid place-content-center peer-focus:ring-2 peer-focus:ring-blue-500 peer-checked:bg-blue-600 peer-checked:border-blue-600"
            >
              <svg
                className="h-3 w-3 text-white opacity-0 peer-checked:opacity-100"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <span className="font-medium text-gray-900">Lab</span>
          </label>
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
            30h
          </span>
        </div>
        {labSelected && (
          <div className="px-3 sm:px-4 pb-3 sm:pb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Lab groups</label>
            <div className="relative">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={labGroups}
                onChange={(e) => onLabGroupsChange(e.target.value)}
                className="block w-full h-10 border border-gray-300 rounded-md pl-3 pr-16 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. 1"
              />
              <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-gray-500">
                groups
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
