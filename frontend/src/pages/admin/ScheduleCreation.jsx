import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarCheck, FileText, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "../../lib/axios";
import { getGroups } from "../../services/group.service";
import { getSpecializations } from "../../services/specialization.service";

const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const fallbackTimeSlots = [
  "08h:00-09h:30",
  "09h:50-11h:30",
  "12h:10-13h:40",
  "13h:50-15h:20",
  "15h:30-17h:00",
];

const SESSION_TO_TIMESLOT = {
  S1: "08h:00-09h:30",
  S2: "09h:50-11h:30",
  S3: "12h:10-13h:40",
  S4: "13h:50-15h:20",
  S5: "15h:30-17h:00",
};

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function parseAvailabilityToSlots(availability) {
  const raw = String(availability || "").trim();
  if (!raw) return [];

  const out = [];
  const dayBlocks = raw
    .split(";")
    .map((block) => block.trim())
    .filter(Boolean);

  dayBlocks.forEach((block) => {
    const [dayPart, sessionsPart] = block
      .split(":")
      .map((part) => String(part || "").trim());
    if (!dayPart || !sessionsPart) return;

    const day = weekDays.find((d) => d.toLowerCase() === dayPart.toLowerCase());
    if (!day) return;

    sessionsPart
      .split(",")
      .map((s) => String(s || "").trim().toUpperCase())
      .filter(Boolean)
      .forEach((code) => {
        const slot = SESSION_TO_TIMESLOT[code];
        if (!slot) return;
        out.push({ day, slot });
      });
  });

  return out;
}

function getSpecializationName(classObj) {
  return (
    classObj?.Specialization?.name ||
    classObj?.specialization?.name ||
    classObj?.specialization_name ||
    classObj?.specializationName ||
    ""
  );
}

