const jwt = require('jsonwebtoken');
const Registration = require('../models/Registration');
const Abstract = require('../models/Abstract');
const EventSponsor = require('../models/EventSponsor');
const Category = require('../models/Category');
const Payment = require('../models/Payment');
const Workshop = require('../models/Workshop');
const { sendSuccess, sendPaginated } = require('../utils/responseFormatter');
const excelHelper = require('../utils/excelHelper');
const config = require('../config/config');
const bcrypt = require('bcryptjs');
const EventClient = require('../models/EventClient');
const Event = require('../models/Event');
const ApiError = require('../utils/ApiError');
const Resource = require('../models/Resource');
const { Parser: Json2csvParser } = require('json2csv');
const PDFDocument = require('pdfkit');
const stream = require('stream');
const { generateRegistrationId } = require('../utils/idGenerator');
const { getNextSequenceValue } = require('../utils/counterUtils');

// Utility to check event context
function ensureEventContext(req, res, next) {
  if (!req.client || !req.client.event) {
    console.error('[ClientPortal] Missing event context for client:', req.client ? req.client._id : 'unknown');
    return res.status(400).json({ success: false, message: 'Event context missing. Please re-login or contact support.' });
  }
  return null;
}

const loginClient = async (req, res, next) => {
  try {
    const { clientId, password } = req.body;
    if (!clientId || !password) {
      return next(new ApiError(400, 'clientId and password are required'));
    }
    const client = await EventClient.findOne({ clientId });
    if (!client) return next(new ApiError(401, 'Invalid clientId or password'));
    if (client.status !== 'Active') return next(new ApiError(403, 'Client account is not active'));
    const isMatch = await bcrypt.compare(password, client.passwordHash);
    if (!isMatch) return next(new ApiError(401, 'Invalid clientId or password'));
    // Issue JWT
    const payload = {
      id: client._id,
      type: 'client',
      event: client.event,
      clientId: client.clientId,
      name: client.name
    };
    const secret = process.env.CLIENT_JWT_SECRET || process.env.JWT_SECRET;
    const token = jwt.sign(payload, secret, { expiresIn: '2d' });
    res.json({ success: true, token, client: { clientId: client.clientId, name: client.name, email: client.email, phone: client.phone, event: client.event } });
  } catch (err) {
    next(new ApiError(500, 'Error logging in', true, err.stack));
  }
};

const logoutClient = async (req, res) => {
  // No server-side token invalidation for JWT, just respond success
  res.json({ success: true, message: 'Logged out' });
};

const getClientDashboard = async (req, res, next) => {
  if (ensureEventContext(req, res, next)) return;
  try {
    const eventId = req.client.event;
    // Registration stats
    const totalRegistrations = await Registration.countDocuments({ event: eventId });
    const totalPayments = await Payment.countDocuments({ event: eventId });
    const totalAbstracts = await Abstract.countDocuments({ event: eventId });
    const totalSponsors = await EventSponsor.countDocuments({ event: eventId });
    // Add more stats as needed
    const stats = {
      totalRegistrations,
      totalPayments,
      totalAbstracts,
      totalSponsors
    };
    sendSuccess(res, 200, 'Dashboard data', stats);
  } catch (err) {
    next(new ApiError(500, 'Error fetching dashboard data', true, err.stack));
  }
};

const getClientRegistrants = async (req, res, next) => {
  if (ensureEventContext(req, res, next)) return;
  try {
    const eventId = req.client.event;
    const { category, status, registrationType, search, page = 1, limit = 50 } = req.query;
    const filter = { event: eventId };
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (registrationType) filter.registrationType = registrationType;
    if (search) {
      filter.$or = [
        { 'personalInfo.firstName': { $regex: search, $options: 'i' } },
        { 'personalInfo.lastName': { $regex: search, $options: 'i' } },
        { 'personalInfo.email': { $regex: search, $options: 'i' } },
        { registrationId: { $regex: search, $options: 'i' } }
      ];
    }
    const total = await Registration.countDocuments(filter);
    const registrants = await Registration.find(filter)
      .populate('category')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    sendPaginated(res, 200, 'Registrants list', registrants, Number(page), Number(limit), total);
  } catch (err) {
    next(new ApiError(500, 'Error fetching registrants', true, err.stack));
  }
};

