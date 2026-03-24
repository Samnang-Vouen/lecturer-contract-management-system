import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, FileText, Users, X } from "lucide-react";
import toast from "react-hot-toast";
import Button from "../../ui/Button";
import Checkbox from "../../ui/Checkbox";
import { toArray } from "../../../utils/evaluationUpload/common";

export default function GeneratePdfModal({ open, onClose, onConfirm, rows, isGenerating }) {
  const [mode, setMode] = useState("all");
  const [selectedKeys, setSelectedKeys] = useState([]);

  useEffect(() => {
    if (!open) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setMode("all");
    setSelectedKeys(toArray(rows).map((row) => row.key));
  }, [open, rows]);

  if (!open) return null;

  const allRows = toArray(rows);
  const selectedRows = allRows.filter((row) => selectedKeys.includes(row.key));
  const allSelected = allRows.length > 0 && selectedRows.length === allRows.length;
  const selectedSummary = `${selectedRows.length} of ${allRows.length} lecturers selected`;

  const handleConfirm = () => {
    if (mode === "all") {
      onConfirm(allRows, { mode: "all" });
      return;
    }
    if (!selectedRows.length) {
      toast.error("Please select at least one lecturer");
      return;
    }
    onConfirm(selectedRows, { mode: "selected" });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm sm:p-4"
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        className="relative flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] bg-slate-100 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="generate-evaluation-pdf-title"
      >
        <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h2 id="generate-evaluation-pdf-title" className="text-xl font-semibold text-slate-900 sm:text-2xl">Generate Evaluation PDF</h2>
                <p className="mt-1 text-sm text-slate-500">Choose whether to export every visible lecturer or only a selected list.</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-10 w-10 p-0" onClick={onClose} aria-label="Close" disabled={isGenerating}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)] xl:items-start">
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
                  <Users className="h-5 w-5 text-blue-600" />
                  Export Scope
                </div>

                <div className="grid gap-3">
                  <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-4 transition ${mode === "all" ? "border-blue-300 bg-blue-50/70 shadow-sm" : "border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-slate-50"}`}>
                    <input
                      type="radio"
                      name="pdf-mode"
                      value="all"
                      checked={mode === "all"}
                      onChange={() => setMode("all")}
                      disabled={isGenerating}
                      className="mt-1 h-4 w-4 accent-blue-600"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-slate-900">Generate for all visible lecturers</span>
                      <span className="mt-1 block text-sm text-slate-500">Create HTML-based PDF files for all {allRows.length} visible lecturer summaries.</span>
                    </span>
                  </label>

                  <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-4 transition ${mode === "selected" ? "border-blue-300 bg-blue-50/70 shadow-sm" : "border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-slate-50"}`}>
                    <input
                      type="radio"
                      name="pdf-mode"
                      value="selected"
                      checked={mode === "selected"}
                      onChange={() => setMode("selected")}
                      disabled={isGenerating}
                      className="mt-1 h-4 w-4 accent-blue-600"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-slate-900">Choose specific lecturers</span>
                      <span className="mt-1 block text-sm text-slate-500">Pick a smaller set when you only need selected lecturer reports.</span>
                    </span>
                  </label>
                </div>
              </div>

              {mode === "selected" ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-base font-semibold text-slate-900">Lecturer Selection</p>
                      <p className="text-sm text-slate-500">Choose the lecturers you want to export.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="px-3 text-xs text-blue-600 hover:text-blue-800"
                        onClick={() => setSelectedKeys(allRows.map((row) => row.key))}
                        disabled={isGenerating || allSelected}
                      >
                        Select all
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="px-3 text-xs text-slate-600 hover:text-slate-800"
                        onClick={() => setSelectedKeys([])}
                        disabled={isGenerating || selectedRows.length === 0}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>

                  <div className="max-h-[48vh] space-y-2 overflow-y-auto pr-1">
                    {allRows.map((row) => {
                      const checked = selectedKeys.includes(row.key);
                      return (
                        <label
                          key={row.key}
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition ${checked ? "border-blue-300 bg-blue-50/70 shadow-sm" : "border-slate-200 bg-slate-50/60 hover:border-slate-300 hover:bg-slate-50"}`}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() =>
                              setSelectedKeys((prev) =>
                                prev.includes(row.key)
                                  ? prev.filter((item) => item !== row.key)
                                  : [...prev, row.key],
                              )
                            }
                            disabled={isGenerating}
                            className="mt-1"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-slate-900">{row.lecturerName}</span>
                            <span className="mt-1 block text-sm text-slate-600">{row.course || "-"}</span>
                            <span className="mt-1 block text-xs text-slate-500">{row.term || "-"} • {row.academicYear || "-"}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="space-y-4 xl:max-h-[calc(94vh-220px)] xl:overflow-y-auto xl:pr-1">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                  Summary
                </div>

                <div className="space-y-3 text-sm text-slate-600">
                  <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 rounded-xl bg-slate-50 px-3 py-3">
                    <span className="font-semibold text-slate-900">Mode</span>
                    <span>{mode === "all" ? "All visible lecturers" : "Selected lecturers only"}</span>
                  </div>
                  <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 rounded-xl bg-slate-50 px-3 py-3">
                    <span className="font-semibold text-slate-900">Rows</span>
                    <span>{allRows.length} lecturer records available</span>
                  </div>
                  <div className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 rounded-xl bg-slate-50 px-3 py-3">
                    <span className="font-semibold text-slate-900">Selection</span>
                    <span>{mode === "all" ? `All ${allRows.length} lecturers will be exported` : selectedSummary}</span>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                  PDF output uses the backend HTML template so the layout matches the evaluation print format.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" size="md" className="h-11 px-5" onClick={onClose} disabled={isGenerating}>
              Cancel
            </Button>
            <Button type="button" onClick={handleConfirm} disabled={isGenerating} className="h-11 bg-gradient-to-r from-blue-600 to-indigo-600 px-5 text-white hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-500">
              {isGenerating ? "Generating..." : "Generate PDF"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}