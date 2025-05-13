import { useState, useEffect } from 'react';
import { Tabs } from '../../../components/common';
import { useLocation } from 'react-router-dom';
import GeneralTab from './GeneralTab';
import RegistrationTab from './RegistrationTab';
import ResourcesTab from './ResourcesTab';
import AbstractsTab from './AbstractsTab';
import BadgesTab from './BadgesTab';
import EmailTab from './EmailTab';
import PaymentTab from './PaymentTab';

const SettingsTab = ({ event, setEvent, setFormChanged }) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(0);
  
  useEffect(() => {
    if (location.state?.settingsTab) {
      const tabMapping = {
        'general': 0,
        'registration': 1,
        'resources': 2,
        'abstracts': 3,
        'badges': 4,
        'email': 5,
        'payment': 6
      };
      
      const tabIndex = tabMapping[location.state.settingsTab];
      if (tabIndex !== undefined) {
        setActiveTab(tabIndex);
        window.history.replaceState(null, '');
      }
    }
  }, [location.state]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Event Settings</h2>
      
      <Tabs
        tabs={[
          { id: "general", label: "General" },
          { id: "registration", label: "Registration" },
          { id: "resources", label: "Resources" },
          { id: "abstracts", label: "Abstracts" },
          { id: "badges", label: "Badges" },
          { id: "email", label: "Email" },
          { id: "payment", label: "Payment" }
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="pills"
      />
      
      <div className="mt-6">
        {activeTab === 0 && <GeneralTab event={event} setEvent={setEvent} setFormChanged={setFormChanged} />}
        {activeTab === 1 && <RegistrationTab event={event} setEvent={setEvent} setFormChanged={setFormChanged} />}
        {activeTab === 2 && <ResourcesTab event={event} setEvent={setEvent} setFormChanged={setFormChanged} />}
        {activeTab === 3 && <AbstractsTab event={event} setEvent={setEvent} setFormChanged={setFormChanged} />}
        {activeTab === 4 && <BadgesTab event={event} setEvent={setEvent} setFormChanged={setFormChanged} />}
        {activeTab === 5 && <EmailTab event={event} setEvent={setEvent} setFormChanged={setFormChanged} />}
        {activeTab === 6 && <PaymentTab event={event} setEvent={setEvent} setFormChanged={setFormChanged} />}
      </div>
    </div>
  );
};

export default SettingsTab; 