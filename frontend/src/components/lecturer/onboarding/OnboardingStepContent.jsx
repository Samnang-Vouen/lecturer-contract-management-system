import React from 'react';
import OnboardingAcademicInfo from './OnboardingAcademicInfo';
import OnboardingBasicInfo from './OnboardingBasicInfo';
import OnboardingContact from './OnboardingContact';
import OnboardingEducation from './OnboardingEducation';
import OnboardingProfessional from './OnboardingProfessional';

export default function OnboardingStepContent(props) {
  switch (props.stepKey) {
    case 'basic':
      return <OnboardingBasicInfo formData={props.formData} updateForm={props.updateForm} files={props.files} handleFileUpload={props.handleFileUpload} />;
    case 'academic':
      return (
        <OnboardingAcademicInfo
          formData={props.formData}
          updateForm={props.updateForm}
          setFormData={props.setFormData}
          files={props.files}
          handleFileUpload={props.handleFileUpload}
          researchFields={props.researchFields}
          setResearchFields={props.setResearchFields}
          onAddResearchField={props.addResearchFieldValue}
          researchFieldsAPI={props.researchFieldsAPI}
          departmentsCatalog={props.departmentsCatalog}
          availableCourseNames={props.availableCourseNames}
        />
      );
    case 'education':
      return <OnboardingEducation formData={props.formData} updateForm={props.updateForm} universitySuggestions={props.universitySuggestions} majorSuggestions={props.majorSuggestions} />;
    case 'professional':
      return <OnboardingProfessional formData={props.formData} updateForm={props.updateForm} />;
    case 'contact':
      return <OnboardingContact formData={props.formData} updateForm={props.updateForm} phoneNumber={props.phoneNumber} handlePhoneChange={props.handlePhoneChange} />;
    default:
      return null;
  }
}