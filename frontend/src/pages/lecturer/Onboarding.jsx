import React, { useMemo, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useResearchFields } from '../../hooks/useResearchFields';
import { useUniversities } from '../../hooks/useUniversities';
import { useMajors } from '../../hooks/useMajors';
import { advisorSteps, lecturerSteps } from '../../hooks/lecturer/onboarding/onboardingSteps';
import { useOnboardingDerivedData } from '../../hooks/lecturer/onboarding/useOnboardingDerivedData';
import { useOnboardingForm } from '../../hooks/lecturer/onboarding/useOnboardingForm';
import { useOnboardingPrefill } from '../../hooks/lecturer/onboarding/useOnboardingPrefill';
import { useOnboardingStatusCheck } from '../../hooks/lecturer/onboarding/useOnboardingStatusCheck';
import { useOnboardingSubmission } from '../../hooks/lecturer/onboarding/useOnboardingSubmission';
import { useCatalogData } from '../../hooks/lecturer/onboarding/useCatalogData';
import { usePhoneValidation } from '../../hooks/lecturer/onboarding/usePhoneValidation';
import OnboardingNavigation from '../../components/lecturer/onboarding/OnboardingNavigation';
import OnboardingPageHeader from '../../components/lecturer/onboarding/OnboardingPageHeader';
import OnboardingStepContent from '../../components/lecturer/onboarding/OnboardingStepContent';
import OnboardingStepIndicator from '../../components/lecturer/onboarding/OnboardingStepIndicator';
import OnboardingStepPanel from '../../components/lecturer/onboarding/OnboardingStepPanel';
import { useNavigate } from 'react-router-dom';

export default function Onboarding() {
  const { authUser } = useAuthStore();
  const navigate = useNavigate();
  const isAdvisor = String(authUser?.role || '').toLowerCase() === 'advisor';
  const steps = useMemo(() => (isAdvisor ? advisorSteps : lecturerSteps), [isAdvisor]);
  const { formData, setFormData, files, researchFields, setResearchFields, updateForm, handleFileUpload } = useOnboardingForm();
  const { phoneNumber, phoneE164, handlePhoneChange, validatePhone } = usePhoneValidation(formData.phoneNumber);
  const { departmentsCatalog, coursesCatalog, getAvailableCourses, getCourseIds } = useCatalogData();
  const { researchFields: researchFieldsAPI, createResearchField } = useResearchFields();
  const { universities } = useUniversities();
  const { majors } = useMajors();

  useOnboardingPrefill(formData, setFormData, handlePhoneChange);
  useOnboardingStatusCheck({ isAdvisor, navigate });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { availableCourseNames, universitySuggestions, majorSuggestions } = useOnboardingDerivedData({
    formData,
    getAvailableCourses,
    universities,
    majors,
  });
  const { addResearchFieldValue: addResearchFieldInput, handleSubmit } = useOnboardingSubmission({
    authUser,
    isAdvisor,
    steps,
    formData,
    files,
    researchFields,
    researchFieldsAPI,
    createResearchField,
    validatePhone,
    phoneE164,
    getCourseIds,
    navigate,
    setCurrentStep,
    setIsSubmitting,
  });

  const addResearchFieldValue = async (value) => {
    const nextValue = await addResearchFieldInput(value);
    if (nextValue) setResearchFields((prev) => [...prev, nextValue]);
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

  const currentStepConfig = steps[currentStep - 1];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <OnboardingPageHeader />

        <OnboardingStepIndicator steps={steps} currentStep={currentStep} />

        <OnboardingStepPanel step={currentStepConfig}>
          <OnboardingStepContent
            stepKey={currentStepConfig?.key}
            formData={formData}
            updateForm={updateForm}
            setFormData={setFormData}
            files={files}
            handleFileUpload={handleFileUpload}
            researchFields={researchFields}
            setResearchFields={setResearchFields}
            addResearchFieldValue={addResearchFieldValue}
            researchFieldsAPI={researchFieldsAPI}
            departmentsCatalog={departmentsCatalog}
            availableCourseNames={availableCourseNames}
            universitySuggestions={universitySuggestions}
            majorSuggestions={majorSuggestions}
            phoneNumber={phoneNumber}
            handlePhoneChange={handlePhoneChange}
          />
        </OnboardingStepPanel>

        <OnboardingNavigation
          currentStep={currentStep}
          stepCount={steps.length}
          handlePrevious={handlePrevious}
          handleNext={handleNext}
          handleSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
