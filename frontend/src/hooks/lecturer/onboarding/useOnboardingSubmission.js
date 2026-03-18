import toast from 'react-hot-toast';
import { submitAdvisorOnboarding, submitLecturerOnboarding } from '../../../services/lecturerProfile.service';
import {
  buildOnboardingFormData,
  notifyOnboardingComplete,
  validateOnboardingSubmission,
} from './onboardingSubmission.helpers';

export function useOnboardingSubmission({
  authUser, isAdvisor, steps, formData, files, researchFields, researchFieldsAPI,
  createResearchField, validatePhone, phoneE164, getCourseIds, navigate, setCurrentStep, setIsSubmitting,
}) {
  const goToStep = (key) => {
    const idx = steps.findIndex((step) => step.key === key);
    if (idx >= 0) setCurrentStep(idx + 1);
  };

  const addResearchFieldValue = async (value) => {
    const nextValue = String(value || '').trim();
    if (!nextValue || researchFields.includes(nextValue)) return;
    const existsInAPI = researchFieldsAPI.some((field) => field.name.toLowerCase() === nextValue.toLowerCase());
    if (!existsInAPI) {
      try {
        await createResearchField(nextValue);
        toast.success(`Added new research field: ${nextValue}`);
      } catch (error) {
        console.error('Error creating research field:', error);
        toast.error('Failed to save research field to database, but added locally');
      }
    }
    return nextValue;
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const validationError = validateOnboardingSubmission({ formData, files, isAdvisor, authUser, validatePhone });
      if (validationError) {
        toast.error(validationError.message);
        goToStep(validationError.stepKey);
        return;
      }

      const fd = buildOnboardingFormData({ formData, files, isAdvisor, phoneE164, researchFields, getCourseIds });
      const response = await (isAdvisor ? submitAdvisorOnboarding(fd) : submitLecturerOnboarding(fd));
      const unmatched = response?.profile?.unmatched_courses || [];
      const redirectPath = isAdvisor ? '/advisor' : '/lecturer';

      if (response?.alreadyCompleted) toast.success('Onboarding already completed');
      else if (unmatched.length) toast.error(`Some courses not matched: ${unmatched.slice(0, 3).join(', ')}`);
      else toast.success('Onboarding completed successfully!');

      notifyOnboardingComplete({ authUser, profile: response?.profile });

      if (response?.alreadyCompleted) navigate(redirectPath, { replace: true });
      else if (!unmatched.length) setTimeout(() => navigate(redirectPath, { replace: true }), 1500);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 400 && error.response?.data?.message === 'Onboarding already completed') {
        toast.success('Onboarding already completed');
        navigate(isAdvisor ? '/advisor' : '/lecturer');
        return;
      }
      toast.error(error.response?.data?.message || 'Failed to submit onboarding');
    } finally {
      setIsSubmitting(false);
    }
  };

  return { addResearchFieldValue, handleSubmit };
}