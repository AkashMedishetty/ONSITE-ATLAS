/**
 * Mock Data Generator
 * 
 * Utility functions to generate consistent mock data for development purposes.
 * This allows components to function without a backend API connection.
 */

// Generate a single mock event
export const generateMockEvent = () => {
  return {
    _id: `mock-event-${Math.random().toString(36).substring(2, 10)}`,
    name: 'Mock Conference 2024',
    description: 'A comprehensive mock event for development purposes',
    startDate: '2024-06-15',
    endDate: '2024-06-18',
    location: 'Development Center',
    status: 'Draft',
    venue: {
      name: 'Mock Venue',
      city: 'Mock City',
      country: 'Mock Country'
    },
    portalUrls: {
      registration: 'https://example.com/register/mock-event',
      abstract: 'https://example.com/abstracts/mock-event'
    },
    generalSettings: {
      eventType: 'conference',
      timezone: 'UTC',
      language: 'en',
      capacity: 500,
      organizer: 'Development Team'
    },
    registrationSettings: {
      enabled: true,
      startDate: '2024-04-01',
      endDate: '2024-06-01',
      idPrefix: 'DEV',
      fields: [
        { id: 'name', label: 'Full Name', type: 'text', required: true },
        { id: 'email', label: 'Email', type: 'email', required: true },
        { id: 'organization', label: 'Organization', type: 'text', required: false },
        { id: 'dietary', label: 'Dietary Requirements', type: 'select', required: false }
      ]
    },
    resourceSettings: {
      food: {
        enabled: true,
        items: [
          { id: 'breakfast', name: 'Breakfast', days: ['2024-06-15', '2024-06-16', '2024-06-17', '2024-06-18'] },
          { id: 'lunch', name: 'Lunch', days: ['2024-06-15', '2024-06-16', '2024-06-17', '2024-06-18'] },
          { id: 'dinner', name: 'Dinner', days: ['2024-06-15', '2024-06-16', '2024-06-17'] }
        ]
      },
      kits: {
        enabled: true,
        items: [
          { id: 'badge', name: 'Name Badge' },
          { id: 'program', name: 'Program Booklet' },
          { id: 'tshirt', name: 'Conference T-Shirt' },
          { id: 'bag', name: 'Conference Bag' }
        ]
      },
      certificates: {
        enabled: true,
        types: [
          { id: 'participation', name: 'Certificate of Participation' },
          { id: 'speaker', name: 'Speaker Certificate' },
          { id: 'volunteer', name: 'Volunteer Certificate' }
        ]
      }
    },
    abstractSettings: {
      enabled: true,
      submissionStartDate: '2024-03-01',
      submissionEndDate: '2024-04-30',
      reviewDeadline: '2024-05-15',
      maxWordCount: 500,
      allowEdit: true
    },
    badgeSettings: {
      enabled: true,
      templates: [
        {
          id: 'default',
          name: 'Default Badge',
          width: 3.5,
          height: 5,
          unit: 'in',
          orientation: 'portrait',
          showLogo: true,
          showName: true,
          showCategory: true,
          showQR: true
        }
      ]
    },
    emailSettings: {
      enabled: true,
      templates: [
        {
          id: 'registration',
          name: 'Registration Confirmation',
          subject: 'Thank You For Registering',
          body: 'Thank you for registering for {{eventName}}!'
        },
        {
          id: 'reminder',
          name: 'Event Reminder',
          subject: 'Your Event is Coming Up Soon',
          body: 'This is a reminder that {{eventName}} is coming up on {{eventDate}}.'
        }
      ]
    },
    paymentSettings: {
      enabled: false,
      currency: 'USD',
      providers: {
        stripe: { enabled: false },
        paypal: { enabled: false },
        offline: { enabled: true }
      }
    },
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  };
};

// Generate multiple mock events
export const generateMockEvents = (count = 5) => {
  const events = [];
  const statuses = ['Draft', 'Published', 'Active', 'Completed', 'Archived'];
  const eventTypes = ['Conference', 'Workshop', 'Seminar', 'Exhibition', 'Meeting'];
  
  for (let i = 0; i < count; i++) {
    const event = generateMockEvent();
    event._id = `mock-event-${i}`;
    event.name = `${eventTypes[i % eventTypes.length]} ${2024 + (i % 3)}`;
    event.status = statuses[i % statuses.length];
    
    // Vary dates to create a mix of past, current, and future events
    const baseDate = new Date();
    if (i % 3 === 0) {
      // Past event
      baseDate.setMonth(baseDate.getMonth() - (i % 4) - 1);
    } else if (i % 3 === 1) {
      // Current event
      baseDate.setDate(baseDate.getDate() - 1);
    } else {
      // Future event
      baseDate.setMonth(baseDate.getMonth() + (i % 4) + 1);
    }
    
    const startDate = new Date(baseDate);
    const endDate = new Date(baseDate);
    endDate.setDate(endDate.getDate() + 2 + (i % 3));
    
    event.startDate = startDate.toISOString().split('T')[0];
    event.endDate = endDate.toISOString().split('T')[0];
    
    events.push(event);
  }
  
  return events;
};

