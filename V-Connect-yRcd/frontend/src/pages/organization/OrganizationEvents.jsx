import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '../../components/LoadingSpinner';
import SavingSpinner from '../../components/SavingSpinner';
import { FiPlus, FiEdit, FiTrash2, FiUsers, FiCalendar, FiMapPin, FiMessageCircle } from 'react-icons/fi';
import OrganizationSidebar from './OrganizationSidebar';
import { fetchWithFallback } from '../../utils/apiUtils';
import ChatNotificationButton from '../../components/ChatNotificationButton';
import ChatModal from '../../components/ChatModal';

const OrganizationEvents = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventApplications, setEventApplications] = useState([]);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [volunteerProfile, setVolunteerProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  // Chat modal state
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatVolunteer, setChatVolunteer] = useState(null); // {volunteer_id, name}
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const chatBottomRef = useRef(null);

  // Fetch chat messages for event/volunteer
  const openChatModal = async (volunteer) => {
    console.log('openChatModal called with:', volunteer);
    console.log('selectedEvent:', selectedEvent);
    
    if (!volunteer || !volunteer.volunteer_id || !selectedEvent || !selectedEvent.event_id) {
      console.error('Invalid parameters:', { volunteer, selectedEvent });
      setChatError('Invalid chat parameters');
      return;
    }
    
    setChatVolunteer(volunteer);
    setShowChatModal(true);
    setChatMessages([]);
    setChatError(null);
    setChatLoading(true);
    try {
      const token = localStorage.getItem('token');
      const eventId = selectedEvent.event_id;
      const volunteerId = volunteer.volunteer_id;
      
      console.log('Fetching messages for eventId:', eventId, 'volunteerId:', volunteerId);
      
      // Use private messaging endpoint
      const res = await fetch(`http://localhost:9000/api/chat/events/${eventId}/messages/volunteer/${volunteerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch messages');
      const data = await res.json();
      setChatMessages(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Chat fetch error:', e);
      setChatError('Failed to load chat messages.');
    } finally {
      setChatLoading(false);
      setTimeout(() => {
        if (chatBottomRef.current) chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  // Send a new chat message
  const sendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatSending(true);
    setChatError(null);
    try {
      const token = localStorage.getItem('token');
      const eventId = selectedEvent.event_id;
      // Use private messaging endpoint
      const res = await fetch(`http://localhost:9000/api/chat/events/${eventId}/messages/volunteer/${chatVolunteer.volunteer_id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: chatInput.trim()
        })
      });
      if (!res.ok) throw new Error('Failed to send message');
      setChatInput("");
      // Re-fetch messages after sending
      await openChatModal(chatVolunteer);
    } catch (e) {
      setChatError('Failed to send message.');
    } finally {
      setChatSending(false);
      setTimeout(() => {
        if (chatBottomRef.current) chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };
  const handleViewVolunteerProfile = async (volunteerId) => {
    setIsLoadingProfile(true);
    setShowProfileModal(true);
    setVolunteerProfile(null);
    try {
      const res = await fetch(`http://localhost:9000/pub/volunteers/${volunteerId}/profile`);
      if (res.ok) {
        const data = await res.json();
        console.log('Volunteer profile data:', data);
        setVolunteerProfile(data);
      } else {
        setVolunteerProfile({ error: 'Profile not found' });
      }
    } catch (e) {
      setVolunteerProfile({ error: 'Failed to load profile' });
    } finally {
      setIsLoadingProfile(false);
    }
  };
  const navigate = useNavigate();

  // Form state for creating/editing events
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    location: "",
    event_date: "",
    required_volunteers: 0,
  });

  // Form state for feedback
  const [feedbackForm, setFeedbackForm] = useState({
    rating: 5,
    comment: "",
    hours_worked: 1,
  });

  // State for feedback management
  const [existingFeedback, setExistingFeedback] = useState(null);
  const [isEditingFeedback, setIsEditingFeedback] = useState(false);
  const [isFetchingFeedback, setIsFetchingFeedback] = useState(false);

  useEffect(() => {
    // Check if user is logged in and is an organization
    const token = localStorage.getItem("token");
    const userType = localStorage.getItem("user_type");

    if (!token || userType !== "organization") {
      navigate("/login");
      return;
    }

    fetchEvents();
  }, [navigate]);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      const organizationId = localStorage.getItem("user_id");

      const response = await fetch(`/api/org/events/${organizationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }

      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error("Error fetching events:", error);
      setError("Failed to load events. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEventApplications = async (eventId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/org/events/${eventId}/applications`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch applications");
      }
      const data = await response.json();
      // Save a copy of the current applications to help preserve status changes
      const currentApplications = [...eventApplications];
      // Get any stored application statuses from localStorage
      const storedApplications = JSON.parse(localStorage.getItem('applicationStatuses') || '{}');

      // Get all unique volunteer IDs
      const volunteerIds = [...new Set(data.map(app => app.volunteer_id))];
      // Fetch volunteer names in parallel
      const volunteerNames = {};
      await Promise.all(volunteerIds.map(async (id) => {
        try {
          const user = await fetchWithFallback(`/pub/users/${id}`);
          if (user) {
            if (!user.name || user.name.trim().toLowerCase() === 'volunteer') {
              volunteerNames[id] = user.email || `Volunteer #${id}`;
            } else {
              volunteerNames[id] = user.name;
            }
          } else {
            volunteerNames[id] = `Volunteer #${id}`;
          }
        } catch {
          volunteerNames[id] = `Volunteer #${id}`;
        }
      }));

      // Transform the data to ensure it has all required fields
      const processedApplications = data.map(app => {
        const existingApp = currentApplications.find(existing => existing.application_id === app.application_id);
        const storedStatus = storedApplications[app.application_id];
        let effectiveStatus;
        if (storedStatus) {
          effectiveStatus = storedStatus;
        } else if (existingApp) {
          effectiveStatus = existingApp.status;
        } else {
          effectiveStatus =
            app.status === "accepted" ? "approved" : app.status || "pending";
        }
        return {
          ...app,
          volunteer_name: volunteerNames[app.volunteer_id] || `Volunteer #${app.volunteer_id}`,
          status: effectiveStatus,
          message: app.message || ''
        };
      });
      setEventApplications(processedApplications);
    } catch (error) {
      console.error("Error fetching applications:", error);
      setError("Failed to load applications. Please try again later.");
    }
  };

  const handleViewEventDetails = (event) => {
    setSelectedEvent(event);
    fetchEventApplications(event.event_id);
    setShowEventDetails(true);

    // Clear the error when opening event details
    setError(null);
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const token = localStorage.getItem("token");
      const organizationId = localStorage.getItem("user_id");

      const response = await fetch("/api/org/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...eventForm,
          organization_id: parseInt(organizationId),
          required_volunteers: parseInt(eventForm.required_volunteers),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create event");
      }

      // Refresh events list and close modal
      fetchEvents();
      setShowCreateModal(false);
      // Reset form
      setEventForm({
        title: "",
        description: "",
        location: "",
        event_date: "",
        required_volunteers: 0,
      });
    } catch (error) {
      console.error('Error creating event:', error);
      setError('Failed to create event. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditEvent = async (e) => {
    e.preventDefault();
    setIsEditing(true);
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`/api/org/events/${currentEvent.event_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...eventForm,
          required_volunteers: parseInt(eventForm.required_volunteers),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update event");
      }

      // Refresh events list and close modal
      fetchEvents();
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating event:', error);
      setError('Failed to update event. Please try again.');
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(`/api/org/events/${eventId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to delete event");
        }

        // Refresh events list
        fetchEvents();
      } catch (error) {
        console.error("Error deleting event:", error);
        setError("Failed to delete event. Please try again.");
      }
    }
  };

  const handleUpdateApplicationStatus = async (
    eventId,
    applicationId,
    status
  ) => {
    try {
      const token = localStorage.getItem("token");

      console.log(`Updating application ${applicationId} to status: ${status}`);

      // Update the local state immediately for a smoother UI experience
      // Find the application and update its status
      const updatedApplications = eventApplications.map((app) => {
        if (app.application_id === applicationId) {
          return { ...app, status: status };
        }
        return app;
      });

      // Set the updated applications BEFORE the API call
      setEventApplications(updatedApplications);

      // Convert 'approved' status to 'accepted' as required by the API
      const apiStatus = status === "approved" ? "accepted" : status;

      // Use the relative URL path which will work with the proxy setup in Vite
      const endpoint = `/api/org/events/${eventId}/applications/${applicationId}/status?status=${apiStatus}`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        // Add this to help with CORS preflight requests
        credentials: "include",
      });

      if (!response.ok) {
        let errorMessage = "An unknown error occurred";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If response is not JSON, get the text
          errorMessage = (await response.text()) || errorMessage;
        }
        console.error("Server response:", errorMessage);
        throw new Error(`Failed to ${status} application`);
      }

      // Clear any errors and set a success message
      setError(null);
      setSuccessMessage(`Volunteer application ${status} successfully!`);

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);

      // Log for debugging
      console.log(`Volunteer application ${status} successfully!`);

      // Store the current application status in localStorage to persist it
      const storedApplications = JSON.parse(
        localStorage.getItem("applicationStatuses") || "{}"
      );
      storedApplications[applicationId] = status;
      localStorage.setItem(
        "applicationStatuses",
        JSON.stringify(storedApplications)
      );

      // We don't need to fetch again immediately - this causes the UI flicker
      // Instead, set a flag to fetch after a delay
      setTimeout(() => {
        fetchEventApplications(eventId);
      }, 1000); // Fetch after 1 second to allow the UI to stabilize
    } catch (error) {
      console.error("Error updating application status:", error);
      setError(`Failed to ${status} application. Please try again.`);
    }
  };

  // Fetch feedback for a volunteer
  const fetchVolunteerFeedback = async (eventId, volunteerId) => {
    setIsFetchingFeedback(true);
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:9000/api/org/feedback/volunteer/${volunteerId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("All feedback for volunteer:", data);
        // Find feedback for the current event
        const feedbackForEvent = data.find((fb) => fb.event_id === eventId);
        console.log("Feedback for current event:", feedbackForEvent);

        if (feedbackForEvent) {
          setExistingFeedback(feedbackForEvent);
          setFeedbackForm({
            rating: feedbackForEvent.rating,
            comment: feedbackForEvent.comment || "",
            hours_worked: feedbackForEvent.hours_worked || 1,
          });
          setIsEditingFeedback(true);
        } else {
          setExistingFeedback(null);
          setFeedbackForm({
            rating: 5,
            comment: "",
            hours_worked: 1,
          });
          setIsEditingFeedback(false);
        }
      } else {
        console.log("Failed to fetch feedback, status:", response.status);
        setExistingFeedback(null);
        setIsEditingFeedback(false);
      }
    } catch (error) {
      console.error("Error fetching feedback:", error);
      setError("Failed to fetch feedback information.");
      setExistingFeedback(null);
      setIsEditingFeedback(false);
    } finally {
      setIsFetchingFeedback(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    setIsSubmittingFeedback(true);
    try {
      const token = localStorage.getItem("token");
      const organizationId = localStorage.getItem("user_id");

      // Determine if we're creating or updating feedback
      const method = isEditingFeedback ? "PUT" : "POST";
      const url = isEditingFeedback
        ? `http://localhost:9000/api/org/feedback/${existingFeedback.feedback_id}`
        : "http://localhost:9000/api/org/feedback";

      // Prepare request body - only include fields expected by the backend
      const requestBody = {
        event_id: parseInt(selectedEvent.event_id),
        volunteer_id: parseInt(selectedVolunteer.volunteer_id),
        organization_id: parseInt(organizationId),
        rating: parseInt(feedbackForm.rating),
        comment: feedbackForm.comment?.trim() || null,
        hours_worked: feedbackForm.hours_worked
          ? parseInt(feedbackForm.hours_worked)
          : null,
      };

      // Validate required fields
      if (
        !requestBody.event_id ||
        !requestBody.volunteer_id ||
        !requestBody.organization_id
      ) {
        throw new Error(
          "Missing required fields: event_id, volunteer_id, or organization_id"
        );
      }

      if (requestBody.rating < 1 || requestBody.rating > 5) {
        throw new Error("Rating must be between 1 and 5");
      }

      console.log("Submitting feedback:", requestBody);
      console.log("Method:", method, "URL:", url);
      console.log("Is editing feedback:", isEditingFeedback);
      console.log("Existing feedback:", existingFeedback);

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorMessage = "Unknown error occurred";
        let errorData = null;
        try {
          errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
          console.error("Server error response:", errorData);
        } catch (e) {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
          console.error("Server error text:", errorText);
        }

        // Handle AlreadyExists error by switching to edit mode
        if (errorData && errorData.error === "AlreadyExists") {
          console.log("Feedback already exists, fetching existing feedback...");
          await fetchVolunteerFeedback(
            selectedEvent.event_id,
            selectedVolunteer.volunteer_id
          );
          setError(
            "Feedback already exists for this volunteer. Please edit the existing feedback."
          );
          return;
        }

        throw new Error(
          `Failed to submit feedback: ${response.status} - ${errorMessage}`
        );
      }

      // Set success message
      setSuccessMessage(
        isEditingFeedback
          ? "Feedback updated successfully!"
          : "Feedback submitted successfully!"
      );

      // Close feedback modal and reset form
      setShowFeedbackModal(false);
      setFeedbackForm({
        rating: 5,
        comment: "",
        hours_worked: 1,
      });

      // Clear existing feedback state
      setExistingFeedback(null);
      setIsEditingFeedback(false);

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setError(error.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return "Not specified";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format date for input field
  const formatDateForInput = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toISOString().split("T")[0];
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <OrganizationSidebar>
        <div className="w-full px-4 py-1 sm:px-6 md:px-8 lg:px-10">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Events Management</h1>
            {/* Only show button when not loading */}
            {!isLoading && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition-colors flex items-justify-center"
              >
                <FiPlus className="mr-2" /> Create Event
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 text-green-600 p-4 rounded-md mb-6 animate-pulse">
              {successMessage}
            </div>
          )}
        
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            {/* Events List */}
            {events.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <p className="text-gray-500 mb-4">You haven't created any events yet.</p>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition-colors"
                >
                  Create Your First Event
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map(event => {
                  const eventDate = new Date(event.event_date);
                  const isUpcoming = eventDate >= new Date();
                  
                  return (
                    <div key={event.event_id} className="bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{event.title}</h3>
                          <div className="flex space-x-1 ml-2">
                            <button 
                              onClick={() => {
                                setCurrentEvent(event);
                                setEventForm({
                                  title: event.title,
                                  description: event.description,
                                  location: event.location,
                                  event_date: formatDateForInput(event.event_date),
                                  required_volunteers: event.required_volunteers
                                });
                                setShowEditModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded"
                            >
                              <FiEdit size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteEvent(event.event_id)}
                              className="text-red-600 hover:text-red-800 p-1 rounded"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </div>
                        
                        <span className={`text-xs px-2 py-1 rounded-full font-medium mb-4 inline-block ${
                          isUpcoming ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {isUpcoming ? 'Upcoming' : 'Past'}
                        </span>
                        
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
                        </div>
                        
                        <div className="flex gap-2 pt-4 border-t border-gray-100">
                          <button
                            onClick={() => handleViewEventDetails(event)}
                            className="flex-1 bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
        
        {/* Create Event Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-start md:items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-auto my-4 md:my-8 overflow-hidden">
              <div className="flex justify-between items-center p-3 sm:p-4 md:p-6 border-b sticky top-0 bg-white z-10">
                <h3 className="text-base sm:text-lg font-bold">Create New Event</h3>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl ml-4"
                >
                  &times;
                </button>
              </div>
              
              <form onSubmit={handleCreateEvent} className="p-4 sm:p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Title
                  </label>
                  <input 
                    type="text"
                    required
                    value={eventForm.title}
                    onChange={e => setEventForm({...eventForm, title: e.target.value})}
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
                    value={eventForm.description}
                    onChange={e => setEventForm({...eventForm, description: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-primary/50"
                    rows="4"
                    placeholder="Describe your event's purpose and activities"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <FiMapPin className="mr-2 text-primary" />
                    Location
                  </label>
                  <input 
                    type="text"
                    required
                    value={eventForm.location}
                    onChange={e => setEventForm({...eventForm, location: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-primary/50"
                    placeholder="Enter the event location"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <FiCalendar className="mr-2 text-primary" />
                    Event Date
                  </label>
                  <input 
                    type="date"
                    required
                    value={eventForm.event_date}
                    onChange={e => setEventForm({...eventForm, event_date: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-primary/50"
                  />
                </div>
                
                <div className="mb-6">
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <FiUsers className="mr-2 text-primary" />
                    Required Volunteers
                  </label>
                  <input 
                    type="number"
                    required
                    min="1"
                    value={eventForm.required_volunteers}
                    onChange={e => setEventForm({...eventForm, required_volunteers: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-primary/50"
                    placeholder="Enter number of volunteers needed"
                  />
                </div>
                
                <div className="flex justify-end">
                  <motion.button 
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md mr-2 hover:bg-gray-300 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isCreating}
                  >
                    Cancel
                  </motion.button>
                  <motion.button 
                    type="submit"
                    className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition-colors flex items-center min-w-[130px] justify-center"
                    whileHover={!isCreating ? { scale: 1.02 } : {}}
                    whileTap={!isCreating ? { scale: 0.98 } : {}}
                    disabled={isCreating}
                  >
                    <AnimatePresence mode="wait">
                      {isCreating ? (
                        <SavingSpinner key="creating" message="Creating..." size="small" />
                      ) : (
                        <motion.div
                          key="create"
                          className="flex items-center"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <FiPlus className="mr-2" /> Create Event
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Edit Event Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-auto my-8 overflow-hidden">
              <div className="flex justify-between items-center p-4 sm:p-6 border-b sticky top-0 bg-white z-10">
                <h3 className="text-lg font-bold">Edit Event</h3>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl ml-4"
                >
                  &times;
                </button>
              </div>
              
              <form onSubmit={handleEditEvent} className="p-4 sm:p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Title
                  </label>
                  <input 
                    type="text"
                    required
                    value={eventForm.title}
                    onChange={e => setEventForm({...eventForm, title: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-primary/50"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea 
                    required
                    value={eventForm.description}
                    onChange={e => setEventForm({...eventForm, description: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-primary/50"
                    rows="4"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <FiMapPin className="mr-2 text-primary" />
                    Location
                  </label>
                  <input 
                    type="text"
                    required
                    value={eventForm.location}
                    onChange={e => setEventForm({...eventForm, location: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-primary/50"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <FiCalendar className="mr-2 text-primary" />
                    Event Date
                  </label>
                  <input 
                    type="date"
                    required
                    value={eventForm.event_date}
                    onChange={e => setEventForm({...eventForm, event_date: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-primary/50"
                  />
                </div>
                
                <div className="mb-6">
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <FiUsers className="mr-2 text-primary" />
                    Required Volunteers
                  </label>
                  <input 
                    type="number"
                    required
                    min="1"
                    value={eventForm.required_volunteers}
                    onChange={e => setEventForm({...eventForm, required_volunteers: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-primary/50"
                  />
                </div>
                
                <div className="flex justify-end">
                  <motion.button 
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md mr-2 hover:bg-gray-300 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isEditing}
                  >
                    Cancel
                  </motion.button>
                  <motion.button 
                    type="submit"
                    className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition-colors flex items-center min-w-[140px] justify-center"
                    whileHover={!isEditing ? { scale: 1.02 } : {}}
                    whileTap={!isEditing ? { scale: 0.98 } : {}}
                    disabled={isEditing}
                  >
                    <AnimatePresence mode="wait">
                      {isEditing ? (
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
                          <FiEdit className="mr-2" /> Save Changes
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Event Details Modal */}
        {showEventDetails && selectedEvent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl mx-auto my-8 max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center p-4 sm:p-6 border-b sticky top-0 bg-white z-10">
                <h3 className="text-lg font-bold truncate">{selectedEvent.title}</h3>
                <button 
                  onClick={() => setShowEventDetails(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl ml-4"
                >
                  &times;
                </button>
              </div>
              
              <div className="p-4 sm:p-6 overflow-y-auto">
                {/* Success message in modal */}
                {successMessage && (
                  <div className="bg-green-50 text-green-600 p-3 rounded-md mb-4 animate-pulse">
                    {successMessage}
                  </div>
                )}
                
                {/* Event Details */}
                <div className="mb-6 pb-4 border-b">
                  <h4 className="text-md font-bold mb-4">Event Information</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium">{formatDate(selectedEvent.event_date)}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium">{selectedEvent.location}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Required Volunteers</p>
                      <p className="font-medium">{selectedEvent.required_volunteers}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="whitespace-pre-line">{selectedEvent.description}</p>
                  </div>
                </div>
                
                {/* Applications Tabs */}
                <div>
                  <h4 className="text-md font-bold mb-4">Volunteer Applications</h4>
                  
                  {eventApplications.length === 0 ? (
                    <p className="text-gray-500">No applications received yet.</p>
                  ) : (
                    <>
                        {/* Pending Applications */}
                      <div className="mb-6">
                        <h5 className="text-sm font-medium mb-2">Pending Applications</h5>
                        {eventApplications.filter(app => app.status === 'pending').length === 0 ? (
                          <p className="text-gray-500 text-sm">No pending applications.</p>
                        ) : (
                          <div className="overflow-x-auto rounded-md border">
                            <table className="min-w-full bg-white">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="py-2 px-2 sm:px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volunteer ID</th>
                                  <th className="py-2 px-2 sm:px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volunteer</th>
                                  <th className="py-2 px-2 sm:px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied At</th>
                                  <th className="py-2 px-2 sm:px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {eventApplications
                                  .filter(app => app.status === 'pending')
                                  .map(app => (
                                    <tr key={app.application_id} className="transition-colors hover:bg-gray-50">
                                      <td className="py-2 px-2 sm:px-4 text-xs sm:text-sm">{app.volunteer_id}</td>
                                      <td className="py-2 px-2 sm:px-4 text-xs sm:text-sm">{app.volunteer_name}</td>
                                      <td className="py-2 px-2 sm:px-4 text-xs sm:text-sm">{app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'N/A'}</td>
                                      <td className="py-2 px-2 sm:px-4 text-xs sm:text-sm whitespace-nowrap">
                                        <button
                                          onClick={() => handleViewVolunteerProfile(app.volunteer_id)}
                                          className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md mr-1 sm:mr-2 text-xs hover:bg-gray-200 transition-colors"
                                        >
                                          View Profile
                                        </button>
                                        <button
                                          onClick={() => handleUpdateApplicationStatus(selectedEvent.event_id, app.application_id, 'approved')}
                                          className="bg-green-100 text-green-700 px-2 py-1 rounded-md mr-1 sm:mr-2 text-xs hover:bg-green-200 transition-colors"
                                        >
                                          Approve
                                        </button>
                                        <button
                                          onClick={() => handleUpdateApplicationStatus(selectedEvent.event_id, app.application_id, 'rejected')}
                                          className="bg-red-100 text-red-700 px-2 py-1 rounded-md text-xs hover:bg-red-200 transition-colors"
                                        >
                                          Reject
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                                            {/* Approved Applications */}
                      <div className="mb-6">
                        <h5 className="text-sm font-medium mb-2">Approved Volunteers</h5>
                        {eventApplications.filter(app => app.status === 'approved' || app.status === 'accepted').length === 0 ? (
                          <p className="text-gray-500 text-sm">No approved volunteers yet.</p>
                        ) : (
                          <div className="overflow-x-auto rounded-md border">
                            <table className="min-w-full bg-white">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="py-2 px-2 sm:px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volunteer ID</th>
                                  <th className="py-2 px-2 sm:px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volunteer</th>
                                  <th className="py-2 px-2 sm:px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied At</th>
                                  <th className="py-2 px-2 sm:px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {eventApplications
                                  .filter(app => app.status === 'approved' || app.status === 'accepted')
                                  .map(app => (
                                    <tr key={app.application_id} className="transition-colors hover:bg-green-50 bg-gray-50">
                                      <td className="py-2 px-2 sm:px-4 text-xs sm:text-sm">{app.volunteer_id}</td>
                                      <td className="py-2 px-2 sm:px-4 text-xs sm:text-sm">{app.volunteer_name}</td>
                                      <td className="py-2 px-2 sm:px-4 text-xs sm:text-sm">{app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'N/A'}</td>
                                      <td className="py-2 px-2 sm:px-4 text-xs sm:text-sm whitespace-nowrap">
                                        <button
                                          onClick={() => handleViewVolunteerProfile(app.volunteer_id)}
                                          className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md mr-1 sm:mr-2 text-xs hover:bg-gray-200 transition-colors"
                                        >
                                          View Profile
                                        </button>
                                        <button
                                          onClick={() => {
                                            console.log('Chat button clicked for volunteer:', app.volunteer_id, app.volunteer_name);
                                            if (!app.volunteer_id || app.volunteer_id === null) {
                                              console.error('Invalid volunteer_id:', app.volunteer_id);
                                              return;
                                            }
                                            openChatModal({ volunteer_id: app.volunteer_id, name: app.volunteer_name });
                                          }}
                                          className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md mr-1 sm:mr-2 text-xs hover:bg-blue-200 transition-colors flex items-center"
                                        >
                                          <FiMessageCircle className="mr-1" size={12} />
                                          View Messages
                                        </button>
                                        <button
                                          onClick={() => {
                                            setSelectedVolunteer({
                                              volunteer_id: app.volunteer_id,
                                              name: app.volunteer_name || `Volunteer #${app.volunteer_id}`
                                            });
                                            // Fetch any existing feedback before showing the modal
                                            fetchVolunteerFeedback(selectedEvent.event_id, app.volunteer_id);
                                            setShowFeedbackModal(true);
                                          }}
                                          className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs hover:bg-blue-200 transition-colors mr-2"
                                        >
                                          Feedback
                                        </button>
                                        <button
                                          onClick={() => handleUpdateApplicationStatus(selectedEvent.event_id, app.application_id, 'rejected')}
                                          className="bg-red-100 text-red-700 px-2 py-1 rounded-md text-xs hover:bg-red-200 transition-colors"
                                        >
                                          Reject
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

{/* Volunteer Profile Modal (properly moved outside table structure) */}
{showProfileModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
    <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-auto my-8 overflow-hidden">
      <div className="flex justify-between items-center p-4 sm:p-6 border-b sticky top-0 bg-white z-10">
        <h3 className="text-lg font-bold truncate">Volunteer Profile</h3>
        <button 
          onClick={() => setShowProfileModal(false)} 
          className="text-gray-500 hover:text-gray-700 text-xl"
        >
          &times;
        </button>
      </div>
      <div className="p-4 sm:p-6">
        {isLoadingProfile ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <>
            {volunteerProfile && !volunteerProfile.error ? (
              <div>
                <div className="flex flex-col items-center mb-4">
                  {volunteerProfile.profile_photo ? (
                    <img 
                      src={
                        volunteerProfile.profile_photo.startsWith('http')
                          ? volunteerProfile.profile_photo
                          : `http://localhost:9000${volunteerProfile.profile_photo}`
                      }
                      alt="Profile" 
                      className="w-28 h-28 rounded-full object-cover mb-3 border-4 border-primary shadow-lg" 
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center mb-3 text-gray-400 border-4 border-primary shadow-lg">
                      <span className="text-3xl">?</span>
                    </div>
                  )}
                  <div className="font-bold text-xl text-gray-900 mb-1">{volunteerProfile.name || 'No Name Provided'}</div>
                </div>
                {volunteerProfile.bio && (
                  <div className="mb-4 text-center text-base text-gray-700 px-2">
                    <span className="font-semibold text-primary">Bio:</span> {volunteerProfile.bio}
                  </div>
                )}
                {volunteerProfile.skills && (
                  <div className="mb-2 text-center">
                    <span className="font-semibold text-primary">Skills:</span>
                    <div className="flex flex-wrap justify-center gap-2 mt-2">
                      {volunteerProfile.skills.split(',').map((skill, idx) => (
                        <span key={idx} className="inline-block bg-primary/10 text-primary font-medium px-3 py-1 rounded-full text-sm shadow-sm border border-primary/20">
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {/* Removed raw profile data display as requested */}
              </div>
            ) : (
              <div className="text-center text-red-500 py-8">
                {volunteerProfile?.error || 'Profile not found.'}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  </div>
)}
                     
                      
                      {/* Rejected Applications */}
                      <div>
                        <h5 className="text-sm font-medium mb-2">Rejected Applications</h5>
                        {eventApplications.filter(app => app.status === 'rejected').length === 0 ? (
                          <p className="text-gray-500 text-sm">No rejected applications.</p>
                        ) : (
                          <div className="overflow-x-auto rounded-md border">
                            <table className="min-w-full bg-white">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="py-2 px-2 sm:px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volunteer ID</th>
                                  <th className="py-2 px-2 sm:px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volunteer</th>
                                  <th className="py-2 px-2 sm:px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied At</th>
                                  <th className="py-2 px-2 sm:px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {eventApplications
                                  .filter(app => app.status === 'rejected')
                                  .map(app => (
                                    <tr key={app.application_id} className="transition-colors hover:bg-red-50 bg-gray-50">
                                      <td className="py-2 px-2 sm:px-4 text-xs sm:text-sm">{app.volunteer_id}</td>
                                      <td className="py-2 px-2 sm:px-4 text-xs sm:text-sm">{app.volunteer_name}</td>
                                      <td className="py-2 px-2 sm:px-4 text-xs sm:text-sm">{app.applied_at ? new Date(app.applied_at).toLocaleDateString() : 'N/A'}</td>
                                      <td className="py-2 px-2 sm:px-4 text-xs sm:text-sm whitespace-nowrap">
                                        <button
                                          onClick={() => handleUpdateApplicationStatus(selectedEvent.event_id, app.application_id, 'approved')}
                                          className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-xs hover:bg-green-200 transition-colors"
                                        >
                                          Approve
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Feedback Modal */}
        {showFeedbackModal && selectedVolunteer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-auto my-8 overflow-hidden">
              <div className="flex justify-between items-center p-4 sm:p-6 border-b sticky top-0 bg-white z-10">
                <h3 className="text-lg font-bold truncate">
                  {isEditingFeedback 
                    ? `Edit Feedback for ${selectedVolunteer.name}` 
                    : selectedVolunteer.name 
                      ? `Provide Feedback for ${selectedVolunteer.name}` 
                      : "Provide Feedback"}
                </h3>
                <button 
                  onClick={() => setShowFeedbackModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl ml-4"
                >
                  &times;
                </button>
              </div>
              
              {isFetchingFeedback ? (
                <div className="p-4 sm:p-6 flex justify-center items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <form onSubmit={handleSubmitFeedback} className="p-4 sm:p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rating (1-5)
                  </label>
                  <select 
                    value={feedbackForm.rating}
                    onChange={e => setFeedbackForm({...feedbackForm, rating: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-primary/50"
                  >
                    <option value="1">1 - Poor</option>
                    <option value="2">2 - Fair</option>
                    <option value="3">3 - Good</option>
                    <option value="4">4 - Very Good</option>
                    <option value="5">5 - Excellent</option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hours Worked
                  </label>
                  <input 
                    type="number"
                    required
                    min="1"
                    value={feedbackForm.hours_worked}
                    onChange={e => setFeedbackForm({...feedbackForm, hours_worked: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-primary/50"
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comment
                  </label>
                  <textarea 
                    required
                    value={feedbackForm.comment}
                    onChange={e => setFeedbackForm({...feedbackForm, comment: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-primary/50"
                    rows="3"
                    placeholder="Provide feedback on volunteer's performance..."
                  />
                </div>
                
                <div className="flex justify-end">
                  <motion.button 
                    type="button"
                    onClick={() => setShowFeedbackModal(false)}
                    className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md mr-2 hover:bg-gray-300 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isSubmittingFeedback}
                  >
                    Cancel
                  </motion.button>
                  <motion.button 
                    type="submit"
                    className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition-colors flex items-center min-w-[150px] justify-center"
                    whileHover={!isSubmittingFeedback ? { scale: 1.02 } : {}}
                    whileTap={!isSubmittingFeedback ? { scale: 0.98 } : {}}
                    disabled={isSubmittingFeedback}
                  >
                    <AnimatePresence mode="wait">
                      {isSubmittingFeedback ? (
                        <SavingSpinner key="submitting" message="Submitting..." size="small" />
                      ) : (
                        <motion.span
                          key="submit"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          {isEditingFeedback ? 'Update Feedback' : 'Submit Feedback'}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
              </form>
              )}
            </div>
          </div>
        )}
        {/* Chat Modal */}
        <ChatModal 
          isOpen={showChatModal}
          onClose={() => setShowChatModal(false)}
          eventId={selectedEvent?.event_id}
          eventTitle={selectedEvent?.title}
          volunteerId={chatVolunteer?.volunteer_id}
          volunteerName={chatVolunteer?.name}
        />
        </div>
      </OrganizationSidebar>
    </div>
  );
};

export default OrganizationEvents;
