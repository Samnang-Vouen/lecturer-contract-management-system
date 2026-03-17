import { useEffect, useRef } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { getMyLecturerProfile, getMyCandidateContact } from '../../../services/lecturerProfile.service';
import { composeEnglishWithTitle } from '../../../utils/nameFormatting';

/**
 * Hook to prefill form data from existing profile and candidate records
 */
export const useOnboardingPrefill = (formData, setFormData, handlePhoneChange) => {
  const { authUser } = useAuthStore();
  const contactPrefillFetched = useRef(false);

  // Auto-fill school email from logged in user
  useEffect(() => {
    if (authUser?.email && !formData.schoolEmail) {
      setFormData(prev => ({ ...prev, schoolEmail: authUser.email }));
    }
  }, [authUser, formData.schoolEmail, setFormData]);

  // Prefill contact fields from existing profile first, then candidate record as fallback.
  useEffect(() => {
    if (contactPrefillFetched.current) return;
    
    let cancelled = false;
    
    const fetchContactDetails = async () => {
      try {
        const needsPhone = !formData.phoneNumber;
        const needsEmail = !formData.personalEmail;
        if (!needsPhone && !needsEmail) {
          contactPrefillFetched.current = true;
          return;
        }

        let profilePhone = '';
        let profileEmail = '';

        try {
          const profile = await getMyLecturerProfile();
          if (cancelled) return;

          profilePhone = profile?.phone_number || '';
          profileEmail = profile?.personal_email || '';

          setFormData(prev => ({
            ...prev,
            phoneNumber: needsPhone && profilePhone ? profilePhone : prev.phoneNumber,
            personalEmail: needsEmail && profileEmail ? profileEmail : prev.personalEmail
          }));

          if (needsPhone && profilePhone) {
            handlePhoneChange(profilePhone);
          }
        } catch (e) {
          // ignore: profile may not exist yet
        }

        const stillNeedsPhone = needsPhone && !profilePhone;
        const stillNeedsEmail = needsEmail && !profileEmail;
        if (!stillNeedsPhone && !stillNeedsEmail) {
          contactPrefillFetched.current = true;
          return;
        }

        const res = await getMyCandidateContact();
        if (cancelled) return;

        contactPrefillFetched.current = true;

        const phone = res?.phone || '';
        const email = res?.personalEmail || '';

        setFormData(prev => ({
          ...prev,
          phoneNumber: stillNeedsPhone && phone ? phone : prev.phoneNumber,
          personalEmail: stillNeedsEmail && email ? email : prev.personalEmail
        }));

        if (stillNeedsPhone && phone) {
          handlePhoneChange(phone);
        }
      } catch (e) {
        // Silently ignore - candidate record may not exist if lecturer wasn't recruited through the system
        contactPrefillFetched.current = true;
      }
    };

    fetchContactDetails();
    
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