// Generate mock registrations
export const generateMockRegistrations = (count = 20, eventId = 'mock-event') => {
  const registrations = [];
  const categories = ['Attendee', 'Speaker', 'Sponsor', 'Staff', 'VIP'];
  const statuses = ['Registered', 'Checked In', 'Cancelled', 'No Show'];
  
  for (let i = 0; i < count; i++) {
    const firstName = ['John', 'Sarah', 'Michael', 'Emma', 'David', 'Lisa', 'Robert', 'Jennifer'][i % 8];
    const lastName = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia'][i % 8];
    
    registrations.push({
      _id: `mock-reg-${i}`,
      registrationId: `DEV${1000 + i}`,
      eventId,
      status: statuses[i % statuses.length],
      category: categories[i % categories.length],
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      organization: ['ABC Corp', 'XYZ University', 'Tech Solutions', 'Research Center'][i % 4],
      phone: `+1 555-${100 + i}-${1000 + i}`,
      checkedIn: i % 4 === 1 ? new Date().toISOString() : null,
      createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString(),
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=DEV${1000 + i}`
    });
  }
  
  return registrations;
};

// Generate mock abstracts
export const generateMockAbstracts = (count = 10, eventId = 'mock-event') => {
  const abstracts = [];
  const statuses = ['Submitted', 'Under Review', 'Accepted', 'Rejected', 'Revisions Requested'];
  const titles = [
    'Advances in Machine Learning for Healthcare',
    'Sustainable Energy Solutions for Urban Centers',
    'The Future of Remote Work Technologies',
    'New Approaches to Climate Change Mitigation',
    'Innovation in Educational Technology',
    'Blockchain Applications in Supply Chain Management',
    'Artificial Intelligence in Financial Services',
    'The Impact of 5G on IoT Devices',
    'Quantum Computing: Current State and Future Prospects',
    'Cybersecurity Challenges in the Post-Pandemic Era'
  ];
  
  for (let i = 0; i < count; i++) {
    const firstName = ['John', 'Sarah', 'Michael', 'Emma', 'David'][i % 5];
    const lastName = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'][i % 5];
    
    abstracts.push({
      _id: `mock-abstract-${i}`,
      eventId,
      registrationId: `DEV${1000 + i}`,
      authorName: `${firstName} ${lastName}`,
      authorEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      title: titles[i % titles.length],
      content: `This is a sample abstract that discusses the important aspects of ${titles[i % titles.length].toLowerCase()}. The abstract presents new findings and discusses implications for future research and practical applications.`,
      keywords: ['technology', 'innovation', 'research', 'development', 'future'][i % 5],
      status: statuses[i % statuses.length],
      reviewNotes: i % 5 === 3 ? 'The abstract needs minor revisions to clarify methodology.' : null,
      submittedAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString(),
      updatedAt: new Date(Date.now() - (i * 12 * 60 * 60 * 1000)).toISOString()
    });
  }
  
  return abstracts;
};

// Generate mock resource tracking records
export const generateMockResourceRecords = (count = 50, eventId = 'mock-event') => {
  const records = [];
  const resourceTypes = ['food', 'kit', 'certificate'];
  const resourceNames = {
    food: ['Breakfast', 'Lunch', 'Dinner'],
    kit: ['Name Badge', 'Program Booklet', 'Conference Bag', 'T-Shirt'],
    certificate: ['Participation', 'Speaker', 'Volunteer']
  };
  
  for (let i = 0; i < count; i++) {
    const type = resourceTypes[i % resourceTypes.length];
    const name = resourceNames[type][i % resourceNames[type].length];
    const baseDate = new Date();
    baseDate.setHours(baseDate.getHours() - i);
    
    records.push({
      _id: `mock-resource-${i}`,
      eventId,
      registrationId: `DEV${1000 + (i % 20)}`,
      resourceType: type,
      resourceName: name,
      issuedAt: baseDate.toISOString(),
      issuedBy: 'Mock Staff',
      day: type === 'food' ? baseDate.toISOString().split('T')[0] : null,
      void: i % 10 === 0,
      voidReason: i % 10 === 0 ? 'Issued in error' : null
    });
  }
  
  return records;
};

// Export additional generators as needed
export default {
  generateMockEvent,
  generateMockEvents,
  generateMockRegistrations,
  generateMockAbstracts,
  generateMockResourceRecords
}; 