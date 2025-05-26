import React, { useEffect, useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import BadgeTemplate from '../../components/badges/BadgeTemplate';
import eventService from '../../services/eventService';
import html2canvas from 'html2canvas';

const BadgesPage = () => {
  const { eventId } = useParams();
  const [badgeTemplate, setBadgeTemplate] = useState(null);
  const [event, setEvent] = useState(null);
  const previewRef = useRef();

  useEffect(() => {
    const fetchTemplate = async () => {
      if (!eventId) return;
      try {
        const eventResp = await eventService.getEventById(eventId);
        setEvent(eventResp.data?.data || eventResp.data);
        const badgeResp = await eventService.getBadgeSettings(eventId);
        setBadgeTemplate(badgeResp.data?.data || badgeResp.data);
      } catch (err) {
        setBadgeTemplate(null);
      }
    };
    fetchTemplate();
  }, [eventId]);

  const sampleRegistration = {
    registrationId: 'REG-001',
    personalInfo: {
      firstName: 'Sample',
      lastName: 'User',
      email: 'sample@example.com',
      phone: '1234567890',
      organization: 'Sample Org',
    },
    category: { name: 'Delegate', color: '#2A4365' },
  };

  // Helper to normalize registration data for badge rendering (copied from RegistrationsTab.jsx)
  function normalizeRegistrationData(reg) {
    if (!reg) return {};
    const personal = reg.personalInfo || {};
    return {
      ...reg,
      firstName: personal.firstName,
      lastName: personal.lastName,
      name: personal.name || `${personal.firstName || ''} ${personal.lastName || ''}`,
      organization: personal.organization,
      country: personal.country,
      designation: personal.designation,
      email: personal.email,
      phone: personal.phone,
      // Add more fields as needed
    };
  }

  const handlePrint = async () => {
    if (!badgeTemplate) return;
    // Calculate badge pixel size
    const DPIN = 100;
    const size = badgeTemplate.size || { width: 3.375, height: 5.375 };
    const unit = badgeTemplate.unit || 'in';
    let badgeWidthPx, badgeHeightPx;
    if (unit === 'in') {
      badgeWidthPx = (size.width || 0) * DPIN;
      badgeHeightPx = (size.height || 0) * DPIN;
    } else if (unit === 'cm') {
      badgeWidthPx = (size.width || 0) * (DPIN / 2.54);
      badgeHeightPx = (size.height || 0) * (DPIN / 2.54);
    } else if (unit === 'mm') {
      badgeWidthPx = (size.width || 0) * (DPIN / 25.4);
      badgeHeightPx = (size.height || 0) * (DPIN / 25.4);
    } else {
      badgeWidthPx = (size.width || 0);
      badgeHeightPx = (size.height || 0);
    }
    // Create a hidden container
    const hiddenDiv = document.createElement('div');
    hiddenDiv.style.position = 'fixed';
    hiddenDiv.style.left = '-9999px';
    hiddenDiv.style.top = '0';
    hiddenDiv.style.width = `${badgeWidthPx}px`;
    hiddenDiv.style.height = `${badgeHeightPx}px`;
    document.body.appendChild(hiddenDiv);
    // Render the badge in the hidden container
    const { createRoot } = await import('react-dom/client');
    const root = createRoot(hiddenDiv);
    root.render(
      <BadgeTemplate template={badgeTemplate} registrationData={normalizeRegistrationData(sampleRegistration)} previewMode={false} scale={1} />
    );
    await new Promise(resolve => setTimeout(resolve, 100));
    // Capture as image
    const canvas = await html2canvas(hiddenDiv, { scale: 1, useCORS: true, logging: false, allowTaint: true, width: badgeWidthPx, height: badgeHeightPx });
    const dataUrl = canvas.toDataURL('image/png');
    root.unmount();
    document.body.removeChild(hiddenDiv);
    // Print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Print Badge</title>
      <style>
        @page { size: ${size.width}${unit} ${size.height}${unit}; margin: 0; }
        body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; }
        .badge-img { width: ${size.width}${unit}; height: ${size.height}${unit}; object-fit: contain; display: block; box-shadow: none; border: none; }
      </style>
      </head><body onload="window.print(); window.onafterprint = function(){ window.close(); }">
        <img src='${dataUrl}' class='badge-img' alt='Badge' />
      </body></html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Badges</h1>
        <div className="flex space-x-2">
          <Link 
            to={`/events/${eventId}/badges/print`}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Print Badges
          </Link>
          <Link
            to={`/events/${eventId}/badges/template`}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Edit Template
          </Link>
        </div>
      </div>
      <div className="bg-white shadow rounded-lg p-6 flex flex-col items-center">
        <h2 className="text-lg font-semibold mb-4">Badge Template Preview</h2>
        <div ref={previewRef} className="mb-4">
          {badgeTemplate ? (
            <BadgeTemplate template={badgeTemplate} registrationData={normalizeRegistrationData(sampleRegistration)} previewMode={true} scale={1} />
          ) : (
            <p className="text-gray-500">No badge template found for this event.</p>
          )}
        </div>
        {badgeTemplate && (
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
          >
            Print Preview
          </button>
        )}
      </div>
    </div>
  );
};

export default BadgesPage; 