export default function ScheduleCreation() {
  const [specializations, setSpecializations] = useState([]);
  const [groups, setGroups] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);

  const [selectedSpecialization, setSelectedSpecialization] = useState("all");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState("all");
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);

  const [previewCells, setPreviewCells] = useState({});
  const [previewTimeSlots, setPreviewTimeSlots] = useState(fallbackTimeSlots);
  const [previewGroupName, setPreviewGroupName] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isGenerateAllLoading, setIsGenerateAllLoading] = useState(false);
  const [activeDownloadId, setActiveDownloadId] = useState(null);
  const [generatedCount, setGeneratedCount] = useState(0);

  const academicYearOptions = useMemo(() => {
    return ["all", ...safeArray(academicYears)];
  }, [academicYears]);

  const selectedSpecializationName = useMemo(() => {
    if (selectedSpecialization === "all") return "";
    return (
      specializations.find(
        (s) => String(s.id) === String(selectedSpecialization),
      )?.name || ""
    );
  }, [specializations, selectedSpecialization]);

  const visibleGroups = useMemo(() => {
    return safeArray(groups).filter((group) => {
      if (!selectedSpecializationName) return true;
      const groupSpecName = getSpecializationName(group?.Class);
      return String(groupSpecName).trim() === String(selectedSpecializationName).trim();
    });
  }, [groups, selectedSpecializationName]);

  const loadPageData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [specRes, groupsRes, yearsRes] = await Promise.all([
        getSpecializations(),
        getGroups(),
        axiosInstance.get("/course-mappings/academic-years"),
      ]);
      const specPayload = specRes?.data;
      setSpecializations(
        Array.isArray(specPayload)
          ? specPayload
          : safeArray(specPayload?.data),
      );
      setGroups(safeArray(groupsRes?.data?.group));
      setAcademicYears(safeArray(yearsRes?.data?.data));
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

  const handlePreviewGroup = useCallback(
    async (group) => {
      setIsPreviewLoading(true);
      try {
        setPreviewGroupName(group?.name || "");

        const baseParams = {
          group_id: group?.id,
          status: "Accepted",
          academic_year:
            selectedAcademicYear !== "all" ? selectedAcademicYear : undefined,
        };

        const limit = 100;
        const allMappings = [];
        let page = 1;
        let hasMore = true;
        const maxPages = 50; // safety guard to avoid infinite loops

        while (hasMore && page <= maxPages) {
          const { data } = await axiosInstance.get("/course-mappings", {
            params: {
              ...baseParams,
              limit,
              page,
            },
          });

          const pageMappings = safeArray(data?.data);
          allMappings.push(...pageMappings);

          // Continue if backend indicates there are more pages
          hasMore = Boolean(data?.hasMore);
          page += 1;

          // If backend does not set hasMore correctly but returns fewer than limit,
          // stop to avoid unnecessary extra calls.
          if (!hasMore && pageMappings.length < limit) {
            break;
          }
        }

        const mappings = allMappings;

        const grid = {};
        mappings.forEach((mapping) => {
          const course = mapping?.course?.name || "Unknown Course";
          const teacher = mapping?.lecturer?.name || "TBA";
          const room =
            mapping?.theory_room_number ||
            mapping?.lab_room_number ||
            mapping?.room_number ||
            "TBA";

          parseAvailabilityToSlots(mapping?.availability).forEach(({ day, slot }) => {
            if (!grid[slot]) grid[slot] = {};
            if (!grid[slot][day]) grid[slot][day] = [];
            grid[slot][day].push({ course, teacher, room });
          });
        });

        setPreviewTimeSlots(fallbackTimeSlots);
        setPreviewCells(grid);
      } catch (error) {
        console.error("[ScheduleCreation] failed to preview schedule", error);
        toast.error("Failed to load schedule preview");
      } finally {
        setIsPreviewLoading(false);
      }
    },
    [selectedAcademicYear],
  );

  const downloadGeneratedSchedulePdf = useCallback(async (filename) => {
    const response = await axiosInstance.get("/schedules/generated-pdf", {
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
        await axiosInstance.post("/schedules/generate-html", {
          academic_year:
            selectedAcademicYear !== "all" ? selectedAcademicYear : undefined,
          group_ids: [group?.id].filter(Boolean),
        });

        await downloadGeneratedSchedulePdf(
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
    [downloadGeneratedSchedulePdf, selectedAcademicYear],
  );

  const handleGenerateAll = useCallback(async () => {
    setIsGenerateAllLoading(true);
    try {
      const groupIds =
        selectedGroupIds.length > 0
          ? selectedGroupIds
          : visibleGroups.map((g) => g.id);

      await axiosInstance.post("/schedules/generate-html", {
        academic_year:
          selectedAcademicYear !== "all" ? selectedAcademicYear : undefined,
        specialization_id:
          selectedSpecialization !== "all"
            ? Number(selectedSpecialization)
            : undefined,
        group_ids: groupIds.length > 0 ? groupIds : undefined,
      });

      await downloadGeneratedSchedulePdf("all-schedules.pdf");
      setGeneratedCount((prev) => prev + Math.max(groupIds.length, 1));
    } catch (error) {
      console.error("[ScheduleCreation] failed to generate all PDFs", error);
      toast.error("Failed to generate all PDFs");
    } finally {
      setIsGenerateAllLoading(false);
    }
  }, [
    downloadGeneratedSchedulePdf,
    selectedAcademicYear,
    selectedGroupIds,
    selectedSpecialization,
    visibleGroups,
  ]);

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
                  Specialization
                </label>
                <select
                  value={selectedSpecialization}
                  onChange={(e) => setSelectedSpecialization(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="all">All Specializations</option>
                  {safeArray(specializations).map((spec) => (
                    <option key={spec.id} value={String(spec.id)}>
                      {spec.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <h2 className="text-sm font-semibold text-slate-800">
                  Bulk Generation
                </h2>
                <p className="mt-3 text-xs text-slate-500">
                  All visible groups will be included when generating PDFs.
                  Academic Year affects the generated schedule content.
                </p>
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
                            <p>Schedule source: Accepted course mappings</p>
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
                            {Array.isArray(cell) && cell.length > 0 ? (
                              <div className="mx-auto max-w-[150px] space-y-3 text-slate-700">
                                {cell.map((item, idx) => (
                                  <div key={idx} className="space-y-1">
                                    <p className="text-sm font-bold leading-4">
                                      {item.course}
                                    </p>
                                    <p className="text-[13px] text-slate-600">
                                      {item.teacher}
                                    </p>
                                    {item.room ? (
                                      <p className="text-[13px] text-slate-700 font-semibold">
                                        {item.room}
                                      </p>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
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
