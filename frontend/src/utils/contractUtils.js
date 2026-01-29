import { Clock, CircleCheck } from 'lucide-react';

/**
 * Get status label, styling, and icon for contract status
 */
export const getStatusLabel = (status) => {
  switch (status) {
    case 'DRAFT':
      return { label: 'draft', class: 'bg-gray-100 text-gray-700 border-gray-200', icon: Clock };
    case 'WAITING_MANAGEMENT':
      return { label: 'waiting management', class: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock };
    case 'WAITING_LECTURER':
      return { label: 'waiting lecturer', class: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock };
    case 'MANAGEMENT_SIGNED':
      return { label: 'waiting lecturer', class: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock };
    case 'COMPLETED':
      return { label: 'completed', class: 'bg-green-50 text-green-700 border-green-200', icon: CircleCheck };
    default:
      return { label: 'draft', class: 'bg-gray-100 text-gray-700 border-gray-200', icon: Clock };
  }
};

/**
 * Format lecturer title + name from available fields
 */
export const formatLecturerDisplay = (lecturer) => {
  if (!lecturer) return '—';
  const rawTitle = lecturer?.LecturerProfile?.title || lecturer?.title || '';
  const name = lecturer?.display_name || lecturer?.full_name || lecturer?.full_name_english || lecturer?.full_name_khmer || lecturer?.name || lecturer?.email || '—';

  const norm = (s = '') => String(s).toLowerCase().replace(/\./g, '').trim();
  const prettyTitle = (() => {
    const t = norm(rawTitle);
    if (!t) return '';
    switch (t) {
      case 'mr':
      case 'mister':
        return 'Mr.';
      case 'ms':
      case 'miss':
        return 'Ms.';
      case 'mrs':
        return 'Mrs.';
      case 'dr':
      case 'doctor':
        return 'Dr.';
      case 'prof':
      case 'professor':
        return 'Prof.';
      default: {
        // Capitalize first letter; add dot for 2-3 letter common abbreviations
        const cap = rawTitle.charAt(0).toUpperCase() + String(rawTitle).slice(1);
        return cap.length <= 4 && !/[\.!]$/.test(cap) ? `${cap}.` : cap;
      }
    }
  })();

  // Avoid duplicating title if already present in name
  const nameNorm = norm(name);
  const titleNorm = norm(prettyTitle);
  if (titleNorm && (nameNorm.startsWith(titleNorm + ' ') || nameNorm === titleNorm)) {
    return name;
  }
  return prettyTitle ? `${prettyTitle} ${name}` : name;
};

/**
 * Format date to M/D/YYYY
 */
export const formatMDY = (value) => {
  if (!value) return '';
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' });
  } catch {
    return '';
  }
};

/**
 * Get department name from contract
 */
export const getDepartmentName = (contract) => {
  const fromLecturer = contract?.lecturer?.department_name || contract?.lecturer?.department || '';
  const fromCourse = contract?.courses?.[0]?.Course?.Department?.dept_name || contract?.courses?.[0]?.Course?.department_name || '';
  return fromLecturer || fromCourse || '—';
};

/**
 * Build a safe filename from lecturer info
 */
export const deriveLecturerBaseName = (lecturer) => {
  if (!lecturer) return '';
  // Raw title from profile
  const rawTitle = lecturer?.LecturerProfile?.title || lecturer?.title || '';
  const t = String(rawTitle || '').toLowerCase().replace(/\./g, '').trim();
  const prettyTitle = t === 'dr'
    ? 'Dr'
    : t === 'prof' || t === 'professor'
    ? 'Prof'
    : t === 'mr'
    ? 'Mr'
    : t === 'ms' || t === 'miss'
    ? 'Ms'
    : t === 'mrs'
    ? 'Mrs'
    : (rawTitle ? String(rawTitle) : '');

  // Prefer human display name; fall back to email local-part
  let name = lecturer?.display_name || lecturer?.full_name || lecturer?.full_name_english || lecturer?.full_name_khmer || lecturer?.name || lecturer?.email || '';
  if (name.includes('@')) name = name.split('@')[0];
  // Strip common titles if prefixed in the name itself to avoid duplication
  name = name.replace(/^(mr|mrs|ms|miss|dr|prof|professor)\.?\s+/i, '');
  name = name.trim();
  return prettyTitle ? `${prettyTitle} ${name}`.trim() : name;
};

/**
 * Convert base name to safe PDF filename
 */
export const toSafePdfFilename = (baseName, id) => {
  let safe = String(baseName || '')
    .replace(/[\/:*?"<>|]+/g, ' ') // illegal -> space
    .replace(/\s+/g, ' ') // compress spaces
    .trim();
  if (!safe) safe = `contract-${id}`;
  // Replace spaces with underscores for cleaner filenames
  safe = safe.replace(/\s+/g, '_');
  // limit length and ensure .pdf extension
  safe = safe.slice(0, 80);
  return /\.pdf$/i.test(safe) ? safe : `${safe}.pdf`;
};

/**
 * Generate formatted contract ID
 */
export const formatContractId = (contract) => {
  const createdYear = contract.created_at ? new Date(contract.created_at).getFullYear() : new Date().getFullYear();
  return `CTR-${createdYear}-${String(contract.id).padStart(3, '0')}`;
};

/**
 * Calculate total hours from contract courses
 */
export const calculateTotalHours = (contract) => {
  return (contract.courses || []).reduce((acc, course) => acc + (course.hours || 0), 0);
};

/**
 * Get hourly rate from contract
 */
export const getHourlyRate = (contract) => {
  const rate = contract.hourlyRateThisYear;
  const num = rate != null && rate !== '' ? Number(rate) : null;
  return Number.isFinite(num) ? num : null;
};

/**
 * Calculate total salary
 */
export const calculateSalary = (contract) => {
  const hours = calculateTotalHours(contract);
  const rate = getHourlyRate(contract);
  return (rate != null && Number.isFinite(Number(rate)) && Number.isFinite(Number(hours))) 
    ? Number(rate) * Number(hours) 
    : null;
};
