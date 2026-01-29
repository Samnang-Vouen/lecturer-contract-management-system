import React from 'react';
import { Card, CardContent } from '../../ui/Card';
import Button from '../../ui/Button';
import SectionHeader from './SectionHeader';
import DocumentRow from './DocumentRow';
import { FileText, Upload } from 'lucide-react';

export default function DocumentsSection({ 
  profile, 
  editMode, 
  fileUploading, 
  onUploadFiles, 
  onOpenSyllabusDialog 
}) {
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
        {profile.course_syllabus ? (
          <DocumentRow 
            label="Course Syllabus" 
            exists={!!profile.course_syllabus} 
            url={profile.course_syllabus} 
            onUpload={(f) => onUploadFiles({ syllabus: f })} 
            uploading={fileUploading} 
            editable={editMode} 
          />
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
            >
              <Upload className="h-3.5 w-3.5" /> Upload
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
