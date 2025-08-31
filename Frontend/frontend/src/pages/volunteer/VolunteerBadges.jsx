import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiAward, FiCalendar, FiUser } from 'react-icons/fi'
import DashboardLayout from './DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';

const VolunteerBadges = () => {
  const [badges, setBadges] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchBadges = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const token = localStorage.getItem('token')
        const user_id = localStorage.getItem('user_id')
        
        if (!token) {
          throw new Error('Authentication required')
        }
        
        // Fetch volunteer badges
        const response = await fetch(`http://localhost:9000/api/volunteers/${user_id}/badges`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
         
        if (response.ok) {
          const data = await response.json()
          setBadges(data.data || data || [])
        }
        } catch (err) {
          console.error('Error fetching badges:', err)
          setError('Using sample data')
        } finally {
          setIsLoading(false)
        }
    }
    
    fetchBadges()
  }, [])

  // Format date function
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  // Get badge color based on badge name
  const getBadgeColor = (badgeName) => {
    if (badgeName.toLowerCase().includes('bronze')) return 'bg-orange-100 text-orange-600'
    if (badgeName.toLowerCase().includes('silver')) return 'bg-gray-100 text-gray-600'
    if (badgeName.toLowerCase().includes('gold')) return 'bg-yellow-100 text-yellow-600'
    if (badgeName.toLowerCase().includes('environmental')) return 'bg-green-100 text-green-600'
    return 'bg-blue-100 text-blue-600'
  }

  return (
    <DashboardLayout userType="volunteer">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">My Badges</h1>
        <p className="text-gray-600">View all the badges you've earned through your volunteer work.</p>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Badge Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <FiAward className="text-primary text-2xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Total Badges</p>
                  <p className="text-2xl font-bold">{badges.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-lg">
                  <FiCalendar className="text-green-600 text-2xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Latest Badge</p>
                  <p className="text-lg font-semibold">
                    {badges.length > 0 ? formatDate(badges[badges.length - 1].earned_date) : 'None'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <FiUser className="text-yellow-600 text-2xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500">Achievement Level</p>
                  <p className="text-lg font-semibold">
                    {badges.length >= 5 ? 'Expert' : badges.length >= 3 ? 'Advanced' : badges.length >= 1 ? 'Beginner' : 'New'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Badges Grid */}
          {badges.length > 0 ? (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {badges.map((badge, index) => (
                <motion.div
                  key={badge.badge_id}
                  className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                  <div className="text-center mb-4">
                    <div className={`inline-flex p-4 rounded-full ${getBadgeColor(badge.badge_name)} mb-4`}>
                      <FiAward size={32} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{badge.badge_name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{badge.badge_description}</p>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>Earned on:</span>
                      <span className="font-medium">{formatDate(badge.earned_date)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-16">
              <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
                <FiAward className="text-gray-400 text-4xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Badges Yet</h3>
              <p className="text-gray-600 mb-6">Start volunteering to earn your first badge!</p>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  )
}

export default VolunteerBadges