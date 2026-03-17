import { FileText, Clock, CircleCheck, AlertCircle } from 'lucide-react';

/**
 * Contract Utility Functions
 * Helper functions for contract data formatting and processing
 */

/**
 * Format date to M/D/Y format
 * @param {string|Date} value - Date value
 * @returns {string} Formatted date string
 */
export const formatMDY = (value) => {
  if (!value) return '';
  try {
    const d = parseDateOnlyToLocalDate(value);
    if (!d) return '';
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'numeric', 
      day: 'numeric' 
    });
  } catch { 
    return ''; 
  }
};

/**
 * Parse backend DATEONLY values (YYYY-MM-DD) as a local Date.
 * JS `new Date('YYYY-MM-DD')` is interpreted as UTC and can shift the local day.
 * @param {unknown} value
 * @returns {Date|null}
 */
export const parseDateOnlyToLocalDate = (value) => {
  if (!value) return null;
  try {
    if (value instanceof Date) {
      const t = value.getTime();
      return Number.isFinite(t) ? new Date(t) : null;
    }
    const s = String(value).trim();
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (m) {
      const y = Number(m[1]);
      const mo = Number(m[2]) - 1;
      const d = Number(m[3]);
      const dt = new Date(y, mo, d);
      return Number.isFinite(dt.getTime()) ? dt : null;
    }
    const dt = new Date(value);
    return Number.isFinite(dt.getTime()) ? dt : null;
  } catch {
    return null;
  }
};

/**
 * Format contract ID with year prefix
 * @param {Object} contract - Contract object
 * @returns {string} Formatted contract ID
 */
export const formatContractId = (contract) => {
  const createdYear = contract.created_at 
    ? new Date(contract.created_at).getFullYear() 
    : new Date().getFullYear();
  const t = String(contract?.contract_type || '').toUpperCase();
  const prefix = t === 'ADVISOR' ? 'AC' : 'LC';
  return `${prefix}-${createdYear}-${String(contract.id).padStart(3, '0')}`;
};

/**
 * Calculate total hours from contract courses
 * @param {Object} contract - Contract object
 * @returns {number} Total hours
 */
export const calculateTotalHours = (contract) => {
  const t = String(contract?.contract_type || '').toUpperCase();
  if (t === 'ADVISOR') {
    const perStudentRaw =
      contract?.hours_per_student ??
      contract?.hoursPerStudent ??
      contract?.hours_per_students ??
      contract?.hoursPerStudents;
    const perStudent = Number(perStudentRaw || 0) || 0;
    const studentsCount = Array.isArray(contract?.students) ? contract.students.length : 0;
    const judgingRaw =
      contract?.join_judging_hours ??
      contract?.joinJudgingHours ??
      contract?.join_judging_hour ??
      contract?.joinJudgingHour;
    const judging = Number(judgingRaw || 0) || 0;
    // Match backend/PDF logic: join judging hours are per-student
    const totalHoursPerStudent = perStudent * studentsCount;
    const totalJudgingHours = judging * studentsCount;
    return totalHoursPerStudent + totalJudgingHours;
  }
  return (contract.courses || []).reduce((acc, course) => acc + (course.hours || 0), 0);
};

/**
 * Parse a value into a positive number.
 * Accepts numbers or strings (e.g. "$50/hr", "50").
 * Returns null when the value is missing, invalid, or not > 0.
 * @param {unknown} value
 * @returns {number|null}
 */
