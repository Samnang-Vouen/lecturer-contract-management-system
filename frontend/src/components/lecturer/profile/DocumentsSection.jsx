import React from 'react';
import { Card, CardContent } from '../../ui/Card';
import Button from '../../ui/Button';
import SectionHeader from './SectionHeader';
import DocumentRow from './DocumentRow';
import { FileText, Upload } from 'lucide-react';
import { buildFileUrl } from '../../../utils/profileUtils';

export default function DocumentsSection({ 
  profile, 
  editMode, 
  fileUploading, 
  onUploadFiles, 
  onOpenSyllabusDialog 
}) {
  const syllabusFilesFromApi = Array.isArray(profile?.course_syllabus_files)
    ? profile.course_syllabus_files
    : null;
  const syllabusFileNamesRaw = profile?.course_syllabus_file_names && typeof profile.course_syllabus_file_names === 'object'
    ? profile.course_syllabus_file_names
    : {};
  const syllabusFilesRaw = (syllabusFilesFromApi && syllabusFilesFromApi.length)
    ? syllabusFilesFromApi
    : (profile?.course_syllabus ? [profile.course_syllabus] : []);
  const syllabusFiles = Array.from(
    new Set((syllabusFilesRaw || []).filter(Boolean).map((p) => String(p).replace(/\\/g, '/')))
  ).sort((a, b) => {
    const an = String(a).split('/').pop() || '';
    const bn = String(b).split('/').pop() || '';
    return bn.localeCompare(an); // timestamped filenames sort newest-first
  });
  const normalizePathKey = (p) => String(p || '').replace(/\\/g, '/').replace(/^\//, '');
  const syllabusFileNames = Object.fromEntries(
    Object.entries(syllabusFileNamesRaw).map(([k, v]) => [normalizePathKey(k), String(v)])
  );
  const friendlyStoredName = (p) => {
    const base = String(p).split('/').pop() || '';
    const m = base.match(/^syllabus_\d+_(\d+)\.pdf$/i);
    if (m) return `Syllabus ${m[1]}.pdf`;
    const m2 = base.match(/^syllabus_\d+\.pdf$/i);
    if (m2) return 'Syllabus.pdf';
    return base || 'syllabus.pdf';
  };
  const syllabusNameOf = (p) => {
    const key = normalizePathKey(p);
    return syllabusFileNames[key] || friendlyStoredName(p);
  };

  return (
    <Card className="shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 bg-white rounded-2xl border border-gray-100/70">
      <SectionHeader title="Documents" icon={<FileText className="h-4 w-4" />} accent="emerald" />
      <CardContent className="pt-5 space-y-4">
        <DocumentRow 
          label="Curriculum Vitae (CV)" 
          exists={!!profile.cv_file_path} 
          url={profile.cv_file_path} 
          onUpload={(f) => onUploadFiles({ cv: f })} 
          uploading={fileUploading} 
          editable={editMode} 
        />
        {syllabusFiles.length ? (
          <div className="text-sm p-4 rounded-xl border border-dashed border-gray-200 hover:border-gray-300 transition-colors bg-gradient-to-br from-white to-gray-50/70 group">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-gray-800 flex items-center gap-2 tracking-wide min-w-0">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shadow flex-shrink-0" />
                  <span className="truncate">Course Syllabus</span>
                  <span className="text-[11px] text-emerald-600 font-medium flex-shrink-0">
                    ({syllabusFiles.length} file{syllabusFiles.length === 1 ? '' : 's'})
                  </span>
                </p>
                <p className="text-[11px] mt-1 text-emerald-600 font-medium">Uploaded</p>
              </div>

              <Button
                type="button"
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1 shadow-sm flex-shrink-0"
                onClick={onOpenSyllabusDialog}
                disabled={fileUploading}
              >
                <Upload className="h-3.5 w-3.5" /> {fileUploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>

            <div className="mt-3 max-h-28 overflow-auto pr-1 space-y-1">
              {syllabusFiles.map((p) => {
                const name = syllabusNameOf(p);
                return (
                  <a
                    key={p}
                    href={buildFileUrl(p)}
                    target="_blank"
                    rel="noreferrer"
                    title={name}
                    className="flex items-center gap-2 bg-white/60 border border-gray-200 rounded-lg px-2.5 py-1.5 text-[11px] text-gray-800 hover:border-gray-300 hover:bg-white transition-colors"
                    aria-label={`Download ${name}`}
                  >
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-300 flex-shrink-0" />
                    <span className="truncate font-medium">{name}</span>
                  </a>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 text-sm p-4 rounded-xl border border-dashed border-gray-200 bg-gradient-to-br from-white to-gray-50/70">
            <div className="w-full sm:w-auto">
              <p className="font-medium text-gray-800 flex items-center gap-2 tracking-wide">
                <span className="inline-block w-2 h-2 rounded-full bg-gray-300 shadow" />
                Course Syllabus{' '}
                <span className="text-[10px] font-normal text-gray-400 uppercase tracking-wider">
                  Required
                </span>
              </p>
              <p className="text-[11px] mt-1 text-gray-400">Not uploaded</p>
            </div>
            <Button 
              type="button" 
              size="sm" 
              className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1 shadow-sm w-full sm:w-auto" 
              onClick={onOpenSyllabusDialog}
              disabled={fileUploading}
            >
              <Upload className="h-3.5 w-3.5" /> {fileUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
