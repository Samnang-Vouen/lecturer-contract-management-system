import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { downloadLecturerEvaluationPdf } from "../../../services/evaluation.service";
import { toArray } from "../../../utils/evaluationUpload/common";

export function useEvaluationPdfGeneration() {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleGeneratePDF = useCallback(async (targetRows, options = {}) => {
    const rowsToGenerate = toArray(targetRows);
    if (!rowsToGenerate.length) {
      toast.error("No lecturer rows to export");
      return;
    }

    setIsGeneratingPdf(true);

    try {
      let generatedCount = 0;
      for (const row of rowsToGenerate) {
        const evaluationId = Number(row?.evaluationId);
        const lecturerId = Number(row?.lecturerId);
        if (!Number.isInteger(evaluationId) || evaluationId <= 0) {
          throw new Error("Missing evaluation id for PDF generation");
        }
        if (!Number.isInteger(lecturerId) || lecturerId <= 0) {
          throw new Error("Missing lecturer id for PDF generation");
        }

        const blob = await downloadLecturerEvaluationPdf(evaluationId, lecturerId);
        downloadPdfBlob(blob, buildPdfFileName(row));
        generatedCount += 1;
      }

      toast.success(
        generatedCount === 1
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

  return { isGeneratingPdf, handleGeneratePDF };
}

function buildPdfFileName(row) {
  const sanitize = (value, fallback) =>
    String(value || fallback).replace(/[^a-zA-Z0-9-_ ]/g, "").trim().replace(/\s+/g, "_") || fallback;
  return `evaluation_${sanitize(row.lecturerName, "lecturer")}_${sanitize(row.course, "course")}_${sanitize(row.term, "term")}.pdf`;
}

function downloadPdfBlob(blob, fileName) {
  const url = window.URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}