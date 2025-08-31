import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCalendar, FiAward, FiUsers, FiAlertCircle, FiCheckCircle, FiMapPin } from 'react-icons/fi';
import DashboardLayout from './DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';

const VolunteerDashboard = () => {
  const [stats, setStats] = useState({
    totalEvents: 0,
    appliedEvents: 0,
    badges: 0,
    feedback: 0
  });
  const [recentEvents, setRecentEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        
        // Fetch all events
        const eventsRes = await fetch('http://localhost:9000/api/org/events', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const eventsData = eventsRes.ok ? await eventsRes.json() : [];
        
        // Fetch my applications
        const appsRes = await fetch('http://localhost:9000/api/vol/applications', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const appsData = appsRes.ok ? await appsRes.json() : [];
        
        // Fetch badges
        const badgesRes = await fetch(`http://localhost:9000/api/volunteers/${userId}/badges`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const badgesData = badgesRes.ok ? await badgesRes.json() : [];
        
        // Fetch feedback
        const feedbackRes = await fetch(`http://localhost:9000/pub/feedback/volunteer/${userId}`);
        const feedbackData = feedbackRes.ok ? await feedbackRes.json() : [];
        
        setStats({
          totalEvents: eventsData.length,
          appliedEvents: appsData.length,
          badges: (badgesData.data || badgesData || []).length,
          feedback: feedbackData.length
        });
        
        // Get recent events (last 3)
        const sortedEvents = [...eventsData].sort((a, b) => 
          new Date(b.event_date) - new Date(a.event_date)
        );
        setRecentEvents(sortedEvents.slice(0, 3));
        
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);
  

  
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20
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
  


  return (
    <DashboardLayout userType="volunteer">
      <motion.h1 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-2xl font-bold mb-6"
      >
        Volunteer Dashboard
      </motion.h1>
      
      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-50 text-red-600 p-4 rounded-md"
        >
          {error}
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          {/* Stats Cards */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <motion.div 
              whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
              className="bg-white rounded-lg shadow p-3 sm:p-4 flex items-center transition-shadow duration-300"
            >
              <div className="rounded-full bg-blue-100 p-2 sm:p-3 mr-3">
                <FiCalendar className="text-primary text-lg sm:text-xl" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Total Events</p>
                <motion.h3 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-xl sm:text-2xl font-bold"
                >
                  {stats.totalEvents}
                </motion.h3>
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
              className="bg-white rounded-lg shadow p-3 sm:p-4 flex items-center transition-shadow duration-300"
            >
              <div className="rounded-full bg-green-100 p-2 sm:p-3 mr-3">
                <FiCheckCircle className="text-green-600 text-lg sm:text-xl" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Applied Events</p>
                <motion.h3 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="text-xl sm:text-2xl font-bold"
                >
                  {stats.appliedEvents}
                </motion.h3>
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
              className="bg-white rounded-lg shadow p-3 sm:p-4 flex items-center transition-shadow duration-300"
            >
              <div className="rounded-full bg-yellow-100 p-2 sm:p-3 mr-3">
                <FiAward className="text-yellow-600 text-lg sm:text-xl" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Badges Earned</p>
                <motion.h3 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="text-xl sm:text-2xl font-bold"
                >
                  {stats.badges}
                </motion.h3>
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
              className="bg-white rounded-lg shadow p-3 sm:p-4 flex items-center transition-shadow duration-300"
            >
              <div className="rounded-full bg-purple-100 p-2 sm:p-3 mr-3">
                <FiUsers className="text-purple-600 text-lg sm:text-xl" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Feedback Received</p>
                <motion.h3 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="text-xl sm:text-2xl font-bold"
                >
                  {stats.feedback}
                </motion.h3>
              </div>
            </motion.div>
          </motion.div>
          
          {/* Recent Events */}
          <motion.div 
            variants={itemVariants}
            className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6 sm:mb-8"
          >
            <h2 className="text-lg sm:text-xl font-bold mb-4">Recent Events</h2>
            
            {recentEvents.length === 0 ? (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-gray-500 text-center py-8"
              >
                No events available yet.
              </motion.p>
            ) : (
              <div className="space-y-4">
                {recentEvents.map((event) => (
                  <div key={event.event_id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="mb-2">
                      <h3 className="font-medium">{event.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <FiCalendar className="mr-1" />
                      <span>{formatDate(event.event_date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 text-right"
            >
              <Link 
                to="/volunteer-all-events"
                className="text-primary hover:underline text-sm font-medium"
              >
                View All Events
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </DashboardLayout>
  );
};

export default VolunteerDashboard;
