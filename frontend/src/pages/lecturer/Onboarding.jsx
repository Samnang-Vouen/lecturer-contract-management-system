import React, { useState, useMemo } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { submitLecturerOnboarding } from '../../services/lecturerProfile.service';
import { useResearchFields } from '../../hooks/useResearchFields';
import { useUniversities } from '../../hooks/useUniversities';
import { useMajors } from '../../hooks/useMajors';
import { useOnboardingForm } from '../../hooks/lecturer/onboarding/useOnboardingForm';
import { useOnboardingPrefill } from '../../hooks/lecturer/onboarding/useOnboardingPrefill';
import { useCatalogData } from '../../hooks/lecturer/onboarding/useCatalogData';
import { usePhoneValidation } from '../../hooks/lecturer/onboarding/usePhoneValidation';
import { validateAccountNumber, validateEmail, digitsOnlyPattern } from '../../utils/inputValidation';
import Button from '../../components/ui/Button';
import OnboardingStepIndicator from '../../components/lecturer/onboarding/OnboardingStepIndicator';
import OnboardingBasicInfo from '../../components/lecturer/onboarding/OnboardingBasicInfo';
import OnboardingAcademicInfo from '../../components/lecturer/onboarding/OnboardingAcademicInfo';
import OnboardingEducation from '../../components/lecturer/onboarding/OnboardingEducation';
import OnboardingProfessional from '../../components/lecturer/onboarding/OnboardingProfessional';
import OnboardingContact from '../../components/lecturer/onboarding/OnboardingContact';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  User,
  GraduationCap,
  Briefcase,
  Phone,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const steps = [
  { id: 1, title: "Basic Information", icon: User, description: "Personal and banking details" },
  { id: 2, title: "Academic Info", icon: GraduationCap, description: "Course and research information" },
  { id: 3, title: "Education", icon: GraduationCap, description: "Educational background" },
  { id: 4, title: "Professional", icon: Briefcase, description: "Work experience" },
  { id: 5, title: "Contact", icon: Phone, description: "Contact information" },
];

