import { useEffect } from 'react';
import { getAdvisorOnboardingStatus, getLecturerOnboardingStatus } from '../../../services/lecturerProfile.service';

export function useOnboardingStatusCheck({ isAdvisor, navigate }) {
  useEffect(() => {
    let cancelled = false;

    const checkExistingOnboarding = async () => {
      try {
        const data = await (isAdvisor ? getAdvisorOnboardingStatus() : getLecturerOnboardingStatus());
        if (!cancelled && data?.complete) navigate(isAdvisor ? '/advisor' : '/lecturer', { replace: true });
      } catch {
        // Let the page render if status check is temporarily unavailable.
      }
    };

    checkExistingOnboarding();
    return () => {
      cancelled = true;
    };
  }, [isAdvisor, navigate]);
}