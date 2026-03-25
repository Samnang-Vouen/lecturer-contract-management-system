import { resolveVisibleGroups } from "./groups";
import { makeSummaryKey, toArray } from "./common";

export function buildLecturerRows(
  mappings,
  lecturerEmailByProfileId,
  summaryByKey,
  summaryEmailByLecturerId,
) {
  const grouped = new Map();

  toArray(mappings).forEach((item) => {
    const lecturerId = item?.lecturer?.id;
    const lecturerName = item?.lecturer?.name;
    if (!lecturerId || !lecturerName) return;

    const key = [
      lecturerId,
      item?.academic_year || "-",
      item?.term || "-",
      item?.course?.name || "-",
    ].join("|");

    if (!grouped.has(key)) {
      const summaryKey = makeSummaryKey(
        lecturerId,
        item?.academic_year || "-",
        item?.term || "-",
        item?.course?.name || "-",
      );
      const summary = summaryByKey.get(summaryKey);

      grouped.set(key, {
        key,
        evaluationId: summary?.evaluation_id || null,
        lecturerId,
        lecturerName,
        lecturerEmail:
          lecturerEmailByProfileId.get(lecturerId) ||
          summaryEmailByLecturerId.get(lecturerId) ||
          "",
        summaryGroupScores: toArray(summary?.group_scores),
        academicYear: item?.academic_year || "-",
        term: item?.term || "-",
        classId: item?.class?.id || null,
        className: item?.class?.name || "-",
        course: item?.course?.name || "-",
        groups: new Set(),
        totalPoint: Number.isFinite(Number(summary?.total_point))
          ? Number(summary.total_point)
          : null,
      });
    }

    const row = grouped.get(key);
    if (item?.group?.name) row.groups.add(item.group.name);
  });

  return Array.from(grouped.values())
    .map((row) => ({
      ...row,
      ...resolveVisibleGroups(Array.from(row.groups), row.summaryGroupScores),
    }))
    .sort((a, b) => a.lecturerName.localeCompare(b.lecturerName));
}