import { Shield, Settings, Users, Eye } from "lucide-react";

/**
 * User Utility Functions
 * Helper functions for user data formatting and processing
 */

/**
 * Format user's full name from available data
 * Priority: name -> fullName -> formatted email
 * @param {Object} user - User object
 * @returns {string} Formatted full name
 */
export const formatFullName = (user) => {
  if (user.name && user.name.trim()) {
    return user.name.trim();
  }
  if (user.fullName && user.fullName.trim()) {
    return user.fullName.trim();
  }
  // Extract and format name from email
  const emailName = user.email.split('@')[0].replace(/\./g, ' ');
  return emailName.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

/**
 * Get badge variant for user role
 * @param {string} role - User role
 * @returns {string} Badge variant name
 */
export const getRoleBadgeVariant = (role) => {
  const r = (role || '').toString().trim().toLowerCase();
  if (r === 'superadmin') return 'superadmin';
  if (r === 'admin') return 'admin';
  if (r === 'management') return 'management';
  return 'secondary';
};

/**
 * Get icon component for user role
 * @param {string} role - User role
 * @returns {JSX.Element} Icon component
 */
export const getRoleIcon = (role) => {
  const r = (role || '').toString().trim().toLowerCase();
  if (r === 'superadmin') return <Shield className="w-3 h-3" />;
  if (r === 'admin') return <Settings className="w-3 h-3" />;
  if (r === 'management') return <Users className="w-3 h-3" />;
  return <Eye className="w-3 h-3" />;
};

/**
 * Get CSS class for status badge
 * @param {string} status - User status
 * @returns {string} CSS class string
 */
export const getStatusBadgeClass = (status) => 
  (status || '').toLowerCase() === 'active' 
    ? 'bg-emerald-100 text-emerald-800' 
    : 'bg-gray-100 text-gray-800';

/**
 * Format user data from API response
 * @param {Object} user - Raw user data
 * @returns {Object} Normalized user object
 */
export const normalizeUserData = (user) => {
  const extractedName = user.email.split('@')[0].replace(/\./g, ' ');
  const formattedName = extractedName.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
  
  return {
    id: user.id,
    name: user.name || user.fullName || formattedName,
    fullName: user.fullName || user.name || formattedName,
    email: user.email,
    role: user.role || 'User',
    department: user.department || 'General',
    status: user.status || 'active',
    lastLogin: user.lastLogin || 'Never'
  };
};

/**
 * Department options for filtering
 */
export const DEPARTMENT_OPTIONS = [
  "all",
  "Computer Science",
  "Digital Business",
  "Telecommunications and Network"
];
