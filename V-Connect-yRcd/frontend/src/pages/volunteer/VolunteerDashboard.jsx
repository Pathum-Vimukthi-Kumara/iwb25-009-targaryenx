import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCalendar, FiClock, FiMapPin, FiUsers, FiAlertCircle } from 'react-icons/fi';
import DashboardLayout from './DashboardLayout';

const VolunteerDashboard = () => {
  const [events, setEvents] = useState([]);
  const [applications, setApplications] = useState([]); // NEW
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, public, private
  
  useEffect(() => {
    const fetchEventsAndApplications = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        // Fetch all events
        const eventsRes = await fetch('http://localhost:9000/api/org/events', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!eventsRes.ok) throw new Error('Failed to fetch events');
        const eventsData = await eventsRes.json();
        // Fetch my applications
        const appsRes = await fetch('http://localhost:9000/api/vol/applications', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        let appsData = [];
        if (appsRes.ok) {
          appsData = await appsRes.json();
        }
        setApplications(appsData);
        // Mark events as applied if in applications
        const appliedEventIds = new Set(appsData.map(app => app.event_id));
        const mergedEvents = eventsData.map(event => ({
          ...event,
          has_applied: appliedEventIds.has(event.event_id)
        }));
        setEvents(mergedEvents);
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setIsLoading(false);
      }
    };
    fetchEventsAndApplications();
  }, []);
  
  // Filter events based on the selected filter
  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    if (filter === 'public') return !event.is_private;
    if (filter === 'private') return event.is_private;
    return true;
  });
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  // Function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };
  
  // Function to handle apply to event
  const handleApplyToEvent = async (eventId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:9000/api/org/events/${eventId}/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      if (!response.ok) {
        throw new Error('Failed to apply for event');
      }
      alert('Successfully applied to the event!');
      // Re-fetch events and applications to update UI
      setIsLoading(true);
      const eventsRes = await fetch('http://localhost:9000/api/org/events', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const appsRes = await fetch('http://localhost:9000/api/vol/applications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      let eventsData = [];
      let appsData = [];
      if (eventsRes.ok) eventsData = await eventsRes.json();
      if (appsRes.ok) appsData = await appsRes.json();
      setApplications(appsData);
      const appliedEventIds = new Set(appsData.map(app => app.event_id));
      const mergedEvents = eventsData.map(event => ({
        ...event,
        has_applied: appliedEventIds.has(event.event_id)
      }));
      setEvents(mergedEvents);
      setIsLoading(false);
    } catch (err) {
      alert(err.message || 'Something went wrong');
    }
  };

  return (
    <DashboardLayout userType="volunteer">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Volunteer Dashboard</h1>
        <p className="text-gray-600">Discover and apply for volunteer opportunities.</p>
      </div>
      
      {/* Filter options */}
      <div className="flex mb-6 space-x-2">
        <button 
          className={`px-4 py-2 rounded-md ${filter === 'all' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
          onClick={() => setFilter('all')}
        >
          All Events
        </button>
        <button 
          className={`px-4 py-2 rounded-md ${filter === 'public' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
          onClick={() => setFilter('public')}
        >
          Public Events
        </button>
        <button 
          className={`px-4 py-2 rounded-md ${filter === 'private' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
          onClick={() => setFilter('private')}
        >
          Private Events
        </button>
      </div>
      
      {/* Events Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-gray-600">Loading events...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-lg flex items-center text-red-600">
          <FiAlertCircle className="mr-2" />
          <p>{error}</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No events found. Please check back later!</p>
        </div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredEvents.map((event) => (
            <motion.div 
              key={event.event_id} 
              className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100"
              variants={itemVariants}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className={`h-3 ${event.is_private ? 'bg-accent' : 'bg-primary'}`}></div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold">{event.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded ${event.is_private ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'}`}>
                    {event.is_private ? 'Private' : 'Public'}
                  </span>
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
                    <span>
                      {event.required_volunteers} volunteers needed
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <FiClock className="mr-2 text-gray-400" />
                    <span>Status: {event.status}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <Link 
                    to={`/event-details/${event.event_id}`}
                    className="text-primary hover:underline text-sm font-medium"
                  >
                    View Details
                  </Link>
                  {event.has_applied ? (
                    <span className="text-sm bg-green-50 text-green-600 px-3 py-1 rounded">
                      Applied
                    </span>
                  ) : (
                    <button
                      onClick={() => handleApplyToEvent(event.event_id)}
                      className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors text-sm"
                    >
                      Apply
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </DashboardLayout>
  );
};

export default VolunteerDashboard;
