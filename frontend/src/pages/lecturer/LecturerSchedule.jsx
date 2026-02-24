import LecturerScheduleHeader from "../../components/lecturer/schedule/LecturerScheduleHeaders";
import ScheduleTable from "../../components/lecturer/schedule/Table";

export default function LecturerSchedule() {
    return (
        <div className="space-y-4">
            <LecturerScheduleHeader />
            <ScheduleTable />
        </div>
    );
}