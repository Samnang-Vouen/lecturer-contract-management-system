import { toArray } from "../../../utils/evaluationUpload/common";

export default function UploadResultPanel({ uploadResult }) {
  if (!uploadResult) return null;

  const lecturerSummaryText = Array.isArray(uploadResult?.lecturer_assignments) && uploadResult.lecturer_assignments.length > 0
    ? uploadResult.lecturer_assignments.map((assignment) => assignment?.lecturer_name).filter(Boolean).join(", ")
    : Array.isArray(uploadResult?.lecturer_names) && uploadResult.lecturer_names.length > 0
      ? uploadResult.lecturer_names.join(", ")
      : typeof uploadResult?.lecturers === "string" && uploadResult.lecturers.trim()
        ? uploadResult.lecturers
        : typeof uploadResult?.lecturer_count === "number"
          ? String(uploadResult.lecturer_count)
          : "No data found";

  const processedGroupsText = toArray(uploadResult?.processed_groups).length > 0
    ? uploadResult.processed_groups.join(", ")
    : "No data found";

  const displayValue = (value) => (value === null || value === undefined || value === "" ? "No data found" : value);
  const detailRows = [
    ["Evaluation ID", displayValue(uploadResult.evaluation_id || uploadResult.id)],
    ["Course Mapping ID", displayValue(uploadResult.course_mapping_id)],
    ["Course", displayValue(uploadResult.course)],
    ["Class", displayValue(uploadResult.class)],
    ["Academic Year", displayValue(uploadResult.academic_year)],
    ["Specialization", displayValue(uploadResult.specialization)],
    ["Department", displayValue(uploadResult.department)],
    ["Total Submissions", displayValue(uploadResult.total_submissions)],
    ["Processed Groups", processedGroupsText],
    ["Lecturers", lecturerSummaryText],
  ];

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-emerald-950 shadow-sm">
      <p className="text-base font-semibold">Evaluation uploaded successfully</p>
      <div className="mt-3 space-y-2 text-sm">
        {detailRows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[132px_minmax(0,1fr)] gap-3 rounded-xl bg-white/60 px-3 py-2">
            <span className="font-semibold text-emerald-950">{label}</span>
            <span className="break-words text-slate-800">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}