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
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
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
 * Format contract ID with year prefix
 * @param {Object} contract - Contract object
 * @returns {string} Formatted contract ID
 */
export const formatContractId = (contract) => {
  const createdYear = contract.created_at 
    ? new Date(contract.created_at).getFullYear() 
    : new Date().getFullYear();
  return `CTR-${createdYear}-${String(contract.id).padStart(3, '0')}`;
};

/**
 * Calculate total hours from contract courses
 * @param {Object} contract - Contract object
 * @returns {number} Total hours
 */
export const calculateTotalHours = (contract) => {
  return (contract.courses || []).reduce((acc, course) => acc + (course.hours || 0), 0);
};

/**
 * Get lecturer name from contract or profile
 * @param {Object} contract - Contract object
 * @param {Object} lecturerProfile - Lecturer profile object
 * @param {Object} authUser - Authenticated user object
 * @returns {string} Lecturer name
 */
export const getLecturerName = (contract, lecturerProfile, authUser) => {
  return (
    contract?.lecturer_name ||
    contract?.lecturer?.fullName ||
    lecturerProfile?.fullName ||
    lecturerProfile?.name ||
    authUser?.fullName ||
    authUser?.name ||
    ''
  );
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
  
  const unique = Array.from(new Set(names));
  return unique.join(', ');
};

/**
 * Get status label and styling
 * @param {string} status - Contract status
 * @returns {Object} Status configuration
 */
export const getStatusLabel = (status) => {
  switch (status) {
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
    const endD = new Date(end);
    if (isNaN(endD.getTime())) return false;
    
    const today = new Date();
    endD.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    return endD < today;
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
  if (isContractExpired(contract)) return 'CONTRACT_ENDED';
  
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
    .replace(/[\/:*?"<>|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9_.-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '') || 'lecturer';
  
  if (!/\.pdf$/i.test(safe)) safe += '.pdf';
  return safe;
};
