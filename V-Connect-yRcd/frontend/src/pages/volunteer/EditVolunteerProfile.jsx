import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';

const EditVolunteerProfile = ({ profile, onClose, onSave }) => {
  const defaultSkills = [
    'Event Planning', 'Teaching/Tutoring', 'Fundraising', 'Community Outreach',
    'Administrative Support', 'Social Media Management', 'Photography', 'Graphic Design',
    'Public Speaking', 'Leadership', 'Project Management', 'Customer Service',
    'Data Entry', 'Research', 'Writing/Editing', 'Translation',
    'Healthcare Support', 'Environmental Conservation', 'Animal Care', 'Food Service'
  ];

  const [formData, setFormData] = useState({
    name: '',
    skills: '',
    bio: '',
    profile_photo: ''
  });

  const [selectedSkills, setSelectedSkills] = useState([]);
  const [customSkill, setCustomSkill] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  useEffect(() => {
    if (profile) {
      const skillsArray = profile.skills ? profile.skills.split(',').map(s => s.trim()) : [];
      setSelectedSkills(skillsArray);
      setFormData({
        name: profile.name || '',
        skills: profile.skills || '', 
        bio: profile.bio || '',
        profile_photo: profile.profile_photo || ''
      });
    }
  }, [profile]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSkillToggle = (skill) => {
    setSelectedSkills(prev => {
      const updated = prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill];
      setFormData(prevForm => ({ ...prevForm, skills: updated.join(', ') }));
      return updated;
    });
  };

  const handleCustomSkillAdd = () => {
    if (customSkill.trim() && !selectedSkills.includes(customSkill.trim())) {
      const updated = [...selectedSkills, customSkill.trim()];
      setSelectedSkills(updated);
      setFormData(prev => ({ ...prev, skills: updated.join(', ') }));
      setCustomSkill('');
      setShowCustomInput(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('image', file);
      
      try {
        const response = await fetch('http://localhost:9000/api/contact/upload_photo', {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          const result = await response.json();
          setFormData(prev => ({ ...prev, profile_photo: result.photoUrl }));
        }
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }
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
        bio: formData.bio,
        skills: formData.skills,
        profile_photo: formData.profile_photo
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
      console.log('Updated profile response:', updatedProfile);
      onSave(updatedProfile);
      alert("Profile updated successfully");
      localStorage.setItem("profile", JSON.stringify(updatedProfile));
      onClose();
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
              <label htmlFor="profile_photo" className="block text-gray-700 font-medium mb-2">Profile Photo</label>
              <input type="file" id="profile_photo" accept="image/*" onChange={handleFileChange} className="w-full px-3 py-2 border rounded-md" />
              {formData.profile_photo && (
                <p className="text-sm text-gray-500 mt-1">Current: {formData.profile_photo}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Skills</label>
              <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {defaultSkills.map(skill => (
                    <label key={skill} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedSkills.includes(skill)}
                        onChange={() => handleSkillToggle(skill)}
                        className="rounded accent-primary"
                      />
                      <span className="text-sm">{skill}</span>
                    </label>
                  ))}
                </div>
                <div className="border-t pt-2">
                  {!showCustomInput ? (
                    <button
                      type="button"
                      onClick={() => setShowCustomInput(true)}
                      className="text-primary text-sm hover:underline"
                    >
                      + Add custom skill
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={customSkill}
                        onChange={(e) => setCustomSkill(e.target.value)}
                        placeholder="Enter custom skill"
                        className="flex-1 px-2 py-1 border rounded text-sm"
                        onKeyPress={(e) => e.key === 'Enter' && handleCustomSkillAdd()}
                      />
                      <button
                        type="button"
                        onClick={handleCustomSkillAdd}
                        className="px-2 py-1 bg-primary text-white rounded text-sm"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowCustomInput(false); setCustomSkill(''); }}
                        className="px-2 py-1 border rounded text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {selectedSkills.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 mb-1">Selected skills:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedSkills.map(skill => (
                      <span key={skill} className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
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
