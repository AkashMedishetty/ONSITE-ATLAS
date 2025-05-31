import apiClient from './apiClient';

/**
 * Service for client portal bulk import (async job-based)
 */
const clientBulkImportService = {
  /**
   * Start a bulk import job for client portal
   * @param {Array<Object>} registrations - Array of registration objects
   * @param {string} [originalFileName] - Optional original file name for tracking
   * @returns {Promise<Object>} - API response, expects { jobId } on success
   */
  bulkImport: async (registrations, originalFileName) => {
    try {
      if (!registrations || registrations.length === 0) {
        return {
          data: {
            success: false,
            message: 'No registration data to import.'
          }
        };
      }
      const payload = { registrations };
      if (originalFileName) payload.originalFileName = originalFileName;
      const response = await apiClient.post('/client-bulk-import/registrants', payload);
      return response;
    } catch (error) {
      if (error.response) return error.response;
      return { data: { success: false, message: error.message || 'Unknown error during client bulk import.' } };
    }
  },

  /**
   * Poll the status of a client bulk import job
   * @param {string} jobId - The import job ID
   * @returns {Promise<Object>} - API response with job details
   */
  getImportJobStatus: async (jobId) => {
    try {
      const response = await apiClient.get(`/client-bulk-import/import-jobs/${jobId}/status`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default clientBulkImportService; 