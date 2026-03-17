import React from "react";
import { CalendarCheck, Loader2 } from "lucide-react";
import {
  getPreviewDateText,
  weekDays,
} from "../../../utils/scheduleCreation";

export default function SchedulePreviewPanel({
  previewGroupName,
  previewStartTerm,
  previewEndTerm,
  isPreviewLoading,
  previewTimeSlots,
  previewCells,
}) {
  return (
    <section className="flex flex-col bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-xl font-semibold text-slate-900">Schedule Preview</h2>
        {previewGroupName ? (
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              {previewGroupName}
            </span>
            <span className="text-xs text-slate-500">{getPreviewDateText(previewStartTerm, previewEndTerm)}</span>
          </div>
        ) : (
          <p className="mt-0.5 text-sm text-slate-400">{getPreviewDateText(previewStartTerm, previewEndTerm)}</p>
        )}
      </div>

      <div className="overflow-x-auto">
        {isPreviewLoading ? (
          <div className="py-16 text-center text-sm text-slate-500">
            <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-blue-500" />
            Loading preview…
          </div>
        ) : !previewGroupName ? (
          <div className="py-16 text-center text-sm text-slate-400">
            <CalendarCheck className="mx-auto mb-3 h-8 w-8 text-slate-300" />
            Select a group on the left to preview its schedule.
          </div>
        ) : (
          <table className="w-full min-w-[860px] border-collapse text-sm">
            <colgroup>
              <col style={{ width: "160px" }} />
              {weekDays.map((_, idx) => <col key={idx} style={{ width: "160px" }} />)}
            </colgroup>
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="border border-slate-200 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide">Time</th>
                {weekDays.map((day) => (
                  <th
                    key={day}
                    className="border border-slate-200 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewTimeSlots.map((slot) => (
                <tr key={slot} className="align-top">
                  <td className="h-28 border border-slate-200 px-3 py-3 text-center text-xs font-semibold text-slate-600">{slot}</td>
                  {weekDays.map((day) => {
                    const cell = previewCells?.[slot]?.[day];
                    return (
                      <td key={`${slot}-${day}`} className="h-28 border border-slate-200 px-2 py-2 align-top">
                        {Array.isArray(cell) && cell.length > 0 ? (
                          <div className="mx-auto max-w-[150px] space-y-3 text-center text-slate-700">
                            {cell.map((item, idx) => (
                              <div key={idx} className="space-y-0.5">
                                <p className="text-xs font-bold leading-snug text-slate-800">{item.course}</p>
                                <p className="text-[11px] text-slate-500">{item.teacher}</p>
                                {item.room ? <p className="text-[11px] font-semibold text-blue-600">{item.room}</p> : null}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}