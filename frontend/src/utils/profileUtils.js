import { axiosInstance } from '../lib/axios';

/**
 * Sanitize English name input - allow only English letters, spaces, hyphens, and apostrophes
 */
export const sanitizeEnglish = (s = '') => String(s).replace(/[^A-Za-z' -]/g, '');

/**
 * Sanitize Khmer name input - allow only Khmer Unicode characters (U+1780 - U+17FF) and spaces
 */
export const sanitizeKhmer = (s = '') => String(s).replace(/[^\u1780-\u17FF\s]/g, '');

/**
 * Map profile response to form state
 */
export const mapProfileToForm = (p) => ({
  full_name_english: p.full_name_english || '',
  full_name_khmer: p.full_name_khmer || '',
  personal_email: p.personal_email || '',
  phone_number: p.phone_number || '',
  place: p.place || '',
  latest_degree: p.latest_degree || '',
  degree_year: p.degree_year || '',
  major: p.major || '',
  university: p.university || '',
  country: p.country || '',
  qualifications: p.qualifications || '',
  research_fields: (p.research_fields || ''),
  short_bio: p.short_bio || '',
  bank_name: p.bank_name || '',
  account_name: p.account_name || '',
  account_number: p.account_number || '',
  hourlyRateThisYear: p.hourlyRateThisYear ?? '',
});

/**
 * Convert backend-relative stored path (e.g. uploads/lecturers/NAME/cv.pdf) to absolute URL on API host
 */
export const buildFileUrl = (p) => {
  if (!p) return '';
  if (/^https?:/i.test(p)) return p; // already full URL
  const cleaned = p.replace(/\\/g, '/').replace(/^\//, '');
  // axiosInstance baseURL ends with /api; strip that to get origin
  let base = axiosInstance.defaults.baseURL || '';
  base = base.replace(/\/?api\/?$/i, '');
  if (base.endsWith('/')) base = base.slice(0, -1);
  return `${base}/${cleaned}`;
};

/**
 * Validate profile form
 */
export const validateProfile = (form) => {
  const er = {};
  if (!form.full_name_english.trim()) er.full_name_english = 'Required';
  if (form.phone_number && !/^[0-9+\-() ]{6,20}$/.test(form.phone_number)) {
    er.phone_number = 'Invalid phone';
  }
  if (
    form.degree_year &&
    (Number(form.degree_year) < 1950 || Number(form.degree_year) > new Date().getFullYear())
  ) {
    er.degree_year = 'Out of range';
  }
  return er;
};

/**
 * Validate password form
 */
export const validatePassword = (passwordForm) => {
  if (!passwordForm.currentPassword || !passwordForm.newPassword) {
    return 'Fill all password fields';
  }
  if (passwordForm.newPassword !== passwordForm.confirm) {
    return 'Passwords do not match';
  }
  if (passwordForm.newPassword.length < 6) {
    return 'Password too short';
  }
  return null;
};

/**
 * Avatar color palette
 */
export const avatarColors = [
  'bg-blue-600',
  'bg-indigo-600',
  'bg-emerald-600',
  'bg-rose-600',
  'bg-amber-600',
];
