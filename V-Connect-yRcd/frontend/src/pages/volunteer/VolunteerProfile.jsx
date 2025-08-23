import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiEdit2, FiAward, FiClock, FiUser, FiMail, FiPhone, FiStar } from 'react-icons/fi';
import DashboardLayout from './DashboardLayout';
import EditVolunteerProfile from './EditVolunteerProfile';

const VolunteerProfile = () => {
  const [profile, setProfile] = useState([]);
  const [badges, setBadges] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [error, setError] = useState(null);
  
  const convertGoogleDriveUrl = (url) => {
    if (url && url.startsWith('/uploads/')) {
      return `http://localhost:9000${url}`;
    }
    if (url && url.includes('drive.google.com')) {
      const fileId = url.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
      return fileId ? `https://drive.google.com/uc?export=download&id=${fileId}` : url;
    }
    return url;
  };
  
  const hardcodedBadges = [
    {
      badge_id: 1,
      badge_name: "First Event",
      badge_description: "Completed your first volunteer event",
      earned_date: "2024-01-15"
    }
  ];
  
  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('token');
        let user_id = localStorage.getItem('userId');
        let email = localStorage.getItem('email');
        console.log(token);
                
        if (!token) {
          throw new Error('Authentication required');
        }
        
        // Extract data from JWT token
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (!user_id) user_id = payload.user_id;
            if (!email) email = payload.email; // Only use email field
            console.log('JWT payload:', payload);
          } catch (e) {
            console.error('Failed to parse JWT token:', e);
          }
        }
        
        if (!user_id) {
          throw new Error('User ID not found');
        }
        
        // Fetch volunteer profile data
        const profileResponse = await fetch(`http://localhost:9000/api/volunteers/${user_id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!profileResponse.ok) {
          throw new Error('Failed to fetch profile data');
        }
        
        const profileData = await profileResponse.json();
        console.log('Profile API response:', profileData);
        
        // Fetch email from users table separately
        let userEmail = email;
        try {
          // Try different endpoints to get user email
          const endpoints = [
            `http://localhost:9000/pub/users/${user_id}`,
            `http://localhost:9000/api/volunteers/${user_id}`,
            `http://localhost:9000/api/users/${user_id}`
          ];
          
          for (const endpoint of endpoints) {
            try {
              const userRes = await fetch(endpoint);
              if (userRes.ok) {
                const userData = await userRes.json();
                console.log(`Email from ${endpoint}:`, userData);
                if (userData.email) {
                  userEmail = userData.email;
                  break;
                }
              }
            } catch (e) {
              console.log(`Failed to fetch from ${endpoint}:`, e);
            }
          }
        } catch (e) {
          console.log('Failed to fetch user email:', e);
        }
        
        // Handle different API response structures
        const profileInfo = profileData.data || profileData;
        
        setProfile({
          ...profileInfo,
          email: userEmail || profileInfo.email || 'Not provided'
        });
        
        // Fetch volunteer badges
        try {
          const badgesResponse = await fetch(`http://localhost:9000/api/volunteers/${user_id}/badges`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (badgesResponse.ok) {
            const badgesData = await badgesResponse.json();
            console.log('Fetched badges:', badgesData);
            setBadges(badgesData.data || badgesData || []);
          }
        } catch (badgeError) {
          console.log('Failed to fetch badges');
          setBadges(hardcodedBadges);
        }
        
        // Fetch volunteer feedback
        try {
          const feedbackResponse = await fetch(`http://localhost:9000/pub/feedback/volunteer/${user_id}`);
          if (feedbackResponse.ok) {
            const feedbackData = await feedbackResponse.json();
            
            // Fetch organizations for feedback
            let organizations = [];
            try {
              const orgRes = await fetch('http://localhost:9000/pub/organizations/');
              if (orgRes.ok) {
                organizations = await orgRes.json();
              }
            } catch (error) {
              console.log('Error fetching organizations:', error);
            }
            
            // Map organization names to feedback
            const feedbackWithOrgNames = feedbackData.map((fb) => {
              const org = organizations.find(o => o.user_id === fb.organization_id);
              return { ...fb, organizationName: org?.name || 'Unknown Organization' };
            });
            
            setFeedback(feedbackWithOrgNames);
          } else {
            console.log('Feedback API returned status:', feedbackResponse.status);
            setFeedback([]);
          }
        } catch (feedbackError) {
          console.log('Failed to fetch feedback:', feedbackError);
          // Use mock data when API is not available
          const mockFeedback = [
            {
              feedback_id: 1,
              event_id: 101,
              rating: 5,
              comment: "Excellent volunteer work! Very dedicated and helpful.",
              organizationName: "Community Help Center"
            },
            {
              feedback_id: 2,
              event_id: 102,
              rating: 4,
              comment: "Great participation in the cleanup event.",
              organizationName: "Green Earth Initiative"
            }
          ];
          setFeedback(mockFeedback);
        }

      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError(err.message || 'Something went wrong');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfileData();
  }, []);


  // Format date function
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const handleProfileUpdate = (updatedProfile) => {
    setProfile({
      ...profile,
      ...updatedProfile,
      profile_photo: updatedProfile.profile_photo
    });
    setIsEditModalOpen(false);
  };

  return (
    <DashboardLayout userType="volunteer">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">My Profile</h1>
        <p className="text-gray-600">Manage your volunteer profile and view your contributions.</p>
      </div>
      
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-lg mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      ) : (
        <div className="flex justify-center">
          {/* Profile Card */}
          <motion.div 
            className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 w-full max-w-3xl min-h-[100px]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Personal Information</h2>
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="text-primary hover:bg-primary/10 p-2 rounded-full transition-colors"
              >
                <FiEdit2 />
              </button>
            </div>
            
            <div className="text-center mb-20">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
                {profile?.profile_photo ? (
                  <img 
                    src={convertGoogleDriveUrl(profile.profile_photo)} 
                    alt="Profile" 
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                ) : null}
                <FiUser className={`text-primary text-2xl ${profile?.profile_photo ? 'hidden' : 'block'}`} />
              </div>
              <h3 className="text-xl font-bold">{profile?.name || 'Loading...'}</h3>
              <p className="text-gray-500 text-sm mt-1">Volunteer</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <FiMail className="text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p>{profile?.email || 'Not provided'}</p>
                </div>
              </div>
              
              
            </div>
            <hr className="mt-12 mb-7"/>
                <div>
                  <h3 className="font-semibold mb-2">Bio</h3>
                  <p className="text-gray-600">{profile?.bio || 'No bio provided.'}</p>
                </div>

            <hr className="my-6" />
            
            <div>
              <h3 className="font-semibold mb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {profile?.skills ? (
                  profile.skills.split(',').map((skill, index) => (
                    <span 
                      key={index} 
                      className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                    >
                      {skill.trim()}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">No skills listed</p>
                )}
              </div>
            </div>
            
            <hr className="my-6" />
            
            {/* Badges Section */}
            <div>
              <h3 className="font-semibold mb-4">Badges Earned</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(badges.length > 0 ? badges : hardcodedBadges).map((badge) => (
                  <div key={badge.badge_id} className="bg-gray-50 rounded-lg p-4 flex items-start">
                    <div className="bg-yellow-100 text-yellow-600 p-3 rounded-lg mr-4 flex-shrink-0">
                      <FiAward size={24} />
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-semibold text-lg mb-1">{badge.badge_name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{badge.badge_description}</p>
                      <p className="text-xs text-gray-500">
                        Earned on {formatDate(badge.earned_date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              {(badges.length > 0 ? badges : hardcodedBadges).length === 0 && (
                <p className="text-gray-500 text-center py-8">No badges earned yet. Keep volunteering to earn your first badge!</p>
              )}
            </div>
            
            <hr className="my-6" />
            
            {/* Feedback Section */}
            <div>
              <h3 className="font-semibold mb-4">Feedback Received</h3>
              {feedback.length > 0 ? (
                <div className="space-y-4">
                  {feedback.map((fb, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm">Event ID: {fb.event_id}</span>
                        <span className="text-yellow-500 font-bold">★ {fb.rating}</span>
                      </div>
                      <div className="text-gray-700 mb-2">{fb.comment || 'No comment provided.'}</div>
                      <div className="text-xs text-gray-500">By: {fb.organizationName}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No feedback received yet.</p>
              )}
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <EditVolunteerProfile
          profile={profile}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleProfileUpdate}
        />
      )}
    </DashboardLayout>
  );
};

export default VolunteerProfile;    
    

