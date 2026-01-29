import { useEffect, useRef } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { getMyLecturerProfile, getMyCandidateContact } from '../../../services/lecturerProfile.service';
import { composeEnglishWithTitle } from '../../../utils/nameFormatting';

/**
 * Hook to prefill form data from existing profile and candidate records
 */
export const useOnboardingPrefill = (formData, setFormData, handlePhoneChange) => {
  const { authUser } = useAuthStore();
  const candidateContactFetched = useRef(false);

  // Auto-fill school email from logged in user
  useEffect(() => {
    if (authUser?.email && !formData.schoolEmail) {
      setFormData(prev => ({ ...prev, schoolEmail: authUser.email }));
    }
  }, [authUser, formData.schoolEmail, setFormData]);

  // Prefill phone and personal email from candidate record
  useEffect(() => {
    if (candidateContactFetched.current) return;
    
    let cancelled = false;
    
    const fetchCandidateContact = async () => {
      try {
        const needsPhone = !formData.phoneNumber;
        const needsEmail = !formData.personalEmail;
        if (!needsPhone && !needsEmail) {
          candidateContactFetched.current = true;
          return;
        }

        const res = await getMyCandidateContact();
        if (cancelled) return;

        candidateContactFetched.current = true;

        const phone = res?.phone || '';
        const email = res?.personalEmail || '';

        setFormData(prev => ({
          ...prev,
          phoneNumber: needsPhone && phone ? phone : prev.phoneNumber,
          personalEmail: needsEmail && email ? email : prev.personalEmail
        }));

        if (needsPhone && phone) {
          handlePhoneChange(phone);
        }
      } catch (e) {
        // Silently ignore - candidate record may not exist if lecturer wasn't recruited through the system
        candidateContactFetched.current = true;
      }
    };

    fetchCandidateContact();
    
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - formData/setFormData/handlePhoneChange deliberately excluded to prevent infinite loop

  // Prefill English Name from existing profile or auth user
  useEffect(() => {
    if (formData.englishName) return; // don't overwrite if user started typing
    
    let cancelled = false;
    
    const fetchProfileName = async () => {
      let apiTitle;
      try {
        const p = await getMyLecturerProfile();
        apiTitle = p.title;
        const name = p.full_name_english;
        
        if (name && !cancelled) {
          const composed = composeEnglishWithTitle(apiTitle, name);
          setFormData(prev => prev.englishName ? prev : { ...prev, englishName: composed });
          return;
        }
      } catch (e) {
        // ignore: likely profile not created yet
      }
      
      if (!cancelled) {
        const fallback = authUser?.display_name || authUser?.name || 
          (authUser?.email ? authUser.email.split('@')[0].replace(/[._-]/g, ' ') : '');
        
        if (fallback) {
          const composed = composeEnglishWithTitle(apiTitle, fallback);
          setFormData(prev => prev.englishName ? prev : { ...prev, englishName: composed });
        }
      }
    };

    fetchProfileName();
    
    return () => { cancelled = true; };
  }, [authUser, formData.englishName, setFormData]);
};
