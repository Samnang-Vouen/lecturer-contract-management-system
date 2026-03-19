import LecturerScheduleHeader from "../../components/lecturer/schedule/LecturerScheduleHeaders";
import ScheduleTable from "../../components/lecturer/schedule/Table";
import { useLecturerSchedule } from "../../hooks/lecturer/schedule/useLecturerSchedule";
import { useLecturerSchedulesList } from "../../hooks/lecturer/schedule/useLecturerSchedulesList";
import { useParams, useNavigate } from "react-router-dom";
import { CalendarDays, Loader, AlertCircle } from "lucide-react";

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
  return <ScheduleDetailView scheduleId={scheduleId} />;
}

function ScheduleListView({ onSelectSchedule }) {
  const { schedules, loading, error } = useLecturerSchedulesList();

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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {schedules.map((schedule) => (
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
              className="text-left rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-blue-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <div className="space-y-3">
                {/* Group Name */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Group
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {schedule?.Group?.name || "-"}
                  </p>
                </div>

                {/* Class Name */}
                {schedule?.Group?.Class?.name && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Class
                    </p>
                    <p className="text-sm text-gray-700">
                      {schedule.Group.Class.name}
                    </p>
                  </div>
                )}

                {/* Specialization */}
                {schedule?.Group?.Class?.Specialization?.name && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Specialization
                    </p>
                    <p className="text-sm text-gray-700">
                      {schedule.Group.Class.Specialization.name}
                    </p>
                  </div>
                )}

                {/* Start Date */}
                {schedule?.start_date && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Start Date
                    </p>
                    <p className="text-sm text-gray-700">
                      {new Date(schedule.start_date).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {/* Student Count */}
                {schedule?.Group?.num_of_student && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Students
                    </p>
                    <p className="text-sm text-gray-700">
                      {schedule.Group.num_of_student}
                    </p>
                  </div>
                )}

                {/* View Button */}
                <button className="mt-4 w-full rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  View Schedule
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ScheduleDetailView({ scheduleId }) {
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
      />
    </div>
  );
}
