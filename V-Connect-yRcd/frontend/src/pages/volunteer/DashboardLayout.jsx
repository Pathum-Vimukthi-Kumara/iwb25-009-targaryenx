import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiHome, FiUsers, FiCalendar, FiUser, FiLogOut, 
  FiSettings, FiPlusCircle, FiHeart, FiAward, FiMenu, FiX, FiAlertCircle 
} from 'react-icons/fi';

const DashboardLayout = ({ children, userType = 'volunteer' }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Function to handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userType');
    navigate('/login');
  };
  
  // Define menu items based on user type
  const getMenuItems = () => {
    switch(userType) {
      case 'volunteer':
        return [
          { 
            path: '/volunteer-dashboard', 
            icon: <FiHome size={20} />, 
            label: 'Dashboard',
            description: 'View available events and opportunities'
          },
          
          { 
            path: '/volunteer-events', 
            icon: <FiCalendar size={20} />, 
            label: 'My Events',
            description: 'Track your event applications and participation'
          },
          { 
            path: '/volunteer-profile', 
            icon: <FiUser size={20} />, 
            label: 'Profile',
            description: 'Manage your volunteer profile'
          },
          { 
            path: '/volunteer-badges', 
            icon: <FiAward size={20} />, 
            label: 'Badges',
            description: 'View your earned badges and achievements'
          },
          { 
            path: '/volunteer-feedback', 
            icon: <FiAlertCircle size={20} />, 
            label: 'Feedback',
            description: 'View feedback received from organizations'
          }
        ];
      case 'organization':
        return [
          { 
            path: '/organization-dashboard', 
            icon: <FiHome size={20} />, 
            label: 'Dashboard',
            description: 'Monitor your organization activity'
          },
          { 
            path: '/organization-events', 
            icon: <FiCalendar size={20} />, 
            label: 'Events',
            description: 'Manage your events and participation'
          },
          { 
            path: '/organization-volunteers', 
            icon: <FiUsers size={20} />, 
            label: 'Volunteers',
            description: 'View and manage volunteer requests'
          },
          { 
            path: '/create-event', 
            icon: <FiPlusCircle size={20} />, 
            label: 'Create Event',
            description: 'Create new volunteer events'
          },
          { 
            path: '/my-donations', 
            icon: <FiHeart size={20} />, 
            label: 'My Donations',
            description: 'Manage your donation campaigns'
          },
          { 
            path: '/create-donation', 
            icon: <FiPlusCircle size={20} />, 
            label: 'Create Donation',
            description: 'Start a donation campaign'
          },
          { 
            path: '/organization-profile', 
            icon: <FiUser size={20} />, 
            label: 'Profile',
            description: 'Manage your organization profile'
          }
          
        ];
      case 'admin':
        return [
          { 
            path: '/admin-dashboard', 
            icon: <FiHome size={20} />, 
            label: 'Dashboard',
            description: 'Platform overview and statistics'
          },
          { 
            path: '/admin-users', 
            icon: <FiUsers size={20} />, 
            label: 'Users',
            description: 'Manage platform users'
          },
          { 
            path: '/admin-events', 
            icon: <FiCalendar size={20} />, 
            label: 'Events',
            description: 'Review and manage events'
          },
          { 
            path: '/admin-badges', 
            icon: <FiAward size={20} />, 
            label: 'Badges',
            description: 'Assign and manage badges'
          },
          { 
            path: '/admin-settings', 
            icon: <FiSettings size={20} />, 
            label: 'Settings',
            description: 'Platform configuration'
          }
        ];
      default:
        return [];
    }
  };
  
  const menuItems = getMenuItems();
  
  // Animation variants
  const sidebarVariants = {
    open: { width: 280, transition: { duration: 0.3 } },
    closed: { width: 80, transition: { duration: 0.3 } },
    mobileOpen: { x: 0, transition: { duration: 0.3 } },
    mobileClosed: { x: '-100%', transition: { duration: 0.3 } }
  };
  
  const contentVariants = {
    sidebarOpen: { marginLeft: 280, transition: { duration: 0.3 } },
    sidebarClosed: { marginLeft: 80, transition: { duration: 0.3 } }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-40">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-white p-2 rounded-md shadow-md text-primary"
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>
      
      {/* Mobile Sidebar */}
      <motion.div 
        className="md:hidden fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg"
        variants={sidebarVariants}
        initial="mobileClosed"
        animate={isMobileMenuOpen ? "mobileOpen" : "mobileClosed"}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xl">
                <span className="text-primary">V</span>
                <span className="text-dark">-Connect</span>
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {userType.charAt(0).toUpperCase() + userType.slice(1)} Dashboard
            </p>
          </div>
          
          <nav className="mt-4 flex-grow overflow-y-auto">
            <ul className="space-y-1 px-2">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link 
                    to={item.path} 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      currentPath === item.path 
                        ? 'bg-primary/10 text-primary font-medium' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className={`${currentPath === item.path ? 'text-primary' : 'text-gray-500'}`}>
                      {item.icon}
                    </div>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
            >
              <FiLogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </motion.div>
      
      {/* Desktop Sidebar */}
      <motion.div 
        className="hidden md:block fixed inset-y-0 left-0 z-30 bg-white shadow-lg overflow-x-hidden"
        variants={sidebarVariants}
        initial="open"
        animate={isSidebarOpen ? "open" : "closed"}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-xl">
                <span className="text-primary">V</span>
                <span className={`text-dark ${!isSidebarOpen ? 'hidden' : 'inline'}`}>-Connect</span>
              </span>
            </div>
            {isSidebarOpen && (
              <p className="text-sm text-gray-500 mt-1">
                {userType.charAt(0).toUpperCase() + userType.slice(1)} Dashboard
              </p>
            )}
          </div>
          
          <nav className="mt-4 flex-grow overflow-y-auto">
            <ul className="space-y-1 px-2">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link 
                    to={item.path} 
                    className={`flex items-center ${isSidebarOpen ? 'space-x-3' : 'justify-center'} px-4 py-3 rounded-lg transition-colors ${
                      currentPath === item.path 
                        ? 'bg-primary/10 text-primary font-medium' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className={`${currentPath === item.path ? 'text-primary' : 'text-gray-500'}`}>
                      {item.icon}
                    </div>
                    {isSidebarOpen && <span>{item.label}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className={`flex items-center ${isSidebarOpen ? 'space-x-3' : 'justify-center'} w-full px-4 py-3 rounded-lg text-red-500 hover:bg-red-50 transition-colors`}
            >
              <FiLogOut size={20} />
              {isSidebarOpen && <span>Logout</span>}
            </button>
          </div>
          
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="flex items-center justify-center w-full p-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {isSidebarOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              )}
            </button>
          </div>
        </div>
      </motion.div>
      
      {/* Main Content */}
      <motion.main 
        className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50"
        variants={contentVariants}
        initial="sidebarOpen"
        animate={isSidebarOpen ? "sidebarOpen" : "sidebarClosed"}
        transition={{ duration: 0.3 }}
      >
        <div className="md:hidden h-16"></div> {/* Space for mobile header */}
        <div className="container px-4 py-6 md:px-6 md:py-8">
          {children}
        </div>
      </motion.main>
    </div>
  );
};

export default DashboardLayout;
