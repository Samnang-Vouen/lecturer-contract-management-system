import { validateAccountNumber, validateEmail } from '../../../utils/inputValidation';

export function validateOnboardingSubmission({ formData, files, isAdvisor, authUser, validatePhone }) {
  const basicChecks = [
    ['englishName', 'Please enter your English name', 'basic'],
    ['khmerName', 'Please enter your Khmer name', 'basic'],
    ['accountHolderName', 'Please enter the account holder name', 'basic'],
    ['bankName', 'Please select your bank', 'basic'],
  ];

  for (const [key, message, stepKey] of basicChecks) {
    if (!String(formData[key] || '').trim()) return { message, stepKey };
  }
  if (!files.payrollFile) return { message: 'Please upload your payroll document', stepKey: 'basic' };
  if (!validateAccountNumber(formData.accountName)) return { message: 'Account number must contain exactly 16 digits', stepKey: 'basic' };

  if (!isAdvisor) {
    if (!formData.departments?.length) return { message: 'Please select at least one department', stepKey: 'academic' };
    if (!formData.courses?.length) return { message: 'Please select at least one course', stepKey: 'academic' };
    if (!String(formData.shortBio || '').trim()) return { message: 'Please enter a short bio', stepKey: 'academic' };
    if (!files.updatedCvFile) return { message: 'Please upload your updated CV', stepKey: 'academic' };
  }

  const educationChecks = [
    ['universityName', 'Please enter your university name'],
    ['country', 'Please enter your country'],
    ['majorName', 'Please enter your major'],
    ['graduationYear', 'Please select your graduation year'],
    ['latestDegree', 'Please select your latest degree'],
  ];
  for (const [key, message] of educationChecks) {
    if (!String(formData[key] || '').trim()) return { message, stepKey: 'education' };
  }

  if (!String(formData.occupation || '').trim()) return { message: 'Please enter your current occupation', stepKey: 'professional' };
  if (!String(formData.placeOfWork || '').trim()) return { message: 'Please enter your place of work', stepKey: 'professional' };
  if (!String(formData.schoolEmail || authUser?.email || '').trim()) return { message: 'Missing school email', stepKey: 'contact' };

  const phoneValidation = validatePhone();
  if (!phoneValidation.valid) return { message: phoneValidation.error, stepKey: 'contact' };
  if (!validateEmail(formData.personalEmail)) {
    return { message: 'Please enter a valid personal email (must include @)', stepKey: 'contact' };
  }

  return null;
}

export function buildOnboardingFormData({ formData, files, isAdvisor, phoneE164, researchFields, getCourseIds }) {
  const fd = new FormData();
  fd.append('full_name_english', formData.englishName || '');
  fd.append('full_name_khmer', formData.khmerName || '');
  fd.append('bank_name', formData.bankName || '');
  fd.append('account_name', formData.accountHolderName || '');
  fd.append('account_number', formData.accountName || '');
  if (!isAdvisor) fd.append('short_bio', formData.shortBio || '');
  fd.append('university', formData.universityName || '');
  fd.append('country', formData.country || '');
  fd.append('major', formData.majorName || '');
  fd.append('degree_year', formData.graduationYear || '');
  fd.append('latest_degree', formData.latestDegree === 'ASSOCIATE' ? 'OTHER' : (formData.latestDegree || ''));
  fd.append('occupation', formData.occupation || '');
  fd.append('place', formData.placeOfWork || '');
  fd.append('phone_number', phoneE164 || formData.phoneNumber || '');
  fd.append('personal_email', formData.personalEmail || '');

  if (!isAdvisor) {
    fd.append('research_fields', researchFields.join(', '));
    if (formData.departments.length) fd.append('departments', formData.departments.join(', '));
    if (formData.courses.length) {
      fd.append('courses', formData.courses.join(', '));
      const selectedIds = getCourseIds(formData.courses);
      if (selectedIds.length) fd.append('course_ids', selectedIds.join(','));
    }
    if (files.updatedCvFile) fd.append('cv', files.updatedCvFile);
    if (files.courseSyllabusFile) fd.append('syllabus', files.courseSyllabusFile);
  }

  if (files.payrollFile) fd.append('payroll', files.payrollFile);
  return fd;
}

export function notifyOnboardingComplete({ authUser, profile }) {
  try {
    const payload = {
      type: 'onboarding_complete',
      userId: authUser?.id || profile?.user_id || null,
      profileId: profile?.id || null,
      timestamp: Date.now(),
    };
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel('lecturer-updates');
      channel.postMessage(payload);
      channel.close();
    }
    localStorage.setItem('lecturer-onboarding-update', JSON.stringify(payload));
    setTimeout(() => {
      try {
        localStorage.removeItem('lecturer-onboarding-update');
      } catch {}
    }, 300);
  } catch {}
}