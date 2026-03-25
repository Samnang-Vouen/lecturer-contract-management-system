import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Users,
} from "lucide-react";

const DETAIL_FIELDS = [
  { key: "group", label: "Group" },
  { key: "course", label: "Course" },
  { key: "room", label: "Room" },
];

const SESSION_BADGE = {
  theory: {
    label: "Theory",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  lab: {
    label: "Lab",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};

export default function ScheduleTable({
  days = [],
  timeSlots = [],
  grid = {},
  specialSlots = {},
  groupName = '-',
  loading = false,
  error = '',
  onBack,
}) {
  const totalEntries = days.reduce(
    (count, day) =>
      count +
      timeSlots.reduce(
        (slotCount, slot) => slotCount + (grid?.[day]?.[slot]?.length || 0),
        0
      ),
    0
  );

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_70px_-40px_rgba(15,23,42,0.35)]">
      <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.22),_transparent_36%),linear-gradient(135deg,_#eff6ff_0%,_#ffffff_45%,_#f8fafc_100%)] px-4 py-5 md:px-6 md:py-6">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-3">
              {onBack ? (
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
              ) : null}

              <div>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                  {groupName}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                  Review the generated timetable by day and time slot.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                <Users className="h-4 w-4 text-blue-600" />
                Sessions
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{totalEntries}</p>
              <p className="mt-1 text-sm text-slate-500">Lecturer assignments in the grid</p>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="mx-4 mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 md:mx-6 md:mt-6">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="px-4 py-12 text-center text-sm text-slate-500 md:px-6">
          Loading schedule...
        </div>
      ) : null}

      <div className="px-4 pb-4 pt-4 md:px-6 md:pb-6">
        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50/70">
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-[132px] border-b border-r border-slate-200 bg-slate-100 px-4 py-4 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                Time
              </th>
              {days.map((day) => (
                <th
                  key={day}
                  className="border-b border-r border-slate-200 bg-slate-100 px-4 py-4 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 last:border-r-0"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((slot) => (
              <tr key={slot} className="align-stretch">
                <td className="sticky left-0 z-[1] whitespace-nowrap border-b border-r border-slate-200 bg-white px-4 py-5 text-center align-middle text-sm font-semibold text-slate-700">
                  {slot}
                </td>

                {specialSlots[slot] ? (
                  <td
                    colSpan={days.length}
                    className="border-b border-slate-200 bg-amber-50/80 px-4 py-5 text-center align-middle text-sm font-medium text-amber-800"
                  >
                    {specialSlots[slot]}
                  </td>
                ) : (
                  days.map((day) => {
                    const entries = grid?.[day]?.[slot] || [];
                    return (
                      <td
                        key={day}
                        className="min-w-[220px] border-b border-r border-slate-200 bg-white p-3 align-top last:border-r-0"
                      >
                        {entries.length > 0 ? (
                          <div className="space-y-3">
                            {entries.map((entry, index) => (
                              <div
                                key={entry.id || `${slot}-${day}-${index}`}
                                className="rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,_rgba(248,250,252,0.95)_0%,_rgba(255,255,255,1)_100%)] p-4 shadow-sm"
                              >
                                <div className="space-y-3">
                                  <div className="flex justify-end">
                                    <span
                                      className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${SESSION_BADGE[entry?.sessionKind]?.className || "bg-slate-100 text-slate-600 border-slate-200"}`}
                                    >
                                      {SESSION_BADGE[entry?.sessionKind]?.label || "Session"}
                                    </span>
                                  </div>

                                  {getSessionDetails(entry).map(({ key, label, fallback }) => (
                                    <div
                                      key={key}
                                      className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 text-sm text-slate-600"
                                    >
                                      <span className="font-semibold text-slate-700">
                                        {label}:
                                      </span>
                                      <span className="break-words text-slate-900">
                                        {getDisplayValue(entry?.[key], fallback)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex h-full min-h-[132px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
                            No session scheduled
                          </div>
                        )}
                      </td>
                    );
                  })
                )}
              </tr>
            ))}
          </tbody>
        </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function getSessionDetails(entry) {
  const fields = [...DETAIL_FIELDS];

  if (entry?.sessionKind === "lab") {
    fields.splice(2, 0, { key: "lab", label: "Lab" });
  } else if (entry?.sessionKind === "theory") {
    fields.splice(2, 0, { key: "theory", label: "Theory" });
  }

  return fields.filter(({ key, fallback = "" }) =>
    Boolean(getDisplayValue(entry?.[key], fallback))
  );
}

function getDisplayValue(value, fallback = "") {
  const normalized = String(value ?? "").trim();
  if (!normalized || normalized === "-") {
    return fallback;
  }

  return normalized;
}
