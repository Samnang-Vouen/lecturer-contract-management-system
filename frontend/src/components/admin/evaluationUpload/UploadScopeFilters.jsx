import Select, { SelectItem } from "../../ui/Select";

export default function UploadScopeFilters({
  selectedAcademicYear,
  setSelectedAcademicYear,
  selectedClassId,
  setSelectedClassId,
  selectedTerm,
  setSelectedTerm,
  academicYearOptions,
  classOptions,
  termOptions,
  isUploading,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Evaluation Scope</h3>
          <p className="text-sm text-slate-500">Choose the academic context before assigning lecturers.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-800">Academic Year</label>
          <Select
            value={selectedAcademicYear}
            onValueChange={setSelectedAcademicYear}
            placeholder="Select academic year"
            disabled={isUploading}
            oneLine
            buttonClassName="h-11 rounded-lg border-slate-300 text-sm shadow-sm"
          >
            {academicYearOptions.map((academicYear) => (
              <SelectItem key={academicYear} value={academicYear}>{academicYear}</SelectItem>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-800">Class</label>
          <Select
            value={selectedClassId}
            onValueChange={setSelectedClassId}
            placeholder="Select class"
            disabled={isUploading || !selectedAcademicYear}
            oneLine
            buttonClassName="h-11 rounded-lg border-slate-300 text-sm shadow-sm"
          >
            {classOptions.map((classOption) => (
              <SelectItem key={classOption.id} value={String(classOption.id)}>{classOption.name}</SelectItem>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-800">Term</label>
          <Select
            value={selectedTerm}
            onValueChange={setSelectedTerm}
            placeholder="Select term"
            disabled={isUploading || !selectedAcademicYear}
            oneLine
            buttonClassName="h-11 rounded-lg border-slate-300 text-sm shadow-sm"
          >
            {termOptions.map((termOption) => (
              <SelectItem key={termOption} value={termOption}>{termOption}</SelectItem>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
}