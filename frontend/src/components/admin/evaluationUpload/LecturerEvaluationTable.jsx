import { Loader2, Users } from "lucide-react";
import { formatScore } from "../../../utils/evaluationUpload/common";

export default function LecturerEvaluationTable({ visibleRows, rows, isLoading, maxGroupColumns }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-slate-900">Lecturer List ({visibleRows.length})</h2>
        </div>
        <p className="text-sm text-slate-500">{visibleRows.length} of {rows.length} shown</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-slate-600">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Term</th>
                <th className="px-4 py-3 font-semibold">Course</th>
                {Array.from({ length: maxGroupColumns }).map((_, index) => <th key={`group-col-${index}`} className="px-4 py-3 font-semibold">Group</th>)}
                <th className="px-4 py-3 font-semibold">Total Point</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {isLoading ? (
                <tr><td colSpan={maxGroupColumns + 4} className="px-4 py-10 text-center text-slate-500"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />Loading lecturers...</td></tr>
              ) : visibleRows.length === 0 ? (
                <tr><td colSpan={maxGroupColumns + 4} className="px-4 py-10 text-center text-slate-500">No lecturers found.</td></tr>
              ) : (
                visibleRows.map((row) => (
                  <tr key={row.key} className="text-slate-700">
                    <td className="px-4 py-3"><div className="font-semibold text-slate-900">{row.lecturerName}</div>{row.lecturerEmail ? <div className="text-xs text-slate-500">{row.lecturerEmail}</div> : null}</td>
                    <td className="px-4 py-3">{row.term}</td>
                    <td className="px-4 py-3">{row.course}</td>
                    {Array.from({ length: maxGroupColumns }).map((_, index) => {
                      const groupName = row.groupNames[index];
                      const score = groupName && row.groupScoreByName ? row.groupScoreByName[groupName] : null;
                      return <td key={`${row.key}-group-${index}`} className="px-4 py-3">{groupName ? <div className="leading-tight"><div>{groupName}</div><div className="text-slate-500">{formatScore(score)}</div></div> : "-"}</td>;
                    })}
                    <td className="px-4 py-3 font-semibold text-slate-900">{formatScore(row.totalPoint)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}