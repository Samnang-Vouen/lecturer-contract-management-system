import React from "react";
import { ArrowRight, FileText, GraduationCap, Loader2, Users } from "lucide-react";
import { getSpecializationName } from "../../../utils/scheduleCreation";

function compareGroupNames(leftGroup, rightGroup) {
  const leftName = String(leftGroup?.name || "").trim();
  const rightName = String(rightGroup?.name || "").trim();

  const leftMatch = leftName.match(/^(.*?)(?:[-\s]?G(\d+))?$/i);
  const rightMatch = rightName.match(/^(.*?)(?:[-\s]?G(\d+))?$/i);

  const leftPrefix = String(leftMatch?.[1] || leftName).trim();
  const rightPrefix = String(rightMatch?.[1] || rightName).trim();

  const prefixCompare = leftPrefix.localeCompare(rightPrefix, undefined, { numeric: true, sensitivity: "base" });
  if (prefixCompare !== 0) return prefixCompare;

  const leftNumber = Number.parseInt(leftMatch?.[2] || "", 10);
  const rightNumber = Number.parseInt(rightMatch?.[2] || "", 10);

  if (Number.isInteger(leftNumber) && Number.isInteger(rightNumber) && leftNumber !== rightNumber) {
    return leftNumber - rightNumber;
  }

  if (Number.isInteger(leftNumber)) return -1;
  if (Number.isInteger(rightNumber)) return 1;

  return leftName.localeCompare(rightName, undefined, { numeric: true, sensitivity: "base" });
}

export default function ScheduleGroupGrid({
  isLoading,
  visibleGroups,
  activeDownloadId,
  onPreviewGroup,
  openEmptyCellDialog,
}) {
  const orderedGroups = [...visibleGroups].sort(compareGroupNames);

  if (isLoading) {
    return (
      <div className="rounded-3xl border-2 border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
        <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin text-blue-500" />
        Loading groups...
      </div>
    );
  }

  if (visibleGroups.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400 shadow-sm">
        No groups found for the selected filters.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {orderedGroups.map((group) => {
        const isDownloading = activeDownloadId === `group-${group.id}`;
        const specializationName = getSpecializationName(group?.Class) || "Specialization unavailable";

        return (
          <article
            key={group.id}
            role="button"
            tabIndex={0}
            onClick={() => onPreviewGroup(group)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onPreviewGroup(group);
              }
            }}
            className="group relative flex h-full flex-col rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="min-w-0 pr-2">
                <div className="mb-3 flex items-center gap-3">
                  <div className="rounded-xl bg-blue-100 p-2.5">
                    <GraduationCap className="h-5 w-5 text-blue-600" />
                  </div>

                  <span className="inline-flex flex-shrink-0 items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    Preview
                  </span>
                </div>

                <p className="truncate text-lg font-bold text-slate-900 transition-colors group-hover:text-blue-600">
                  {group.name}
                </p>
                <p className="mt-1 truncate text-sm text-slate-500">{group?.Class?.name || "Class unavailable"}</p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-slate-400" />
                <span className="truncate">{specializationName}</span>
              </div>

              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-400" />
                <span>{group?.num_of_student || 0} students</span>
              </div>
            </div>

            <div className="mt-auto pt-6">
              <div className="mb-4 border-t border-slate-100" />

              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors group-hover:text-blue-700">
                Open preview
                <ArrowRight className="h-4 w-4" />
                </span>

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    openEmptyCellDialog("single", group);
                  }}
                  disabled={isDownloading}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  {isDownloading ? "Generating..." : "Generate PDF"}
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}