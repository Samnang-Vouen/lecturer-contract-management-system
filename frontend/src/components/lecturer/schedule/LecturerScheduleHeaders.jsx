import { CalendarDays, FileText } from "lucide-react";
import { Button } from "@headlessui/react";

export default function LecturerScheduleHeader() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
            <CalendarDays className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
              Schedule Generation
            </h1>
            <p className="text-gray-600">Generate PDF Schedules</p>
          </div>
        </div>
        <div>
        </div>
      </div>
    </div>
  );
}
