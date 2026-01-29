import { useState } from 'react';

/**
 * Hook to manage onboarding form state
 */
export const useOnboardingForm = () => {
  const [formData, setFormData] = useState({
    // Basic Info
    englishName: '',
    khmerName: '',
    accountName: '',
    bankName: 'ACLEDA Bank',
    accountHolderName: '',
    
    // Academic Info
    shortBio: '',
    researchFields: [],
    departments: [],
    courses: [],
    
    // Education
    universityName: '',
    country: '',
    majorName: '',
    graduationYear: '',
    latestDegree: '',
    
    // Professional
    occupation: '',
    placeOfWork: '',
    
    // Contact
    phoneNumber: '',
    personalEmail: '',
    schoolEmail: ''
  });

  const [files, setFiles] = useState({
    courseSyllabusFile: null,
    updatedCvFile: null,
    payrollFile: null
  });

  const [researchFields, setResearchFields] = useState([]);

  const updateForm = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleFileUpload = (file, type) => {
    if (type === "syllabus") {
      setFiles(prev => ({ ...prev, courseSyllabusFile: file }));
    } else if (type === "cv") {
      setFiles(prev => ({ ...prev, updatedCvFile: file }));
    } else if (type === "payroll") {
      setFiles(prev => ({ ...prev, payrollFile: file }));
    }
  };

  return {
    formData,
    setFormData,
    files,
    researchFields,
    setResearchFields,
    updateForm,
    handleFileUpload
  };
};
