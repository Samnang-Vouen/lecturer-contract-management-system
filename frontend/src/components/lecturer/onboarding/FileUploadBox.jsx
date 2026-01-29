import React from 'react';
import { Upload, FileText } from 'lucide-react';
import Button from '../../ui/Button';

/**
 * Reusable file upload component with preview
 */
export default function FileUploadBox({ 
  file, 
  onFileSelect, 
  accept, 
  label, 
  description,
  required = false,
  id 
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">
        {label} 
        {required && (
          <>
            <span className="text-red-500" aria-hidden="true">*</span>
            <span className="sr-only"> required</span>
          </>
        )}
      </label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors duration-200">
        {file ? (
          <div className="flex items-center justify-center space-x-2">
            <FileText className="h-6 w-6 text-green-600" />
            <span className="text-sm text-gray-700 font-semibold">{file.name}</span>
          </div>
        ) : (
          <div>
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">{label}</p>
            {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
          </div>
        )}
        <input
          type="file"
          accept={accept}
          onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])}
          className="hidden"
          id={id}
        />
        <Button 
          variant="outline" 
          className="mt-3 border-gray-300 text-gray-700 hover:bg-gray-50"
          onClick={() => document.getElementById(id).click()}
        >
          Choose File
        </Button>
      </div>
    </div>
  );
}
