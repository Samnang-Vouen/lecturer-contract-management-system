import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarCheck, FileText, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../../lib/axios";
import { listMajors } from "../../services/major.service";
import { getGroups } from "../../services/group.service";

const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const fallbackTimeSlots = [
  "08:00 - 09:30",
  "09:50 - 11:20",
  "12:10 - 13:40",
  "13:50 - 15:20",
  "15:30 - 17:00",
];

function normalizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function deriveAcademicYears(schedules) {
  const years = new Set();
  safeArray(schedules).forEach((schedule) => {
    if (!schedule?.start_date) return;
    const dt = new Date(schedule.start_date);
    if (Number.isNaN(dt.getTime())) return;
    const startYear = dt.getUTCFullYear();
    years.add(`${startYear}-${startYear + 1}`);
  });
  return Array.from(years).sort((a, b) => b.localeCompare(a));
}

function scheduleMatchesAcademicYear(schedule, academicYear) {
  if (!academicYear || academicYear === "all") return true;
  if (!schedule?.start_date) return false;
  const dt = new Date(schedule.start_date);
  if (Number.isNaN(dt.getTime())) return false;
  const startYear = dt.getUTCFullYear();
  return `${startYear}-${startYear + 1}` === academicYear;
}

function getMajorAbbreviation(majorName) {
  const raw = String(majorName || "").trim();
  if (!raw) return "";

  // Prefer explicit abbreviation in parentheses, e.g. "Software Engineering (SE)"
  const parenMatch = raw.match(/\(([^)]+)\)/);
  if (parenMatch?.[1]) {
    return parenMatch[1].replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  }

  // Fallback: build from initials, e.g. "Data Science" -> "DS"
  return raw
    .split(/\s+/)
    .map((word) => word.replace(/[^a-zA-Z0-9]/g, ""))
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function parseTimeSlotMinutes(label) {
  const raw = String(label || "").trim();
  const match = raw.match(/(\d{1,2})h?:(\d{2})\s*-\s*(\d{1,2})h?:(\d{2})/);
  if (!match) return 0;

  const startMinutes = Number(match[1]) * 60 + Number(match[2]);
  const endMinutes = Number(match[3]) * 60 + Number(match[4]);
  const diff = endMinutes - startMinutes;
  return diff > 0 ? diff : 0;
}

function getScheduleStats(schedule) {
  const entries = safeArray(
    schedule?.ScheduleEntries || schedule?.scheduleEntries || schedule?.entries,
  );

  const courseKeys = new Set();
  let totalMinutes = 0;

  entries.forEach((entry) => {
    const courseId = entry?.CourseMapping?.Course?.id;
    const courseName = entry?.CourseMapping?.Course?.course_name;
    const key = String(courseId || courseName || "").trim();
    if (key) courseKeys.add(key);

    const durationFromSlot = parseTimeSlotMinutes(entry?.TimeSlot?.label);
    const durationFromField = Number(entry?.duration_minutes || 0);
    totalMinutes +=
      durationFromField > 0 ? durationFromField : durationFromSlot;
  });

  if (totalMinutes <= 0) {
    const fallbackHours = Number(schedule?.total_hours || 0);
    if (fallbackHours > 0) totalMinutes = fallbackHours * 60;
  }

  const totalHours = totalMinutes / 60;
  const totalHoursLabel = Number.isInteger(totalHours)
    ? String(totalHours)
    : totalHours.toFixed(1);

  return {
    courses: courseKeys.size,
    hoursLabel: totalMinutes > 0 ? totalHoursLabel : "0",
  };
}

