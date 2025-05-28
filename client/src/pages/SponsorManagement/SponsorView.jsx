import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import sponsorService from '../../services/sponsorService';
import { Spinner, Alert, Button } from '../../components/common';

const SponsorView = () => {
  const { id: eventId, sponsorId } = useParams();
  const [sponsor, setSponsor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!eventId || !sponsorId) {
      setError('Missing event or sponsor ID.');
      setLoading(false);
      return;
    }
    sponsorService.getSponsorById(eventId, sponsorId)
      .then(res => {
        if (res && (res.success || res.data)) setSponsor(res.data || res.sponsor || res.result);
        else setError(res.message || 'Sponsor not found');
      })
      .catch(err => setError(err.message || 'Error loading sponsor'))
      .finally(() => setLoading(false));
  }, [eventId, sponsorId]);

  if (loading) return <div className="flex justify-center items-center h-64"><Spinner /></div>;
  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!sponsor) return <Alert variant="warning">Sponsor not found.</Alert>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">{sponsor.companyName}</h1>
      <div className="mb-2"><strong>Sponsor ID:</strong> {sponsor.sponsorId}</div>
      <div className="mb-2"><strong>Authorized Person:</strong> {sponsor.authorizedPerson}</div>
      <div className="mb-2"><strong>Email:</strong> {sponsor.email}</div>
      <div className="mb-2"><strong>Phone:</strong> {sponsor.displayPhoneNumber}</div>
      <div className="mb-2"><strong>Status:</strong> {sponsor.status}</div>
      {/* Add more fields as needed */}
      <div className="mt-4">
        <Link to={`/events/${eventId}/sponsors/${sponsorId}/edit`}>
          <Button variant="primary">Edit Sponsor</Button>
        </Link>
        <Link to={`/events/${eventId}/sponsors`} className="ml-2">
          <Button variant="light">Back to List</Button>
        </Link>
      </div>
    </div>
  );
};

export default SponsorView; 