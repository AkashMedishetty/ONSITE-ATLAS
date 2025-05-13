import { format, formatDistance } from 'date-fns';

/**
 * Format a date string to a readable format
 * @param {string} dateString - ISO date string
 * @param {string} formatString - date-fns format string
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, formatString = 'MMMM d, yyyy') => {
  if (!dateString) return 'N/A';
  try {
    return format(new Date(dateString), formatString);
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'N/A';
  }
};

/**
 * Format a date string to a relative time (e.g. "2 days ago")
 * @param {string} dateString - ISO date string
 * @returns {string} Relative time string
 */
export const formatDateTimeRelative = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return formatDistance(new Date(dateString), new Date(), { addSuffix: true });
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'N/A';
  }
};

export default {
  formatDate,
  formatDateTimeRelative
}; 