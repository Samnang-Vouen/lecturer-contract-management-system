/**
 * Name formatting utilities for lecturer onboarding
 */

export const TITLE_MAP = { 
  Mr: 'Mr.', 
  Ms: 'Ms.', 
  Mrs: 'Mrs.', 
  Dr: 'Dr.', 
  Prof: 'Prof.' 
};

/**
 * Convert string to title case (e.g., "spider man" => "Spider Man")
 */
export const toTitleCase = (str = '') => str
  .trim()
  .split(/\s+/)
  .map(w => w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : '')
  .join(' ');

/**
 * Compose English name with title, avoiding duplication
 * @param {string} rawTitle - The title (Mr, Dr, etc.)
 * @param {string} rawName - The name to format
 * @returns {string} Formatted name with title
 */
export const composeEnglishWithTitle = (rawTitle, rawName) => {
  const name = toTitleCase(String(rawName || ''));
  const t = rawTitle && TITLE_MAP[rawTitle] ? TITLE_MAP[rawTitle] : (rawTitle ? String(rawTitle).trim() : '');
  if (!t) return name;
  
  // If name already starts with the title (with or without dot), normalize to mapped form
  const bare = String(rawTitle || '').replace(/\./g, '');
  const re = new RegExp(`^\s*(${bare}|${bare}\.)\s+`, 'i');
  if (re.test(name)) {
    return name.replace(re, `${t} `).trim();
  }
  return `${t}${name ? ' ' + name : ''}`.trim();
};
