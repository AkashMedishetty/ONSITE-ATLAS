const ExcelJS = require('exceljs');
const { ApiError } = require('../middleware/errorHandler');
const logger = require('./logger');

/**
 * Parse Excel file for registration import
 * @param {Buffer} buffer - Excel file buffer
 * @param {Object} options - Import options
 * @returns {Promise<Array>} - Array of registration data
 */
const parseRegistrationsExcel = async (buffer, options = {}) => {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new ApiError(400, 'Invalid Excel file: No worksheet found');
    }
    
    // Get headers from first row
    const headers = [];
    worksheet.getRow(1).eachCell((cell) => {
      headers.push(cell.value);
    });
    
    // Required fields
    const requiredFields = ['First Name', 'Last Name', 'Email'];
    
    // Check if required fields exist
    for (const field of requiredFields) {
      if (!headers.includes(field)) {
        throw new ApiError(400, `Invalid Excel file: Missing required field "${field}"`);
      }
    }
    
    // Parse data rows
    const registrations = [];
    
    worksheet.eachRow((row, rowNumber) => {
      // Skip header row
      if (rowNumber === 1) return;
      
      const registration = {
        personalInfo: {},
        customFields: {}
      };
      
      // Map cells to registration object
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1];
        
        // Map standard fields
        if (header === 'First Name') {
          registration.personalInfo.firstName = cell.value;
        } else if (header === 'Last Name') {
          registration.personalInfo.lastName = cell.value;
        } else if (header === 'Email') {
          registration.personalInfo.email = cell.value;
        } else if (header === 'Phone') {
          registration.personalInfo.phone = cell.value;
        } else if (header === 'Organization') {
          registration.personalInfo.organization = cell.value;
        } else if (header === 'Designation') {
          registration.personalInfo.designation = cell.value;
        } else if (header === 'Country') {
          registration.personalInfo.country = cell.value;
        } else if (header === 'Notes') {
          registration.notes = cell.value;
        } else {
          // Map custom fields
          registration.customFields[header] = cell.value;
        }
      });
      
      // Validate required fields
      if (!registration.personalInfo.firstName || 
          !registration.personalInfo.lastName || 
          !registration.personalInfo.email) {
        logger.warn(`Row ${rowNumber} skipped: Missing required fields`);
        return;
      }
      
      registrations.push(registration);
    });
    
    return registrations;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Error parsing Excel file', false, error.stack);
  }
};

/**
 * Generate Excel file for registration export
 * @param {Array} registrations - Array of registration documents
 * @param {Object} options - Export options
 * @returns {Promise<Buffer>} - Excel file buffer
 */
const generateRegistrationsExcel = async (registrations, options = {}) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Registrations');
    
    // Define columns
    const columns = [
      { header: 'Registration ID', key: 'registrationId' },
      { header: 'First Name', key: 'firstName' },
      { header: 'Last Name', key: 'lastName' },
      { header: 'Email', key: 'email' },
      { header: 'Phone', key: 'phone' },
      { header: 'Organization', key: 'organization' },
      { header: 'Designation', key: 'designation' },
      { header: 'Country', key: 'country' },
      { header: 'Category', key: 'category' },
      { header: 'Registration Type', key: 'registrationType' },
      { header: 'Status', key: 'status' },
      { header: 'Checked In', key: 'checkedIn' },
      { header: 'Registration Date', key: 'createdAt' }
    ];
    
    // Add custom field columns if any
    if (registrations.length > 0 && registrations[0].customFields) {
      const customFieldKeys = new Set();
      
      // Collect all custom field keys
      registrations.forEach(reg => {
        if (reg.customFields) {
          Object.keys(reg.customFields).forEach(key => customFieldKeys.add(key));
        }
      });
      
      // Add custom field columns
      customFieldKeys.forEach(key => {
        columns.push({ header: key, key: `custom_${key}` });
      });
    }
    
    // Set columns
    worksheet.columns = columns;
    
    // Add rows
    registrations.forEach(reg => {
      const row = {
        registrationId: reg.registrationId,
        firstName: reg.personalInfo?.firstName,
        lastName: reg.personalInfo?.lastName,
        email: reg.personalInfo?.email,
        phone: reg.personalInfo?.phone,
        organization: reg.personalInfo?.organization,
        designation: reg.personalInfo?.designation,
        country: reg.personalInfo?.country,
        category: reg.category?.name || '',
        registrationType: reg.registrationType,
        status: reg.status,
        checkedIn: reg.checkIn?.isCheckedIn ? 'Yes' : 'No',
        createdAt: reg.createdAt ? new Date(reg.createdAt).toLocaleString() : ''
      };
      
      // Add custom fields
      if (reg.customFields) {
        Object.entries(reg.customFields).forEach(([key, value]) => {
          row[`custom_${key}`] = value;
        });
      }
      
      worksheet.addRow(row);
    });
    
    // Format header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    
    // Auto-fit columns
    worksheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const length = cell.value ? cell.value.toString().length : 10;
        if (length > maxLength) {
          maxLength = length;
        }
      });
      column.width = Math.min(maxLength + 2, 30);
    });
    
    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  } catch (error) {
    throw new ApiError(500, 'Error generating Excel file', false, error.stack);
  }
};

