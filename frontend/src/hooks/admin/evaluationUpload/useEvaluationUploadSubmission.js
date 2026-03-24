import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { uploadEvaluationFile } from "../../../services/evaluation.service";
import { getErrorMessage, toArray } from "../../../utils/evaluationUpload/common";

export function useEvaluationUploadSubmission(loadRows) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  const handleFileSelect = useCallback(
    async ({ file, academicYear, classId, term, lecturerAssignments }) => {
      if (!file) return;

      setUploadResult(null);
      setIsUploading(true);
      try {
        const response = await uploadEvaluationFile(file, {
          academicYear,
          classId,
          term,
          lecturerAssignments,
        });

        toast.success(response?.message || "Evaluation uploaded successfully");
        setUploadResult({
          evaluation_id: response?.evaluation_id || null,
          course_mapping_id: response?.course_mapping_id || null,
          course: response?.course_info?.course_name || null,
          class: response?.course_info?.class_name || null,
          academic_year: response?.course_info?.academic_year || null,
          specialization: response?.course_info?.specialization || null,
          department: response?.course_info?.department || null,
          total_submissions: response?.stats?.total_submissions ?? null,
          lecturer_count: response?.stats?.lecturers ?? null,
          processed_groups: toArray(response?.processed_groups),
          lecturer_assignments:
            toArray(response?.lecturer_assignments).length > 0
              ? response.lecturer_assignments
              : lecturerAssignments,
        });
        await loadRows();
      } catch (error) {
        setUploadResult(null);
        console.error("[UploadEvaluation] upload failed", error);
        toast.error(getErrorMessage(error));
      } finally {
        setIsUploading(false);
      }
    },
    [loadRows],
  );

  return {
    isUploading,
    uploadResult,
    setUploadResult,
    handleFileSelect,
  };
}