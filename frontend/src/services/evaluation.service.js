import { axiosInstance } from "../lib/axios";

export async function uploadEvaluationFile(
  file,
  { lecturerNames = [], lecturerIds = [] } = {},
) {
  const form = new FormData();
  form.append("file", file);

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