/**
 * Generate Excel file for abstract export
 * @param {Array} abstracts - Array of abstract documents (populated with registration, category, reviews)
 * @param {Object} options - Export options: { eventName, categoryOrTopic, exportMode: 'single-row'|'multi-row' }
 * @returns {Promise<{buffer: Buffer, fileName: string}>} - Excel file buffer and suggested file name
 */
const generateAbstractsExcel = async (abstracts, options = {}) => {
  const { eventName = 'Event', categoryOrTopic = 'all', exportMode = 'single-row' } = options;
  const sanitize = (name) => (name || '').toString().replace(/[^a-zA-Z0-9_.-]/g, '_').substring(0, 50);
  const safeEvent = sanitize(eventName);
  const safeCat = sanitize(categoryOrTopic);
  const safeMode = exportMode === 'multi-row' ? 'multirow' : 'singlerow';
  const fileName = `abstracts_${safeEvent}_${safeCat}_${safeMode}.xlsx`;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Abstracts');

  // Expanded columns for reviewer export
  let columns = [
    { header: 'Event Name', key: 'eventName' },
    { header: 'Abstract Number', key: 'abstractNumber' },
    { header: 'Abstract ID', key: 'abstractId' },
    { header: 'Title', key: 'title' },
    { header: 'Authors', key: 'authors' },
    { header: 'Author Affiliations', key: 'authorAffiliations' },
    { header: 'Category', key: 'category' },
    { header: 'Topic', key: 'topic' },
    { header: 'SubTopic', key: 'subTopic' },
    { header: 'Submission Type', key: 'submissionType' },
    { header: 'Status', key: 'status' },
    { header: 'Submission Date', key: 'submissionDate' },
    { header: 'Registration ID', key: 'registrationId' },
    { header: 'First Name', key: 'firstName' },
    { header: 'Last Name', key: 'lastName' },
    { header: 'Email', key: 'email' },
    { header: 'Phone', key: 'phone' },
    { header: 'Organization', key: 'organization' },
    { header: 'Keywords', key: 'keywords' },
    { header: 'File Name', key: 'fileName' },
    { header: 'File URL', key: 'fileUrl' },
    { header: 'Reviewers', key: 'reviewers' },
    { header: 'Review Scores', key: 'reviewScores' },
    { header: 'Review Decisions', key: 'reviewDecisions' },
    { header: 'Review Comments', key: 'reviewComments' },
  ];
  if (exportMode === 'multi-row') {
    columns = columns.concat([
      { header: 'Reviewer Name', key: 'reviewerName' },
      { header: 'Reviewer Email', key: 'reviewerEmail' },
      { header: 'Review Date', key: 'reviewDate' },
      { header: 'Review Comment', key: 'reviewComment' },
      { header: 'Review Score', key: 'reviewScore' },
      { header: 'Review Decision', key: 'reviewDecision' },
    ]);
  }
  worksheet.columns = columns;

  for (const abs of abstracts) {
    // Registration info
    const reg = abs.registrationInfo || abs.registration || {};
    const personal = reg.personalInfo || {};
    // Category info
    const cat = abs.category || abs.categoryInfo || {};
    // Keywords
    const keywords = Array.isArray(abs.keywords) ? abs.keywords.join(', ') : (abs.keywords || '');
    // Reviewers
    let reviewers = '';
    let reviewerEmails = '';
    if (abs.reviewDetails && Array.isArray(abs.reviewDetails.assignedTo)) {
      reviewers = abs.reviewDetails.assignedTo.map(r => r?.name || r?.email || r?.toString()).join(', ');
      reviewerEmails = abs.reviewDetails.assignedTo.map(r => r?.email || '').join(', ');
    }
    // Reviews
    let reviewScores = '';
    let reviewDecisions = '';
    let reviewComments = '';
    if (abs.reviewDetails && Array.isArray(abs.reviewDetails.reviews)) {
      reviewScores = abs.reviewDetails.reviews.map(r => r.score).filter(x => x !== undefined && x !== null).join(', ');
      reviewDecisions = abs.reviewDetails.reviews.map(r => r.decision).filter(x => x).join(', ');
      reviewComments = abs.reviewDetails.reviews.map(r => r.comments).filter(x => x).join(' | ');
    }
    // SubTopic name (if possible)
    let subTopic = abs.subTopic;
    if (abs.eventInfo && abs.eventInfo.abstractSettings && Array.isArray(abs.eventInfo.abstractSettings.categories)) {
      // Try to find the category and subtopic by ID
      let catId = cat._id?.toString() || cat.toString();
      let subTopicId = abs.subTopic?.toString();
      const catObj = abs.eventInfo.abstractSettings.categories.find(c => c._id?.toString() === catId);
      if (catObj && Array.isArray(catObj.subTopics)) {
        const sub = catObj.subTopics.find(st => st._id?.toString() === subTopicId);
        if (sub) subTopic = sub.name;
      }
    }
    const baseRow = {
      eventName,
      abstractNumber: abs.abstractNumber || '',
      abstractId: abs._id?.toString() || '',
      title: abs.title || '',
      authors: abs.authors || '',
      authorAffiliations: abs.authorAffiliations || '',
      category: cat.name || cat || '',
      topic: abs.topic || '',
      subTopic: subTopic || '',
      submissionType: abs.submissionType || '',
      status: abs.status || '',
      submissionDate: abs.submissionDate ? new Date(abs.submissionDate).toLocaleString() : '',
      registrationId: reg.registrationId || '',
      firstName: personal.firstName || '',
      lastName: personal.lastName || '',
      email: personal.email || '',
      phone: personal.phone || '',
      organization: personal.organization || '',
      keywords,
      fileName: abs.fileName || '',
      fileUrl: abs.fileUrl || '',
      reviewers,
      reviewScores,
      reviewDecisions,
      reviewComments,
    };
    if (exportMode === 'multi-row' && abs.reviewDetails && Array.isArray(abs.reviewDetails.reviews) && abs.reviewDetails.reviews.length > 0) {
      for (const review of abs.reviewDetails.reviews) {
        worksheet.addRow({
          ...baseRow,
          reviewerName: review.reviewer?.name || review.reviewer?.toString() || '',
          reviewerEmail: review.reviewer?.email || '',
          reviewDate: review.reviewedAt ? new Date(review.reviewedAt).toLocaleString() : '',
          reviewComment: review.comments || '',
          reviewScore: review.score || '',
          reviewDecision: review.decision || '',
        });
      }
    } else {
      worksheet.addRow(baseRow);
    }
  }

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };
  worksheet.columns.forEach(column => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const length = cell.value ? cell.value.toString().length : 10;
      if (length > maxLength) {
        maxLength = length;
      }
    });
    column.width = Math.min(maxLength + 2, 40);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return { buffer, fileName };
};

module.exports = {
  parseRegistrationsExcel,
  generateRegistrationsExcel,
  generateAbstractsExcel,
}; 