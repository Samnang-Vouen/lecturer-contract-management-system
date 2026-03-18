import LecturerScheduleHeader from "../../components/lecturer/schedule/LecturerScheduleHeaders";
import ScheduleTable from "../../components/lecturer/schedule/Table";
import { useLecturerSchedule } from "../../hooks/lecturer/schedule/useLecturerSchedule";

export default function LecturerSchedule() {
    const { days, timeSlots, grid, specialSlots, groupName, generatedCount, loading, error } = useLecturerSchedule();

    return (
        <div className="space-y-4">
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