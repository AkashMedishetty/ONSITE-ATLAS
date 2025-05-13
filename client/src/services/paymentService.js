import api from './api';

/**
 * Service for interacting with payment API endpoints
 */
const paymentService = {
  /**
   * Process a payment
   * @param {Object} paymentData - Payment data
   * @returns {Promise} - Promise with payment processing result
   */
  processPayment: async (paymentData) => {
    try {
      const response = await api.post('/payments/process', paymentData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Verify a payment
   * @param {Object} verificationData - Payment verification data
   * @returns {Promise} - Promise with verification result
   */
  verifyPayment: async (verificationData) => {
    try {
      const response = await api.post('/payments/verify', verificationData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get a payment by ID
   * @param {string} id - Payment ID
   * @returns {Promise} - Promise with payment data
   */
  getPaymentById: async (id) => {
    try {
      const response = await api.get(`/payments/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Refund a payment
   * @param {string} id - Payment ID
   * @param {Object} refundData - Refund data
   * @returns {Promise} - Promise with refund result
   */
  refundPayment: async (id, refundData) => {
    try {
      const response = await api.post(`/payments/${id}/refund`, refundData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get invoice for a payment
   * @param {string} id - Payment ID
   * @returns {Promise} - Promise with invoice data
   */
  getInvoice: async (id) => {
    try {
      const response = await api.get(`/payments/${id}/invoice`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get receipt for a payment
   * @param {string} id - Payment ID
   * @returns {Promise} - Promise with receipt data
   */
  getReceipt: async (id) => {
    try {
      const response = await api.get(`/payments/${id}/receipt`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all payment gateways
   * @returns {Promise} - Promise with payment gateways data
   */
  getPaymentGateways: async () => {
    try {
      const response = await api.get('/payments/gateways');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create a new payment gateway
   * @param {Object} gatewayData - Payment gateway data
   * @returns {Promise} - Promise with created payment gateway
   */
  createPaymentGateway: async (gatewayData) => {
    try {
      const response = await api.post('/payments/gateways', gatewayData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update a payment gateway
   * @param {string} id - Payment gateway ID
   * @param {Object} updateData - Data to update
   * @returns {Promise} - Promise with updated payment gateway
   */
  updatePaymentGateway: async (id, updateData) => {
    try {
      const response = await api.patch(`/payments/gateways/${id}`, updateData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete a payment gateway
   * @param {string} id - Payment gateway ID
   * @returns {Promise} - Promise with deletion result
   */
  deletePaymentGateway: async (id) => {
    try {
      const response = await api.delete(`/payments/gateways/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get all invoice templates
   * @returns {Promise} - Promise with invoice templates data
   */
  getInvoiceTemplates: async () => {
    try {
      const response = await api.get('/payments/invoice-templates');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create a new invoice template
   * @param {Object} templateData - Invoice template data
   * @returns {Promise} - Promise with created invoice template
   */
  createInvoiceTemplate: async (templateData) => {
    try {
      const response = await api.post('/payments/invoice-templates', templateData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update an invoice template
   * @param {string} id - Invoice template ID
   * @param {Object} updateData - Data to update
   * @returns {Promise} - Promise with updated invoice template
   */
  updateInvoiceTemplate: async (id, updateData) => {
    try {
      const response = await api.patch(`/payments/invoice-templates/${id}`, updateData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete an invoice template
   * @param {string} id - Invoice template ID
   * @returns {Promise} - Promise with deletion result
   */
  deleteInvoiceTemplate: async (id) => {
    try {
      const response = await api.delete(`/payments/invoice-templates/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default paymentService; 