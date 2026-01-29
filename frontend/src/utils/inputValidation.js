/**
 * Input validation and sanitization utilities
 */

// Patterns
export const khmerOnlyPattern = /[^\u1780-\u17FF\s]/g;
export const digitsOnlyPattern = /[^0-9]/g;
export const englishOnlyPattern = /[^A-Za-z\s]/g;

/**
 * Filter string to Khmer characters only
 */
export const filterToKhmer = (s = '') => String(s).replace(khmerOnlyPattern, '');

/**
 * Format account number with spaces every 4 digits (max 16 digits)
 */
export const formatAccountNumber = (s = '') => {
  const digits = String(s).replace(digitsOnlyPattern, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
};

/**
 * Sanitize to uppercase English letters only
 */
export const sanitizeEnglishUpper = (s = '') => 
  String(s).toUpperCase().replace(englishOnlyPattern, '');

/**
 * Validate account number has exactly 16 digits
 */
export const validateAccountNumber = (accountNumber = '') => {
  const digits = String(accountNumber).replace(digitsOnlyPattern, '');
  return digits.length === 16;
};

/**
 * Validate email contains @
 */
export const validateEmail = (email = '') => {
  const trimmed = String(email).trim();
  return trimmed && trimmed.includes('@');
};
