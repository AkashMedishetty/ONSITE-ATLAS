import React, { useState, useEffect, useCallback } from 'react';
import { useRegistrantAuth } from '../../contexts/RegistrantAuthContext.jsx';
import { FaUser, FaIdCard, FaEnvelope, FaPhone, FaBuilding, FaBriefcase, FaGlobe, FaCalendarAlt, FaClock, FaInfoCircle, FaCheckCircle, FaTimesCircle, FaPrint, FaEdit, FaSave, FaTimes, FaDownload } from 'react-icons/fa';
import registrantPortalService from '../../services/registrantPortalService'; // Assuming you have this service
import { toast } from 'react-toastify';

const ProfileField = ({ icon: Icon, label, value, className = '' }) => (
  <div className={`flex items-center py-2 ${className}`}>
    {Icon && <Icon className="text-gray-500 mr-3 flex-shrink-0" />}
    <dt className="text-sm font-medium text-gray-600 w-40">{label}</dt>
    <dd className="text-sm text-gray-900 flex-grow">{value || <span className="text-gray-400 italic">Not Set</span>}</dd>
  </div>
);

const EditableProfileField = ({ icon: Icon, label, value, name, onChange, type = 'text', placeholder }) => (
  <div className="flex items-center py-2">
    {Icon && <Icon className="text-gray-500 mr-3 flex-shrink-0" />}
    <label htmlFor={name} className="text-sm font-medium text-gray-600 w-40">{label}</label>
    <input
      type={type}
      name={name}
      id={name}
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder || label}
      className="flex-grow mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
    />
  </div>
);

