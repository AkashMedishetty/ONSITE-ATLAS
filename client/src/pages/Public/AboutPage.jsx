import React from 'react';

const AboutPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">About Atlas</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-blue-600 mb-4">Our Mission</h2>
          <p className="text-gray-700 mb-4">
            At Atlas, our mission is to simplify the complex process of organizing academic and professional conferences. 
            We provide a comprehensive platform that streamlines event management, abstract submissions, registrations, 
            and attendee engagement, allowing organizers to focus on creating meaningful experiences.
          </p>
          <p className="text-gray-700">
            We believe in the power of knowledge sharing and collaboration, and our goal is to make these professional 
            gatherings more accessible, efficient, and impactful for everyone involved.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-blue-600 mb-4">Our Story</h2>
          <p className="text-gray-700 mb-4">
            Atlas was founded in 2018 by a team of researchers and event organizers who experienced firsthand the 
            challenges of managing academic conferences. Frustrated by fragmented tools and inefficient processes, 
            they set out to create a unified solution that would address all aspects of conference management.
          </p>
          <p className="text-gray-700">
            Since then, Atlas has grown to serve hundreds of conferences worldwide, helping researchers, professionals, 
            and organizations to connect and share knowledge more effectively.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold text-blue-600 mb-4">Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="text-center">
              <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <h3 className="font-medium">Dr. Sarah Johnson</h3>
              <p className="text-gray-600">Co-Founder & CEO</p>
            </div>
            <div className="text-center">
              <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <h3 className="font-medium">Michael Chen</h3>
              <p className="text-gray-600">Co-Founder & CTO</p>
            </div>
            <div className="text-center">
              <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <h3 className="font-medium">Aisha Patel</h3>
              <p className="text-gray-600">Chief Product Officer</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-blue-600 mb-4">Contact Us</h2>
          <p className="text-gray-700 mb-4">
            Have questions about Atlas or want to learn more about how we can help with your event? 
            We'd love to hear from you!
          </p>
          <div className="flex justify-center">
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300">
              Get in Touch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage; 