import React from "react";
import { CalendarCheck, FileText, Loader2 } from "lucide-react";

export default function ScheduleCreationHeader({
  isGenerateAllLoading,
  canGenerateAll,
  requiresSpecializationSelection,
  selectedSpecializationName,
  openEmptyCellDialog,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
            <CalendarCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Schedule Creation</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {requiresSpecializationSelection
                ? "Choose a specialization first, then fill the empty session dialog to generate PDFs"
                : canGenerateAll
                ? `Generate PDF schedules for ${selectedSpecializationName}`
                : "Generate PDF schedules for the available specialization"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => openEmptyCellDialog("all")}
          disabled={isGenerateAllLoading || !canGenerateAll}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-shrink-0"
        >
          {isGenerateAllLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          Generate Specialization PDFs
        </button>
      </div>
    </div>
  );
}