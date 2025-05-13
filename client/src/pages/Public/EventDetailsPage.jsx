import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const EventDetailsPage = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        // In a real app, this would be an API call using the ID
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Sample data based on ID
        const eventData = {
          id,
          title: 'International Medical Conference 2023',
          date: 'May 15-18, 2023',
          location: 'San Francisco Convention Center, San Francisco, CA',
          category: 'medical',
          image: 'https://via.placeholder.com/800x400',
          registrationOpen: true,
          registrationDeadline: 'April 30, 2023',
          price: '$499',
          description: 'The International Medical Conference 2023 brings together leading healthcare professionals, researchers, and innovators from around the world to share knowledge, discuss advancements, and collaborate on solving global health challenges.',
          fullDetails: `
            <h3>About the Conference</h3>
            <p>The International Medical Conference is the premier annual gathering for medical professionals. This year's theme is "Advancing Healthcare Through Innovation and Collaboration."</p>
            
            <h3>Key Topics</h3>
            <ul>
              <li>Artificial Intelligence in Healthcare</li>
              <li>Pandemic Response and Preparedness</li>
              <li>Personalized Medicine</li>
              <li>Global Health Equity</li>
              <li>Digital Health Technologies</li>
              <li>Mental Health Innovations</li>
            </ul>
            
            <h3>Featured Speakers</h3>
            <p>Our conference features world-renowned experts and thought leaders in various medical specialties, including:</p>
            <ul>
              <li>Dr. Sarah Johnson - Director, WHO Global Health Initiative</li>
              <li>Dr. Michael Chen - Chief Medical Officer, Future Health Technologies</li>
              <li>Prof. Elizabeth Taylor - Head of Medical Research, Cambridge University</li>
              <li>Dr. James Williams - Surgeon General (Former)</li>
              <li>Dr. Aisha Patel - Leader in Telemedicine Innovation</li>
            </ul>
          `,
          schedule: [
            {
              day: 'Day 1 - May 15, 2023',
              events: [
                { time: '8:00 AM - 9:00 AM', title: 'Registration and Breakfast' },
                { time: '9:00 AM - 10:30 AM', title: 'Opening Ceremony and Keynote Address' },
                { time: '10:45 AM - 12:15 PM', title: 'Panel: The Future of Healthcare' },
                { time: '12:30 PM - 1:30 PM', title: 'Lunch Break' },
                { time: '1:45 PM - 3:15 PM', title: 'Breakout Sessions' },
                { time: '3:30 PM - 5:00 PM', title: 'Research Presentations' },
                { time: '6:00 PM - 8:00 PM', title: 'Welcome Reception' }
              ]
            },
            {
              day: 'Day 2 - May 16, 2023',
              events: [
                { time: '8:30 AM - 9:30 AM', title: 'Breakfast and Networking' },
                { time: '9:30 AM - 11:00 AM', title: 'Keynote: Innovation in Medical Technology' },
                { time: '11:15 AM - 12:45 PM', title: 'Workshop Sessions' },
                { time: '1:00 PM - 2:00 PM', title: 'Lunch Break' },
                { time: '2:15 PM - 3:45 PM', title: 'Panel: Global Health Challenges' },
                { time: '4:00 PM - 5:30 PM', title: 'Research Presentations' }
              ]
            }
          ],
          venue: {
            name: 'San Francisco Convention Center',
            address: '747 Howard St, San Francisco, CA 94103',
            directions: 'Located in downtown San Francisco, the Convention Center is easily accessible by public transportation. BART and Muni stations are within walking distance.',
            parking: 'Paid parking is available at the Convention Center garage and several nearby public parking facilities.'
          },
          organizer: {
            name: 'Global Medical Association',
            website: 'https://www.globalmedicala.org',
            email: 'conference@gma.org',
            phone: '+1 (555) 123-4567'
          },
          faqs: [
            {
              question: 'Is there a virtual attendance option?',
              answer: 'Yes, we offer a virtual attendance package that includes access to livestreamed sessions and on-demand content after the conference.'
            },
            {
              question: 'Are CME credits available?',
              answer: 'Yes, attendees can earn up to 20 CME credits for participating in the conference.'
            },
            {
              question: 'What is the cancellation policy?',
              answer: 'Cancellations made before April 15, 2023 will receive a full refund minus a $50 processing fee. Cancellations between April 15-30 will receive a 50% refund. No refunds will be issued after April 30, 2023.'
            }
          ]
        };
        
        setEvent(eventData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching event details:', err);
        setError('Failed to load event details. Please try again.');
        setLoading(false);
      }
    };
    
    fetchEventDetails();
  }, [id]);
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <p>{error}</p>
          <Link to="/events" className="text-red-700 font-medium underline">
            Return to Events
          </Link>
        </div>
      </div>
    );
  }
  
  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
          <p className="text-gray-600 mb-4">The event you're looking for doesn't exist or has been removed.</p>
          <Link to="/events" className="text-blue-600 font-medium">
            Browse All Events
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/events" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Events
        </Link>
        
        <div className="mb-8">
          <img 
            src={event.image} 
            alt={event.title} 
            className="w-full h-auto rounded-lg shadow-md mb-6"
          />
          
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-3xl font-bold">{event.title}</h1>
            {event.registrationOpen ? (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                Registration Open
              </span>
            ) : (
              <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                Coming Soon
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-gray-700">{event.date}</span>
            </div>
            
            <div className="flex items-center">
              <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-gray-700">{event.location}</span>
            </div>
            
            <div className="flex items-center">
              <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span className="text-gray-700">{event.category}</span>
            </div>
            
            {event.registrationOpen && (
              <div className="flex items-center">
                <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-700">{event.price}</span>
              </div>
            )}
          </div>
          
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">About This Event</h2>
            <p className="text-gray-700 mb-4">{event.description}</p>
            <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: event.fullDetails }}></div>
          </div>
          
          {event.registrationOpen && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-blue-800 mb-2">Registration Information</h2>
              <p className="text-blue-800 mb-2">
                <span className="font-medium">Price:</span> {event.price}
              </p>
              <p className="text-blue-800 mb-4">
                <span className="font-medium">Registration Deadline:</span> {event.registrationDeadline}
              </p>
              <button className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition duration-300">
                Register Now
              </button>
            </div>
          )}
        </div>
        
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Event Schedule</h2>
          <div className="space-y-6">
            {event.schedule.map((day, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="font-medium text-gray-800">{day.day}</h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {day.events.map((item, idx) => (
                    <div key={idx} className="px-4 py-3">
                      <p className="font-medium text-gray-800">{item.time}</p>
                      <p className="text-gray-600">{item.title}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Venue Information</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-medium mb-2">{event.venue.name}</h3>
            <p className="text-gray-700 mb-4">{event.venue.address}</p>
            
            <h4 className="font-medium text-gray-800 mb-2">Directions:</h4>
            <p className="text-gray-700 mb-4">{event.venue.directions}</p>
            
            <h4 className="font-medium text-gray-800 mb-2">Parking:</h4>
            <p className="text-gray-700">{event.venue.parking}</p>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Organizer Information</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-medium mb-4">{event.organizer.name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600 mb-1">Website:</p>
                <a href={event.organizer.website} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                  {event.organizer.website.replace('https://', '')}
                </a>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Email:</p>
                <a href={`mailto:${event.organizer.email}`} className="text-blue-600 hover:underline">
                  {event.organizer.email}
                </a>
              </div>
              <div>
                <p className="text-gray-600 mb-1">Phone:</p>
                <p>{event.organizer.phone}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {event.faqs.map((faq, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-800 mb-2">{faq.question}</h3>
                <p className="text-gray-700">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-center">
          <Link
            to="/events"
            className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition duration-300"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Browse All Events
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EventDetailsPage; 