export default function ScheduleCreation() {
  const [majors, setMajors] = useState([]);
  const [groups, setGroups] = useState([]);
  const [schedules, setSchedules] = useState([]);

  const [selectedMajor, setSelectedMajor] = useState("all");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("all");
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);

  const [previewCells, setPreviewCells] = useState({});
  const [previewTimeSlots, setPreviewTimeSlots] = useState(fallbackTimeSlots);
  const [previewGroupName, setPreviewGroupName] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isGenerateAllLoading, setIsGenerateAllLoading] = useState(false);
  const [isGenerateSelectedLoading, setIsGenerateSelectedLoading] = useState(false);

  const [activeDownloadId, setActiveDownloadId] = useState(null);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [groupStatsById, setGroupStatsById] = useState({});

  const scheduleByGroup = useMemo(() => {
    const map = new Map();
    safeArray(schedules).forEach((schedule) => {
      const idKey = String(schedule?.Group?.id || "").trim();
      const nameKey = normalizeName(schedule?.Group?.name);
      const key = idKey || nameKey;
      if (!key) return;
      if (
        !map.has(key) ||
        String(schedule?.created_at || "") >
          String(map.get(key)?.created_at || "")
      ) {
        map.set(key, schedule);
      }
    });
    return map;
  }, [schedules]);

  const getScheduleForGroup = useCallback(
    (group) => {
      const byId = scheduleByGroup.get(String(group?.id || "").trim());
      if (byId) return byId;
      return scheduleByGroup.get(normalizeName(group?.name));
    },
    [scheduleByGroup],
  );

  const academicYearOptions = useMemo(() => {
    const years = deriveAcademicYears(schedules);
    return ["all", ...years];
  }, [schedules]);

  const selectedMajorName = useMemo(() => {
    if (selectedMajor === "all") return "";
    return (
      majors.find((m) => String(m.id) === String(selectedMajor))?.name || ""
    );
  }, [majors, selectedMajor]);

  const visibleGroups = useMemo(() => {
    const majorAbbr = getMajorAbbreviation(selectedMajorName);
    return safeArray(groups).filter((group) => {
      const schedule = getScheduleForGroup(group);
      const yearOk = scheduleMatchesAcademicYear(
        schedule,
        selectedAcademicYear,
      );
      if (!yearOk) return false;
      if (!majorAbbr) return true;

      const groupName = String(group?.name || "")
        .trim()
        .toUpperCase();
      return groupName === majorAbbr || groupName.startsWith(`${majorAbbr}-`);
    });
  }, [groups, selectedAcademicYear, selectedMajorName, getScheduleForGroup]);

  const loadPageData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [majorsRes, groupsRes, schedulesRes] = await Promise.all([
        listMajors(),
        getGroups(),
        axiosInstance.get("/schedules"),
      ]);
      setMajors(safeArray(majorsRes));
      setGroups(safeArray(groupsRes?.data?.group));
      setSchedules(safeArray(schedulesRes?.data?.schedules));
    } catch (error) {
      console.error("[ScheduleCreation] failed to load page data", error);
      toast.error("Failed to load schedule data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  useEffect(() => {
    setSelectedGroupIds((prev) =>
      prev.filter((id) => visibleGroups.some((g) => g.id === id)),
    );
  }, [visibleGroups]);

  useEffect(() => {
    const nextStats = {};
    visibleGroups.forEach((group) => {
      const schedule = getScheduleForGroup(group);
      const groupId = group?.id;
      if (!groupId) return;

    const fetchVisibleGroupStats = () => {
      if (!visibleGroups.length) {
        if (isActive) setGroupStatsById({});
        return;
      }

      const nextStats = {};

      visibleGroups.forEach((group) => {
        const schedule = getScheduleForGroup(group);
        const groupId = group?.id;
        if (!groupId) return;

        if (!schedule?.id) {
          nextStats[groupId] = { courses: 0, hoursLabel: "0" };
          return;
        }

        nextStats[groupId] = getScheduleStats(schedule);
      });

      if (isActive) {
        setGroupStatsById(nextStats);
      }
    });
    setGroupStatsById(nextStats);
  }, [visibleGroups, getScheduleForGroup]);

  const buildPreviewFromSchedule = useCallback((scheduleDetail) => {
    const entries = safeArray(
      scheduleDetail?.ScheduleEntries ||
        scheduleDetail?.scheduleEntries ||
        scheduleDetail?.entries,
    );

    const slotOrderMap = new Map();
    entries.forEach((entry) => {
      const label = entry?.TimeSlot?.label;
      if (!label) return;
      const index = Number(entry?.TimeSlot?.order_index ?? 9999);
      slotOrderMap.set(label, index);
    });

    const orderedSlots = Array.from(slotOrderMap.entries())
      .sort((a, b) => a[1] - b[1] || a[0].localeCompare(b[0]))
      .map(([label]) => label);

    const slotList = orderedSlots.length ? orderedSlots : fallbackTimeSlots;
    const grid = {};

    entries.forEach((entry) => {
      const slot = entry?.TimeSlot?.label;
      const day = entry?.day_of_week;
      if (!slot || !day) return;
      const course =
        entry?.CourseMapping?.Course?.course_name || "Unknown Course";
      const teacherTitle = entry?.CourseMapping?.LecturerProfile?.title || "";
      let teacherName =
        entry?.CourseMapping?.LecturerProfile?.full_name_english || "";
      // Avoid double title
      let teacherDisplay = teacherName;
      if (
        teacherTitle &&
        teacherName &&
        !teacherName
          .trim()
          .toLowerCase()
          .startsWith(teacherTitle.trim().toLowerCase())
      ) {
        teacherDisplay = `${teacherTitle} ${teacherName}`.trim();
      }
      const room = entry?.room || "TBA";

      if (!grid[slot]) grid[slot] = {};
      grid[slot][day] = {
        course,
        teacher: teacherDisplay || "TBA",
        room,
      };
    });

    setPreviewTimeSlots(slotList);
    setPreviewCells(grid);
  }, []);

  const handlePreviewGroup = useCallback(
    async (group) => {
      const schedule = getScheduleForGroup(group);
      if (!schedule?.id) {
        setPreviewGroupName(group?.name || "");
        setPreviewCells({});
        setPreviewTimeSlots(fallbackTimeSlots);
        toast.error("No schedule found for this group");
        return;
      }

      setIsPreviewLoading(true);
      try {
        const { data } = await axiosInstance.get(`/schedules/${schedule.id}`);
        buildPreviewFromSchedule(data?.schedule || {});
        setPreviewGroupName(group?.name || "");
      } catch (error) {
        console.error("[ScheduleCreation] failed to preview schedule", error);
        toast.error("Failed to load schedule preview");
      } finally {
        setIsPreviewLoading(false);
      }
    },
    [buildPreviewFromSchedule, getScheduleForGroup],
  );

  const downloadSchedulePdf = useCallback(async (params, filename) => {
    const response = await axiosInstance.get("/schedules/pdf", {
      params,
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(
      new Blob([response.data], { type: "application/pdf" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }, []);

  const handleGenerateGroupPdf = useCallback(
    async (group) => {
      const groupKey = `group-${group?.id}`;
      setActiveDownloadId(groupKey);
      try {
        await downloadSchedulePdf(
          {
            class_name: group?.Class?.name || undefined,
            specialization: group?.Class?.Specialization?.name || undefined,
          },
          `schedule-${String(group?.name || "group")
            .replace(/\s+/g, "-")
            .toLowerCase()}.pdf`,
        );
        setGeneratedCount((prev) => prev + 1);
      } catch (error) {
        console.error("[ScheduleCreation] failed to generate group PDF", error);
        toast.error("Failed to generate PDF for this group");
      } finally {
        setActiveDownloadId(null);
      }
    },
    [downloadSchedulePdf],
  );

  const handleGenerateAll = useCallback(async () => {
    setIsGenerateAllLoading(true);
    try {
      const normalizedSpecialization =
        typeof selectedMajorName === "string"
          ? selectedMajorName.replace(/\s*\([^)]*\)\s*$/, "").trim()
          : undefined;

      await downloadSchedulePdf(
        {
          specialization: normalizedSpecialization || undefined,
        },
        "all-schedules.pdf",
      );
      setGeneratedCount((prev) => prev + 1);
    } catch (error) {
      console.error("[ScheduleCreation] failed to generate all PDFs", error);
      toast.error("Failed to generate all PDFs");
    } finally {
      setIsGenerateAllLoading(false);
    }
  }, [downloadSchedulePdf, selectedMajorName]);

  const handleGenerateSelected = useCallback(async () => {
    if (!selectedGroupIds.length) return;
    setIsGenerateSelectedLoading(true);
    let successCount = 0;
    try {
      // Build a map of unique (class_name, specialization) combinations
      const comboMap = new Map();
      for (const groupId of selectedGroupIds) {
        const group = visibleGroups.find((g) => g.id === groupId);
        if (!group) continue;
        const className = group?.Class?.name || undefined;
        const specialization = group?.Class?.Specialization?.name || undefined;
        const comboKey = `${className || ""}||${specialization || ""}`;
        if (!comboMap.has(comboKey)) {
          comboMap.set(comboKey, {
            className,
            specialization,
            // Use class/specialization label for messages
            label:
              className && specialization
                ? `${className} - ${specialization}`
                : className || specialization || "schedule",
          });
        }
      }

      for (const [comboKey, combo] of comboMap.entries()) {
        setActiveDownloadId(`combo-${comboKey}`);
        const { className, specialization, label } = combo;
        try {
          const safeClass = String(className || "class")
            .replace(/\s+/g, "-")
            .toLowerCase();
          const safeSpec = specialization
            ? String(specialization)
                .replace(/\s+/g, "-")
                .toLowerCase()
            : "general";
          await downloadSchedulePdf(
            {
              class_name: className,
              specialization: specialization,
            },
            `schedule-${safeClass}-${safeSpec}.pdf`,
          );
          successCount += 1;
        } catch (error) {
          console.error(
            "[ScheduleCreation] failed to generate selected schedule PDF",
            error,
          );
          toast.error(`Failed to generate PDF for ${label}`);
        }
      }
      setGeneratedCount((prev) => prev + successCount);
    } finally {
      setActiveDownloadId(null);
      setIsGenerateSelectedLoading(false);
    }
  }, [downloadSchedulePdf, selectedGroupIds, visibleGroups]);

  const toggleGroupSelection = useCallback((groupId) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId],
    );
  }, []);

  const handleSelectAllVisible = useCallback(() => {
    setSelectedGroupIds(visibleGroups.map((g) => g.id));
  }, [visibleGroups]);

  const handleClearSelection = useCallback(() => {
    setSelectedGroupIds([]);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6">
      <div className="mx-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">
                Schedule Creation
              </h1>
              <p className="text-sm text-slate-500">
                Generate PDF schedules for academic groups
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerateAll}
            disabled={isGenerateAllLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGenerateAllLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Generate All PDFs
          </button>
        </div>

        <div className="grid grid-cols-1 overflow-hidden rounded-xl border border-slate-200 xl:grid-cols-[320px_1fr]">
          <aside className="border-b border-slate-200 bg-slate-50 xl:border-b-0 xl:border-r">
            <div className="space-y-4 p-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Academic Year
                </label>
                <select
                  value={selectedAcademicYear}
                  onChange={(e) => setSelectedAcademicYear(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {academicYearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year === "all" ? "All Academic Years" : year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Major
                </label>
                <select
                  value={selectedMajor}
                  onChange={(e) => setSelectedMajor(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="all">All Majors</option>
                  {safeArray(majors).map((major) => (
                    <option key={major.id} value={String(major.id)}>
                      {major.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <h2 className="text-sm font-semibold text-slate-800">
                  Bulk Generation
                </h2>
                <p className="mt-3 text-xs text-slate-500">
                  All visible groups matching the selected filters will be
                  included when generating PDFs.
                </p>
                {selectedGroupIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleGenerateSelected}
                    disabled={isGenerateSelectedLoading}
                    className="mt-2 w-full rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isGenerateSelectedLoading ? (
                      <span className="flex items-center justify-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Generating...
                      </span>
                    ) : (
                      `Generate Selected PDFs (${selectedGroupIds.length})`
                    )}
                  </button>
                )}
              </div>

              {isLoading ? (
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-center text-sm text-slate-500">
                  <Loader2 className="mx-auto mb-2 h-4 w-4 animate-spin" />
                  Loading groups...
                </div>
              ) : (
                <div className="space-y-3">
                  {visibleGroups.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center text-sm text-slate-500">
                      No groups found for the selected filters.
                    </div>
                  ) : (
                    visibleGroups.map((group) => {
                      const schedule = getScheduleForGroup(group);
                      const stats = groupStatsById[group.id];
                      const isSelected = selectedGroupIds.includes(group.id);
                      return (
                        <div
                          key={group.id}
                          className="rounded-xl border border-slate-200 bg-white p-3"
                        >
                          <div className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleGroupSelection(group.id)}
                              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600"
                            />
                            <div>
                              <p className="text-sm font-semibold text-slate-800">
                                {group.name}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {group?.Class?.name || "Class unavailable"}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 space-y-1 text-xs text-slate-500">
                            <p>{group?.num_of_student || 0} students</p>
                            <p>
                              {schedule
                                ? stats
                                  ? `${stats.courses} courses | ${stats.hoursLabel} hours`
                                  : "Loading course/hour stats..."
                                : "Schedule: Not created yet"}
                            </p>
                          </div>

                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => handlePreviewGroup(group)}
                              className="flex-1 rounded-md bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                            >
                              Preview
                            </button>
                            <button
                              type="button"
                              onClick={() => handleGenerateGroupPdf(group)}
                              disabled={
                                activeDownloadId === `group-${group.id}`
                              }
                              className="flex-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {activeDownloadId === `group-${group.id}`
                                ? "Generating..."
                                : "Generate PDF"}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </aside>

          <section className="overflow-x-auto bg-white">
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <h2 className="text-3xl font-semibold text-slate-900">
                  Schedule Preview
                </h2>
                {previewGroupName ? (
                  <p className="text-xs text-slate-500">
                    Group: {previewGroupName}
                  </p>
                ) : null}
              </div>
              <p className="text-sm text-slate-500">
                Generated:{" "}
                <span className="font-semibold text-slate-700">
                  {generatedCount}
                </span>
              </p>
            </div>

            {isPreviewLoading ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                Loading preview...
              </div>
            ) : (
              <table className="w-full min-w-[860px] border-collapse text-sm">
                <colgroup>
                  <col style={{ width: "180px" }} />
                  {weekDays.map((_, idx) => (
                    <col key={idx} style={{ width: "160px" }} />
                  ))}
                </colgroup>
                <thead>
                  <tr className="bg-slate-100 text-slate-700">
                    <th className="border border-slate-200 px-4 py-2 font-semibold w-[120px] text-center">
                      Time
                    </th>
                    {weekDays.map((day) => (
                      <th
                        key={day}
                        className="border border-slate-200 px-4 py-2 text-center font-semibold w-[160px]"
                      >
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewTimeSlots.map((slot) => (
                    <tr key={slot} className="align-top">
                      <td className="h-28 border border-slate-200 px-3 py-3 font-medium text-slate-700 text-center">
                        {slot}
                      </td>
                      {weekDays.map((day) => {
                        const cell = previewCells?.[slot]?.[day];
                        return (
                          <td
                            key={`${slot}-${day}`}
                            className="relative h-28 border border-slate-200 px-2 py-2 text-center align-top w-[160px]"
                          >
                            {cell ? (
                              <>
                                <div className="mx-auto max-w-[150px] space-y-1 text-slate-700">
                                  <p className="text-sm font-bold leading-4">
                                    {cell.course}
                                  </p>
                                  <p className="text-[13px] text-slate-600">
                                    {cell.teacher}
                                  </p>
                                </div>
                                {cell.room && (
                                  <span className="absolute bottom-2 right-2 text-[13px] text-slate-700 font-semibold">
                                    {cell.room}
                                  </span>
                                )}
                              </>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
