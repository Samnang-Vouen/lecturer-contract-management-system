import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FileText, FolderUp, Loader2, Search, Users } from "lucide-react";
import toast from "react-hot-toast";
import { listCourseMappings } from "../../services/courseMapping.service";
import { listLecturers } from "../../services/lecturer.service";
import {
  getEvaluationResults,
  getEvaluationSummary,
  uploadEvaluationFile,
} from "../../services/evaluation.service";
import { getSocket } from "../../services/socket";
import { useAuthStore } from "../../store/useAuthStore";

// Modal for file upload
function UploadModal({
  open,
  onClose,
  onSubmit,
  isUploading,
  defaultLecturerNames,
  uploadResult,
}) {
  const mockLecturerNames = ["Dr. Alex Kim", "Ms. Lina Chan"];

  const getInitialLecturerNames = () =>
    Array.isArray(defaultLecturerNames) && defaultLecturerNames.length > 0
      ? defaultLecturerNames
      : mockLecturerNames;

  const fileInputRef = useRef(null);
  const wasOpenRef = useRef(false);
  const [authToken, setAuthToken] = useState("");
  const [inputType, setInputType] = useState("lecturer-names");
  const [lecturerNamesText, setLecturerNamesText] = useState(() =>
    JSON.stringify(getInitialLecturerNames()),
  );
  const [selectedFile, setSelectedFile] = useState(null);
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    const justOpened = open && !wasOpenRef.current;
    wasOpenRef.current = open;

    if (!justOpened) return;

    setLocalError("");
    setSelectedFile(null);
    // Show default lecturer names (or mock data) only when opening the modal.
    setLecturerNamesText(JSON.stringify(getInitialLecturerNames()));
  }, [open, defaultLecturerNames]);

  useEffect(() => {
    if (!open) return;
    if (inputType === "lecturer-ids") {
      setLecturerNamesText("[1]");
      return;
    }

    setLecturerNamesText(JSON.stringify(getInitialLecturerNames()));
  }, [inputType, open, defaultLecturerNames]);

  const lecturerSummaryText = useMemo(() => {
    if (
      Array.isArray(uploadResult?.lecturer_names) &&
      uploadResult.lecturer_names.length > 0
    ) {
      return uploadResult.lecturer_names.join(", ");
    }

    if (
      typeof uploadResult?.lecturers === "string" &&
      uploadResult.lecturers.trim()
    ) {
      return uploadResult.lecturers;
    }

    if (typeof uploadResult?.lecturer_count === "number") {
      return String(uploadResult.lecturer_count);
    }

    return "No data found";
  }, [uploadResult]);

  const displayValue = (value) => {
    if (value === null || value === undefined || value === "") {
      return "No data found";
    }
    return value;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
      setLocalError("");
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setLocalError("");
    }
  };

  const handleSubmit = () => {
    if (!selectedFile) {
      setLocalError("Please choose an Excel file before uploading.");
      return;
    }

    let lecturerNames = [];
    let lecturerIds = [];

    try {
      const parsed = JSON.parse(lecturerNamesText || "[]");
      if (!Array.isArray(parsed)) {
        setLocalError(
          inputType === "lecturer-ids"
            ? "Lecturer IDs must be a JSON array."
            : "Lecturer Names must be a JSON array.",
        );
        return;
      }

      if (inputType === "lecturer-ids") {
        lecturerIds = parsed
          .map((item) => Number(item))
          .filter((item) => Number.isInteger(item) && item > 0);
        if (lecturerIds.length === 0) {
          setLocalError("Please provide at least one valid lecturer ID.");
          return;
        }
      } else {
        lecturerNames = parsed
          .map((item) => String(item || "").trim())
          .filter(Boolean);
        if (lecturerNames.length === 0) {
          setLocalError("Please provide at least one lecturer name.");
          return;
        }
      }
    } catch (error) {
      setLocalError(
        inputType === "lecturer-ids"
          ? "Lecturer IDs JSON is invalid."
          : "Lecturer Names JSON is invalid.",
      );
      return;
    }

    setLocalError("");
    onSubmit({
      file: selectedFile,
      authToken,
      inputType,
      lecturerNames,
      lecturerIds,
    });
  };

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-xl bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute right-4 top-4 text-2xl text-red-500 hover:text-red-700"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="mb-4 text-2xl font-semibold">Upload Files</h2>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-semibold text-slate-800">
            Input Type:
          </label>
          <select
            value={inputType}
            onChange={(e) => setInputType(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="lecturer-names">Lecturer Names (Recommended)</option>
            <option value="lecturer-ids">Lecturer ID</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-semibold text-slate-800">
            {inputType === "lecturer-ids"
              ? "Lecturer IDs (JSON array):"
              : "Lecturer Names (JSON array):"}
          </label>
          <textarea
            value={lecturerNamesText}
            onChange={(e) => setLecturerNamesText(e.target.value)}
            rows={3}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <p className="mt-1 text-xs text-slate-500">
            {inputType === "lecturer-ids"
              ? "Format: [1, 2] - must match order in Excel columns"
              : 'Format: ["Name1", "Name2"] - must match order in Excel columns'}
          </p>
        </div>

        <div
          className="mb-4 flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-8 text-center"
          style={{ minHeight: 170 }}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <div className="mb-1 font-medium">Excel File (.xlsx or .xls):</div>
          <div className="mb-3 text-xs text-slate-500">
            Drop file here or choose manually
          </div>
          <button
            className="rounded bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700"
            onClick={handleClick}
            disabled={isUploading}
          >
            Choose Files
          </button>
          {selectedFile ? (
            <p className="mt-3 text-sm text-slate-700">{selectedFile.name}</p>
          ) : null}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </div>

        {localError ? (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {localError}
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isUploading}
          className="w-full rounded bg-green-600 px-4 py-2.5 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploading ? "Uploading..." : "Upload Evaluation"}
        </button>

        {uploadResult ? (
          <div className="mt-4 rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
            <p className="font-semibold">Evaluation uploaded successfully</p>
            <p>
              Evaluation ID:{" "}
              {displayValue(uploadResult.evaluation_id || uploadResult.id)}
            </p>
            <p>
              Course Mapping ID: {displayValue(uploadResult.course_mapping_id)}
            </p>
            <p>Course: {displayValue(uploadResult.course)}</p>
            <p>Class: {displayValue(uploadResult.class)}</p>
            <p>Academic Year: {displayValue(uploadResult.academic_year)}</p>
            <p>Specialization: {displayValue(uploadResult.specialization)}</p>
            <p>Department: {displayValue(uploadResult.department)}</p>
            <p>
              Total Submissions: {displayValue(uploadResult.total_submissions)}
            </p>
            <p>Lecturers: {lecturerSummaryText}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function GeneratePdfModal({ open, onClose, onConfirm, rows, isGenerating }) {
  const [mode, setMode] = useState("all");
  const [selectedKeys, setSelectedKeys] = useState([]);

  useEffect(() => {
    if (!open) return;
    setMode("all");
    setSelectedKeys(toArray(rows).map((row) => row.key));
  }, [open, rows]);

  if (!open) return null;

  const toggleKey = (key) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  };

  const selectedRows = toArray(rows).filter((row) =>
    selectedKeys.includes(row.key),
  );

  const handleConfirm = () => {
    if (mode === "all") {
      onConfirm(toArray(rows), { mode: "all" });
      return;
    }

    if (!selectedRows.length) {
      toast.error("Please select at least one lecturer");
      return;
    }

    onConfirm(selectedRows, { mode: "selected" });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-xl bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute right-4 top-4 text-2xl text-red-500 hover:text-red-700"
          onClick={onClose}
          aria-label="Close"
          disabled={isGenerating}
        >
          &times;
        </button>

        <h2 className="mb-4 text-2xl font-semibold">Generate PDF</h2>

        <div className="mb-4 space-y-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
            <input
              type="radio"
              name="pdf-mode"
              value="all"
              checked={mode === "all"}
              onChange={() => setMode("all")}
              disabled={isGenerating}
            />
            Generate for all visible lecturers ({toArray(rows).length})
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
            <input
              type="radio"
              name="pdf-mode"
              value="selected"
              checked={mode === "selected"}
              onChange={() => setMode("selected")}
              disabled={isGenerating}
            />
            Choose specific lecturer(s)
          </label>
        </div>

        {mode === "selected" ? (
          <div className="mb-4 max-h-72 overflow-y-auto rounded-xl border border-slate-200 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                {selectedRows.length} selected
              </p>
              <button
                type="button"
                className="text-xs font-medium text-blue-600 hover:text-blue-800"
                onClick={() =>
                  setSelectedKeys(toArray(rows).map((row) => row.key))
                }
                disabled={isGenerating}
              >
                Select all
              </button>
            </div>
            <div className="space-y-2">
              {toArray(rows).map((row) => (
                <label
                  key={row.key}
                  className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedKeys.includes(row.key)}
                    onChange={() => toggleKey(row.key)}
                    disabled={isGenerating}
                  />
                  <span className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">
                      {row.lecturerName}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {row.course} - {row.term}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleConfirm}
          disabled={isGenerating}
          className="w-full rounded bg-green-600 px-4 py-2.5 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGenerating ? "Generating..." : "Generate PDF"}
        </button>
      </div>
    </div>
  );
}

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

const DEFAULT_QUESTION_TEXT_BY_ID = {
  1: "How would you rate the clarity and organization of the course content and materials?",
  2: "Do you feel the instructor effectively engages students through various teaching techniques?",
  3: "Do you feel comfortable asking questions or seeking clarification from the instructor?",
  4: "Do you receive timely and constructive feedback on your assignments and assessments?",
  5: "Are the lecturer's teaching methods effective?",
};

function buildQuestionRowsFromResults(resultsBody, lecturerId) {
  const groups = Object.values(resultsBody?.groups || {});
  const questionCatalog = toArray(resultsBody?.question_catalog);
  const questionMetaById = new Map(
    questionCatalog.map((question) => [
      String(question?.id),
      {
        orderNo: Number(question?.order_no),
        text: String(question?.question_text || "").trim(),
      },
    ]),
  );
  const weightedByQuestion = new Map();
  let overallWeightedSum = 0;
  let overallWeight = 0;

  groups.forEach((group) => {
    const weight = Number(group?.responses_received);
    const normalizedWeight = Number.isFinite(weight) && weight > 0 ? weight : 1;
    const lecturerData = group?.lecturer_evaluations?.[String(lecturerId)];
    if (!lecturerData) return;

    const questionAverages = lecturerData.question_averages || {};
    Object.entries(questionAverages).forEach(([questionId, score]) => {
      const numeric = Number(score);
      if (!Number.isFinite(numeric)) return;
      const prev = weightedByQuestion.get(questionId) || { sum: 0, weight: 0 };
      prev.sum += numeric * normalizedWeight;
      prev.weight += normalizedWeight;
      weightedByQuestion.set(questionId, prev);
    });

    const overall = Number(lecturerData.overall_average);
    if (Number.isFinite(overall)) {
      overallWeightedSum += overall * normalizedWeight;
      overallWeight += normalizedWeight;
    }
  });

  const sortedQuestionIds = Array.from(weightedByQuestion.keys()).sort(
    (a, b) => {
      const metaA = questionMetaById.get(String(a));
      const metaB = questionMetaById.get(String(b));
      const orderA = Number.isFinite(metaA?.orderNo)
        ? metaA.orderNo
        : Number(a);
      const orderB = Number.isFinite(metaB?.orderNo)
        ? metaB.orderNo
        : Number(b);
      return orderA - orderB;
    },
  );
  if (!sortedQuestionIds.length) return null;

  const questionOrders = [];
  const questionRows = sortedQuestionIds.map((questionId) => {
    const meta = questionMetaById.get(String(questionId));
    const displayOrder = Number.isFinite(meta?.orderNo)
      ? meta.orderNo
      : Number(questionId);
    questionOrders.push(displayOrder);

    const stat = weightedByQuestion.get(questionId);
    const avg = stat && stat.weight > 0 ? stat.sum / stat.weight : null;
    const fallbackText = DEFAULT_QUESTION_TEXT_BY_ID[displayOrder] || "";
    const questionText = meta?.text || fallbackText;
    const questionTitle = questionText
      ? `Q${displayOrder}. ${questionText}`
      : `Q${displayOrder}`;
    return [questionTitle, avg === null ? "-" : formatScore(avg)];
  });

  const overallAverage =
    overallWeight > 0 ? overallWeightedSum / overallWeight : null;
  const validOrders = questionOrders.filter((order) => Number.isFinite(order));
  const minQuestionNo = validOrders.length ? Math.min(...validOrders) : 1;
  const maxQuestionNo = validOrders.length
    ? Math.max(...validOrders)
    : sortedQuestionIds.length;

  return {
    questionRows,
    questionCount: sortedQuestionIds.length,
    overallAverage,
    minQuestionNo,
    maxQuestionNo,
  };
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
        evaluationId: summary?.evaluation_id || null,
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

  // --- BEGIN: Group name mapping workaround for numeric group names ---
  // This logic maps group scores with names '1', '2', ... to the actual group names from course mapping (e.g., 'DS-G1', 'DS-G2')
  // so that numeric group names in the uploaded file are matched to the correct group columns.
  return Array.from(grouped.values())
    .map((row) => {
      const collator = new Intl.Collator(undefined, {
        numeric: true,
        sensitivity: "base",
      });
      const groupNames = Array.from(row.groups).sort((a, b) =>
        collator.compare(a, b),
      );
      const filteredGroupScoreByName = {};
      groupNames.forEach((groupName, idx) => {
        // Map '1' to first group, '2' to second, etc.
        if (
          row.groupScoreByName &&
          Object.prototype.hasOwnProperty.call(
            row.groupScoreByName,
            String(idx + 1),
          )
        ) {
          filteredGroupScoreByName[groupName] =
            row.groupScoreByName[String(idx + 1)];
        } else if (
          row.groupScoreByName &&
          Object.prototype.hasOwnProperty.call(row.groupScoreByName, groupName)
        ) {
          filteredGroupScoreByName[groupName] = row.groupScoreByName[groupName];
        }
      });
      return {
        ...row,
        groupNames,
        groupScoreByName: filteredGroupScoreByName,
      };
    })
    .sort((a, b) => a.lecturerName.localeCompare(b.lecturerName));
  // --- END: Group name mapping workaround for numeric group names ---
}

export default function UploadEvaluation() {
  const { authUser } = useAuthStore();
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

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

  const handleGeneratePDF = useCallback(async (targetRows, options = {}) => {
    const rowsToGenerate = toArray(targetRows);
    if (!rowsToGenerate.length) {
      toast.error("No lecturer rows to export");
      return;
    }

    const combineIntoSingleFile = options?.mode === "all";

    setIsGeneratingPdf(true);

    try {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const isPositiveInt = (value) =>
        Number.isInteger(Number(value)) && Number(value) > 0;

      const evaluationIds = Array.from(
        new Set(
          rowsToGenerate
            .map((row) => Number(row?.evaluationId))
            .filter((id) => isPositiveInt(id)),
        ),
      );

      const resultPairs = await Promise.all(
        evaluationIds.map(async (evaluationId) => {
          try {
            const body = await getEvaluationResults(evaluationId);
            return [evaluationId, body];
          } catch (error) {
            console.error(
              `[UploadEvaluation] failed to load evaluation results for ${evaluationId}`,
              error,
            );
            return [evaluationId, null];
          }
        }),
      );
      const resultsByEvaluationId = new Map(resultPairs);

      let generatedCount = 0;
      const sharedDoc = combineIntoSingleFile
        ? new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" })
        : null;

      rowsToGenerate.forEach((row, index) => {
        const doc =
          sharedDoc ||
          new jsPDF({
            orientation: "landscape",
            unit: "pt",
            format: "a4",
          });

        if (sharedDoc && index > 0) {
          doc.addPage();
        }

        const pageWidth = doc.internal.pageSize.getWidth();
        const leftX = 40;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(24);
        doc.text("Instructor Faculty Evaluation", pageWidth / 2, 48, {
          align: "center",
        });

        doc.setFontSize(14);
        doc.text("Instructor", leftX, 92);
        doc.text(":", leftX + 110, 92);
        doc.setFont("helvetica", "normal");
        doc.text(String(row.lecturerName || "-"), leftX + 125, 92);

        doc.setFont("helvetica", "bold");
        doc.text("Subject", leftX, 120);
        doc.text(":", leftX + 110, 120);
        doc.setFont("helvetica", "normal");
        doc.text(String(row.course || "-"), leftX + 125, 120);

        doc.setFont("helvetica", "bold");
        doc.text("Term", leftX, 148);
        doc.text(":", leftX + 110, 148);
        doc.setFont("helvetica", "normal");
        doc.text(String(row.term || "-"), leftX + 125, 148);

        doc.setFont("helvetica", "bold");
        doc.text("Academic Year", leftX, 176);
        doc.text(":", leftX + 110, 176);
        doc.setFont("helvetica", "normal");
        doc.text(String(row.academicYear || "-"), leftX + 125, 176);

        const fallbackGroupRows = Array.from(
          { length: Math.max(row.groupNames.length, 1) },
          (_, index) => {
            const groupName = row.groupNames[index];
            if (!groupName) {
              return ["-", "-"];
            }
            const score = row.groupScoreByName
              ? row.groupScoreByName[groupName]
              : null;
            return [groupName, formatScore(score)];
          },
        );

        const resultsBody = resultsByEvaluationId.get(
          Number(row?.evaluationId),
        );
        const questionSummary = buildQuestionRowsFromResults(
          resultsBody,
          Number(row?.lecturerId),
        );

        const tableRows = questionSummary?.questionRows?.length
          ? [
              ...questionSummary.questionRows,
              [
                `Average of Q${questionSummary.minQuestionNo} to Q${questionSummary.maxQuestionNo}`,
                questionSummary.overallAverage === null
                  ? "-"
                  : formatScore(questionSummary.overallAverage),
              ],
            ]
          : fallbackGroupRows;

        if (!questionSummary?.questionRows?.length) {
          tableRows.push(["Total Point", formatScore(row.totalPoint)]);
        }

        autoTable(doc, {
          startY: 210,
          head: [
            [
              questionSummary?.questionRows?.length ? "Question" : "Group",
              "Score",
            ],
          ],
          body: tableRows,
          theme: "grid",
          styles: { fontSize: 12, cellPadding: 8, valign: "middle" },
          headStyles: { fillColor: [224, 231, 239], textColor: [15, 23, 42] },
          columnStyles: {
            0: { cellWidth: 520 },
            1: { cellWidth: 110, halign: "center" },
          },
        });

        const safeName = String(row.lecturerName || "lecturer")
          .replace(/[^a-zA-Z0-9-_ ]/g, "")
          .trim()
          .replace(/\s+/g, "_");
        const safeCourse = String(row.course || "course")
          .replace(/[^a-zA-Z0-9-_ ]/g, "")
          .trim()
          .replace(/\s+/g, "_");
        const safeTerm = String(row.term || "term")
          .replace(/[^a-zA-Z0-9-_ ]/g, "")
          .trim()
          .replace(/\s+/g, "_");

        if (!sharedDoc) {
          doc.save(
            `evaluation_${safeName || "lecturer"}_${safeCourse || "course"}_${safeTerm || "term"}.pdf`,
          );
        }
        generatedCount += 1;
      });

      if (sharedDoc) {
        sharedDoc.save("lecturer-evaluation-list.pdf");
      }

      toast.success(
        combineIntoSingleFile
          ? `PDF generated for ${generatedCount} lecturers`
          : generatedCount === 1
            ? "PDF generated for selected lecturer"
            : `Generated ${generatedCount} PDF files`,
      );
    } catch (error) {
      console.error("[UploadEvaluation] failed to generate PDF", error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsGeneratingPdf(false);
    }
  }, []);

  const handleFileSelect = useCallback(
    async ({ file, lecturerNames, lecturerIds, inputType }) => {
      if (!file) return;

      // Clear previous success details for a new upload attempt.
      setUploadResult(null);
      setIsUploading(true);
      try {
        const namesToUpload =
          Array.isArray(lecturerNames) && lecturerNames.length > 0
            ? lecturerNames
            : lecturerNamesForUpload;
        const idsToUpload =
          Array.isArray(lecturerIds) && lecturerIds.length > 0
            ? lecturerIds
            : [];
        const response = await uploadEvaluationFile(file, {
          lecturerNames: inputType === "lecturer-ids" ? [] : namesToUpload,
          lecturerIds: inputType === "lecturer-ids" ? idsToUpload : [],
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
          lecturer_names:
            inputType === "lecturer-ids"
              ? idsToUpload.map((id) => String(id))
              : namesToUpload,
        });
        await loadRows();
      } catch (error) {
        // Keep success panel empty when upload fails.
        setUploadResult(null);
        console.error("[UploadEvaluation] upload failed", error);
        toast.error(getErrorMessage(error));
      } finally {
        setIsUploading(false);
      }
    },
    [lecturerNamesForUpload, loadRows],
  );

  const onClickUpload = useCallback(() => {
    if (lecturerNamesForUpload.length === 0) {
      toast.error("No lecturer is available for upload");
      return;
    }
    setUploadResult(null);
    setModalOpen(true);
  }, [lecturerNamesForUpload.length]);

  const onClickGenerate = useCallback(() => {
    if (!visibleRows.length) {
      toast.error("No lecturer is available for PDF generation");
      return;
    }
    setGenerateModalOpen(true);
  }, [visibleRows.length]);

  const onConfirmGenerate = useCallback(
    async (rowsToGenerate, options) => {
      setGenerateModalOpen(false);
      await handleGeneratePDF(rowsToGenerate, options);
    },
    [handleGeneratePDF],
  );

  return (
    <>
      {/* Upload Modal */}
      <UploadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleFileSelect}
        isUploading={isUploading}
        defaultLecturerNames={lecturerNamesForUpload}
        uploadResult={uploadResult}
      />
      <GeneratePdfModal
        open={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        onConfirm={onConfirmGenerate}
        rows={visibleRows}
        isGenerating={isGeneratingPdf}
      />
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
                    Upload Course Evaluation of Each lecturer
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
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
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={onClickGenerate}
                  disabled={isGeneratingPdf || isLoading}
                >
                  <FileText className="h-4 w-4" />
                  {isGeneratingPdf ? "Generating..." : "Generate PDF"}
                </button>
              </div>
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
                  Lecturer List ({visibleRows.length})
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
                      {Array.from({ length: maxGroupColumns }).map(
                        (_, index) => (
                          <th
                            key={`group-col-${index}`}
                            className="px-4 py-3 font-semibold"
                          >
                            Group
                          </th>
                        ),
                      )}
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
    </>
  );
}
