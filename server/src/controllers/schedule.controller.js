const Schedule = require('../models/Schedule');
const Event = require('../models/Event');
const { sendSuccess } = require('../utils/responseFormatter');

/**
 * Get the schedule for a specific event
 */
exports.getEventSchedule = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const schedule = await Schedule.findOne({ eventId });
    
    if (!schedule) {
      return sendSuccess(res, 404, 'Schedule not found for this event', null);
    }
    
    return sendSuccess(res, 200, 'Schedule retrieved successfully', schedule);
  } catch (error) {
    console.error('Error fetching event schedule:', error);
    return sendSuccess(res, 500, 'Failed to fetch schedule', null, { error: error.message });
  }
};

/**
 * Get the schedule for the current/active event
 */
exports.getCurrentEventSchedule = async (req, res) => {
  try {
    // Find the current active event
    const activeEvent = await Event.findOne({ isActive: true });
    
    if (!activeEvent) {
      return sendSuccess(res, 404, 'No active event found', null);
    }
    
    // Get the schedule for the active event
    const schedule = await Schedule.findOne({ eventId: activeEvent._id });
    
    if (!schedule) {
      return sendSuccess(res, 404, 'Schedule not found for the current event', null);
    }
    
    return sendSuccess(res, 200, 'Current event schedule retrieved successfully', schedule);
  } catch (error) {
    console.error('Error fetching current event schedule:', error);
    return sendSuccess(res, 500, 'Failed to fetch schedule', null, { error: error.message });
  }
};

/**
 * Create a new schedule for an event
 */
exports.createSchedule = async (req, res) => {
  try {
    const { eventId } = req.params;
    const scheduleData = req.body;
    
    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return sendSuccess(res, 404, 'Event not found', null);
    }
    
    // Check if schedule already exists for this event
    const existingSchedule = await Schedule.findOne({ eventId });
    if (existingSchedule) {
      return sendSuccess(res, 400, 'Schedule already exists for this event', null);
    }
    
    // Create new schedule
    const newSchedule = new Schedule({
      eventId,
      eventName: event.name,
      days: scheduleData.days
    });
    
    await newSchedule.save();
    
    return sendSuccess(res, 201, 'Schedule created successfully', newSchedule);
  } catch (error) {
    console.error('Error creating schedule:', error);
    return sendSuccess(res, 500, 'Failed to create schedule', null, { error: error.message });
  }
};

/**
 * Update an existing schedule
 */
exports.updateSchedule = async (req, res) => {
  try {
    const { eventId } = req.params;
    const scheduleData = req.body;
    
    // Check if schedule exists
    const schedule = await Schedule.findOne({ eventId });
    if (!schedule) {
      return sendSuccess(res, 404, 'Schedule not found for this event', null);
    }
    
    // Update schedule
    schedule.days = scheduleData.days;
    schedule.updatedAt = Date.now();
    
    await schedule.save();
    
    return sendSuccess(res, 200, 'Schedule updated successfully', schedule);
  } catch (error) {
    console.error('Error updating schedule:', error);
    return sendSuccess(res, 500, 'Failed to update schedule', null, { error: error.message });
  }
};

/**
 * Delete a schedule
 */
exports.deleteSchedule = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const result = await Schedule.deleteOne({ eventId });
    
    if (result.deletedCount === 0) {
      return sendSuccess(res, 404, 'Schedule not found for this event', null);
    }
    
    return sendSuccess(res, 200, 'Schedule deleted successfully', { deleted: true });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    return sendSuccess(res, 500, 'Failed to delete schedule', null, { error: error.message });
  }
}; 