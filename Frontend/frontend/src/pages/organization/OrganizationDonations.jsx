import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit, FiTrash2, FiHeart, FiAtSign } from 'react-icons/fi';
import OrganizationSidebar from './OrganizationSidebar';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmModal from '../../components/common/ConfirmModal';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const OrganizationDonations = () => {
  const [donationRequests, setDonationRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentDonation, setCurrentDonation] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [donationToDelete, setDonationToDelete] = useState(null);
  const navigate = useNavigate();
  
  // Form state for creating/editing donation requests
  const [donationForm, setDonationForm] = useState({
    title: '',
    description: '',
    target_amount: 0,
    contact_info: '',
    status: 'active'
  });
  
  useEffect(() => {
    // Check if user is logged in and is an organization
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('user_type');
    
    if (!token || userType !== 'organization') {
      navigate('/login');
      return;
    }
    
    fetchDonationRequests();
  }, [navigate]);
  
  const fetchDonationRequests = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const organizationId = localStorage.getItem('user_id');
      
      const response = await fetch(`/api/org/donation_requests/org/${organizationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch donation requests');
      }
      
      const data = await response.json();
      setDonationRequests(data);
      
    } catch (error) {
      console.error('Error fetching donation requests:', error);
      setError('Failed to load donation requests. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCreateDonation = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const organizationId = localStorage.getItem('user_id');
      
      const response = await fetch('/api/org/donation_requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...donationForm,
          organization_id: parseInt(organizationId),
          target_amount: parseInt(donationForm.target_amount)
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create donation request');
      }
      
      // Refresh donation requests list and close modal
      fetchDonationRequests();
      setShowCreateModal(false);
      // Reset form
      setDonationForm({
        title: '',
        description: '',
        target_amount: 0,
        contact_info: '',
        status: 'active'
      });
      
    } catch (error) {
      console.error('Error creating donation request:', error);
      setError('Failed to create donation request. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleEditDonation = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/org/donation_requests/${currentDonation.request_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...donationForm,
          target_amount: parseInt(donationForm.target_amount)
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update donation request');
      }
      
      // Refresh donation requests list and close modal
      fetchDonationRequests();
      setShowEditModal(false);
      
    } catch (error) {
      console.error('Error updating donation request:', error);
      setError('Failed to update donation request. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDeleteDonation = (requestId) => {
    setDonationToDelete(requestId);
    setShowConfirm(true);
  };

  const confirmDeleteDonation = async () => {
    if (!donationToDelete) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/org/donation_requests/${donationToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete donation request');
      toast.success('Donation request deleted successfully!');
      fetchDonationRequests();
    } catch (error) {
      toast.error('Failed to delete donation request.');
    } finally {
      setShowConfirm(false);
      setDonationToDelete(null);
    }
  };
  
  // Format currency for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'LKR',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not specified';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <OrganizationSidebar>
        <div className="w-full px-4 py-1 sm:px-6 md:px-8 lg:px-10">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
            <h1 className="text-xl sm:text-2xl font-bold">Donation Campaigns</h1>
            {/* Only show the button when not loading */}
            {!isLoading && (
              <button 
                onClick={() => setShowCreateModal(true)}
                className="bg-primary text-white py-1 sm:py-2 px-3 sm:px-4 text-sm sm:text-base rounded-md hover:bg-primary/90 transition-colors flex items-center whitespace-nowrap w-max"
              >
                <FiPlus className="mr-1 sm:mr-2" /> Create Campaign
              </button>
            )}
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
              {error}
            </div>
          )}
        
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            {/* Donation Campaigns List */}
            {donationRequests.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <p className="text-gray-500 mb-4">You haven't created any donation campaigns yet.</p>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition-colors"
                >
                  Create Your First Campaign
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {donationRequests.map((donation) => (
                  <div 
                    key={donation.request_id}
                    className="bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:-translate-y-1"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          donation.status === 'active' ? 'bg-green-100 text-green-700' : 
                          donation.status === 'completed' ? 'bg-blue-100 text-blue-700' : 
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                        </span>
                        <div className="flex items-center">
                          <button 
                            onClick={() => {
                              setCurrentDonation(donation);
                              setDonationForm({
                                title: donation.title,
                                description: donation.description,
                                target_amount: donation.target_amount,
                                contact_info: donation.contact_info,
                                status: donation.status
                              });
                              setShowEditModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                          >
                            <FiEdit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteDonation(donation.request_id)}
                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
                        {donation.title}
                      </h3>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {donation.description}
                      </p>
                      
                      <div className="bg-red-50 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">Target</span>
                          <span className="text-lg font-bold text-red-600">
                            {formatCurrency(donation.target_amount)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Campaign Details - Highlighted Section */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Campaign Details</h4>
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-gray-500">Organization</p>
                            <p className="text-sm font-semibold text-gray-800">
                              {localStorage.getItem('user_name') || 'Your Organization'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Email</p>
                            <p className="text-sm font-semibold text-gray-800">
                              {donation.contact_info}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                        <span className="text-xs text-gray-500">
                          Created: {formatDate(donation.created_at)}
                        </span>
                        <button 
                          onClick={() => {
                            setSelectedDonation(donation);
                            setShowViewModal(true);
                          }}
                          className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                        >
                          View More
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        
        {/* Create Donation Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-start md:items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-auto my-4 md:my-8 overflow-hidden">
              <div className="flex justify-between items-center p-3 sm:p-4 md:p-6 border-b sticky top-0 bg-white z-10">
                <h3 className="text-base sm:text-lg font-bold">Create Donation Campaign</h3>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl ml-4"
                >
                  &times;
                </button>
              </div>
              
              <form onSubmit={handleCreateDonation} className="p-4 sm:p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Campaign Title
                  </label>
                  <input 
                    type="text"
                    required
                    value={donationForm.title}
                    onChange={e => setDonationForm({...donationForm, title: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-primary/50"
                    placeholder="Enter a clear, descriptive title"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea 
                    required
                    value={donationForm.description}
                    onChange={e => setDonationForm({...donationForm, description: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-primary/50"
                    rows="4"
                    placeholder="Describe your campaign's purpose and impact"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <FiHeart className="mr-2 text-red-500" />
                    Target Amount (LKR)
                  </label>
                  <input 
                    type="number"
                    required
                    min="1"
                    value={donationForm.target_amount}
                    onChange={e => setDonationForm({...donationForm, target_amount: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-primary/50"
                    placeholder="Enter fundraising goal amount"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <FiAtSign className="mr-2 text-primary" />
                    Email Address
                  </label>
                  <input 
                    type="email"
                    required
                    value={donationForm.contact_info}
                    onChange={e => setDonationForm({...donationForm, contact_info: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-primary/50"
                    placeholder="organization@example.com"
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select 
                    value={donationForm.status}
                    onChange={e => setDonationForm({...donationForm, status: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-primary/50"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                
                <div className="flex justify-end">
                  <button 
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md mr-2 hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition-colors flex items-center disabled:opacity-50"
                  >
                    {isSaving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <FiPlus className="mr-2" />
                    )}
                    {isSaving ? 'Creating...' : 'Create Campaign'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Edit Donation Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-auto my-8 overflow-hidden">
              <div className="flex justify-between items-center p-4 sm:p-6 border-b sticky top-0 bg-white z-10">
                <h3 className="text-lg font-bold">Edit Donation Campaign</h3>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl ml-4"
                >
                  &times;
                </button>
              </div>
              
              <form onSubmit={handleEditDonation} className="p-4 sm:p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Campaign Title
                  </label>
                  <input 
                    type="text"
                    required
                    value={donationForm.title}
                    onChange={e => setDonationForm({...donationForm, title: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-primary/50"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea 
                    required
                    value={donationForm.description}
                    onChange={e => setDonationForm({...donationForm, description: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-primary/50"
                    rows="4"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <FiHeart className="mr-2 text-red-500" />
                    Target Amount (LKR)
                  </label>
                  <input 
                    type="number"
                    required
                    min="1"
                    value={donationForm.target_amount}
                    onChange={e => setDonationForm({...donationForm, target_amount: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-primary/50"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <FiAtSign className="mr-2 text-primary" />
                    Email Address
                  </label>
                  <input 
                    type="email"
                    required
                    value={donationForm.contact_info}
                    onChange={e => setDonationForm({...donationForm, contact_info: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-primary/50"
                    placeholder="organization@example.com"
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select 
                    value={donationForm.status}
                    onChange={e => setDonationForm({...donationForm, status: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-primary/50"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                
                <div className="flex justify-end">
                  <button 
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md mr-2 hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition-colors flex items-center disabled:opacity-50"
                  >
                    {isSaving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <FiEdit className="mr-2" />
                    )}
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* View More Modal */}
        {showViewModal && selectedDonation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-auto">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-semibold">Campaign Description</h3>
                <button 
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  &times;
                </button>
              </div>
              
              <div className="p-4">
                <p className="text-gray-700 leading-relaxed">{selectedDonation.description}</p>
                
                <div className="flex justify-end mt-4 pt-4 border-t">
                  <button 
                    onClick={() => setShowViewModal(false)}
                    className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <ConfirmModal
          isOpen={showConfirm}
          title="Delete Donation Request"
          message="Are you sure you want to delete this donation request?"
          onConfirm={confirmDeleteDonation}
          onCancel={() => setShowConfirm(false)}
        />
        <ToastContainer position="top-right" autoClose={2000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
        </div>
      </OrganizationSidebar>
    </div>
  );
};

export default OrganizationDonations;
