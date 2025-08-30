import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '../../components/LoadingSpinner';
import SavingSpinner from '../../components/SavingSpinner';
import { FiSave, FiEdit2, FiMapPin, FiGlobe, FiCheckCircle, FiInfo, FiUser, FiX, FiMail } from 'react-icons/fi';
import OrganizationSidebar from './OrganizationSidebar';

const OrganizationProfile = () => {
  const [profile, setProfile] = useState({
    organization_id: '',
    description: '',
    address: '',
    website: '',
    is_verified: false,
    // Additional fields for display purposes from user record
    name: '',
    email: ''
  });
  const [editFormData, setEditFormData] = useState({
    description: '',
    address: '',
    website: ''
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is logged in and is an organization
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('user_type');
    
    if (!token || userType !== 'organization') {
      navigate('/login');
      return;
    }
    
    fetchProfile();
  }, [navigate]);
  
  // Initialize edit form data when profile data is loaded or edit modal is opened
  useEffect(() => {
    if (showEditModal) {
      setEditFormData({
        description: profile.description || '',
        address: profile.address || '',
        website: profile.website || ''
      });
    }
  }, [showEditModal, profile]);
  
  // Function to decode JWT token
  const decodeJWT = (token) => {
    try {
      // Get the payload part of the token (second part)
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      // Decode the base64 string
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding JWT token:', error);
      return null;
    }
  };

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const organizationId = localStorage.getItem('user_id');
      const userEmail = localStorage.getItem('user_email') || '';
      
      // Try to get organization name from JWT token first
      let orgName = '';
      const decodedToken = decodeJWT(token);
      if (decodedToken && decodedToken.name) {
        orgName = decodedToken.name;
        // Save the name to localStorage for future use
        localStorage.setItem('user_name', decodedToken.name);
      } else {
        // Fall back to localStorage if JWT doesn't contain name
        orgName = localStorage.getItem('user_name') || '';
      }
      
      // Fetch organization profile data from the API
      const response = await fetch(`/api/org/profile/${organizationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      const profileData = await response.json();
      
      // Use the data from the API, JWT token and localStorage
      setProfile({
        ...profileData,
        organization_id: organizationId,
        name: orgName,
        email: userEmail
      });
      
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const organizationId = localStorage.getItem('user_id');
      
      // Only include the fields supported by the API
      const response = await fetch(`/api/org/profile/${organizationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          description: editFormData.description,
          address: editFormData.address,
          website: editFormData.website,
          is_verified: profile.is_verified
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      // Update the profile data with the new values
      setProfile({
        ...profile,
        description: editFormData.description,
        address: editFormData.address,
        website: editFormData.website
      });
      
      // Close the modal
      setShowEditModal(false);
      setSaveSuccess(true);
      
      // Show success message for 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <OrganizationSidebar>
      <div className="w-full px-4 py-1 sm:px-6 md:px-8 lg:px-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Organization Profile</h1>
          <p className="text-gray-600">Manage your organization profile and information.</p>
        </div>
      
      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="bg-red-50 p-4 rounded-lg mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {saveSuccess && (
            <div className="bg-green-50 text-green-600 p-4 rounded-md mb-6 flex items-center">
              <FiCheckCircle className="mr-2" /> Profile updated successfully!
            </div>
          )}
          
          {/* Profile Header Card */}
          <motion.div 
            className="bg-white rounded-lg shadow-sm border border-gray-100 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {profile.is_verified && (
              <div className="bg-green-50 text-green-700 px-4 py-2 flex items-center text-sm rounded-md mb-4">
                <FiCheckCircle className="mr-2" /> This organization is verified
              </div>
            )}
            
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <FiUser className="text-primary text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{profile.name || 'Loading...'}</h2>
                  <p className="text-gray-500">Organization</p>
                  <div className="flex items-center mt-1 text-gray-600">
                    <FiMail className="mr-2 text-sm" />
                    <span className="text-sm">{profile.email || 'Not provided'}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowEditModal(true)}
                className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors flex items-center space-x-2"
              >
                <FiEdit2 size={16} />
                <span>Edit Profile</span>
              </button>
            </div>
          </motion.div>

          {/* About Card */}
          <motion.div 
            className="bg-white rounded-lg shadow-sm border border-gray-100 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <h3 className="text-lg font-semibold mb-4">About</h3>
            <div>
              <h4 className="font-bold text-gray-700 mb-2">Description</h4>
              <p className="text-gray-600">
                {profile.description || 'No description provided.'}
              </p>
            </div>
          </motion.div>

          {/* Contact Information Card */}
          <motion.div 
            className="bg-white rounded-lg shadow-sm border border-gray-100 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-gray-700 mb-2">Address</h4>
                <div className="flex items-start">
                  <FiMapPin className="text-yellow-500 mr-2 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    {profile.address ? (
                      <p className="text-gray-600 whitespace-pre-line">{profile.address}</p>
                    ) : (
                      <p className="text-gray-500 italic">No address provided.</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-bold text-gray-700 mb-2">Website</h4>
                <div className="flex items-start">
                  <FiGlobe className="text-green-500 mr-2 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    {profile.website ? (
                      <a 
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline break-all"
                      >
                        {profile.website}
                      </a>
                    ) : (
                      <p className="text-gray-500 italic">No website provided.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg mx-auto my-8 overflow-hidden">
            <div className="flex justify-between items-center p-4 sm:p-6 border-b sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold">Edit Organization Profile</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700 text-xl ml-4"
              >
                <FiX />
              </button>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="p-4 sm:p-6">
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                <div className="mb-3 sm:mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization Description
                  </label>
                  <textarea 
                    value={editFormData.description}
                    onChange={e => setEditFormData({...editFormData, description: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-primary/50 text-sm sm:text-base"
                    rows={window.innerWidth < 640 ? "4" : "6"}
                    placeholder="Describe your organization, its mission, values, and impact..."
                  />
                  <p className="text-xs text-gray-500 mt-1">This description will be visible to volunteers and donors.</p>
                </div>
                
                <div className="mb-4">
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <FiMapPin className="mr-2 text-yellow-500" /> 
                    Organization Address
                  </label>
                  <textarea 
                    value={editFormData.address}
                    onChange={e => setEditFormData({...editFormData, address: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-primary/50"
                    rows="3"
                    placeholder="Enter your physical address..."
                  />
                </div>
                
                <div className="mb-6">
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <FiGlobe className="mr-2 text-green-500" /> 
                    Website URL
                  </label>
                  <input 
                    type="url"
                    value={editFormData.website}
                    onChange={e => setEditFormData({...editFormData, website: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-primary/50"
                    placeholder="https://www.example.org"
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap justify-end gap-2">
                <motion.button 
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="bg-gray-200 text-gray-700 py-1 sm:py-2 px-3 sm:px-4 text-sm sm:text-base rounded-md hover:bg-gray-300 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isSaving}
                >
                  Cancel
                </motion.button>
                <motion.button 
                  type="submit"
                  className="bg-primary text-white py-1 sm:py-2 px-3 sm:px-4 text-sm sm:text-base rounded-md hover:bg-primary/90 transition-colors flex items-center min-w-[140px] justify-center"
                  whileHover={!isSaving ? { scale: 1.02 } : {}}
                  whileTap={!isSaving ? { scale: 0.98 } : {}}
                  disabled={isSaving}
                >
                  <AnimatePresence mode="wait">
                    {isSaving ? (
                      <SavingSpinner key="saving" message="Saving..." size="small" />
                    ) : (
                      <motion.div
                        key="save"
                        className="flex items-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <FiSave className="mr-1 sm:mr-2" /> Save Changes
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </OrganizationSidebar>
  );
};

export default OrganizationProfile;
