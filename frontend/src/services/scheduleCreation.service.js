import axios from "../lib/axios";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

export const getScheduleAcademicYears = () => axios.get("/course-mappings/academic-years");

export const getScheduleCourseMappings = (params = {}) =>
  axios.get("/course-mappings", { params });

export const generateScheduleHtml = (payload) =>
  axios.post("/schedules/generate-html", payload);

export const getGeneratedSchedulePdf = (file) =>
  axios.get("/schedules/generated-pdf", {
    params: file ? { file } : undefined,
    responseType: "blob",
  });

export async function listAllAcceptedMappingsForGroup({ groupId, academicYear }) {
  const allMappings = [];
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= 50) {
    const response = await getScheduleCourseMappings({
      group_id: groupId,
      status: "Accepted",
      academic_year: academicYear !== "all" ? academicYear : undefined,
      limit: 100,
      page,
    });

    const pageMappings = safeArray(response?.data?.data);
    allMappings.push(...pageMappings);
    hasMore = Boolean(response?.data?.hasMore);
    page += 1;

    if (!hasMore && pageMappings.length < 100) {
      break;
    }
  }

  return allMappings;
}