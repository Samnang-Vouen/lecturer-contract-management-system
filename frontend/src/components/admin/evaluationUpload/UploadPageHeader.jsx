import { FileText, FolderUp, Loader2 } from "lucide-react";
import Button from "../../ui/Button";

export default function UploadPageHeader({ isUploading, isLoading, isGeneratingPdf, onClickUpload, onClickGenerate }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
            <FolderUp className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Lecturer Evaluation</h1>
            <p className="text-sm text-slate-500">Upload Course Evaluation of Each lecturer</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="button" onClick={onClickUpload} disabled={isUploading || isLoading} className="px-5 py-2.5">
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderUp className="h-4 w-4" />} Upload Files
          </Button>
          <Button type="button" variant="secondary" className="border-green-600 bg-green-600 px-5 py-2.5 text-white hover:bg-green-700 hover:border-green-700" onClick={onClickGenerate} disabled={isGeneratingPdf || isLoading}>
            <FileText className="h-4 w-4" />
            {isGeneratingPdf ? "Generating..." : "Generate PDF"}
          </Button>
        </div>
      </div>
    </div>
  );
}