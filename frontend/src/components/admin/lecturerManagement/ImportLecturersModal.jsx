import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Copy, Check, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { importLecturersFromExcel } from '../../../services/lecturer.service';

const RECRUITMENT_SAMPLE_TEMPLATE = '/templates/recruitment_candidate_import_template.xlsx';

function downloadBase64File(base64Content, fileName, mimeType) {
  if (!base64Content || !fileName) return;
  const byteCharacters = atob(base64Content);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i += 1) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Copy failed');
    }
  };
  return (
    <button
      type="button"
      onClick={handle}
      title="Copy password"
      className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}


function downloadRecruitmentSampleTemplate() {
  const a = document.createElement('a');
  a.href = RECRUITMENT_SAMPLE_TEMPLATE;
  a.download = 'recruitment_candidate_import_template.xlsx';
  a.click();
}

export function ImportLecturersPanel({ onClose, onImported, showIntro = true, showCancel = true }) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const fileInputRef = useRef(null);
  const hasInvalidTitleError = results?.errors?.some((err) => /invalid title value/i.test(String(err?.error || '')));
  const hasInvalidGenderError = results?.errors?.some((err) => /invalid gender value/i.test(String(err?.error || '')));
  const hasInvalidHourlyRateError = results?.errors?.some((err) => /invalid hourlyrate value|hourly rate must be a valid positive number/i.test(String(err?.error || '')));

  const acceptFile = (f) => {
    if (!f) return;
    const ok = /\.(xlsx|xls|csv)$/i.test(f.name);
    if (!ok) {
      toast.error('Please upload an Excel (.xlsx / .xls) or CSV file');
      return;
    }
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    acceptFile(e.dataTransfer.files[0]);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const data = await importLecturersFromExcel(file);
      setResults(data);
      if (data.credentialsFileBase64 && data.credentialsFileName) {
        downloadBase64File(
          data.credentialsFileBase64,
          data.credentialsFileName,
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
      }
      if (data.success?.length) {
        onImported?.(data.success);
        toast.success(`${data.success.length} lecturer${data.success.length > 1 ? 's' : ''} imported`);
      }
      if (data.errors?.length && !data.success?.length) {
        toast.error('Import completed with errors');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResults(null);
    onClose?.();
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto px-6 pt-8 pb-5 space-y-5">
        {results ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {results.success?.length || 0} created
              </span>
              {results.errors?.length > 0 && (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-full px-3 py-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {results.errors.length} failed
                </span>
              )}
              <span className="text-sm text-gray-500">{results.total} rows processed</span>
            </div>

            {results.success?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Created accounts — copy passwords and share securely:
                </p>
                {results.credentialsFileBase64 && results.credentialsFileName && (
                  <button
                    type="button"
                    onClick={() => downloadBase64File(
                      results.credentialsFileBase64,
                      results.credentialsFileName,
                      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    )}
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors mb-3"
                  >
                    <Download className="w-4 h-4" />
                    Download email and temporary passwords
                  </button>
                )}
                <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
                  {results.success.map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 px-3 py-2.5 bg-white hover:bg-gray-50">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.email}</p>
                        <p className="text-xs text-gray-500">Row {item.row}</p>
                      </div>
                      {item.tempPassword ? (
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="font-mono text-xs bg-gray-100 border border-gray-200 rounded px-2 py-1 tracking-wide select-none">
                            ••••••••
                          </span>
                          <CopyButton text={item.tempPassword} />
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">no password</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.errors?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-red-700 mb-2">Errors:</p>
                {(hasInvalidTitleError || hasInvalidGenderError || hasInvalidHourlyRateError) && (
                  <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                    <p className="text-xs font-medium text-amber-800">Accepted values</p>
                    {hasInvalidHourlyRateError && (
                      <p className="text-xs text-amber-700 mt-1">
                        Hourly Rate: positive number, for example <span className="font-mono">12.50</span>
                      </p>
                    )}
                    {hasInvalidTitleError && (
                      <p className="text-xs text-amber-700 mt-1">
                        Title: <span className="font-mono">Mr</span>, <span className="font-mono">Ms</span>, <span className="font-mono">Mrs</span>, <span className="font-mono">Dr</span>, <span className="font-mono">Prof</span>
                      </p>
                    )}
                    {hasInvalidGenderError && (
                      <p className="text-xs text-amber-700 mt-1">
                        Gender: <span className="font-mono">male</span>, <span className="font-mono">female</span>, <span className="font-mono">other</span>
                      </p>
                    )}
                  </div>
                )}
                <div className="border border-red-100 rounded-lg overflow-hidden divide-y divide-red-50 max-h-48 overflow-y-auto">
                  {results.errors.map((err, i) => (
                    <div key={i} className="px-3 py-2 bg-red-50">
                      <p className="text-xs font-medium text-red-700">Row {err.row}</p>
                      <p className="text-xs text-red-600 mt-0.5">{err.error}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {showIntro && (
              <p className="text-sm text-gray-600">
                Upload the recruitment-format Excel or CSV file to bulk-create lecturer and advisor accounts.
                A temporary password is generated automatically for each imported user, and a credentials file is returned for download.
                The Hourly Rate column is required and is saved with the imported account.
              </p>
            )}

            <button
              type="button"
              onClick={downloadRecruitmentSampleTemplate}
              className="inline-flex items-center gap-2 text-sm text-emerald-700 hover:text-emerald-900 hover:underline transition-colors"
            >
              <Download className="w-4 h-4" />
              Download recruitment data sample (Excel)
            </button>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                ${dragging
                  ? 'border-blue-400 bg-blue-50'
                  : file
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/40'
                }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => acceptFile(e.target.files?.[0])}
              />

              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <FileSpreadsheet className="w-10 h-10 text-green-500" />
                  <p className="text-sm font-medium text-green-700">{file.name}</p>
                  <p className="text-xs text-green-600">{(file.size / 1024).toFixed(1)} KB — click to change</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-10 h-10 text-gray-300" />
                  <p className="text-sm font-medium text-gray-600">
                    Drop your file here or <span className="text-blue-600">browse</span>
                  </p>
                  <p className="text-xs text-gray-400">.xlsx, .xls, or .csv</p>
                </div>
              )}
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
              <p className="text-xs font-semibold text-amber-800 mb-1">Expected recruitment columns</p>
              <p className="text-xs text-amber-700 font-mono leading-relaxed">
                fullName · email@cadt.edu.kh · Hourly Rate · phone · positionAppliedFor · title(optional) · gender(optional)
              </p>
              <p className="text-xs text-amber-600 mt-2">
                Advisor positions create advisor accounts. All other positions create lecturer accounts.
                Imported emails must use the <span className="font-mono">@cadt.edu.kh</span> domain.
              </p>
              <p className="text-xs text-amber-600 mt-2">
                Hourly Rate is required and must be a positive number.
              </p>
              <p className="text-xs text-amber-600 mt-2">
                Title values: <span className="font-mono">Mr</span>, <span className="font-mono">Ms</span>, <span className="font-mono">Mrs</span>, <span className="font-mono">Dr</span>, <span className="font-mono">Prof</span>. Gender values: <span className="font-mono">male</span>, <span className="font-mono">female</span>, <span className="font-mono">other</span>.
                If title is omitted, the import will infer it from the name prefix or gender when possible.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
        {results ? (
          <button
            onClick={handleClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Done
          </button>
        ) : (
          <>
            {showCancel && (
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleImport}
              disabled={!file || loading}
              className="px-5 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Importing…
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Import
                </>
              )}
            </button>
          </>
        )}
      </div>
    </>
  );
}

export default function ImportLecturersModal({ isOpen, onClose, onImported }) {
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full h-full flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl pointer-events-auto relative flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Import Lecturers from Excel</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <ImportLecturersPanel onClose={onClose} onImported={onImported} />
        </div>
      </div>
    </div>,
    document.body
  );
}