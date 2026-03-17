import React from "react";
import { Loader2 } from "lucide-react";
import { safeArray } from "../../../utils/scheduleCreation";

export default function ScheduleCreationSidebar({
  isLoading,
  academicYearOptions,
  selectedAcademicYear,
  setSelectedAcademicYear,
  selectedSpecialization,
  setSelectedSpecialization,
  specializations,
  visibleGroups,
  previewGroupId,
  activeDownloadId,
  handlePreviewGroup,
  openEmptyCellDialog,
}) {
  return (
    <aside className="border-b border-slate-200 bg-slate-50 xl:border-b-0 xl:border-r">
      <div className="space-y-4 p-4">
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Filters</p>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Academic Year</label>
            <select
              value={selectedAcademicYear}
              onChange={(event) => setSelectedAcademicYear(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {academicYearOptions.map((year) => (
                <option key={year} value={year}>
                  {year === "all" ? "All Academic Years" : year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Specialization</label>
            <select
              value={selectedSpecialization}
              onChange={(event) => setSelectedSpecialization(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">All Specializations</option>
              {safeArray(specializations).map((spec) => (
                <option key={spec.id} value={String(spec.id)}>
                  {spec.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Groups
              {!isLoading && <span className="ml-1 font-normal normal-case text-slate-500">({visibleGroups.length})</span>}
            </p>
          </div>

          {isLoading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
              <Loader2 className="mx-auto mb-2 h-4 w-4 animate-spin text-blue-500" />
              Loading groups…
            </div>
          ) : visibleGroups.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-400">
              No groups found for the selected filters.
            </div>
          ) : (
            <div className="space-y-2">
              {visibleGroups.map((group) => {
                const isPreviewed = previewGroupId === group.id;
                const isDownloading = activeDownloadId === `group-${group.id}`;

                return (
                  <div
                    key={group.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handlePreviewGroup(group)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handlePreviewGroup(group);
                      }
                    }}
                    className={`cursor-pointer rounded-xl border p-3 transition-all focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                      isPreviewed
                        ? "border-blue-400 bg-blue-50 shadow-sm"
                        : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{group.name}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{group?.Class?.name || "Class unavailable"}</p>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-400">{group?.num_of_student || 0} students</span>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openEmptyCellDialog("single", group);
                        }}
                        disabled={isDownloading}
                        className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isDownloading ? "Generating…" : "Generate PDF"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}