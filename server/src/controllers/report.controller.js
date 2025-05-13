const { Report, Event } = require('../models');
const { ApiError } = require('../utils/ApiError');
const httpStatus = require('http-status');
const mongoose = require('mongoose');

/**
 * Create a new report configuration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createReport = async (req, res) => {
  const { eventId } = req.params;
  
  // Check if event exists
  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Event not found');
  }
  
  // Add event and user to report data
  const reportData = {
    ...req.body,
    event: eventId,
    createdBy: req.user._id
  };
  
  // Create the report
  const report = await Report.create(reportData);
  
  res.status(httpStatus.CREATED).json(report);
};

/**
 * Get a specific report by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getReportById = async (req, res) => {
  const { eventId, reportId } = req.params;
  
  // Check if event exists
  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Event not found');
  }
  
  // Find the report
  const report = await Report.findOne({
    _id: reportId,
    event: eventId
  }).populate('createdBy', 'name email');
  
  if (!report) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Report not found');
  }
  
  res.status(httpStatus.OK).json(report);
};

/**
 * Update a report
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateReport = async (req, res) => {
  const { eventId, reportId } = req.params;
  
  // Check if event exists
  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Event not found');
  }
  
  // Find the report
  const report = await Report.findOne({
    _id: reportId,
    event: eventId
  });
  
  if (!report) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Report not found');
  }
  
  // Update the report
  Object.assign(report, req.body);
  await report.save();
  
  res.status(httpStatus.OK).json(report);
};

/**
 * Delete a report
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteReport = async (req, res) => {
  const { eventId, reportId } = req.params;
  
  // Check if event exists
  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Event not found');
  }
  
  // Find the report
  const report = await Report.findOne({
    _id: reportId,
    event: eventId
  });
  
  if (!report) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Report not found');
  }
  
  // Delete the report
  await report.deleteOne();
  
  res.status(httpStatus.NO_CONTENT).send();
};

/**
 * Get all reports for an event
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getReports = async (req, res) => {
  const { eventId } = req.params;
  const { type } = req.query;
  
  // Check if event exists
  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Event not found');
  }
  
  // Build filter
  const filter = { event: eventId };
  
  if (type) {
    filter.type = type;
  }
  
  // Get reports
  const reports = await Report.find(filter)
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });
  
  res.status(httpStatus.OK).json(reports);
};

/**
 * Generate a report based on configuration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const generateReport = async (req, res) => {
  const { eventId, reportId } = req.params;
  
  // Check if event exists
  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Event not found');
  }
  
  // Find the report
  const report = await Report.findOne({
    _id: reportId,
    event: eventId
  });
  
  if (!report) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Report not found');
  }
  
  // For now, we'll just return a placeholder response
  // In a real implementation, this would generate the report based on the config
  res.status(httpStatus.OK).json({
    message: 'Report generation will be implemented in the next phase',
    reportConfig: report
  });
};

/**
 * Schedule a report for periodic generation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const scheduleReport = async (req, res) => {
  const { eventId, reportId } = req.params;
  const { frequency, recipients, startDate } = req.body;
  
  // Check if event exists
  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Event not found');
  }
  
  // Find the report
  const report = await Report.findOne({
    _id: reportId,
    event: eventId
  });
  
  if (!report) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Report not found');
  }
  
  // Calculate next run date based on frequency
  const nextRunDate = startDate ? new Date(startDate) : new Date();
  
  // Update the report with schedule information
  report.isScheduled = true;
  report.scheduleConfig = {
    frequency,
    recipients,
    nextRunDate
  };
  
  await report.save();
  
  res.status(httpStatus.OK).json({
    message: 'Report scheduled successfully',
    schedule: report.scheduleConfig
  });
};

/**
 * Export a report in the specified format
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const exportReport = async (req, res) => {
  const { eventId, reportId } = req.params;
  const { format = 'excel' } = req.query;
  
  // Check if event exists
  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Event not found');
  }
  
  // Find the report
  const report = await Report.findOne({
    _id: reportId,
    event: eventId
  });
  
  if (!report) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Report not found');
  }
  
  // For now, we'll just return a placeholder response
  // In a real implementation, this would generate the export in the requested format
  res.status(httpStatus.OK).json({
    message: `Report export in ${format} format will be implemented in the next phase`,
    reportConfig: report
  });
};

module.exports = {
  createReport,
  getReportById,
  updateReport,
  deleteReport,
  getReports,
  generateReport,
  scheduleReport,
  exportReport
}; 