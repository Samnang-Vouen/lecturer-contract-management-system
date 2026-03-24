import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { FileSpreadsheet, X } from "lucide-react";
import Button from "../../ui/Button";
import UploadScopeFilters from "./UploadScopeFilters";
import LecturerAssignmentsSection from "./LecturerAssignmentsSection";
import FileDropzone from "./FileDropzone";
import UploadResultPanel from "./UploadResultPanel";
import { useUploadEvaluationForm } from "../../../hooks/admin/evaluationUpload/useUploadEvaluationForm";
import { toArray } from "../../../utils/evaluationUpload/common";

export default function UploadModal({ open, onClose, onSubmit, isUploading, mappings, uploadResult }) {
  const form = useUploadEvaluationForm(open, mappings);

  useEffect(() => {
    if (!open) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  const canSubmit = useMemo(() => {
    if (!form.selectedFile || !form.uploadScope?.ready) return false;
    if (!form.lecturerAssignments.length) return false;

    const availableGroupNames = new Set(
      toArray(form.uploadScope?.groups)
        .map((group) => String(group?.name || "").trim())
        .filter(Boolean),
    );
    const lecturerOptionById = new Map(
      toArray(form.uploadScope?.lecturers).map((lecturer) => [lecturer.lecturer_id, lecturer]),
    );
    const seenLecturerIds = new Set();

    for (const assignment of form.lecturerAssignments) {
      const lecturerId = Number(assignment?.lecturer_id);
      const lecturerMeta = lecturerOptionById.get(lecturerId);
      const groupNames = Array.from(
        new Set(
          toArray(assignment?.group_names)
            .map((groupName) => String(groupName || "").trim())
            .filter(Boolean),
        ),
      ).filter((groupName) => availableGroupNames.has(groupName));

      if (!Number.isInteger(lecturerId) || lecturerId <= 0 || !lecturerMeta) return false;
      if (seenLecturerIds.has(lecturerId)) return false;
      if (groupNames.length === 0) return false;
      seenLecturerIds.add(lecturerId);
    }

    return true;
  }, [form.lecturerAssignments, form.selectedFile, form.uploadScope]);

  const handleSubmit = () => {
    if (!form.selectedFile) {
      form.setLocalError("Please choose an Excel file before uploading.");
      return;
    }
    if (!form.uploadScope?.ready) {
      form.setLocalError("Select Academic Year, Class, and Term in this form before uploading.");
      return;
    }
    if (!form.lecturerAssignments.length) {
      form.setLocalError("Please add at least one lecturer assignment.");
      return;
    }

    const availableGroupNames = new Set(toArray(form.uploadScope?.groups).map((group) => String(group?.name || "").trim()).filter(Boolean));
    const lecturerOptionById = new Map(toArray(form.uploadScope?.lecturers).map((lecturer) => [lecturer.lecturer_id, lecturer]));
    const seenLecturerIds = new Set();
    const normalizedAssignments = [];

    for (let index = 0; index < form.lecturerAssignments.length; index += 1) {
      const assignment = form.lecturerAssignments[index];
      const lecturerId = Number(assignment?.lecturer_id);
      const lecturerMeta = lecturerOptionById.get(lecturerId);
      const groupNames = Array.from(new Set(toArray(assignment?.group_names).map((groupName) => String(groupName || "").trim()).filter(Boolean))).filter((groupName) => availableGroupNames.has(groupName));

      if (!Number.isInteger(lecturerId) || lecturerId <= 0 || !lecturerMeta) {
        form.setLocalError(`Select a valid lecturer for order ${index + 1}.`);
        return;
      }
      if (seenLecturerIds.has(lecturerId)) {
        form.setLocalError("Each lecturer can appear only once in the upload order.");
        return;
      }
      if (groupNames.length === 0) {
        form.setLocalError(`Assign at least one group to ${lecturerMeta.name || `lecturer ${lecturerId}`}.`);
        return;
      }

      seenLecturerIds.add(lecturerId);
      normalizedAssignments.push({ lecturer_id: lecturerId, lecturer_name: lecturerMeta.name, order_index: index + 1, group_names: groupNames });
    }

    form.setLocalError("");
    onSubmit({ file: form.selectedFile, academicYear: form.uploadScope.academicYear, classId: form.uploadScope.classId, term: form.uploadScope.term, lecturerAssignments: normalizedAssignments });
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-4"
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        className="relative flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] bg-slate-100 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-evaluation-title"
      >
          <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                <div>
                  <h2 id="upload-evaluation-title" className="text-xl font-semibold text-slate-900 sm:text-2xl">Upload Evaluation</h2>
                  <p className="mt-1 text-sm text-slate-500">Review the scope, assign lecturers, then upload your evaluation spreadsheet.</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-10 w-10 p-0" onClick={onClose} aria-label="Close">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 pb-6 sm:px-6 sm:py-6">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] xl:items-start">
              <div className="space-y-4">
                <UploadScopeFilters
                  selectedAcademicYear={form.selectedAcademicYear}
                  setSelectedAcademicYear={form.setSelectedAcademicYear}
                  selectedClassId={form.selectedClassId}
                  setSelectedClassId={form.setSelectedClassId}
                  selectedTerm={form.selectedTerm}
                  setSelectedTerm={form.setSelectedTerm}
                  academicYearOptions={form.academicYearOptions}
                  classOptions={form.classOptions}
                  termOptions={form.termOptions}
                  isUploading={isUploading}
                />

                <LecturerAssignmentsSection
                  uploadScope={form.uploadScope}
                  lecturerAssignments={form.lecturerAssignments}
                  setLecturerAssignments={form.setLecturerAssignments}
                  isUploading={isUploading}
                  setLocalError={form.setLocalError}
                />
              </div>

              <div className="space-y-4 xl:max-h-[calc(94vh-220px)] xl:overflow-y-auto xl:pr-1">
                <FileDropzone
                  fileInputRef={form.fileInputRef}
                  selectedFile={form.selectedFile}
                  setSelectedFile={form.setSelectedFile}
                  setLocalError={form.setLocalError}
                  isUploading={isUploading}
                />

                {form.localError ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">{form.localError}</div> : null}
                <UploadResultPanel uploadResult={uploadResult} />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" size="md" className="h-11 px-5" onClick={onClose} disabled={isUploading}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={isUploading || !canSubmit} className="h-11 bg-gradient-to-r from-blue-600 to-indigo-600 px-5 text-white hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-500">
                {isUploading ? "Uploading..." : "Upload Evaluation"}
              </Button>
            </div>
          </div>
      </div>
    </div>,
    document.body,
  );
}