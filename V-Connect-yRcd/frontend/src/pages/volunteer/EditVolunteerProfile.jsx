import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';

const EditVolunteerProfile = ({ profile, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    skills: '',
    bio: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        skills: profile.skills || '', 
        bio: profile.bio || ''
      });
    }
  }, [profile]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const user_id = localStorage.getItem('user_id');

      if (!token) throw new Error('Authentication required');

      const apiData = {
        name: formData.name,
        skills: formData.skills,
        bio: formData.bio
      };

      const response = await fetch(`http://localhost:9000/api/volunteers/${user_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const updatedProfile = await response.json();
      onSave(updatedProfile);
      localStorage.setItem("profile", JSON.stringify(updatedProfile));
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Edit Profile</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <FiX size={24} />
            </button>
          </div>

          {error && (
            <div className="bg-red-50 p-4 rounded-lg mb-6">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-gray-700 font-medium mb-2">Full Name</label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" required />
            </div>

            <div className="mb-4">
              <label htmlFor="skills" className="block text-gray-700 font-medium mb-2">Skills</label>
              <input type="text" id="skills" name="skills" value={formData.skills} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
            </div>

            <div className="mb-6">
              <label htmlFor="bio" className="block text-gray-700 font-medium mb-2">Bio</label>
              <textarea id="bio" name="bio" value={formData.bio} onChange={handleChange} rows={4} className="w-full px-3 py-2 border rounded-md"></textarea>
            </div>

            <div className="flex justify-end space-x-3">
              <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditVolunteerProfile;