const bulkImportClientRegistrants = async (req, res, next) => {
  if (ensureEventContext(req, res, next)) return;
  try {
    if (!req.files || !req.files.file) {
      return next(new ApiError(400, 'No file uploaded'));
    }
    const buffer = req.files.file.data;
    const registrations = await excelHelper.parseRegistrationsExcel(buffer);
    const eventId = req.client.event;
    const created = [];
    for (const reg of registrations) {
      const exists = await Registration.findOne({ event: eventId, 'personalInfo.email': reg.personalInfo.email });
      if (exists) continue;
      reg.event = eventId;
      if (!reg.category) {
        const defaultCategory = await Category.findOne({ event: eventId });
        if (defaultCategory) reg.category = defaultCategory._id;
      }
      reg.registrationType = 'complementary'; // Fixed typo
      const newReg = await Registration.create(reg);
      created.push(newReg);
    }
    res.json({ success: true, createdCount: created.length });
  } catch (err) {
    next(new ApiError(500, 'Error importing registrants', true, err.stack));
  }
};

const exportClientRegistrants = async (req, res, next) => {
  if (ensureEventContext(req, res, next)) return;
  try {
    const eventId = req.client.event;
    const registrants = await Registration.find({ event: eventId }).populate('category');
    const buffer = await excelHelper.generateRegistrationsExcel(registrants);
    res.setHeader('Content-Disposition', 'attachment; filename="registrants.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    next(new ApiError(500, 'Error exporting registrants', true, err.stack));
  }
};

const getClientAbstracts = async (req, res, next) => {
  if (ensureEventContext(req, res, next)) return;
  try {
    const eventId = req.client.event;
    const abstracts = await Abstract.find({ event: eventId }).populate('registration category');
    sendSuccess(res, 200, 'Abstracts list', abstracts);
  } catch (err) {
    next(new ApiError(500, 'Error fetching abstracts', true, err.stack));
  }
};

const getClientSponsors = async (req, res, next) => {
  if (ensureEventContext(req, res, next)) return;
  try {
    const eventId = req.client.event;
    const sponsors = await EventSponsor.find({ event: eventId });
    sendSuccess(res, 200, 'Sponsors list', sponsors);
  } catch (err) {
    next(new ApiError(500, 'Error fetching sponsors', true, err.stack));
  }
};

const getClientCategories = async (req, res, next) => {
  if (ensureEventContext(req, res, next)) return;
  try {
    const eventId = req.client.event;
    const categories = await Category.find({ event: eventId });
    sendSuccess(res, 200, 'Categories list', categories);
  } catch (err) {
    next(new ApiError(500, 'Error fetching categories', true, err.stack));
  }
};

const getClientPayments = async (req, res, next) => {
  if (ensureEventContext(req, res, next)) return;
  try {
    const eventId = req.client.event;
    const payments = await Payment.find({ event: eventId });
    sendSuccess(res, 200, 'Payments list', payments);
  } catch (err) {
    next(new ApiError(500, 'Error fetching payments', true, err.stack));
  }
};

const getClientWorkshops = async (req, res, next) => {
  if (ensureEventContext(req, res, next)) return;
  try {
    const eventId = req.client.event;
    const workshops = await Workshop.find({ event: eventId });
    sendSuccess(res, 200, 'Workshops list', workshops);
  } catch (err) {
    next(new ApiError(500, 'Error fetching workshops', true, err.stack));
  }
};

const setNoCacheHeaders = (res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
};

const getClientReports = async (req, res, next) => {
  if (ensureEventContext(req, res, next)) return;
  try {
    setNoCacheHeaders(res);
    // Placeholder: return stats, can be extended
    const eventId = req.client.event;
    const totalRegistrations = await Registration.countDocuments({ event: eventId });
    const totalPayments = await Payment.countDocuments({ event: eventId });
    const totalAbstracts = await Abstract.countDocuments({ event: eventId });
    const totalSponsors = await EventSponsor.countDocuments({ event: eventId });
    sendSuccess(res, 200, 'Reports data', {
      totalRegistrations,
      totalPayments,
      totalAbstracts,
      totalSponsors
    });
  } catch (err) {
    next(new ApiError(500, 'Error fetching reports', true, err.stack));
  }
};

// List all event clients for an event (admin)
const listEventClients = async (req, res, next) => {
  try {
    const { eventId } = req.query;
    if (!eventId) return next(new ApiError(400, 'eventId is required'));
    const event = await Event.findById(eventId).populate('eventClients');
    if (!event) return next(new ApiError(404, 'Event not found'));
    res.json({ success: true, clients: event.eventClients });
  } catch (err) {
    next(new ApiError(500, 'Error listing event clients', true, err.stack));
  }
};

// Create a new event client (admin)
const createEventClient = async (req, res, next) => {
  try {
    const { eventId, name, email, phone } = req.body;
    if (!eventId || !name || !email || !phone) {
      return next(new ApiError(400, 'eventId, name, email, and phone are required'));
    }
    const event = await Event.findById(eventId);
    if (!event) return next(new ApiError(404, 'Event not found'));
    const eventPrefix = event.registrationSettings?.idPrefix || 'REG';
    const clientId = await EventClient.generateNextClientId(eventId, eventPrefix);
    // Check for duplicate email or phone for this event
    const existing = await EventClient.findOne({ event: eventId, $or: [{ email }, { phone }] });
    if (existing) return next(new ApiError(409, 'Client with this email or phone already exists for this event'));
    const newClient = await EventClient.create({
      event: eventId,
      clientId,
      name,
      email,
      phone,
      plainPassword: phone, // Mobile number is password
      passwordHash: phone,  // Will be hashed by pre-save hook
      status: 'Active'
    });
    // Add to event's eventClients array
    event.eventClients.push(newClient._id);
    await event.save();
    res.status(201).json({ success: true, client: newClient, plainPassword: phone });
  } catch (err) {
    next(new ApiError(500, 'Error creating event client', true, err.stack));
  }
};

// Update event client (admin, except password)
const updateEventClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, phone, status } = req.body;
    const client = await EventClient.findById(id);
    if (!client) return next(new ApiError(404, 'Event client not found'));
    if (name) client.name = name;
    if (email) client.email = email;
    if (phone) client.phone = phone;
    if (status) {
      console.log('[updateEventClient] Received status:', status);
      client.status = status;
    }
    await client.save();
    console.log('[updateEventClient] Saved client.status:', client.status);
    res.json({ success: true, client });
  } catch (err) {
    next(new ApiError(500, 'Error updating event client', true, err.stack));
  }
};