export const toPositiveNumber = (value) => {
  if (value == null) return null;
  const n =
    typeof value === 'number'
      ? value
      : parseFloat(String(value).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
};

const normalizeTitle = (rawTitle) => {
  const t = String(rawTitle || '').replace(/\./g, '').trim();
  if (!t) return '';
  const key = t.toLowerCase();
  if (key === 'mr') return 'Mr.';
  if (key === 'ms') return 'Ms.';
  if (key === 'mrs') return 'Mrs.';
  if (key === 'dr') return 'Dr.';
  if (key === 'prof' || key === 'professor') return 'Prof.';
  // Fallback: keep original formatting
  return rawTitle;
};

/**
 * Get lecturer name from contract or profile
 * @param {Object} contract - Contract object
 * @param {Object} lecturerProfile - Lecturer profile object
 * @param {Object} authUser - Authenticated user object
 * @returns {string} Lecturer name
 */
export const getLecturerName = (contract, lecturerProfile, authUser) => {
  const base = (
    contract?.lecturer_name ||
    contract?.lecturerName ||
    contract?.lecturer?.display_name ||
    contract?.lecturer?.displayName ||
    contract?.lecturer?.fullName ||
    lecturerProfile?.full_name_english ||
    lecturerProfile?.fullName ||
    lecturerProfile?.user_display_name ||
    lecturerProfile?.userDisplayName ||
    lecturerProfile?.name ||
    authUser?.display_name ||
    authUser?.displayName ||
    authUser?.fullName ||
    authUser?.name ||
    contract?.lecturer?.email ||
    authUser?.email ||
    ''
  );

  const titleRaw =
    contract?.lecturer?.LecturerProfile?.title ||
    contract?.lecturer?.title ||
    lecturerProfile?.title ||
    authUser?.title ||
    '';
  const title = normalizeTitle(titleRaw);
  if (!title) return base;

  const hasTitleAlready = /^(mr|mrs|ms|miss|dr|prof|professor)\.?\s+/i.test(String(base || '').trim());
  return hasTitleAlready ? base : `${title} ${String(base || '').trim()}`.trim();
};

/**
 * Get lecturer email from profile or auth
 * @param {Object} lecturerProfile - Lecturer profile object
 * @param {Object} authUser - Authenticated user object
 * @returns {string} Lecturer email
 */
export const getLecturerEmail = (lecturerProfile, authUser) => {
  return lecturerProfile?.email || authUser?.email || '';
};

/**
 * Get department name from contract courses
 * @param {Object} contract - Contract object
 * @returns {string} Department names (comma-separated)
 */
export const getLecturerDepartment = (contract) => {
  const courses = contract?.courses || [];
  const directDept =
    contract?.lecturer?.department_name ||
    contract?.lecturer?.departmentName ||
    contract?.department_name ||
    contract?.departmentName ||
    '';

  const names = courses
    .map((cc) => (
      cc?.Course?.Department?.dept_name ||
      cc?.Course?.Department?.name ||
      cc?.Course?.department_name ||
      cc?.department_name ||
      cc?.departmentName ||
      cc?.department ||
      cc?.major_name ||
      cc?.majorName ||
      cc?.major ||
      cc?.faculty_name ||
      cc?.facultyName ||
      ''
    ))
    .map((s) => (s || '').toString().trim())
    .filter(Boolean);
  
  const merged = [...names, String(directDept || '').trim()].filter(Boolean);
  const unique = Array.from(new Set(merged));
  return unique.join(', ');
};

/**
 * Get status label and styling
 * @param {string} status - Contract status
 * @returns {Object} Status configuration
 */
export const getStatusLabel = (status) => {
  switch (status) {
    case 'WAITING_ADVISOR':
      return {
        label: 'waiting advisor',
        class: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: Clock,
      };
    case 'WAITING_LECTURER':
      return { 
        label: 'waiting lecturer', 
        class: 'bg-amber-50 text-amber-700 border-amber-200', 
        icon: Clock 
      };
    case 'WAITING_MANAGEMENT':
      return { 
        label: 'waiting management', 
        class: 'bg-blue-50 text-blue-700 border-blue-200', 
        icon: Clock 
      };
    case 'COMPLETED':
      return { 
        label: 'completed', 
        class: 'bg-green-50 text-green-700 border-green-200', 
        icon: CircleCheck 
      };
    case 'CONTRACT_ENDED':
      return { 
        label: 'Contract Ended', 
        class: 'bg-gray-100 text-red-700 border-red-200', 
        icon: AlertCircle 
      };
    default:
      return { 
        label: 'draft', 
        class: 'bg-gray-100 text-gray-700 border-gray-200', 
        icon: FileText 
      };
  }
};

/**
 * Check if contract is expired
 * @param {Object} contract - Contract object
 * @returns {boolean} True if expired
 */
export const isContractExpired = (contract) => {
  const end = contract?.end_date || contract?.endDate;
  if (!end) return false;
  
  try {
    const endD = parseDateOnlyToLocalDate(end);
    if (!endD) return false;
    
    const today = new Date();
    endD.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    // Ended when the calendar day reaches/passes end_date
    return endD <= today;
  } catch { 
    return false; 
  }
};

/**
 * Get display status for contract
 * @param {Object} contract - Contract object
 * @returns {string} Display status
 */
export const getDisplayStatus = (contract) => {
  const rawStatus = String(contract?.status || '').trim().toUpperCase().replace(/\s+/g, '_');
  if (rawStatus === 'CONTRACT_ENDED') return 'CONTRACT_ENDED';
  if (isContractExpired(contract)) return 'CONTRACT_ENDED';

  const t = String(contract?.contract_type || '').toUpperCase();
  if (t === 'ADVISOR') {
    if (String(contract?.status || '').toUpperCase() === 'COMPLETED') return 'COMPLETED';
    const hasAdvisorSig = !!contract?.advisor_signed_at;
    const hasManagementSig = !!contract?.management_signed_at;
    if (hasAdvisorSig && hasManagementSig) return 'COMPLETED';
    if (hasAdvisorSig && !hasManagementSig) return 'WAITING_MANAGEMENT';
    // Default: waiting advisor signature
    return 'WAITING_ADVISOR';
  }
  
  switch (contract?.status) {
    case 'DRAFT':
    case 'MANAGEMENT_SIGNED':
    case 'WAITING_LECTURER':
      return 'WAITING_LECTURER';
    case 'LECTURER_SIGNED':
    case 'WAITING_MANAGEMENT':
      return 'WAITING_MANAGEMENT';
    case 'COMPLETED':
      return 'COMPLETED';
    default:
      return 'DRAFT';
  }
};

/**
 * Build PDF filename for contract
 * @param {Object} contract - Contract object
 * @param {Object} lecturerProfile - Lecturer profile object
 * @param {Object} authUser - Authenticated user object
 * @returns {string} Sanitized filename
 */
export const makePdfFilenameForContract = (contract, lecturerProfile, authUser) => {
  // Get title
  const rawTitle = contract?.lecturer?.LecturerProfile?.title
    || contract?.lecturer?.title
    || lecturerProfile?.title
    || authUser?.title
    || '';
  
  const t = String(rawTitle || '').toLowerCase().replace(/\./g, '').trim();
  const prettyTitle = t === 'dr' ? 'Dr'
    : (t === 'prof' || t === 'professor') ? 'Prof'
    : t === 'mr' ? 'Mr'
    : (t === 'ms' || t === 'miss') ? 'Ms'
    : t === 'mrs' ? 'Mrs'
    : (rawTitle ? String(rawTitle) : '');

  // Get name
  let name = (
    contract?.lecturer_name ||
    contract?.lecturer?.display_name ||
    contract?.lecturer?.full_name ||
    contract?.lecturer?.full_name_english ||
    contract?.lecturer?.fullName ||
    contract?.lecturer?.name ||
    lecturerProfile?.fullName ||
    lecturerProfile?.name ||
    authUser?.fullName ||
    authUser?.name ||
    (authUser?.email ? authUser.email.split('@')[0] : '') ||
    'lecturer'
  ).toString();
  
  // Strip any title already present
  name = name.replace(/^(mr|mrs|ms|miss|dr|prof|professor)\.?\s+/i, '').trim();

  const full = (prettyTitle ? `${prettyTitle} ${name}` : name).trim();
  
  // Sanitize filename
  let safe = full
    .replace(/[/:*?"<>|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9_.-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '') || 'lecturer';
  
  if (!/\.pdf$/i.test(safe)) safe += '.pdf';
  return safe;
};
