import { ArrowDown, ArrowUp, GripHorizontal, Plus, Trash2 } from "lucide-react";
import Button from "../../ui/Button";
import Checkbox from "../../ui/Checkbox";
import Select, { SelectItem } from "../../ui/Select";
import { buildEmptyUploadAssignment } from "../../../utils/evaluationUpload/uploadScope";
import { toArray } from "../../../utils/evaluationUpload/common";

export default function LecturerAssignmentsSection({
  uploadScope,
  lecturerAssignments,
  setLecturerAssignments,
  isUploading,
  setLocalError,
}) {
  const lecturerOptions = toArray(uploadScope?.lecturers);
  const groupOptions = toArray(uploadScope?.groups);
  const getDefaultGroupNames = (lecturerId) => {
    const lecturer = lecturerOptions.find(
      (option) => Number(option?.lecturer_id) === Number(lecturerId),
    );
    return toArray(lecturer?.default_group_names);
  };

  const updateAssignment = (index, updater) => {
    setLecturerAssignments((prev) =>
      prev.map((assignment, currentIndex) => {
        if (currentIndex !== index) return assignment;
        const nextValue = typeof updater === "function" ? updater(assignment) : updater;
        return { ...assignment, ...nextValue };
      }),
    );
  };

  const addAssignment = () => {
    const usedIds = new Set(lecturerAssignments.map((assignment) => Number(assignment?.lecturer_id)).filter((id) => Number.isInteger(id) && id > 0));
    const nextLecturer = lecturerOptions.find((lecturer) => !usedIds.has(lecturer.lecturer_id));
    if (!nextLecturer) {
      setLocalError("All available lecturers for the selected filters are already included in the upload order.");
      return;
    }
    setLocalError("");
    setLecturerAssignments((prev) => [
      ...prev,
      {
        row_id: buildEmptyUploadAssignment(prev.length).row_id,
        lecturer_id: nextLecturer.lecturer_id,
        group_names: toArray(nextLecturer?.default_group_names),
      },
    ]);
  };

  const moveAssignment = (index, direction) => {
    setLecturerAssignments((prev) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const next = [...prev];
      const [current] = next.splice(index, 1);
      next.splice(nextIndex, 0, current);
      return next;
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-base font-semibold text-slate-900">Lecturer Upload Order</p>
          <p className="text-sm text-slate-500">Use the selected scope to order lecturers and assign groups before uploading.</p>
        </div>
        <Button
          variant="outline"
          size="md"
          className="h-11 px-4 whitespace-nowrap"
          onClick={addAssignment}
          disabled={isUploading || !uploadScope?.ready || lecturerOptions.length === 0}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Lecturer
        </Button>
      </div>

      {uploadScope?.ready ? (
        <div className="mb-4 flex items-center justify-between gap-4 rounded-2xl border border-blue-100 bg-blue-50/80 p-3 text-sm text-slate-700">
          <p><span className="font-semibold text-slate-900">Academic Year:</span> {uploadScope.academicYear}</p>
          <p><span className="font-semibold text-slate-900">Class:</span> {uploadScope.className}</p>
          <p><span className="font-semibold text-slate-900">Term:</span> {uploadScope.term}</p>
        </div>
      ) : (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Select Academic Year, Class, and Term in this form to load lecturers.
        </div>
      )}

      {uploadScope?.ready ? (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Lecturer and group assignments are validated inside the selected Academic Year, Class, and Term scope.
        </div>
      ) : null}

      <div className="space-y-3">
        {lecturerAssignments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">No lecturer assignments available for the selected filters.</div>
        ) : (
          lecturerAssignments.map((assignment, index) => (
            <LecturerAssignmentCard
              key={assignment.row_id || `${assignment?.lecturer_id}-${index}`}
              assignment={assignment}
              index={index}
              lecturerAssignments={lecturerAssignments}
              lecturerOptions={lecturerOptions}
              groupOptions={groupOptions}
              getDefaultGroupNames={getDefaultGroupNames}
              isUploading={isUploading}
              updateAssignment={updateAssignment}
              moveAssignment={moveAssignment}
              removeAssignment={() => setLecturerAssignments((prev) => prev.filter((_, currentIndex) => currentIndex !== index))}
            />
          ))
        )}
      </div>
    </div>
  );
}

function LecturerAssignmentCard({ assignment, index, lecturerAssignments, lecturerOptions, groupOptions, getDefaultGroupNames, isUploading, updateAssignment, moveAssignment, removeAssignment }) {
  const selectedLecturerId = Number(assignment?.lecturer_id);
  const selectedGroups = new Set(toArray(assignment?.group_names));

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
            <GripHorizontal className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Order {index + 1}</p>
            <p className="text-xs text-slate-500">Choose one lecturer and at least one group.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => moveAssignment(index, -1)} disabled={isUploading || index === 0}><ArrowUp className="mr-1 h-4 w-4" /></Button>
          <Button type="button" variant="outline" size="sm" onClick={() => moveAssignment(index, 1)} disabled={isUploading || index === lecturerAssignments.length - 1}><ArrowDown className="mr-1 h-4 w-4" /></Button>
          <Button type="button" variant="destructive" size="sm" onClick={removeAssignment} disabled={isUploading || lecturerAssignments.length === 1}><Trash2 className="mr-1 h-4 w-4" /></Button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-800">Lecturer</label>
        <Select
          value={selectedLecturerId ? String(selectedLecturerId) : ""}
          onValueChange={(value) => updateAssignment(index, { lecturer_id: Number(value), group_names: getDefaultGroupNames(value) })}
          placeholder="Select lecturer"
          disabled={isUploading}
          buttonClassName="h-11 rounded-lg border-slate-300 text-sm shadow-sm"
        >
        {lecturerOptions.map((lecturer) => {
          const alreadySelected = lecturerAssignments.some((item, itemIndex) => itemIndex !== index && Number(item?.lecturer_id) === lecturer.lecturer_id);
          return (
            <SelectItem key={lecturer.lecturer_id} value={String(lecturer.lecturer_id)} disabled={alreadySelected}>
              {lecturer.name}
            </SelectItem>
          );
        })}
        </Select>
      </div>

      <div className="mt-4">
        <p className="mb-3 text-sm font-semibold text-slate-800">Assigned Groups</p>
        {groupOptions.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {groupOptions.map((group) => {
              const checked = selectedGroups.has(group.name);
              return (
                <label key={`${assignment.row_id || index}-${group.name}`} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm transition ${checked ? "border-blue-300 bg-blue-50 text-blue-700 shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"}`}>
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() =>
                      updateAssignment(index, (current) => {
                        const nextGroups = new Set(toArray(current?.group_names));
                        if (nextGroups.has(group.name)) nextGroups.delete(group.name);
                        else nextGroups.add(group.name);
                        return { group_names: Array.from(nextGroups) };
                      })
                    }
                    disabled={isUploading}
                  />
                  <span className="font-medium">{group.name}</span>
                </label>
              );
            })}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-500">Groups will be available after the top filters are selected.</p>
        )}
      </div>
    </div>
  );
}