// Delete event client (admin)
const deleteEventClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const client = await EventClient.findById(id);
    if (!client) return next(new ApiError(404, 'Event client not found'));
    // Remove from event's eventClients array
    await Event.findByIdAndUpdate(client.event, { $pull: { eventClients: client._id } });
    await client.deleteOne();
    res.json({ success: true });
  } catch (err) {
    next(new ApiError(500, 'Error deleting event client', true, err.stack));
  }
};

// Reset event client password (admin, sets to phone)
const resetEventClientPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const client = await EventClient.findById(id);
    if (!client) return next(new ApiError(404, 'Event client not found'));
    if (!client.phone) return next(new ApiError(400, 'Client does not have a phone number set'));
    client.plainPassword = client.phone;
    client.passwordHash = client.phone; // Will be hashed by pre-save hook
    await client.save();
    res.json({ success: true, plainPassword: client.phone });
  } catch (err) {
    next(new ApiError(500, 'Error resetting event client password', true, err.stack));
  }
};

// Analytics for client dashboard
const getClientAnalytics = async (req, res, next) => {
  try {
    setNoCacheHeaders(res);
    const eventId = req.client.event;
    // Registrations by Category
    const categoryAgg = await Registration.aggregate([
      { $match: { event: eventId } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: '$category' },
      { $project: { _id: 0, name: '$category.name', count: 1 } }
    ]);
    const registrationsByCategory = {};
    categoryAgg.forEach(c => { registrationsByCategory[c.name] = c.count; });

    // Registrations by Type
    const typeAgg = await Registration.aggregate([
      { $match: { event: eventId } },
      { $group: { _id: '$registrationType', count: { $sum: 1 } } }
    ]);
    const registrationsByType = {};
    typeAgg.forEach(t => { registrationsByType[t._id || 'Unknown'] = t.count; });

    // Registrations by Day (last 30 days)
    const dayAgg = await Registration.aggregate([
      { $match: { event: eventId, createdAt: { $gte: new Date(Date.now() - 30*24*60*60*1000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    const registrationsByDay = dayAgg.map(d => ({ date: d._id, count: d.count }));

    // Abstracts by Status
    const absStatusAgg = await Abstract.aggregate([
      { $match: { event: eventId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const abstractsByStatus = {};
    absStatusAgg.forEach(a => { abstractsByStatus[a._id || 'Unknown'] = a.count; });

    // Resource Usage Stats (byType and byDay)
    const resourceTypes = ['food', 'kitBag', 'certificate'];
    const resourcesByType = {};
    for (const type of resourceTypes) {
      const agg = await Resource.aggregate([
        { $match: { event: eventId, type, status: 'used' } },
        { $group: { _id: '$details.name', count: { $sum: 1 } } }
      ]);
      resourcesByType[type] = {};
      agg.forEach(r => { resourcesByType[type][r._id || 'Unknown'] = r.count; });
    }
    // Food byDay (last 30 days)
    const foodByDayAgg = await Resource.aggregate([
      { $match: { event: eventId, type: 'food', status: 'used', actionDate: { $gte: new Date(Date.now() - 30*24*60*60*1000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$actionDate' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    const foodByDay = foodByDayAgg.map(d => ({ date: d._id, count: d.count }));

    // Resource Usage Totals
    const foodStats = await Resource.countDocuments({ event: eventId, type: 'food', status: 'used' });
    const kitStats = await Resource.countDocuments({ event: eventId, type: 'kitBag', status: 'used' });
    const certStats = await Resource.countDocuments({ event: eventId, type: 'certificate', status: 'used' });
    const resourceUsageTrends = { food: foodStats, kit: kitStats, certificate: certStats };

    // Payments by Category (stub)
    const paymentsByCategory = { General: 0, VIP: 0 };

    const response = {
      registrationsByCategory,
      registrationsByType,
      registrationsByDay,
      abstractsByStatus,
      resourceUsageTrends,
      paymentsByCategory,
      resources: {
        food: { byType: resourcesByType.food, byDay: foodByDay },
        kitBag: { byType: resourcesByType.kitBag },
        certificates: { byType: resourcesByType.certificate }
      }
    };
    console.log('[CLIENT ANALYTICS RESPONSE]', JSON.stringify(response, null, 2));
    res.json(response);
  } catch (err) {
    next(new ApiError(500, 'Error fetching analytics', true, err.stack));
  }
};

// Recent activity for client dashboard
const getClientRecent = async (req, res, next) => {
  try {
    setNoCacheHeaders(res);
    const eventId = req.client.event;
    // Recent registrations
    const recentRegistrations = await Registration.find({ event: eventId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('personalInfo.firstName personalInfo.lastName createdAt');
    // Recent abstracts
    const recentAbstracts = await Abstract.find({ event: eventId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title createdAt');
    // Recent food scans
    const recentFood = await Resource.find({ event: eventId, type: 'food', status: 'used' })
      .sort({ actionDate: -1 })
      .limit(20)
      .populate('registration')
      .lean();
    // Recent kit scans
    const recentKit = await Resource.find({ event: eventId, type: 'kitBag', status: 'used' })
      .sort({ actionDate: -1 })
      .limit(20)
      .populate('registration')
      .lean();
    // Recent certificate scans
    const recentCert = await Resource.find({ event: eventId, type: 'certificate', status: 'used' })
      .sort({ actionDate: -1 })
      .limit(20)
      .populate('registration')
      .lean();
    // Map resourceOption and actionBy fields
    const mapResource = (arr) => arr.map(r => ({
      ...r,
      timestamp: r.actionDate,
      registration: r.registration ? {
        firstName: r.registration.personalInfo?.firstName,
        lastName: r.registration.personalInfo?.lastName,
        registrationId: r.registration.registrationId
      } : null,
      resourceOption: { name: r.details?.name || '' },
      actionBy: r.actionBy || ''
    }));
    const response = {
      activity: [
        ...recentRegistrations.map(r => ({ description: `Registered: ${r.personalInfo.firstName} ${r.personalInfo.lastName}`, timestamp: r.createdAt })),
        ...recentAbstracts.map(a => ({ description: `Abstract submitted: ${a.title}`, timestamp: a.createdAt }))
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10),
      registrations: recentRegistrations,
      abstracts: recentAbstracts,
      food: mapResource(recentFood),
      kitBag: mapResource(recentKit),
      certificate: mapResource(recentCert)
    };
    console.log('[CLIENT RECENT RESPONSE]', JSON.stringify(response, null, 2));
    res.json(response);
  } catch (err) {
    next(new ApiError(500, 'Error fetching recent activity', true, err.stack));
  }
};

// 3. Add exportClientReport for /me/reports/export
const exportClientReport = async (req, res, next) => {
  try {
    const eventId = req.client.event;
    const { reportType = 'registrations', format = 'pdf', dateRange = 'all' } = req.query;
    let data = [];
    if (reportType === 'registrations') {
      data = await Registration.find({ event: eventId }).populate('category');
    } else if (reportType === 'food') {
      data = await Resource.find({ event: eventId, type: 'food', status: 'used' }).populate('registration');
    } else if (reportType === 'kitBag') {
      data = await Resource.find({ event: eventId, type: 'kitBag', status: 'used' }).populate('registration');
    } else if (reportType === 'certificates') {
      data = await Resource.find({ event: eventId, type: 'certificate', status: 'used' }).populate('registration');
    } else if (reportType === 'abstracts') {
      data = await Abstract.find({ event: eventId }).populate('registration category');
    } else {
      return res.status(400).json({ success: false, message: 'Invalid report type' });
    }
    // Export logic
    if (format === 'excel') {
      let buffer;
      if (reportType === 'registrations') {
        buffer = await excelHelper.generateRegistrationsExcel(data);
      } else if (reportType === 'abstracts') {
        buffer = await excelHelper.generateAbstractsExcel(data);
      } else {
        // For resources, create a simple Excel
        const workbook = new (require('exceljs')).Workbook();
        const worksheet = workbook.addWorksheet('Resource Usage');
        worksheet.columns = [
          { header: 'Registration ID', key: 'registrationId' },
          { header: 'Type', key: 'type' },
          { header: 'Used At', key: 'actionDate' },
          { header: 'Details', key: 'details' }
        ];
        data.forEach(r => {
          worksheet.addRow({
            registrationId: r.registration?.registrationId || '',
            type: r.type,
            actionDate: r.actionDate ? new Date(r.actionDate).toLocaleString() : '',
            details: JSON.stringify(r.details)
          });
        });
        buffer = await workbook.xlsx.writeBuffer();
      }
      res.setHeader('Content-Disposition', `attachment; filename="${reportType}.xlsx"`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      return res.send(buffer);
    } else if (format === 'csv') {
      let csv;
      if (reportType === 'registrations' || reportType === 'abstracts') {
        const fields = Object.keys(data[0]?.toObject() || {});
        const parser = new Json2csvParser({ fields });
        csv = parser.parse(data.map(d => d.toObject()));
      } else {
        // For resources
        const fields = ['registrationId', 'type', 'actionDate', 'details'];
        csv = [fields.join(',')].concat(data.map(r => [
          r.registration?.registrationId || '',
          r.type,
          r.actionDate ? new Date(r.actionDate).toLocaleString() : '',
          JSON.stringify(r.details)
        ].join(','))).join('\n');
      }
      res.setHeader('Content-Disposition', `attachment; filename="${reportType}.csv"`);
      res.setHeader('Content-Type', 'text/csv');
      return res.send(csv);
    } else if (format === 'pdf') {
      // Simple PDF export
      const doc = new PDFDocument();
      const pass = new stream.PassThrough();
      res.setHeader('Content-Disposition', `attachment; filename="${reportType}.pdf"`);
      res.setHeader('Content-Type', 'application/pdf');
      doc.pipe(pass);
      doc.fontSize(16).text(`Report: ${reportType}`, { align: 'center' });
      doc.moveDown();
      data.forEach((item, idx) => {
        doc.fontSize(12).text(`${idx + 1}. ${JSON.stringify(item)}`);
        doc.moveDown(0.5);
      });
      doc.end();
      pass.pipe(res);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid export format' });
    }
  } catch (err) {
    next(new ApiError(500, 'Error exporting report', true, err.stack));
  }
};

// Add a new registrant from the client portal
const addClientRegistrant = async (req, res, next) => {
  if (ensureEventContext(req, res, next)) return;
  try {
    const eventId = req.client.event;
    const { personalInfo = {}, customFields = {}, category, registrationType } = req.body;
    // Validate required fields
    if (!personalInfo.firstName || !personalInfo.lastName || !personalInfo.email || !category) {
      return res.status(400).json({ success: false, message: 'Missing required fields: firstName, lastName, email, category' });
    }
    // Check for duplicate email in this event
    const exists = await Registration.findOne({ event: eventId, 'personalInfo.email': personalInfo.email });
    if (exists) {
      return res.status(409).json({ success: false, message: 'A registrant with this email already exists for this event.' });
    }
    // Fetch event for registrationId generation
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    // --- Use Counter Pattern for ID Generation (admin logic) ---
    const registrationPrefix = event.registrationSettings?.idPrefix || 'REG';
    const startNumber = event.registrationSettings?.startNumber || 1;
    const sequenceName = `${eventId}_registration_id`;
    let registrationId;
    try {
      const nextNumber = await getNextSequenceValue(sequenceName, startNumber);
      const formattedNumber = nextNumber.toString().padStart(4, '0');
      registrationId = `${registrationPrefix}-${formattedNumber}`;
      // Double-check uniqueness (should be extremely rare)
      const existing = await Registration.findOne({ event: eventId, registrationId });
      if (existing) {
        return res.status(500).json({ success: false, message: 'Failed to generate unique registration ID. Please try again.' });
      }
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to generate registration ID' });
    }
    // --- End ID Generation ---
    const reg = await Registration.create({
      event: eventId,
      registrationId,
      personalInfo,
      customFields,
      category,
      registrationType: 'complementary', // Always complementary for client portal
      status: 'active',
    });
    const populated = await Registration.findById(reg._id).populate('category');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(new ApiError(500, 'Error adding registrant', true, err.stack));
  }
};

module.exports = {
  loginClient,
  logoutClient,
  getClientDashboard,
  getClientRegistrants,
  bulkImportClientRegistrants,
  exportClientRegistrants,
  getClientAbstracts,
  getClientSponsors,
  getClientCategories,
  getClientPayments,
  getClientWorkshops,
  getClientReports,
  listEventClients,
  createEventClient,
  updateEventClient,
  deleteEventClient,
  resetEventClientPassword,
  getClientAnalytics,
  getClientRecent,
  exportClientReport,
  addClientRegistrant
}; 