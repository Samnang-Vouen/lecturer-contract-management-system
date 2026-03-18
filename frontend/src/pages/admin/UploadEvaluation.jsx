import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FolderUp, Loader2, Search, Users } from "lucide-react";
import toast from "react-hot-toast";
import { listCourseMappings } from "../../services/courseMapping.service";
import { listLecturers } from "../../services/lecturer.service";
import {
  getEvaluationSummary,
  uploadEvaluationFile,
} from "../../services/evaluation.service";
import { getSocket } from "../../services/socket";
import { useAuthStore } from "../../store/useAuthStore";

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalize(text) {
  return String(text || "")
    .trim()
    .toLowerCase();
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    "Upload failed"
  );
}

function makeSummaryKey(lecturerId, academicYear, term, courseName) {
  return [
    String(lecturerId || ""),
    String(academicYear || "").trim(),
    String(term || "").trim(),
    String(courseName || "")
      .trim()
      .toLowerCase(),
  ].join("|");
}

function formatScore(score) {
  const numeric = Number(score);
  if (!Number.isFinite(numeric)) return "-";
  const rounded = Math.round((numeric + Number.EPSILON) * 10) / 10;
  const scoreLabel = Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(1);
  return `${scoreLabel}/5`;
}

async function fetchAllCourseMappings() {
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

async function fetchAllLecturers() {
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

function buildLecturerRows(
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

      const groupScoreByName = {};
      toArray(summary?.group_scores).forEach((groupScore) => {
        const groupName = String(groupScore?.group_name || "").trim();
        const score = Number(groupScore?.score);
        if (!groupName || !Number.isFinite(score)) return;
        groupScoreByName[groupName] = score;
      });

      grouped.set(key, {
        key,
        lecturerId,
        lecturerName,
        lecturerEmail:
          lecturerEmailByProfileId.get(lecturerId) ||
          summaryEmailByLecturerId.get(lecturerId) ||
          "",
        academicYear: item?.academic_year || "-",
        term: item?.term || "-",
        course: item?.course?.name || "-",
        groups: new Set(),
        groupScoreByName,
        totalPoint: Number.isFinite(Number(summary?.total_point))
          ? Number(summary.total_point)
          : null,
      });
    }

    const row = grouped.get(key);
    const groupName = item?.group?.name;
    if (groupName) row.groups.add(groupName);
  });

  return Array.from(grouped.values())
    .map((row) => ({
      ...row,
      groupNames: Array.from(
        new Set([
          ...Array.from(row.groups),
          ...Object.keys(row.groupScoreByName || {}),
        ]),
      ).sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => a.lecturerName.localeCompare(b.lecturerName));
}

export default function UploadEvaluation() {
  const { authUser } = useAuthStore();
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef(null);

  const loadRows = useCallback(async () => {
    setIsLoading(true);
    try {
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

      setRows(
        buildLecturerRows(
          mappings,
          lecturerEmailByProfileId,
          summaryByKey,
          summaryEmailByLecturerId,
        ),
      );
    } catch (error) {
      console.error("[UploadEvaluation] failed to load mappings", error);
      toast.error("Failed to load lecturer list");
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  useEffect(() => {
    if (!authUser?.id) return;

    const socket = getSocket();
    const joinRoom = () => {
      socket.emit("join", { id: authUser.id, role: authUser.role });
    };

    const onEvaluationUploaded = async () => {
      await loadRows();
      toast.success("Evaluation list updated in real time");
    };

    socket.on("connect", joinRoom);
    socket.on("evaluation:uploaded", onEvaluationUploaded);

    if (!socket.connected) {
      socket.connect();
    } else {
      joinRoom();
    }

    return () => {
      socket.off("connect", joinRoom);
      socket.off("evaluation:uploaded", onEvaluationUploaded);
    };
  }, [authUser?.id, authUser?.role, loadRows]);

  const visibleRows = useMemo(() => {
    const keyword = normalize(search);
    if (!keyword) return rows;

    return rows.filter(
      (row) =>
        normalize(row.lecturerName).includes(keyword) ||
        normalize(row.lecturerEmail).includes(keyword),
    );
  }, [rows, search]);

  const lecturerNamesForUpload = useMemo(() => {
    return Array.from(
      new Set(
        visibleRows
          .map((row) => String(row.lecturerName || "").trim())
          .filter(Boolean),
      ),
    );
  }, [visibleRows]);

  const maxGroupColumns = useMemo(() => {
    if (!visibleRows.length) return 1;
    return Math.max(...visibleRows.map((row) => row.groupNames.length || 0), 1);
  }, [visibleRows]);

  const onClickUpload = useCallback(() => {
    if (lecturerNamesForUpload.length === 0) {
      toast.error("No lecturer is available for upload");
      return;
    }

    fileInputRef.current?.click();
  }, [lecturerNamesForUpload.length]);

  const onFileChange = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      try {
        const response = await uploadEvaluationFile(
          file,
          lecturerNamesForUpload,
        );
        toast.success(response?.message || "Evaluation uploaded successfully");
        await loadRows();
      } catch (error) {
        console.error("[UploadEvaluation] upload failed", error);
        toast.error(getErrorMessage(error));
      } finally {
        event.target.value = "";
        setIsUploading(false);
      }
    },
    [lecturerNamesForUpload, loadRows],
  );

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
                <FolderUp className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold text-slate-900">
                  Upload Evaluation
                </h1>
                <p className="text-sm text-slate-500">
                  Upload Course Evaluation to each lecturer
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClickUpload}
              disabled={isUploading || isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FolderUp className="h-4 w-4" />
              )}
              Upload Files
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={onFileChange}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search lecturer by name or email"
              className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-900">
                Lecture List ({visibleRows.length})
              </h2>
            </div>
            <p className="text-sm text-slate-500">
              {visibleRows.length} of {rows.length} shown
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-slate-600">
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Term</th>
                    <th className="px-4 py-3 font-semibold">Course</th>
                    {Array.from({ length: maxGroupColumns }).map((_, index) => (
                      <th
                        key={`group-col-${index}`}
                        className="px-4 py-3 font-semibold"
                      >
                        Group
                      </th>
                    ))}
                    <th className="px-4 py-3 font-semibold">Total Point</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={maxGroupColumns + 4}
                        className="px-4 py-10 text-center text-slate-500"
                      >
                        <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                        Loading lecturers...
                      </td>
                    </tr>
                  ) : visibleRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={maxGroupColumns + 4}
                        className="px-4 py-10 text-center text-slate-500"
                      >
                        No lecturers found.
                      </td>
                    </tr>
                  ) : (
                    visibleRows.map((row) => (
                      <tr key={row.key} className="text-slate-700">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">
                            {row.lecturerName}
                          </div>
                          {row.lecturerEmail ? (
                            <div className="text-xs text-slate-500">
                              {row.lecturerEmail}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">{row.term}</td>
                        <td className="px-4 py-3">{row.course}</td>
                        {Array.from({ length: maxGroupColumns }).map(
                          (_, index) => {
                            const groupName = row.groupNames[index];
                            const score =
                              groupName && row.groupScoreByName
                                ? row.groupScoreByName[groupName]
                                : null;

                            return (
                              <td
                                key={`${row.key}-group-${index}`}
                                className="px-4 py-3"
                              >
                                {groupName ? (
                                  <div className="leading-tight">
                                    <div>{groupName}</div>
                                    <div className="text-slate-500">
                                      {formatScore(score)}
                                    </div>
                                  </div>
                                ) : (
                                  "-"
                                )}
                              </td>
                            );
                          },
                        )}
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {formatScore(row.totalPoint)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
