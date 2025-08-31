import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { FiAward, FiPlus, FiUser, FiCalendar } from "react-icons/fi";
import LoadingSpinner from "../../components/LoadingSpinner";

const AdminBadges = () => {
  const [volunteers, setVolunteers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [badgeForm, setBadgeForm] = useState({
    badge_name: "",
    badge_description: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userType = localStorage.getItem("user_type");

    if (!token || userType !== "admin") {
      navigate("/login");
      return;
    }

    fetchVolunteers();
  }, [navigate]);

  const fetchVolunteers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");

      // Fetch users
      const usersResponse = await fetch(
        "http://localhost:9000/api/admin/users",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!usersResponse.ok) {
        throw new Error("Failed to fetch users");
      }

      const usersData = await usersResponse.json();
      const volunteerUsers = usersData.filter(
        (user) => user.user_type === "volunteer"
      );

      // Enhance each volunteer with statistics
      const enhancedVolunteers = await Promise.all(
        volunteerUsers.map(async (volunteer) => {
          try {
            // Get volunteer feedback to calculate stats
            const feedbackResponse = await fetch(
              `http://localhost:9000/pub/feedback/volunteer/${volunteer.user_id}`
            );
            let feedbackStats = { totalEvents: 0, avgRating: 0, totalHours: 0 };

            if (feedbackResponse.ok) {
              const feedbackData = await feedbackResponse.json();
              if (feedbackData.length > 0) {
                feedbackStats.totalEvents = feedbackData.length;
                const totalRating = feedbackData.reduce(
                  (sum, fb) => sum + (fb.rating || 0),
                  0
                );
                feedbackStats.avgRating = (
                  totalRating / feedbackData.length
                ).toFixed(1);
                feedbackStats.totalHours = feedbackData.reduce(
                  (sum, fb) => sum + (fb.hours_worked || 0),
                  0
                );
              }
            }

            return {
              ...volunteer,
              ...feedbackStats,
            };
          } catch (error) {
            console.error(
              `Error fetching stats for volunteer ${volunteer.user_id}:`,
              error
            );
            return {
              ...volunteer,
              totalEvents: 0,
              avgRating: 0,
              totalHours: 0,
            };
          }
        })
      );

      setVolunteers(enhancedVolunteers);
    } catch (error) {
      console.error("Error fetching volunteers:", error);
      setError("Failed to load volunteers. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAwardBadge = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:9000/api/admin/volunteers/${selectedVolunteer.user_id}/performance_badges`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            badge_name: badgeForm.badge_name,
            badge_description: badgeForm.badge_description,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to award badge");
      }

      setSuccessMessage(
        `Badge "${badgeForm.badge_name}" awarded to ${selectedVolunteer.name} successfully!`
      );
      setShowModal(false);
      setBadgeForm({ badge_name: "", badge_description: "" });

      setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
    } catch (error) {
      console.error("Error awarding badge:", error);
      setError(error.message || "Failed to award badge. Please try again.");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Not available";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  return (
    <AdminSidebar>
      <div className="w-full px-4 py-1 sm:px-6 md:px-8 lg:px-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Badge Management</h1>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 text-green-600 p-4 rounded-md mb-6">
            {successMessage}
          </div>
        )}

        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            {volunteers.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <FiUser size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 mb-4">No volunteers found.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Volunteer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Events Participated
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Avg Rating
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Hours
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {volunteers.map((volunteer) => (
                        <tr
                          key={volunteer.user_id}
                          className="hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <FiUser className="text-primary" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {volunteer.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {volunteer.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <FiCalendar className="mr-2 text-blue-500" />
                              <span className="font-medium">
                                {volunteer.totalEvents}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {volunteer.avgRating > 0 ? (
                              <div className="flex items-center">
                                <FiAward className="mr-2 text-yellow-500" />
                                <span className="font-medium">
                                  {volunteer.avgRating}/5
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-400">No ratings</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="font-medium">
                              {volunteer.totalHours}h
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                setSelectedVolunteer(volunteer);
                                setShowModal(true);
                              }}
                              className="bg-primary text-white px-3 py-1 rounded-md hover:bg-primary/90 transition-colors flex items-center"
                            >
                              <FiAward className="mr-1" />
                              Award Badge
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Award Badge Modal */}
        {showModal && selectedVolunteer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
              <div className="flex justify-between items-center p-6 border-b">
                <h3 className="text-lg font-bold">
                  Award Badge to {selectedVolunteer.name}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleAwardBadge} className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Badge Name
                  </label>
                  <input
                    type="text"
                    required
                    value={badgeForm.badge_name}
                    onChange={(e) =>
                      setBadgeForm({ ...badgeForm, badge_name: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g., Outstanding Volunteer"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Badge Description
                  </label>
                  <textarea
                    required
                    value={badgeForm.badge_description}
                    onChange={(e) =>
                      setBadgeForm({
                        ...badgeForm,
                        badge_description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows="3"
                    placeholder="Describe why this badge is being awarded..."
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition-colors flex items-center"
                  >
                    <FiAward className="mr-2" />
                    Award Badge
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminSidebar>
  );
};

export default AdminBadges;
