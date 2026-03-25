import { normalize, toArray } from "./common";

export function getAcceptedEvaluationMappings(mappings) {
  return toArray(mappings).filter(
    (item) =>
      normalize(item?.status) === "accepted" &&
      item?.class?.id &&
      item?.lecturer?.id &&
      item?.group?.name,
  );
}

export function buildAcademicYearOptions(mappings) {
  return Array.from(
    new Set(
      getAcceptedEvaluationMappings(mappings)
        .map((item) => String(item?.academic_year || item?.class?.academic_year || "").trim())
        .filter(Boolean),
    ),
  ).sort((a, b) => b.localeCompare(a));
}

export function buildClassOptions(mappings, { academicYear = "", term = "" } = {}) {
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
  const classMap = new Map();

  getAcceptedEvaluationMappings(mappings)
    .filter((item) => {
      const itemAcademicYear = String(item?.academic_year || item?.class?.academic_year || "").trim();
      const itemTerm = String(item?.term || item?.class?.term || "").trim();
      return (!academicYear || itemAcademicYear === academicYear) && (!term || itemTerm === term);
    })
    .forEach((item) => {
      if (!classMap.has(item.class.id)) {
        classMap.set(item.class.id, { id: item.class.id, name: item.class.name });
      }
    });

  return Array.from(classMap.values()).sort((a, b) => collator.compare(a.name, b.name));
}

export function buildTermOptions(mappings, { academicYear = "", classId = "" } = {}) {
  const numericClassId = Number(classId);
  return Array.from(
    new Set(
      getAcceptedEvaluationMappings(mappings)
        .filter((item) => {
          const itemAcademicYear = String(item?.academic_year || item?.class?.academic_year || "").trim();
          const itemClassId = Number(item?.class?.id);
          return (!academicYear || itemAcademicYear === academicYear) && (!numericClassId || itemClassId === numericClassId);
        })
        .map((item) => String(item?.term || item?.class?.term || "").trim())
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b));
}

export function buildUploadScope(mappings, { academicYear = "", classId = "", term = "" } = {}) {
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
  const numericClassId = Number(classId);

  if (!academicYear || !numericClassId || !term) {
    return { ready: false, academicYear, classId: numericClassId || null, className: "", term, mappings: [], lecturers: [], groups: [] };
  }

  const filteredMappings = getAcceptedEvaluationMappings(mappings).filter((item) => {
    const itemAcademicYear = String(item?.academic_year || item?.class?.academic_year || "").trim();
    const itemTerm = String(item?.term || item?.class?.term || "").trim();
    const itemClassId = Number(item?.class?.id);
    return itemAcademicYear === academicYear && itemTerm === term && itemClassId === numericClassId;
  });

  const lecturerMap = new Map();
  const groupMap = new Map();

  filteredMappings.forEach((item) => {
    groupMap.set(item.group.id, { id: item.group.id, name: item.group.name });
    if (!lecturerMap.has(item.lecturer.id)) {
      lecturerMap.set(item.lecturer.id, { lecturer_id: item.lecturer.id, name: item.lecturer.name, defaultGroupNames: new Set() });
    }
    lecturerMap.get(item.lecturer.id).defaultGroupNames.add(item.group.name);
  });

  return {
    ready: true,
    academicYear,
    classId: numericClassId,
    className: filteredMappings[0]?.class?.name || "",
    term,
    mappings: filteredMappings.map((item) => ({
      id: item.id,
      courseId: Number(item?.course?.id || item?.course_id || 0),
      courseName: String(item?.course?.name || "").trim(),
      lecturerId: Number(item?.lecturer?.id || item?.lecturer_profile_id || 0),
      groupName: String(item?.group?.name || "").trim(),
    })),
    lecturers: Array.from(lecturerMap.values())
      .map((lecturer) => ({
        lecturer_id: lecturer.lecturer_id,
        name: lecturer.name,
        default_group_names: Array.from(lecturer.defaultGroupNames).sort((a, b) => collator.compare(a, b)),
      }))
      .sort((a, b) => collator.compare(a.name, b.name)),
    groups: Array.from(groupMap.values()).sort((a, b) => collator.compare(a.name, b.name)),
  };
}

export function buildEmptyUploadAssignment(index) {
  return {
    row_id: `upload-assignment-${index}-${Date.now()}`,
    lecturer_id: null,
    group_names: [],
  };
}