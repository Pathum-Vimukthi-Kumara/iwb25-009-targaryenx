import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCalendar, FiClock, FiMapPin, FiUsers, FiAlertCircle, FiX, FiSearch } from 'react-icons/fi';
import DashboardLayout from './DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';

const VolunteerAllEvents = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
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
        // Fetch organizations
        let organizations = [];
        try {
          const orgRes = await fetch('http://localhost:9000/pub/organizations/');
          if (orgRes.ok) {
            organizations = await orgRes.json();
          }
        } catch (e) {
          console.log('Failed to fetch organizations:', e);
        }
        
        // Mark events as applied and add organization names
        const appliedEventIds = new Set(appsData.map(app => app.event_id));
        const mergedEvents = eventsData.map(event => {
          const org = organizations.find(o => o.user_id === event.organization_id);
          return {
            ...event,
            has_applied: appliedEventIds.has(event.event_id),
            organization_name: org?.name || 'Unknown Organization'
          };
        });
        setEvents(mergedEvents);
        setFilteredEvents(mergedEvents);
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setIsLoading(false);
      }
    };
    fetchEventsAndApplications();
  }, []);
  
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
  
  // Function to show event details
  const showEventDetails = (event) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  // Function to close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
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
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold">All Events</h1>
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
        <p className="text-gray-600">Discover and apply for volunteer opportunities.</p>
      </div>
      
      {/* Events Grid */}
      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-lg flex items-center text-red-600">
          <FiAlertCircle className="mr-2" />
          <p>{error}</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">
            {searchTerm ? 'No events found matching your search.' : 'No events found. Please check back later!'}
          </p>
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
              className="bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200"
              variants={itemVariants}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{event.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    event.status === 'active' ? 'bg-green-100 text-green-700' : 
                    event.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {event.status}
                  </span>
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
                  <button
                    onClick={() => showEventDetails(event)}
                    className="flex-1 bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                  >
                    View Details
                  </button>
                  {event.has_applied ? (
                    <div className="flex-1 bg-green-50 text-green-700 px-4 py-2 rounded-md text-center text-sm font-medium">
                      ✓ Applied
                    </div>
                  ) : (
                    <button
                      onClick={() => handleApplyToEvent(event.event_id)}
                      className="flex-1 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
                    >
                      Apply Now
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Event Details Modal */}
      <AnimatePresence>
        {showModal && selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold">{selectedEvent.title}</h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FiX size={24} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-600">{selectedEvent.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center text-gray-600">
                      <FiCalendar className="mr-3 text-primary" />
                      <div>
                        <p className="font-medium">Date</p>
                        <p>{formatDate(selectedEvent.event_date)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <FiMapPin className="mr-3 text-primary" />
                      <div>
                        <p className="font-medium">Location</p>
                        <p>{selectedEvent.location}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <FiUsers className="mr-3 text-primary" />
                      <div>
                        <p className="font-medium">Volunteers Needed</p>
                        <p>{selectedEvent.required_volunteers}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <FiClock className="mr-3 text-primary" />
                      <div>
                        <p className="font-medium">Status</p>
                        <p className="capitalize">{selectedEvent.status}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    {selectedEvent.has_applied ? (
                      <span className="inline-block bg-green-50 text-green-600 px-4 py-2 rounded-md">
                        Already Applied
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          handleApplyToEvent(selectedEvent.event_id);
                          closeModal();
                        }}
                        className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90 transition-colors"
                      >
                        Apply for Event
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default VolunteerAllEvents;