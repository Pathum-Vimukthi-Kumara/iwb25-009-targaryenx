import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiMapPin, FiUsers, FiClock } from 'react-icons/fi';
import DashboardLayout from './DashboardLayout';

const VolunteerEvents = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMyEvents = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        // Step 1: Get applications
        const response = await fetch('http://localhost:9000/api/vol/applications', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch my events');
        const applications = await response.json();
        // Step 2: Fetch all organizations first
        let organizations = [];
        try {
          const orgRes = await fetch('http://localhost:9000/pub/organizations/');
          if (orgRes.ok) {
            organizations = await orgRes.json();
          }
        } catch (e) {
          console.log('Failed to fetch organizations:', e);
        }
        
        // Step 3: Fetch event details for each application
        const eventDetails = await Promise.all(applications.map(async (app) => {
          const eventRes = await fetch(`http://localhost:9000/pub/events/${app.event_id}`);
          let eventData = null;
          try {
            eventData = await eventRes.json();
          } catch (e) {
            console.log('Failed to parse event data for event_id', app.event_id, e);
          }
          if (!eventRes.ok || !eventData || !eventData.title) return {
            application_id: app.application_id,
            application_status: app.application_status,
            applied_at: app.applied_at,
            event_id: app.event_id,
            missing: true
          };
          
          // Find organization name
          const org = organizations.find(o => o.user_id === eventData.organization_id);
          const organizationName = org?.name || 'Unknown Organization';
          
          return {
            ...eventData,
            organization_name: organizationName,
            application_status: app.application_status,
            applied_at: app.applied_at,
            application_id: app.application_id
          };
        }));
        setEvents(eventDetails);
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMyEvents();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "N/A";
    }
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  return (
    <DashboardLayout userType="volunteer">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">My Events</h1>
        <p className="text-gray-600">Events you have applied for.</p>
      </div>
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-gray-600">Loading events...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-lg flex items-center text-red-600">
          <p>{error}</p>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">You haven't applied to any events yet.</p>
        </div>
      ) : (
        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event, idx) => (
            <motion.div key={event.application_id || event.event_id || idx} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
              <div className="p-6">
                {!event.missing && event && event.title ? (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold">
                        {event.title ? event.title : `Event #${event.event_id} (name not available)`}
                      </h3>
                      <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">{event.application_status || event.status}</span>
                    </div>
                    <p className="text-gray-600 mb-4 line-clamp-3">{event.description}</p>
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center text-sm text-gray-500">
                        <FiCalendar className="mr-2 text-gray-400" />
                        <span>{formatDate(event.event_date)}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <FiMapPin className="mr-2 text-gray-400" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <FiUsers className="mr-2 text-gray-400" />
                        <span>{event.required_volunteers} volunteers needed</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <FiUsers className="mr-2 text-gray-400" />
                        <span>By: {event.organization_name}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <FiClock className="mr-2 text-gray-400" />
                        <span>Status: {event.application_status || event.status}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-gray-400 text-center">
                    Event details not available for event ID: {event.event_id}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </DashboardLayout>
  );
};

export default VolunteerEvents;
