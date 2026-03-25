import React, { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import GeneratePdfModal from "../../components/admin/evaluationUpload/GeneratePdfModal";
import LecturerEvaluationTable from "../../components/admin/evaluationUpload/LecturerEvaluationTable";
import LecturerSearchBar from "../../components/admin/evaluationUpload/LecturerSearchBar";
import UploadModal from "../../components/admin/evaluationUpload/UploadModal";
import UploadPageHeader from "../../components/admin/evaluationUpload/UploadPageHeader";
import { useEvaluationUploadData } from "../../hooks/admin/evaluationUpload/useEvaluationUploadData";
import { useEvaluationPdfGeneration } from "../../hooks/admin/evaluationUpload/useEvaluationPdfGeneration";
import { useEvaluationUploadSubmission } from "../../hooks/admin/evaluationUpload/useEvaluationUploadSubmission";
import { normalize } from "../../utils/evaluationUpload/common";
import { getAcceptedEvaluationMappings } from "../../utils/evaluationUpload/uploadScope";
import { useAuthStore } from "../../store/useAuthStore";

export default function UploadEvaluation() {
  const { authUser } = useAuthStore();
  const { mappings, rows, isLoading, loadRows } = useEvaluationUploadData(authUser);
  const { isGeneratingPdf, handleGeneratePDF } = useEvaluationPdfGeneration();
  const {
    isUploading,
    uploadResult,
    setUploadResult,
    handleFileSelect,
  } = useEvaluationUploadSubmission(loadRows);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);

  const visibleRows = useMemo(() => {
    const keyword = normalize(search);
    return rows.filter(
      (row) =>
        !keyword ||
        normalize(row.lecturerName).includes(keyword) ||
        normalize(row.lecturerEmail).includes(keyword),
    );
  }, [rows, search]);

  const maxGroupColumns = useMemo(() => {
    if (!visibleRows.length) return 1;
    return Math.max(...visibleRows.map((row) => row.groupNames.length || 0), 1);
  }, [visibleRows]);

  const onClickUpload = useCallback(() => {
    if (!getAcceptedEvaluationMappings(mappings).length) {
      toast.error("No accepted lecturer mappings are available for upload");
      return;
    }
    setUploadResult(null);
    setModalOpen(true);
  }, [mappings, setUploadResult]);

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
      <UploadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleFileSelect}
        isUploading={isUploading}
        mappings={mappings}
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
          <UploadPageHeader
            isUploading={isUploading}
            isLoading={isLoading}
            isGeneratingPdf={isGeneratingPdf}
            onClickUpload={onClickUpload}
            onClickGenerate={onClickGenerate}
          />
          <LecturerSearchBar search={search} setSearch={setSearch} />
          <LecturerEvaluationTable
            visibleRows={visibleRows}
            rows={rows}
            isLoading={isLoading}
            maxGroupColumns={maxGroupColumns}
          />
        </div>
      </div>
    </>
  );
}