export default function Onboarding() {
  const { authUser } = useAuthStore();
  const navigate = useNavigate();
  
  // Custom hooks
  const { formData, setFormData, files, researchFields, setResearchFields, updateForm, handleFileUpload } = useOnboardingForm();
  const { phoneNumber, phoneE164, handlePhoneChange, validatePhone } = usePhoneValidation(formData.phoneNumber);
  const { departmentsCatalog, coursesCatalog, getAvailableCourses, getCourseIds } = useCatalogData();
  const { researchFields: researchFieldsAPI, createResearchField } = useResearchFields();
  const { universities } = useUniversities();
  const { majors } = useMajors();
  
  // Prefill form data from existing records
  useOnboardingPrefill(formData, setFormData, handlePhoneChange);
  
  // Local state
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Computed values
  const availableCourseNames = useMemo(() => 
    getAvailableCourses(formData.departments), 
    [formData.departments, getAvailableCourses]
  );

  const universitySuggestions = useMemo(() => {
    const q = String(formData.universityName || '').trim().toLowerCase();
    if (!q) return [];
    return universities
      .map(u => u.name)
      .filter(u => u.toLowerCase().startsWith(q))
      .slice(0, 8);
  }, [formData.universityName, universities]);

  const majorSuggestions = useMemo(() => {
    const q = String(formData.majorName || '').trim().toLowerCase();
    if (!q) return [];
    return majors
      .map(m => m.name)
      .filter(m => m.toLowerCase().startsWith(q))
      .slice(0, 8);
  }, [formData.majorName, majors]);

  // Research field handlers
  const addResearchFieldValue = async (value) => {
    const v = String(value || '').trim();
    if (!v) return;
    if (researchFields.includes(v)) return;
    
    const existsInAPI = researchFieldsAPI.some(rf => rf.name.toLowerCase() === v.toLowerCase());
    
    if (!existsInAPI) {
      try {
        await createResearchField(v);
        toast.success(`Added new research field: ${v}`);
      } catch (error) {
        console.error('Error creating research field:', error);
        toast.error('Failed to save research field to database, but added locally');
      }
    }
    
    setResearchFields(prev => [...prev, v]);
  };

  // Navigation handlers
  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Form submission
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Step 1: Basic info validations
      if (!String(formData.englishName || '').trim()) {
        toast.error('Please enter your English name');
        setCurrentStep(1);
        setIsSubmitting(false);
        return;
      }
      if (!String(formData.khmerName || '').trim()) {
        toast.error('Please enter your Khmer name');
        setCurrentStep(1);
        setIsSubmitting(false);
        return;
      }
      if (!String(formData.accountHolderName || '').trim()) {
        toast.error('Please enter the account holder name');
        setCurrentStep(1);
        setIsSubmitting(false);
        return;
      }
      if (!String(formData.bankName || '').trim()) {
        toast.error('Please select your bank');
        setCurrentStep(1);
        setIsSubmitting(false);
        return;
      }
      if (!files.payrollFile) {
        toast.error('Please upload your payroll document');
        setCurrentStep(1);
        setIsSubmitting(false);
        return;
      }
      if (!validateAccountNumber(formData.accountName)) {
        toast.error('Account number must contain exactly 16 digits');
        setCurrentStep(1);
        setIsSubmitting(false);
        return;
      }

      // Step 2: Academic info validations
      if (!formData.departments || formData.departments.length === 0) {
        toast.error('Please select at least one department');
        setCurrentStep(2);
        setIsSubmitting(false);
        return;
      }
      if (!formData.courses || formData.courses.length === 0) {
        toast.error('Please select at least one course');
        setCurrentStep(2);
        setIsSubmitting(false);
        return;
      }
      if (!String(formData.shortBio || '').trim()) {
        toast.error('Please enter a short bio');
        setCurrentStep(2);
        setIsSubmitting(false);
        return;
      }
      if (!files.updatedCvFile) {
        toast.error('Please upload your updated CV');
        setCurrentStep(2);
        setIsSubmitting(false);
        return;
      }

      // Step 3: Education validations
      if (!String(formData.universityName || '').trim()) {
        toast.error('Please enter your university name');
        setCurrentStep(3);
        setIsSubmitting(false);
        return;
      }
      if (!String(formData.country || '').trim()) {
        toast.error('Please enter your country');
        setCurrentStep(3);
        setIsSubmitting(false);
        return;
      }
      if (!String(formData.majorName || '').trim()) {
        toast.error('Please enter your major');
        setCurrentStep(3);
        setIsSubmitting(false);
        return;
      }
      if (!String(formData.graduationYear || '').trim()) {
        toast.error('Please select your graduation year');
        setCurrentStep(3);
        setIsSubmitting(false);
        return;
      }
      if (!String(formData.latestDegree || '').trim()) {
        toast.error('Please select your latest degree');
        setCurrentStep(3);
        setIsSubmitting(false);
        return;
      }

      // Step 4: Professional validations
      if (!String(formData.occupation || '').trim()) {
        toast.error('Please enter your current occupation');
        setCurrentStep(4);
        setIsSubmitting(false);
        return;
      }
      if (!String(formData.placeOfWork || '').trim()) {
        toast.error('Please enter your place of work');
        setCurrentStep(4);
        setIsSubmitting(false);
        return;
      }

      // Step 5: Contact validations
      if (!String(formData.schoolEmail || authUser?.email || '').trim()) {
        toast.error('Missing school email');
        setCurrentStep(5);
        setIsSubmitting(false);
        return;
      }
      
      const phoneValidation = validatePhone();
      if (!phoneValidation.valid) {
        toast.error(phoneValidation.error);
        setCurrentStep(5);
        setIsSubmitting(false);
        return;
      }
      
      if (!validateEmail(formData.personalEmail)) {
        toast.error('Please enter a valid personal email (must include @)');
        setCurrentStep(5);
        setIsSubmitting(false);
        return;
      }

      // Build FormData for submission
      const fd = new FormData();
      
      fd.append('full_name_english', formData.englishName || '');
      fd.append('full_name_khmer', formData.khmerName || '');
      fd.append('bank_name', formData.bankName || '');
      fd.append('account_name', formData.accountHolderName || '');
      fd.append('account_number', formData.accountName || '');
      fd.append('short_bio', formData.shortBio || '');
      fd.append('university', formData.universityName || '');
      fd.append('country', formData.country || '');
      fd.append('major', formData.majorName || '');
      fd.append('degree_year', formData.graduationYear || '');
      fd.append('latest_degree', formData.latestDegree === 'ASSOCIATE' ? 'OTHER' : (formData.latestDegree || ''));
      fd.append('occupation', formData.occupation || '');
      fd.append('place', formData.placeOfWork || '');
      fd.append('phone_number', phoneE164 || formData.phoneNumber || '');
      fd.append('personal_email', formData.personalEmail || '');
      
      fd.append('research_fields', researchFields.join(', '));
      
      if (formData.departments.length) fd.append('departments', formData.departments.join(', '));
      if (formData.courses.length) {
        fd.append('courses', formData.courses.join(', '));
        const selectedIds = getCourseIds(formData.courses);
        if (selectedIds.length) fd.append('course_ids', selectedIds.join(','));
      }
      
      if (files.updatedCvFile) fd.append('cv', files.updatedCvFile);
      if (files.courseSyllabusFile) fd.append('syllabus', files.courseSyllabusFile);
      if (files.payrollFile) fd.append('payroll', files.payrollFile);
      
      const res = await submitLecturerOnboarding(fd);
      const unmatched = res?.profile?.unmatched_courses || [];
      
      if (unmatched.length) {
        toast.error(`Some courses not matched: ${unmatched.slice(0, 3).join(', ')}`);
      } else {
        toast.success('Onboarding completed successfully!');
      }
      
      // Notify other tabs
      try {
        const payload = {
          type: 'onboarding_complete',
          userId: authUser?.id || res?.profile?.user_id || null,
          profileId: res?.profile?.id || null,
          timestamp: Date.now()
        };
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const bc = new BroadcastChannel('lecturer-updates');
          bc.postMessage(payload);
          bc.close();
        }
        localStorage.setItem('lecturer-onboarding-update', JSON.stringify(payload));
        setTimeout(() => {
          try { localStorage.removeItem('lecturer-onboarding-update'); } catch {}
        }, 300);
      } catch {}
      
      // Small delay to ensure backend has processed the completion before redirect
      setTimeout(() => {
        navigate('/lecturer');
      }, 100);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to submit onboarding');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <OnboardingBasicInfo
            formData={formData}
            updateForm={updateForm}
            files={files}
            handleFileUpload={handleFileUpload}
          />
        );

      case 2:
        return (
          <OnboardingAcademicInfo
            formData={formData}
            updateForm={updateForm}
            setFormData={setFormData}
            files={files}
            handleFileUpload={handleFileUpload}
            researchFields={researchFields}
            setResearchFields={setResearchFields}
            onAddResearchField={addResearchFieldValue}
            researchFieldsAPI={researchFieldsAPI}
            departmentsCatalog={departmentsCatalog}
            availableCourseNames={availableCourseNames}
          />
        );

      case 3:
        return (
          <OnboardingEducation
            formData={formData}
            updateForm={updateForm}
            universitySuggestions={universitySuggestions}
            majorSuggestions={majorSuggestions}
          />
        );

      case 4:
        return (
          <OnboardingProfessional
            formData={formData}
            updateForm={updateForm}
          />
        );

      case 5:
        return (
          <OnboardingContact
            formData={formData}
            updateForm={updateForm}
            phoneNumber={phoneNumber}
            handlePhoneChange={handlePhoneChange}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-800 mb-2">
            Welcome to the University!
          </h1>
          <p className="text-blue-600">Please complete your profile to get started</p>
        </div>

        <OnboardingStepIndicator steps={steps} currentStep={currentStep} />

        {/* Step Content */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-blue-800 flex items-center mb-2">
              {React.createElement(steps[currentStep - 1].icon, { className: "h-5 w-5 mr-2" })}
              {steps[currentStep - 1].title}
            </h2>
            <p className="text-blue-600 text-sm">{steps[currentStep - 1].description}</p>
          </div>
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handlePrevious} 
            disabled={currentStep === 1}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-md flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />Previous
          </Button>
          {currentStep === steps.length ? (
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-2 bg-black text-white hover:bg-gray-800 rounded-md flex items-center disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isSubmitting ? (
                <span className="flex items-center">Submitting...</span>
              ) : (
                <span className="flex items-center">Complete Onboarding</span>
              )}
            </Button>
          ) : (
            <Button 
              onClick={handleNext}
              className="w-full sm:w-auto px-6 py-2 bg-black text-white hover:bg-gray-800 rounded-md flex items-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
