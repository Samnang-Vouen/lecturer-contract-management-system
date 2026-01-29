import React from 'react';
import Textarea from '../../ui/Textarea';
import FileUploadBox from './FileUploadBox';
import ResearchFieldInput from './ResearchFieldInput';
import CourseMultiSelect from './CourseMultiSelect';

const SHORT_BIO_MAX = 160;

/**
 * Step 2: Academic Information
 */
export default function OnboardingAcademicInfo({ 
  formData, 
  updateForm,
  setFormData,
  files, 
  handleFileUpload,
  researchFields,
  setResearchFields,
  onAddResearchField,
  researchFieldsAPI,
  departmentsCatalog,
  availableCourseNames
}) {
  const handleDepartmentToggle = (deptName) => {
    setFormData(prev => {
      const set = new Set(prev.departments);
      if (set.has(deptName)) {
        set.delete(deptName);
      } else {
        set.add(deptName);
      }
      
      const newDepartments = Array.from(set);
      
      // Filter courses to only keep those available in selected departments
      const deptIds = new Set(
        departmentsCatalog
          .filter(dep => newDepartments.includes(dep.dept_name))
          .map(dep => dep.id)
      );
      
      const available = formData.courses.filter(c => availableCourseNames.includes(c));
      
      return { 
        ...prev, 
        departments: newDepartments, 
        courses: available 
      };
    });
  };

  const handleShortBioChange = (e) => {
    updateForm('shortBio', String(e.target.value || '').slice(0, SHORT_BIO_MAX));
  };

  const handleShortBioPaste = (e) => {
    const pasted = (e.clipboardData || window.clipboardData).getData('text') || '';
    e.preventDefault();
    const current = formData.shortBio || '';
    const combined = (current + pasted).slice(0, SHORT_BIO_MAX);
    updateForm('shortBio', combined);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* Departments */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-gray-700">
              Departments <span className="text-red-500" aria-hidden="true">*</span>
              <span className="sr-only"> required</span>
            </label>
            <span className="text-xs text-gray-500">Select one or more</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {departmentsCatalog.map(d => {
              const active = formData.departments.includes(d.dept_name);
              return (
                <button
                  type="button"
                  key={d.id}
                  onClick={() => handleDepartmentToggle(d.dept_name)}
                  className={`px-3 py-1.5 rounded-full border text-xs md:text-sm font-medium transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                    active 
                      ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  {d.dept_name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Courses */}
        {formData.departments.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-gray-700">
                Courses <span className="text-red-500" aria-hidden="true">*</span>
                <span className="sr-only"> required</span>
              </label>
              <span className="text-xs text-gray-500">Multiple selection</span>
            </div>
            <CourseMultiSelect
              selected={formData.courses}
              onChange={(next) => setFormData(prev => ({ ...prev, courses: next }))}
              options={availableCourseNames}
            />
          </div>
        )}

        {/* Short Bio */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Short Bio <span className="text-red-500" aria-hidden="true">*</span>
            <span className="sr-only"> required</span>
          </label>
          <Textarea
            value={formData.shortBio}
            onChange={handleShortBioChange}
            onPaste={handleShortBioPaste}
            placeholder="Write a brief professional biography (2-3 sentences)"
            rows={4}
            maxLength={SHORT_BIO_MAX}
            required
          />
          <p className="text-xs text-gray-500">
            {(formData.shortBio || '').length}/{SHORT_BIO_MAX} characters
          </p>
        </div>

        {/* Research Fields */}
        <ResearchFieldInput
          researchFields={researchFields}
          onAdd={onAddResearchField}
          onRemove={(field) => setResearchFields(researchFields.filter(f => f !== field))}
          researchFieldsAPI={researchFieldsAPI}
        />
      </div>

      {/* File Uploads */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FileUploadBox
          file={files.courseSyllabusFile}
          onFileSelect={(file) => handleFileUpload(file, "syllabus")}
          accept=".pdf,.doc,.docx"
          label="Course Syllabus"
          description="PDF, DOC, or DOCX files"
          id="syllabus-upload"
        />

        <FileUploadBox
          file={files.updatedCvFile}
          onFileSelect={(file) => handleFileUpload(file, "cv")}
          accept=".pdf,.doc,.docx"
          label="Updated CV"
          description="PDF, DOC, or DOCX files"
          required
          id="cv-upload"
        />
      </div>
    </div>
  );
}
