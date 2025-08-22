import { useEffect, useState } from 'react';
import { FiStar } from 'react-icons/fi';
import DashboardLayout from './DashboardLayout';

const VolunteerFeedback = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to render star rating
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FiStar
          key={i}
          className={`w-4 h-4 ${i <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
        />
      );
    }
    return stars;
  };

  useEffect(() => {
    const fetchFeedback = async () => {
      setLoading(true);
      setError(null);
      try {
        let userId = localStorage.getItem('userId');
        
        // If userId not in localStorage, extract from JWT token
        if (!userId) {
          const token = localStorage.getItem('token');
          if (token) {
            try {
              const payload = JSON.parse(atob(token.split('.')[1]));
              userId = payload.user_id;
            } catch (e) {
              console.error('Failed to parse JWT token:', e);
            }
          }
        }
        
        if (!userId) throw new Error('User ID not found');
        const res = await fetch(`http://localhost:9000/pub/feedback/volunteer/${userId}`);
        if (!res.ok) throw new Error('Failed to fetch feedback');
        const data = await res.json();
        
        // Fetch all organizations first
        let organizations = [];
        try {
          const orgRes = await fetch('http://localhost:9000/pub/organizations/');
          if (orgRes.ok) {
            organizations = await orgRes.json();
          }
        } catch (error) {
          console.log('Error fetching organizations:', error);
        }
        
        // Fetch events for feedback
        let events = [];
        try {
          const eventsRes = await fetch('http://localhost:9000/pub/events');
          if (eventsRes.ok) {
            events = await eventsRes.json();
          }
        } catch (error) {
          console.log('Error fetching events:', error);
        }
        
        // Map organization names and event names to feedback
        const feedbackWithOrgNames = data.map((fb) => {
          const org = organizations.find(o => o.user_id === fb.organization_id);
          const event = events.find(e => e.event_id === fb.event_id);
          return { 
            ...fb, 
            organizationName: org?.name || 'Unknown Organization',
            eventName: event?.title || `Event #${fb.event_id}`
          };
        });
        
        setFeedback(feedbackWithOrgNames);
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, []);

  return (
    <DashboardLayout userType="volunteer">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">My Feedback</h1>
        <p className="text-gray-600">View feedback and ratings from organizations</p>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="ml-4 text-gray-600">Loading feedback...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      ) : !feedback.length ? (
        <div className="text-center py-12">
          <div className="bg-gray-50 rounded-lg p-8">
            <p className="text-gray-500 text-lg">No feedback received yet</p>
            <p className="text-gray-400 text-sm mt-2">Complete more events to receive feedback from organizations</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {feedback.map((fb, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-medium text-gray-800">{fb.eventName}</h3>
                  <p className="text-xs text-gray-500">From: {fb.organizationName}</p>
                </div>
                <div className="flex items-center space-x-1">
                  {renderStars(fb.rating)}
                  <span className="text-xs text-gray-600 ml-1">({fb.rating})</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-700 mb-2">
                {fb.comment || 'No comment provided.'}
              </p>
              
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{fb.given_at ? new Date(fb.given_at).toLocaleDateString() : 'Date not available'}</span>
                {fb.hours_worked && <span>{fb.hours_worked}h worked</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default VolunteerFeedback;
