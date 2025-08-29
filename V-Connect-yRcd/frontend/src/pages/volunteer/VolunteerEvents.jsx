import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiMapPin, FiUsers, FiClock, FiAlertCircle, FiSearch } from 'react-icons/fi';
import DashboardLayout from './DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';

const VolunteerEvents = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
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
        setFilteredEvents(eventDetails);
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

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredEvents(events);
    } else {
      const filtered = events.filter(event => 
        event.title?.toLowerCase().includes(term.toLowerCase()) ||
        event.description?.toLowerCase().includes(term.toLowerCase()) ||
        event.organization_name?.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredEvents(filtered);
    }
  };

  return (
    <DashboardLayout userType="volunteer">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold">My Events</h1>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>
        <p className="text-gray-600">Events you have applied for.</p>
      </div>
      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-lg flex items-center text-red-600">
          <p>{error}</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">
            {searchTerm ? 'No events found matching your search.' : "You haven't applied to any events yet."}
          </p>
        </div>
      ) : (
        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event, idx) => (
            <motion.div 
              key={event.application_id || event.event_id || idx} 
              className="bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200"
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
            >
              <div className="p-6">
                {!event.missing && event && event.title ? (
                  <>
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {event.title ? event.title : `Event #${event.event_id}`}
                      </h3>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
                    
                    <div className="space-y-3 mb-5">
                      <div className="flex items-center text-sm text-gray-600">
                        <FiCalendar className="text-gray-400 mr-3" size={16} />
                        <span className="font-medium">{formatDate(event.event_date)}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <FiMapPin className="text-gray-400 mr-3" size={16} />
                        <span className="truncate">{event.location}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <FiUsers className="text-gray-400 mr-3" size={16} />
                        <span>{event.required_volunteers} volunteers needed</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <FiUsers className="text-gray-400 mr-3" size={16} />
                        <span className="truncate">By: {event.organization_name}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                      <div className="flex-1 text-xs text-blue-600">
                        Applied: {formatDate(event.applied_at)}
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        event.application_status === 'accepted' ? 'bg-green-50 text-green-600' :
                        event.application_status === 'pending' ? 'bg-yellow-50 text-yellow-600' :
                        event.application_status === 'rejected' ? 'bg-red-50 text-red-600' :
                        'bg-gray-50 text-gray-600'
                      }`}>
                        {event.application_status || 'Unknown'}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <FiAlertCircle className="text-gray-400" size={24} />
                    </div>
                    <p className="text-gray-500 text-sm">Event details unavailable</p>
                    <p className="text-gray-400 text-xs">ID: {event.event_id}</p>
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
