import { axiosInstance } from "../lib/axios";

export async function uploadEvaluationFile(
  file,
  {
    lecturerNames = [],
    lecturerIds = [],
    lecturerAssignments = [],
    courseMappingId = null,
    academicYear = "",
    classId = null,
    term = "",
  } = {},
) {
  const form = new FormData();
  form.append("file", file);

  if (Number.isInteger(Number(courseMappingId)) && Number(courseMappingId) > 0) {
    form.append("course_mapping_id", String(courseMappingId));
  }

  if (String(academicYear || "").trim()) {
    form.append("academic_year", String(academicYear).trim());
  }

  if (Number.isInteger(Number(classId)) && Number(classId) > 0) {
    form.append("class_id", String(classId));
  }

  if (String(term || "").trim()) {
    form.append("term", String(term).trim());
  }

  if (Array.isArray(lecturerAssignments) && lecturerAssignments.length > 0) {
    form.append("lecturer_assignments", JSON.stringify(lecturerAssignments));
  }

  if (Array.isArray(lecturerNames) && lecturerNames.length > 0) {
    form.append("lecturer_names", JSON.stringify(lecturerNames));
  }

  if (Array.isArray(lecturerIds) && lecturerIds.length > 0) {
    form.append("lecturer_ids", JSON.stringify(lecturerIds));
  }

  const res = await axiosInstance.post("/evaluations/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
}

export async function getEvaluationSummary() {
  const res = await axiosInstance.get("/evaluations/summary/list");
  return res.data;
}

export async function getEvaluationResults(evaluationId) {
  const res = await axiosInstance.get(`/evaluations/${evaluationId}/results`);
  return res.data;
}

export async function downloadLecturerEvaluationPdf(evaluationId, lecturerId) {
  const res = await axiosInstance.get(
    `/evaluations/${evaluationId}/lecturer/${lecturerId}/pdf`,
    { responseType: "blob" },
  );
  return res.data;
}
