import { listCourseMappings } from "./courseMapping.service";
import { getEvaluationResults, getEvaluationSummary } from "./evaluation.service";
import { listLecturers } from "./lecturer.service";
import { makeSummaryKey, toArray } from "../utils/evaluationUpload/common";
import { buildLecturerRows } from "../utils/evaluationUpload/rows";

export async function fetchAllCourseMappings() {
  const limit = 100;
  let page = 1;
  let hasMore = true;
  const allRows = [];

  while (hasMore) {
    const body = await listCourseMappings({ page, limit });
    const rows = toArray(body?.data);
    allRows.push(...rows);
    hasMore = Boolean(body?.hasMore) && rows.length > 0;
    page += 1;
  }

  return allRows;
}

export async function fetchAllLecturers() {
  const limit = 100;
  let page = 1;
  let totalPages = 1;
  const allRows = [];

  do {
    const body = await listLecturers({ page, limit });
    const rows = toArray(body?.data);
    allRows.push(...rows);
    totalPages = Number(body?.meta?.totalPages || 1);
    page += 1;
  } while (page <= totalPages);

  return allRows;
}

export async function loadEvaluationUploadData() {
  const [mappings, lecturers, summaryBody] = await Promise.all([
    fetchAllCourseMappings(),
    fetchAllLecturers(),
    getEvaluationSummary(),
  ]);

  const summaryRows = toArray(summaryBody?.data);
  const summaryByKey = new Map(
    summaryRows.map((row) => [
      makeSummaryKey(
        row?.lecturer_id,
        row?.academic_year,
        row?.term,
        row?.course_name,
      ),
      row,
    ]),
  );
  const summaryEmailByLecturerId = new Map(
    summaryRows
      .filter((row) => row?.lecturer_id && row?.lecturer_email)
      .map((row) => [row.lecturer_id, row.lecturer_email]),
  );
  const lecturerEmailByProfileId = new Map(
    lecturers
      .filter((lecturer) => lecturer?.lecturerProfileId && lecturer?.email)
      .map((lecturer) => [lecturer.lecturerProfileId, lecturer.email]),
  );

  return {
    mappings,
    rows: buildLecturerRows(
      mappings,
      lecturerEmailByProfileId,
      summaryByKey,
      summaryEmailByLecturerId,
    ),
  };
}

export async function fetchEvaluationResultsMap(evaluationIds) {
  const uniqueIds = Array.from(
    new Set(
      toArray(evaluationIds).filter(
        (id) => Number.isInteger(Number(id)) && Number(id) > 0,
      ),
    ),
  );

  const resultPairs = await Promise.all(
    uniqueIds.map(async (evaluationId) => {
      try {
        const body = await getEvaluationResults(evaluationId);
        return [Number(evaluationId), body];
      } catch (error) {
        console.error(
          `[UploadEvaluation] failed to load evaluation results for ${evaluationId}`,
          error,
        );
        return [Number(evaluationId), null];
      }
    }),
  );

  return new Map(resultPairs);
}