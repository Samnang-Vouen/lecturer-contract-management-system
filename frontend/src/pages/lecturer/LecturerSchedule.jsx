import LecturerScheduleHeader from "../../components/lecturer/schedule/LecturerScheduleHeaders";
import ScheduleTable from "../../components/lecturer/schedule/Table";
import { useLecturerSchedule } from "../../hooks/lecturer/schedule/useLecturerSchedule";
import { useLecturerSchedulesList } from "../../hooks/lecturer/schedule/useLecturerSchedulesList";
import { useParams, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Loader,
  AlertCircle,
  ArrowRight,
  BookOpen,
  GraduationCap,
  Users,
} from "lucide-react";

export default function LecturerSchedule() {
  const { scheduleId } = useParams();
  const navigate = useNavigate();

  // If no scheduleId, show list view
  if (!scheduleId) {
    return (
      <ScheduleListView
        onSelectSchedule={(id) => navigate(`/lecturer/schedule/${id}`)}
      />
    );
  }

  // If scheduleId provided, show detail view
  return (
    <ScheduleDetailView
      scheduleId={scheduleId}
      onBack={() => navigate("/lecturer/schedule")}
    />
  );
}

function ScheduleListView({ onSelectSchedule }) {
  const { schedules, loading, error } = useLecturerSchedulesList();
  const formatScheduleDate = (value) =>
    value ? new Date(value).toLocaleDateString() : "Not set";

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <LecturerScheduleHeader />

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Loading schedules...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && schedules.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <CalendarDays className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <p className="text-gray-600">No schedules available</p>
          <p className="text-sm text-gray-500 mt-1">
            Check back later or contact your administrator
          </p>
        </div>
      )}

      {/* Schedules Grid */}
      {!loading && !error && schedules.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {schedules.map((schedule) => {
            const scheduleMeta = [
              {
                label: "Class",
                value: schedule?.Group?.Class?.name,
                Icon: BookOpen,
              },
              {
                label: "Specialization",
                value: schedule?.Group?.Class?.Specialization?.name || "N/A",
                Icon: GraduationCap,
              },
              {
                label: "Start Term",
                value: formatScheduleDate(schedule?.Group?.Class?.start_term),
                Icon: CalendarDays,
              },
              {
                label: "End Term",
                value: formatScheduleDate(schedule?.Group?.Class?.end_term),
                Icon: CalendarDays,
              },
              {
                label: "Students",
                value: schedule?.Group?.num_of_student,
                Icon: Users,
              },
            ].filter(
              ({ value }) =>
                value !== undefined && value !== null && value !== ""
            );

            return (
              <div
                key={schedule.id}
                onClick={() => onSelectSchedule(schedule.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectSchedule(schedule.id);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Open schedule for ${schedule?.Group?.name || "group"}`}
                className="group relative h-full overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-slate-50 to-blue-50/70 p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500" />

                <div className="flex h-full flex-col gap-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-100">
                        <CalendarDays className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-600">
                          Group
                        </p>
                        <p className="truncate text-xl font-bold text-gray-900">
                          {schedule?.Group?.name || "-"}
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full border border-blue-100 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700 shadow-sm">
                      Schedule
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {scheduleMeta.map(({ label, value, Icon }) => (
                      <div
                        key={label}
                        className="min-w-0 rounded-xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm"
                      >
                        <div className="flex min-w-0 items-start gap-2 text-[10px] font-semibold uppercase leading-tight tracking-[0.12em] text-gray-500 sm:text-[11px]">
                          <Icon className="h-4 w-4 shrink-0 text-blue-600 stroke-[2.25]" />
                          <span className="min-w-0 break-words">{label}</span>
                        </div>
                        <p className="mt-2 min-w-0 overflow-hidden break-words break-all text-sm font-medium leading-6 text-gray-800">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto flex items-center justify-between rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-white shadow-md shadow-blue-200 transition-all duration-200 group-hover:from-blue-500 group-hover:to-cyan-500">
                    <div>
                      <p className="text-sm font-semibold">View Schedule</p>
                      <p className="text-xs text-blue-100">
                        Open the generated timetable
                      </p>
                    </div>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/15 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:bg-white/20">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ScheduleDetailView({ scheduleId, onBack }) {
  const {
    days,
    timeSlots,
    grid,
    specialSlots,
    groupName,
    generatedCount,
    loading,
    error,
  } = useLecturerSchedule(scheduleId);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <LecturerScheduleHeader />
      <ScheduleTable
        days={days}
        timeSlots={timeSlots}
        grid={grid}
        specialSlots={specialSlots}
        groupName={groupName}
        generatedCount={generatedCount}
        loading={loading}
        error={error}
        onBack={onBack}
      />
    </div>
  );
}
