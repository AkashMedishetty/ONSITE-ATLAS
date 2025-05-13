const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Event, Category, Registration, User } = require('../models');
const logger = require('./logger');

// Sample data
const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password123',
    role: 'admin'
  },
  {
    name: 'Staff User',
    email: 'staff@example.com',
    password: 'password123',
    role: 'staff'
  }
];

const sampleEvents = [
  {
    name: 'Annual Tech Conference 2023',
    description: 'A gathering of tech enthusiasts and professionals',
    location: 'Tech Convention Center, San Francisco',
    startDate: '2023-09-15T00:00:00.000Z',
    endDate: '2023-09-17T00:00:00.000Z',
    timezone: 'America/Los_Angeles',
    registrationPrefix: 'TECH23',
    logo: 'https://placehold.co/200x200?text=TechConf',
    status: 'active'
  },
  {
    name: 'Medical Summit 2023',
    description: 'Leading medical professionals sharing latest research',
    location: 'Medical Research Center, Boston',
    startDate: '2023-10-20T00:00:00.000Z',
    endDate: '2023-10-22T00:00:00.000Z',
    timezone: 'America/New_York',
    registrationPrefix: 'MED23',
    logo: 'https://placehold.co/200x200?text=MedSummit',
    status: 'upcoming'
  }
];

const sampleCategories = [
  {
    name: 'VIP',
    description: 'Very Important Persons get premium access',
    color: '#FFD700',
    permissions: {
      food: true,
      kitBag: true,
      certificate: true
    }
  },
  {
    name: 'Speaker',
    description: 'Conference speakers',
    color: '#4299E1',
    permissions: {
      food: true,
      kitBag: true,
      certificate: true
    }
  },
  {
    name: 'Attendee',
    description: 'Regular conference attendees',
    color: '#48BB78',
    permissions: {
      food: true,
      kitBag: true,
      certificate: true
    }
  },
  {
    name: 'Staff',
    description: 'Event staff members',
    color: '#F56565',
    permissions: {
      food: true,
      kitBag: true,
      certificate: false
    }
  }
];

// Sample registrations data (will be generated with references to events and categories)
let sampleRegistrations = [];

// Seed functions
const seedUsers = async () => {
  try {
    const count = await User.countDocuments();
    if (count > 0) {
      logger.info('Users collection already has data, skipping seed');
      return;
    }

    // Hash passwords before inserting
    const usersWithHashedPasswords = await Promise.all(
      sampleUsers.map(async (user) => {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        return { ...user, password: hashedPassword };
      })
    );

    await User.insertMany(usersWithHashedPasswords);
    logger.info('User seed data inserted successfully');
  } catch (error) {
    logger.error('Error seeding users:', error);
  }
};

const seedEvents = async () => {
  try {
    const count = await Event.countDocuments();
    if (count > 0) {
      logger.info('Events collection already has data, skipping seed');
      return [];
    }

    const events = await Event.insertMany(sampleEvents);
    logger.info('Event seed data inserted successfully');
    return events;
  } catch (error) {
    logger.error('Error seeding events:', error);
    return [];
  }
};

const seedCategories = async () => {
  try {
    const count = await Category.countDocuments();
    if (count > 0) {
      logger.info('Categories collection already has data, skipping seed');
      return [];
    }

    const categories = await Category.insertMany(sampleCategories);
    logger.info('Category seed data inserted successfully');
    return categories;
  } catch (error) {
    logger.error('Error seeding categories:', error);
    return [];
  }
};

const generateRegistrations = (events, categories) => {
  if (events.length === 0 || categories.length === 0) {
    return [];
  }
  
  // Create sample names
  const firstNames = ['John', 'Jane', 'Alex', 'Sarah', 'Michael', 'Emma', 'David', 'Olivia', 'Robert', 'Sophia'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Martinez', 'Wilson'];
  const organizations = ['Tech Innovations', 'Future Systems', 'Global Tech', 'Innovate Inc.', 'Digital Solutions', 'DevCorp', 'NextGen Systems', 'Smart Tech', 'Pioneer Innovations', 'TechForward'];
  
  const registrations = [];
  
  events.forEach(event => {
    // Create 25 registrations per event
    for (let i = 0; i < 25; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
      const organization = organizations[Math.floor(Math.random() * organizations.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const registrationId = `${event.registrationPrefix}-${1000 + i}`;
      const isCheckedIn = Math.random() > 0.5;
      
      registrations.push({
        registrationId,
        event: event._id,
        category: category._id,
        personalInfo: {
          firstName,
          lastName,
          email,
          phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
          organization
        },
        status: isCheckedIn ? 'checked-in' : 'registered',
        checkedInAt: isCheckedIn ? new Date() : null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  });
  
  return registrations;
};

const seedRegistrations = async (events, categories) => {
  try {
    const count = await Registration.countDocuments();
    if (count > 0) {
      logger.info('Registrations collection already has data, skipping seed');
      return;
    }

    const registrations = generateRegistrations(events, categories);
    await Registration.insertMany(registrations);
    logger.info('Registration seed data inserted successfully');
  } catch (error) {
    logger.error('Error seeding registrations:', error);
  }
};

// Main seed function
const seedDatabase = async () => {
  logger.info('Starting database seed...');
  
  try {
    // Seed users (admins, staff)
    await seedUsers();
    
    // Seed events
    const events = await seedEvents();
    
    // Seed categories
    const categories = await seedCategories();
    
    // Seed registrations (needs events and categories to relate to)
    await seedRegistrations(events, categories);
    
    logger.info('Database seed completed successfully');
    return true; // Return success value
  } catch (error) {
    logger.error('Database seed failed:', error);
    throw error; // Re-throw the error to be caught by the caller
  }
};

module.exports = seedDatabase; 