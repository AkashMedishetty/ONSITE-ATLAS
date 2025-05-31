import apiClient from './apiClient';

/**
 * Service for client portal reports and analytics (mirrors admin, but uses client endpoints)
 */
const clientReportsService = {
  // Fetch main stats for dashboard/reports
  getStats: async (eventId) => {
    const params = eventId ? { eventId } : {};
    return apiClient.get('/client-portal-auth/me/reports', { params });
  },
  // Fetch analytics (registrations by category/type/day, etc)
  getAnalytics: async (eventId) => {
    const params = eventId ? { eventId } : {};
    return apiClient.get('/client-portal-auth/me/analytics', { params });
  },
  // Fetch recent resource scans (food, kitBag, certificate)
  getRecentScans: async (eventId, resourceType, limit = 20) => {
    const params = { eventId, resourceType, limit };
    return apiClient.get('/client-portal-auth/me/recent', { params });
  },
  // Export reports (PDF, Excel, CSV)
  exportReport: async (eventId, reportType, format, dateRange = 'all') => {
    const params = { eventId, reportType, format, dateRange };
    return apiClient.get('/client-portal-auth/me/reports/export', { params, responseType: 'blob' });
  },
};

export default clientReportsService; 