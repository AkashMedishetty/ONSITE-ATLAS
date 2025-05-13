const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Abstract = require('../models/Abstract');
const Schedule = require('../models/Schedule');
const { generateApiResponse } = require('../utils/responseFormatter');

/**
 * Get dashboard data for the registrant
 */
exports.getDashboard = async (req, res) => {
  try {
    const registrantId = req.user.registrationId;
    
    // Find the registration record
    const registration = await Registration.findOne({ registrationId: registrantId });
    
    if (!registration) {
      return res.status(404).json(generateApiResponse(null, false, 'Registration not found'));
    }
    
    // Get the event for this registration
    const event = await Event.findById(registration.eventId);
    
    if (!event) {
      return res.status(404).json(generateApiResponse(null, false, 'Event not found'));
    }
    
    // Get abstracts submitted by this registrant
    const abstracts = await Abstract.find({ 
      registrationId: registrantId,
      eventId: registration.eventId 
    });
    
    // Get schedule for the event
    const eventSchedule = await Schedule.findOne({ eventId: registration.eventId });
    
    // Format abstracts for the dashboard
    const abstractSubmissions = abstracts.map(abstract => ({
      id: abstract._id,
      title: abstract.title,
      status: abstract.status,
      submissionDate: abstract.submissionDate,
      presentationDate: abstract.presentationDate || 'Pending',
      presentationType: abstract.presentationType || 'Pending',
      venue: abstract.venue || 'Pending'
    }));
    
    // Format the schedule to extract upcoming deadlines
    const deadlines = [];
    const today = new Date();
    
    // Add abstract submission deadline if it exists and is in the future
    if (event.abstractDeadline && new Date(event.abstractDeadline) > today) {
      const daysLeft = Math.ceil((new Date(event.abstractDeadline) - today) / (1000 * 60 * 60 * 24));
      deadlines.push({
        id: 1,
        title: 'Abstract Submission',
        dueDate: event.abstractDeadline.toISOString().split('T')[0],
        daysLeft,
        isUrgent: daysLeft <= 3
      });
    }
    
    // Add registration payment deadline if it exists
    if (event.registrationDeadline && new Date(event.registrationDeadline) > today) {
      const daysLeft = Math.ceil((new Date(event.registrationDeadline) - today) / (1000 * 60 * 60 * 24));
      deadlines.push({
        id: 2,
        title: 'Registration Payment',
        dueDate: event.registrationDeadline.toISOString().split('T')[0],
        daysLeft,
        isUrgent: daysLeft <= 3
      });
    }
    
    // Get schedule data for dashboard
    let scheduleData = [];
    if (eventSchedule) {
      // Format the schedule data to include only the current day and next day
      scheduleData = eventSchedule.days.map(day => ({
        day: day.name,
        events: day.sessions.map(session => ({
          time: session.time,
          title: session.title,
          location: session.location,
          isHighlighted: session.isHighlighted
        })).slice(0, 3) // Only include first 3 events per day
      })).slice(0, 2); // Only include first 2 days
    }
    
    // Build the dashboard data
    const dashboardData = {
      registeredEvents: [{
        id: event._id,
        name: event.name,
        date: `${new Date(event.startDate).toISOString().split('T')[0]} to ${new Date(event.endDate).toISOString().split('T')[0]}`,
        location: event.venue,
        role: registration.type || 'Attendee',
        status: registration.status || 'Confirmed'
      }],
      abstractSubmissions,
      upcomingDeadlines: deadlines,
      schedule: scheduleData
    };
    
    return res.status(200).json(generateApiResponse(dashboardData, true, 'Dashboard data retrieved successfully'));
  } catch (error) {
    console.error('Error fetching registrant dashboard:', error);
    return res.status(500).json(generateApiResponse(null, false, 'Failed to fetch dashboard data'));
  }
};

/**
 * Get current event details for registrant portal
 */
exports.getCurrentEventDetails = async (req, res) => {
  try {
    // Find active event (usually would be based on the registrant's event)
    let event;
    
    if (req.user && req.user.registrationId) {
      const registration = await Registration.findOne({ registrationId: req.user.registrationId });
      if (registration) {
        event = await Event.findById(registration.eventId);
      }
    }
    
    // If no registration found or no event, get the active event
    if (!event) {
      event = await Event.findOne({ isActive: true });
    }
    
    if (!event) {
      return res.status(404).json(generateApiResponse(null, false, 'No active event found'));
    }
    
    // Get announcements for the event
    // In a real system, these might come from a separate Announcements collection
    const announcements = [
      { id: 1, title: 'Updated Schedule Available', date: 'Oct 5, 2023', content: 'The final conference schedule is now available. Please check the Schedule section for details.' },
      { id: 2, title: 'Abstract Submission Deadline Extended', date: 'Oct 2, 2023', content: 'The deadline for abstract submissions has been extended to October 10, 2023.' }
    ];
    
    // Get schedule highlights
    const eventSchedule = await Schedule.findOne({ eventId: event._id });
    const highlights = [];
    
    if (eventSchedule && eventSchedule.days && eventSchedule.days.length > 0) {
      // Get important sessions from the schedule to use as highlights
      eventSchedule.days.forEach((day, dayIndex) => {
        day.sessions.forEach(session => {
          if (session.type === 'keynote' || session.type === 'plenary' || session.type === 'ceremony') {
            highlights.push({
              time: `${session.time}, ${day.name}`,
              title: session.title,
              location: session.location
            });
          }
        });
      });
    }
    
    // If no sessions found in schedule, provide default highlights
    if (highlights.length === 0) {
      const startDate = new Date(event.startDate);
      highlights.push(
        { time: `9:00 AM, ${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, title: 'Opening Ceremony', location: 'Main Hall' },
        { time: `10:30 AM, ${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, title: 'Keynote Address', location: 'Auditorium A' }
      );
    }
    
    // Build event details response
    const eventDetails = {
      name: event.name,
      startDate: event.startDate,
      endDate: event.endDate,
      venue: event.venue,
      location: event.location || event.venue,
      bannerImage: event.bannerImage || 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04',
      logo: event.logo || 'https://via.placeholder.com/150x50',
      welcomeMessage: event.description || `Welcome to ${event.name}, where leading researchers from around the world gather to share groundbreaking discoveries and connect with peers.`,
      highlights: highlights.slice(0, 4), // Limit to 4 highlights
      announcements: announcements
    };
    
    return res.status(200).json(generateApiResponse(eventDetails, true, 'Event details retrieved successfully'));
  } catch (error) {
    console.error('Error fetching event details:', error);
    return res.status(500).json(generateApiResponse(null, false, 'Failed to fetch event details'));
  }
}; 
 