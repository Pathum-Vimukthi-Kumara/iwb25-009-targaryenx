import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { FiUserPlus, FiSearch, FiCalendar, FiCheck, FiArrowRight, FiEdit, FiUsers, FiFileText, FiMonitor, FiClock, FiDownload } from 'react-icons/fi'
import { Link } from 'react-router-dom'

const HowToUse = () => {
  const [ref, inView] = useInView({
    triggerOnce: false,
    threshold: 0.1,
  })
  const [activeTab, setActiveTab] = useState('volunteers')
  
  // Define staggered animation variants with refined motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08, // Further reduced stagger interval
        delayChildren: 0.15
      }
    }
  }
  
  const itemVariants = {
    hidden: { y: 6, opacity: 0 }, // Further reduced translation distance
    visible: {
      y: 0,
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 24, 
        duration: 0.3  // Further reduced duration
      }
    }
  }
  
  // Refined motion variants for organizations section
  const orgItemVariants = {
    hidden: { y: 6, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 24, 
        duration: 0.3
      }
    }
  }

  const volunteerWorkflow = [
    {
      icon: <FiUserPlus className="text-white text-3xl" />,
      title: "Sign Up & Profile",
      description: "Create your volunteer profile, add your skills, interests, and availability to get personalized opportunities.",
      color: "bg-primary"
    },
    {
      icon: <FiSearch className="text-white text-3xl" />,
      title: "Browse & Apply",
      description: "Find volunteering opportunities that match your interests, skills, and schedule, then apply directly.",
      color: "bg-accent"
    },
    {
      icon: <FiCalendar className="text-white text-3xl" />,
      title: "Participate & Serve",
      description: "Attend orientation sessions, complete required training, and fulfill your volunteer commitments.",
      color: "bg-primary"
    },
    {
      icon: <FiFileText className="text-white text-3xl" />,
      title: "Track & Verify",
      description: "Log your hours, get them verified by organizations, and build your volunteer portfolio with impact metrics.",
      color: "bg-accent"
    }
  ]
  
  const organizationWorkflow = [
    {
      icon: <FiUserPlus className="text-white text-3xl" />,
      title: "Register & Verify",
      description: "Register your organization, provide necessary documentation, and get verified by our admin team.",
      color: "bg-accent"
    },
    {
      icon: <FiEdit className="text-white text-3xl" />,
      title: "Create Events",
      description: "Create public or private events, set requirements, and manage volunteer applications all in one place.",
      color: "bg-primary"
    },
    {
      icon: <FiUsers className="text-white text-3xl" />,
      title: "Manage Volunteers",
      description: "Screen applications, approve volunteers, track attendance, and communicate with your volunteer team.",
      color: "bg-accent"
    },
    {
      icon: <FiCheck className="text-white text-3xl" />,
      title: "Track & Report",
      description: "Track volunteer hours, generate reports, and manage your organization's impact metrics effortlessly.",
      color: "bg-primary"
    }
  ]
  
  const adminWorkflow = [
    {
      icon: <FiMonitor className="text-white text-3xl" />,
      title: "Platform Management",
      description: "Monitor and manage platform activity, user accounts, and ensure everything runs smoothly.",
      color: "bg-primary"
    },
    {
      icon: <FiUserPlus className="text-white text-3xl" />,
      title: "Organization Verification",
      description: "Review documentation and verify organizations to ensure legitimacy and build user trust.",
      color: "bg-accent"
    },
    {
      icon: <FiClock className="text-white text-3xl" />,
      title: "Event Approval",
      description: "Review and approve events created by organizations to ensure they meet community standards.",
      color: "bg-primary"
    },
    {
      icon: <FiDownload className="text-white text-3xl" />,
      title: "Analytics & Reporting",
      description: "Generate platform-wide reports, track growth metrics, and provide insights to stakeholders.",
      color: "bg-accent"
    }
  ]

  return (
    <section id="how-to-use" className="py-20 bg-gray-50 scroll-section">
      <div className="container mx-auto px-4">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="section-title">How to Use <span className="text-primary">V-Connect</span></h2>
          <p className="section-subtitle">
            Getting started with V-Connect is easy. Follow these simple steps to begin your volunteering journey
            or to enhance your organization's volunteer management.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-white rounded-full p-1 border shadow-sm">
            <button
              onClick={() => setActiveTab('volunteers')}
              className={`px-5 py-2 rounded-full transition-all duration-300 ${
                activeTab === 'volunteers' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              For Volunteers
            </button>
            <button
              onClick={() => setActiveTab('organizations')}
              className={`px-5 py-2 rounded-full transition-all duration-300 ${
                activeTab === 'organizations' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              For Organizations
            </button>
            <button
              onClick={() => setActiveTab('admins')}
              className={`px-5 py-2 rounded-full transition-all duration-300 ${
                activeTab === 'admins' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              For Admins
            </button>
          </div>
        </div>

        {/* Workflow Steps */}
        <div className="mt-8 relative">
          {activeTab === 'volunteers' && (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              key="volunteers"
            >
              {volunteerWorkflow.map((step, index) => (
                <motion.div
                  key={index}
                  className="relative z-10"
                  variants={itemVariants}
                >
                  <div className="flex flex-col items-center p-6 hover:shadow-md rounded-lg bg-white transition-shadow duration-300">
                    <div className="relative">
                      <motion.div 
                        className={`${step.color} w-16 h-16 rounded-full flex items-center justify-center mb-5 shadow-md`}
                        whileHover={{ 
                          scale: 1.08,
                          rotate: [0, -3, 3, -3, 0],
                          transition: { 
                            rotate: { repeat: 0, duration: 0.4 },
                            scale: { duration: 0.2 }
                          }
                        }}
                      >
                        {step.icon}
                      </motion.div>
                      <motion.div
                        className="absolute -top-1 -right-1 bg-white rounded-full w-7 h-7 flex items-center justify-center border border-gray-100 font-bold text-accent"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + index * 0.15, duration: 0.25, type: "spring" }}
                      >
                        {index + 1}
                      </motion.div>
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-center">{step.title}</h3>
                    <p className="text-gray-600 text-center">{step.description}</p>
                    
                    {index < volunteerWorkflow.length - 1 && (
                      <motion.div 
                        className="hidden lg:flex absolute -right-4 top-1/2 transform -translate-y-1/2 z-10"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                      >
                        <FiArrowRight className="text-accent text-2xl" />
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === 'organizations' && (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              key="organizations"
            >
              {organizationWorkflow.map((step, index) => (
                <motion.div
                  key={index}
                  className="relative z-10"
                  variants={itemVariants}
                >
                  <div className="flex flex-col items-center p-6 hover:shadow-md rounded-lg bg-white transition-shadow duration-300">
                    <div className="relative">
                      <motion.div 
                        className={`${step.color} w-16 h-16 rounded-full flex items-center justify-center mb-5 shadow-md`}
                        whileHover={{ 
                          scale: 1.08,
                          rotate: [0, -3, 3, -3, 0],
                          transition: { 
                            rotate: { repeat: 0, duration: 0.4 },
                            scale: { duration: 0.2 }
                          }
                        }}
                      >
                        {step.icon}
                      </motion.div>
                      <motion.div
                        className="absolute -top-1 -right-1 bg-white rounded-full w-7 h-7 flex items-center justify-center border border-gray-100 font-bold text-accent"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + index * 0.15, duration: 0.25, type: "spring" }}
                      >
                        {index + 1}
                      </motion.div>
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-center">{step.title}</h3>
                    <p className="text-gray-600 text-center">{step.description}</p>
                    
                    {index < organizationWorkflow.length - 1 && (
                      <motion.div 
                        className="hidden lg:flex absolute -right-4 top-1/2 transform -translate-y-1/2 z-10"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                      >
                        <FiArrowRight className="text-accent text-2xl" />
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === 'admins' && (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              key="admins"
            >
              {adminWorkflow.map((step, index) => (
                <motion.div
                  key={index}
                  className="relative z-10"
                  variants={itemVariants}
                >
                  <div className="flex flex-col items-center p-6 hover:shadow-md rounded-lg bg-white transition-shadow duration-300">
                    <div className="relative">
                      <motion.div 
                        className={`${step.color} w-16 h-16 rounded-full flex items-center justify-center mb-5 shadow-md`}
                        whileHover={{ 
                          scale: 1.08,
                          rotate: [0, -3, 3, -3, 0],
                          transition: { 
                            rotate: { repeat: 0, duration: 0.4 },
                            scale: { duration: 0.2 }
                          }
                        }}
                      >
                        {step.icon}
                      </motion.div>
                      <motion.div
                        className="absolute -top-1 -right-1 bg-white rounded-full w-7 h-7 flex items-center justify-center border border-gray-100 font-bold text-accent"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + index * 0.15, duration: 0.25, type: "spring" }}
                      >
                        {index + 1}
                      </motion.div>
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-center">{step.title}</h3>
                    <p className="text-gray-600 text-center">{step.description}</p>
                    
                    {index < adminWorkflow.length - 1 && (
                      <motion.div 
                        className="hidden lg:flex absolute -right-4 top-1/2 transform -translate-y-1/2 z-10"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                      >
                        <FiArrowRight className="text-accent text-2xl" />
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
        
        {/* CTA */}
        <motion.div
          className="mt-20 text-center bg-gradient-to-r from-primary to-blue-700 text-white p-8 rounded-lg"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.45 }}
          whileHover={{ 
            boxShadow: "0 10px 20px -8px rgba(0, 90, 255, 0.15)",
            scale: 1.002
          }}
        >
          <motion.h3 
            className="text-2xl md:text-3xl font-bold mb-4"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false }}
            transition={{ duration: 0.35, delay: 0.15 }}
          >
            Ready to Get Started?
          </motion.h3>
          <motion.p 
            className="text-lg opacity-90 mb-8 max-w-xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false }}
            transition={{ duration: 0.35, delay: 0.2 }}
          >
            Join our community of volunteers and organizations making a difference in communities around the world.
          </motion.p>
          <motion.div 
            className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false }}
          >
            <motion.button 
              className="bg-white text-primary hover:bg-gray-100 py-3 px-8 rounded-md font-medium transition-colors duration-300"
              whileHover={{ 
                scale: 1.02, 
                boxShadow: "0 3px 6px -2px rgba(255, 255, 255, 0.15)"
              }}
              whileTap={{ scale: 0.98 }}
              variants={itemVariants}
            >
              Sign Up Now
            </motion.button>
            <Link to="/learn-more">
              <motion.button 
                className="border border-white bg-transparent hover:bg-white/10 py-3 px-8 rounded-md font-medium transition-colors duration-300"
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: "0 3px 6px -2px rgba(255, 255, 255, 0.08)"
                }}
                whileTap={{ scale: 0.98 }}
                variants={itemVariants}
              >
                Learn More
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowToUse;