const RegistrantProfile = () => {
  const { currentRegistrant, fetchRegistrantData, logout } = useRegistrantAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [badgePreviewUrl, setBadgePreviewUrl] = useState(null);

  const initializeFormData = useCallback(() => {
    if (currentRegistrant && currentRegistrant.personalInfo) {
      setFormData({
        firstName: currentRegistrant.personalInfo.firstName || '',
        lastName: currentRegistrant.personalInfo.lastName || '',
        email: currentRegistrant.personalInfo.email || '',
        phone: currentRegistrant.personalInfo.phone || '',
        organization: currentRegistrant.personalInfo.organization || '',
        designation: currentRegistrant.personalInfo.designation || '',
        country: currentRegistrant.personalInfo.country || '',
      });
    } else {
       setFormData({
        firstName: '', lastName: '', email: '', phone: '',
        organization: '', designation: '', country: '',
      });
    }
  }, [currentRegistrant]);

  useEffect(() => {
    initializeFormData();
  }, [initializeFormData]);

  // Fetch badge PDF as blob and set blob URL for iframe preview
  useEffect(() => {
    let url = null;
    const fetchBadgePreview = async () => {
      if (!currentRegistrant || !currentRegistrant.event || !currentRegistrant._id) {
        setBadgePreviewUrl(null);
        return;
      }
      const eventId = currentRegistrant.event._id || currentRegistrant.event;
      const registrantId = currentRegistrant._id;
      try {
        const response = await fetch(`/api/registrant-portal/events/${eventId}/registrants/${registrantId}/badge?preview=true`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${currentRegistrant.token || localStorage.getItem('registrantToken')}` },
        });
        if (!response.ok) throw new Error('Failed to fetch badge preview.');
        const blob = await response.blob();
        url = window.URL.createObjectURL(blob);
        setBadgePreviewUrl(url);
      } catch (err) {
        setBadgePreviewUrl(null);
      }
    };
    fetchBadgePreview();
    return () => {
      if (url) window.URL.revokeObjectURL(url);
    };
  }, [currentRegistrant]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditToggle = () => {
    if (isEditing) { // If cancelling edit
      initializeFormData(); // Reset form data to original
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      // Basic validation (can be expanded)
      if (!formData.firstName || !formData.lastName || !formData.email) {
        toast.error('First Name, Last Name, and Email are required.');
        setIsLoading(false);
        return;
      }
      const response = await registrantPortalService.updateProfile(formData);
      if (response.status === 'success' && response.data && response.data.registration) {
        toast.success('Profile updated successfully!');
        if (typeof fetchRegistrantData === 'function') {
          const updatedRegistrant = await fetchRegistrantData();
          if (updatedRegistrant) {
            setIsEditing(false);
            // Optionally, force a re-render or reload if needed
          } else {
            toast.warn('Profile updated. Please log in again to continue.');
            if (typeof logout === 'function') {
              logout();
              setTimeout(() => {
                window.location.href = '/registrant-portal/auth/login';
              }, 1000);
            }
          }
        } else {
          console.error('[RegistrantProfile] fetchRegistrantData is not a function, cannot refresh data. Check RegistrantAuthContext.');
          toast.warn('Profile saved, but session data might be stale. Please refresh if needed.');
        }
      } else {
        toast.error(response.message || 'Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.message || error.message || 'An error occurred while updating profile.');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!currentRegistrant) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-gray-500">Loading profile information...</p>
      </div>
    );
  }

  const {
    personalInfo = {},
    registrationId,
    category,
    status,
    type,
    createdAt,
    updatedAt,
    checkIn,
    badgePrinted,
    event
  } = currentRegistrant;

  const formattedDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };
  
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow-xl rounded-lg overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
              <h1 className="text-3xl font-bold text-white">
                {isEditing ? (
                  <div className="flex gap-2">
                    <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="First Name" className="text-black p-2 rounded-md border border-gray-300"/>
                    <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Last Name" className="text-black p-2 rounded-md border border-gray-300"/>
                  </div>
                ) : (
                  `${personalInfo.firstName || ''} ${personalInfo.lastName || ''}`.trim() || 'N/A'
                )}
              </h1>
              <p className="text-indigo-200 mt-1">
                {category?.name ? <span className="inline-block bg-indigo-500 text-white px-2 py-0.5 rounded-full text-sm mr-2">{category.name}</span> : ''}
                ID: {registrationId || 'N/A'}
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              {!isEditing ? (
                <button
                  onClick={handleEditToggle}
                  className="flex items-center px-4 py-2 bg-white text-indigo-600 rounded-md shadow hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-indigo-600 transition duration-150 ease-in-out"
                >
                  <FaEdit className="mr-2" /> Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                    className="flex items-center px-4 py-2 bg-green-500 text-white rounded-md shadow hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-indigo-600 transition duration-150 ease-in-out disabled:opacity-50"
                  >
                    <FaSave className="mr-2" /> {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
              <button 
                    onClick={handleEditToggle}
                    disabled={isLoading}
                    className="flex items-center px-4 py-2 bg-gray-300 text-gray-700 rounded-md shadow hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-indigo-600 transition duration-150 ease-in-out"
              >
                    <FaTimes className="mr-2" /> Cancel
              </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: Contact & Organization */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">Contact & Organization</h2>
            {!isEditing ? (
              <>
                <ProfileField icon={FaEnvelope} label="Email" value={personalInfo.email} />
                <ProfileField icon={FaPhone} label="Mobile" value={personalInfo.phone} />
                <ProfileField icon={FaBuilding} label="Organization" value={personalInfo.organization} />
                <ProfileField icon={FaBriefcase} label="Designation" value={personalInfo.designation} />
                <ProfileField icon={FaGlobe} label="Country" value={personalInfo.country} />
              </>
            ) : (
              <>
                <EditableProfileField icon={FaEnvelope} label="Email" name="email" value={formData.email} onChange={handleInputChange} type="email"/>
                <EditableProfileField icon={FaPhone} label="Mobile" name="phone" value={formData.phone} onChange={handleInputChange} type="tel"/>
                <EditableProfileField icon={FaBuilding} label="Organization" name="organization" value={formData.organization} onChange={handleInputChange} />
                <EditableProfileField icon={FaBriefcase} label="Designation" name="designation" value={formData.designation} onChange={handleInputChange} />
                <EditableProfileField icon={FaGlobe} label="Country" name="country" value={formData.country} onChange={handleInputChange} />
              </>
            )}
            
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4 mt-8">Registration Information</h2>
            <ProfileField icon={FaCalendarAlt} label="Registered On" value={formattedDate(createdAt)} />
            <ProfileField icon={FaClock} label="Last Updated" value={formattedDate(updatedAt)} />
            <ProfileField icon={FaInfoCircle} label="Status" value={status || 'N/A'} className="capitalize" />
            <ProfileField icon={FaUser} label="Type" value={type || 'N/A'} className="capitalize" />
            <ProfileField
              icon={checkIn?.status ? FaCheckCircle : FaTimesCircle}
              label="Checked In"
              value={checkIn?.status ? `Yes (${formattedDate(checkIn.timestamp)})` : 'No'}
              className={checkIn?.status ? 'text-green-600' : 'text-red-600'}
            />
            <ProfileField
              icon={badgePrinted ? FaCheckCircle : FaTimesCircle}
              label="Badge Printed"
              value={badgePrinted ? 'Yes' : 'No'}
              className={badgePrinted ? 'text-green-600' : 'text-red-600'}
            />
            {event && <ProfileField icon={FaCalendarAlt} label="Current Event" value={event.name || 'N/A'} />}
          </div>

          {/* Column 2: Badge Preview & Actions */}
          <div className="md:col-span-1 space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">Badge Preview</h2>
            {currentRegistrant && currentRegistrant.event && currentRegistrant._id ? (
              <>
                <div className="w-full aspect-[3/4] border-2 border-gray-300 rounded-lg overflow-hidden mb-2">
                  {badgePreviewUrl ? (
                    <iframe
                      src={badgePreviewUrl + '#toolbar=0&navpanes=0&scrollbar=0&view=FitH&zoom=page-fit'}
                      title="Badge Preview"
                      className="w-full h-full"
                      style={{ border: 'none', overflow: 'hidden', minHeight: '400px' }}
                      scrolling="no"
                      allow="fullscreen"
                    ></iframe>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">Badge preview unavailable</div>
                  )}
                </div>
                <button
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition"
                  onClick={async () => {
                    const eventId = currentRegistrant.event._id || currentRegistrant.event;
                    const registrantId = currentRegistrant._id;
                    if (!eventId || !registrantId) {
                      toast.error('Missing event or registrant ID for badge download.');
                      return;
                    }
                    try {
                      toast.loading('Generating badge...');
                      const response = await fetch(`/api/registrant-portal/events/${eventId}/registrants/${registrantId}/badge`, {
                        method: 'GET',
                        headers: { 'Authorization': `Bearer ${currentRegistrant.token || localStorage.getItem('registrantToken')}` },
                      });
                      if (!response.ok) throw new Error('Failed to download badge.');
                      const blob = await response.blob();
                      let filename = `badge-${registrantId}.pdf`;
                      const contentDisposition = response.headers.get('content-disposition');
                      if (contentDisposition) {
                        const match = contentDisposition.match(/filename="?(.+?)"?$/);
                        if (match && match[1]) filename = match[1];
                      }
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', filename);
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                      window.URL.revokeObjectURL(url);
                      toast.dismiss();
                      toast.success('Badge download started.');
                    } catch (err) {
                      toast.dismiss();
                      toast.error('Failed to download badge.');
                    }
                  }}
                >
                  <FaDownload className="inline-block mr-2" /> Download Badge (PDF)
                </button>
              </>
            ) : (
              <div className="bg-gray-100 p-4 rounded-lg h-64 flex items-center justify-center border-2 border-dashed border-gray-300">
                <p className="text-gray-500">Badge Preview Unavailable (Missing data)</p>
              </div>
            )}
            
            {/* Placeholder for resource usage, can be developed later */}
             {/* <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4 mt-8">Resource Usage</h2>
             <div className="text-sm text-gray-500 italic">
                (Resource usage details will be shown here or on the dashboard)
             </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrantProfile; 