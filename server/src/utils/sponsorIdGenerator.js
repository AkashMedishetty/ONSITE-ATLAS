const Event = require('../models/Event');
const EventSponsor = require('../models/EventSponsor');
const { ApiError } = require('./ApiError');
const httpStatus = require('http-status');
const logger = require('../config/logger');

/**
 * Generates a unique sponsor ID for a given event.
 * Format: SPN-<EVENT_CODE_PREFIX>-NNN (e.g., SPN-CONF24-001)
 * @param {string} eventId - The MongoDB ID of the event.
 * @returns {Promise<string>} The generated unique sponsor ID.
 * @throws {ApiError} If the event is not found or if ID generation fails.
 */
async function generateSponsorId(eventId) {
  const event = await Event.findById(eventId).select('registrationSettings.idPrefix');
  if (!event || !event.registrationSettings || !event.registrationSettings.idPrefix) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Event or event ID prefix not found for sponsor ID generation');
  }

  const prefix = `SPN-${event.registrationSettings.idPrefix}-`;

  const lastSponsor = await EventSponsor.findOne(
    { event: eventId, sponsorId: { $regex: `^${prefix}` } },
    { sponsorId: 1 },
    { sort: { sponsorId: -1 } }
  );

  let nextNumber = 1;
  if (lastSponsor && lastSponsor.sponsorId) {
    const lastNumberStr = lastSponsor.sponsorId.substring(prefix.length);
    const lastNumber = parseInt(lastNumberStr, 10);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  const nextId = `${prefix}${String(nextNumber).padStart(3, '0')}`;
  logger.info(`Generated new sponsor ID: ${nextId} for event ${eventId}`);
  return nextId;
}

module.exports = { generateSponsorId }; 