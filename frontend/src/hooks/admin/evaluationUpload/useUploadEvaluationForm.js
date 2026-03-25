import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildAcademicYearOptions,
  buildClassOptions,
  buildEmptyUploadAssignment,
  buildTermOptions,
  buildUploadScope,
} from "../../../utils/evaluationUpload/uploadScope";
import { toArray } from "../../../utils/evaluationUpload/common";

export function useUploadEvaluationForm(open, mappings) {
  const fileInputRef = useRef(null);
  const wasOpenRef = useRef(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [lecturerAssignments, setLecturerAssignments] = useState([]);
  const [localError, setLocalError] = useState("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");

  const academicYearOptions = useMemo(() => buildAcademicYearOptions(mappings), [mappings]);
  const classOptions = useMemo(
    () => buildClassOptions(mappings, { academicYear: selectedAcademicYear, term: selectedTerm }),
    [mappings, selectedAcademicYear, selectedTerm],
  );
  const termOptions = useMemo(
    () => buildTermOptions(mappings, { academicYear: selectedAcademicYear, classId: selectedClassId }),
    [mappings, selectedAcademicYear, selectedClassId],
  );
  const uploadScope = useMemo(
    () => buildUploadScope(mappings, { academicYear: selectedAcademicYear, classId: selectedClassId, term: selectedTerm }),
    [mappings, selectedAcademicYear, selectedClassId, selectedTerm],
  );

  useEffect(() => {
    const justOpened = open && !wasOpenRef.current;
    wasOpenRef.current = open;
    if (!justOpened) return;
    setLocalError("");
    setSelectedFile(null);
    setSelectedAcademicYear("");
    setSelectedClassId("");
    setSelectedTerm("");
    setLecturerAssignments([]);
  }, [open]);

  useEffect(() => {
    if (selectedAcademicYear && !academicYearOptions.includes(selectedAcademicYear)) setSelectedAcademicYear("");
  }, [academicYearOptions, selectedAcademicYear]);

  useEffect(() => {
    if (selectedClassId && !classOptions.some((option) => Number(option.id) === Number(selectedClassId))) setSelectedClassId("");
  }, [classOptions, selectedClassId]);

  useEffect(() => {
    if (selectedTerm && !termOptions.includes(selectedTerm)) setSelectedTerm("");
  }, [selectedTerm, termOptions]);

  useEffect(() => {
    if (!open || !uploadScope?.ready || lecturerAssignments.length > 0) return;
    const lecturersInScope = toArray(uploadScope?.lecturers);
    if (lecturersInScope.length === 0) return;

    setLecturerAssignments(
      lecturersInScope.map((lecturer, index) => ({
        row_id: buildEmptyUploadAssignment(index).row_id,
        lecturer_id: lecturer.lecturer_id,
        group_names: toArray(lecturer?.default_group_names),
      })),
    );
  }, [lecturerAssignments.length, open, uploadScope]);

  useEffect(() => {
    if (!open || !uploadScope?.ready) return;
    const availableGroupNames = new Set(toArray(uploadScope?.groups).map((group) => String(group?.name || "").trim()).filter(Boolean));
    setLecturerAssignments((prev) =>
      prev.map((assignment, index) => ({
        ...assignment,
        row_id: assignment?.row_id || buildEmptyUploadAssignment(index).row_id,
        group_names: Array.from(new Set(toArray(assignment?.group_names).filter((groupName) => availableGroupNames.has(groupName)))),
      })),
    );
  }, [open, uploadScope]);

  useEffect(() => {
    if (open) setLocalError("");
  }, [lecturerAssignments, open, uploadScope]);

  return {
    fileInputRef,
    selectedFile,
    setSelectedFile,
    lecturerAssignments,
    setLecturerAssignments,
    localError,
    setLocalError,
    selectedAcademicYear,
    setSelectedAcademicYear,
    selectedClassId,
    setSelectedClassId,
    selectedTerm,
    setSelectedTerm,
    academicYearOptions,
    classOptions,
    termOptions,
    uploadScope,
  };
}