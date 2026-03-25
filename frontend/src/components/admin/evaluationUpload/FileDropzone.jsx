import { FileSpreadsheet, UploadCloud } from "lucide-react";
import Button from "../../ui/Button";

export default function FileDropzone({
  fileInputRef,
  selectedFile,
  setSelectedFile,
  setLocalError,
  isUploading,
}) {
  const handleDrop = (event) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      setSelectedFile(event.dataTransfer.files[0]);
      setLocalError("");
    }
  };

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setLocalError("");
    }
  };

  return (
    <div
      className="rounded-2xl border border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-blue-50/70 p-5 text-center shadow-sm sm:p-8"
      onDrop={handleDrop}
      onDragOver={(event) => event.preventDefault()}
    >
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
        {selectedFile ? <FileSpreadsheet className="h-7 w-7" /> : <UploadCloud className="h-7 w-7" />}
      </div>
      <div className="mb-1 text-base font-semibold text-slate-900">Excel File (.xlsx or .xls)</div>
      <div className="mb-4 text-sm text-slate-500">Drop your file here or browse from your device.</div>
      <Button
        variant="primary"
        size="md"
        className="px-6"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        <UploadCloud className="mr-2 h-4 w-4" />
        Choose Files
      </Button>
      {selectedFile ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-left shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Selected File</p>
          <p className="mt-1 break-all text-sm font-medium text-slate-800">{selectedFile.name}</p>
        </div>
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
  );
}