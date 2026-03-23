import React from "react";
import { CalendarCheck, Loader2, MapPin, User } from "lucide-react";
import {
  getPreviewDateText,
  weekDays,
} from "../../../utils/scheduleCreation";

function countScheduledSessions(previewTimeSlots, previewCells) {
  return previewTimeSlots.reduce((total, slot) => {
    return total + weekDays.reduce((slotTotal, day) => {
      const cellItems = previewCells?.[slot]?.[day];
      return slotTotal + (Array.isArray(cellItems) ? cellItems.length : 0);
    }, 0);
  }, 0);
}

export default function SchedulePreviewPanel({
  previewGroupName,
  previewStartTerm,
  previewEndTerm,
  isPreviewLoading,
  previewTimeSlots,
  previewCells,
}) {
  const scheduledSessions = countScheduledSessions(previewTimeSlots, previewCells);
  const totalCells = previewTimeSlots.length * weekDays.length;

  return (
    <section className="flex flex-col bg-white">
      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-blue-50/50 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Schedule Preview</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Weekly teaching schedule</h2>
            <p className="mt-1 text-sm text-slate-500">Review scheduled sessions, lecturers, and room assignments before exporting.</p>
          </div>

          {previewGroupName ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Group</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{previewGroupName}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Scheduled</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{scheduledSessions} sessions</p>
              </div>
            </div>
          ) : null}
        </div>

        {previewGroupName ? (
          <div className="mt-4 inline-flex max-w-full rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
            <span className="truncate">{getPreviewDateText(previewStartTerm, previewEndTerm)}</span>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-400">{getPreviewDateText(previewStartTerm, previewEndTerm)}</p>
        )}
      </div>

      <div className="overflow-x-auto bg-slate-50/60 p-3 sm:p-4">
        {isPreviewLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-500 shadow-sm">
            <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-blue-500" />
            Loading preview…
          </div>
        ) : !previewGroupName ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-sm text-slate-400 shadow-sm">
            <CalendarCheck className="mx-auto mb-3 h-8 w-8 text-slate-300" />
            Select a group to preview its schedule.
          </div>
        ) : (
          <table className="w-full min-w-[900px] border-separate border-spacing-0 text-sm">
            <colgroup>
              <col style={{ width: "170px" }} />
              {weekDays.map((_, idx) => <col key={idx} style={{ width: "170px" }} />)}
            </colgroup>
            <thead>
              <tr className="text-slate-600">
                <th className="rounded-tl-2xl border border-slate-200 bg-slate-900 px-4 py-4 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-100">Time</th>
                {weekDays.map((day) => (
                  <th
                    key={day}
                    className="border border-slate-200 bg-slate-900 px-4 py-4 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-100 last:rounded-tr-2xl"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {previewTimeSlots.map((slot, rowIndex) => (
                <tr key={slot} className="align-top">
                  <td className="border border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs font-semibold text-slate-600">
                    <div className="flex min-h-[104px] items-center justify-center">
                      <p className="text-sm font-semibold text-slate-800">{slot}</p>
                    </div>
                  </td>
                  {weekDays.map((day) => {
                    const cell = previewCells?.[slot]?.[day];
                    const hasEntries = Array.isArray(cell) && cell.length > 0;

                    return (
                      <td
                        key={`${slot}-${day}`}
                        className={`h-32 border border-slate-200 px-3 py-3 align-top ${
                          !hasEntries && rowIndex % 2 === 0 ? "bg-slate-50/50" : "bg-white"
                        }`}
                      >
                        {hasEntries ? (
                          <div className="space-y-2.5 text-slate-700">
                            {cell.map((item, idx) => (
                              <div
                                key={idx}
                                className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-50 px-3 py-3 shadow-sm"
                              >
                                <div className="mb-2 flex items-center justify-between gap-2">
                                  <span
                                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                      item.sessionType === "LAB"
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-emerald-100 text-emerald-700"
                                    }`}
                                  >
                                    {item.sessionType === "LAB" ? "Lab" : "Theory"}
                                  </span>
                                </div>
                                <p className="text-xs font-bold leading-snug text-slate-900">{item.course}</p>

                                <div className="mt-2 space-y-1.5 text-[11px] text-slate-600">
                                  <div className="flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5 text-slate-400" />
                                    <span className="font-medium text-slate-600">{item.teacher}</span>
                                  </div>

                                  {item.room ? (
                                    <div className="flex items-center gap-1.5 text-blue-700">
                                      <MapPin className="h-3.5 w-3.5 text-blue-500" />
                                      <span className="font-semibold">{item.room}</span>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex h-full min-h-[104px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 text-center">
                            <span className="text-[11px] font-medium uppercase tracking-wide text-slate-300">No session</span>
                          </div>
                        )}
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