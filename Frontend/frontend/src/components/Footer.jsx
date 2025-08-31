import { FiHeart, FiGithub, FiFacebook, FiTwitter, FiInstagram, FiLinkedin } from 'react-icons/fi'
import { Link } from 'react-router-dom'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-dark text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12">
          {/* Logo and Description */}
          <div className="lg:w-1/2 mb-8 lg:mb-0">
            <div className="mb-4">
              <span className="font-bold text-2xl">
                <span className="text-white">V - Connect</span>
              </span>
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">Centralized Platform for Volunteering</h2>
            <p className="text-gray-300 max-w-md">
              Connecting volunteers with meaningful opportunities to make a difference in their communities.
            </p>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 lg:w-1/2">
            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link to="/" className="text-gray-300 hover:text-white transition-colors">Home</Link></li>
                <li><Link to="/about" className="text-gray-300 hover:text-white transition-colors">About</Link></li>
                <li><Link to="/login" className="text-gray-300 hover:text-white transition-colors">Login</Link></li>
                <li><Link to="/signup" className="text-gray-300 hover:text-white transition-colors">Sign Up</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><Link to="/faqs" className="text-gray-300 hover:text-white transition-colors">FAQs</Link></li>
                <li><Link to="/privacy-policy" className="text-gray-300 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms-of-service" className="text-gray-300 hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link to="/contact" className="text-gray-300 hover:text-white transition-colors">Contact Us</Link></li>
              </ul>
            </div>

            {/* Account */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Account</h3>
              <ul className="space-y-2">
                <li><Link to="/login" className="text-gray-300 hover:text-white transition-colors">Login</Link></li>
                <li><Link to="/signup" className="text-gray-300 hover:text-white transition-colors">Sign Up</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400">
          <p className="flex items-center justify-center">
            Made by TargaryenX 
          </p>
          <p className="mt-2">
            &copy; {currentYear} V-Connect. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
