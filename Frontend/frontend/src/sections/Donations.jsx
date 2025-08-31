import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import {
  FiArrowRight,
  FiHeart,
  FiArrowLeft,
  FiPhone,
  FiMail,
  FiGlobe,
} from "react-icons/fi";
import { Link } from "react-router-dom";

const Donations = () => {
  const [ref, inView] = useInView({
    triggerOnce: false,
    threshold: 0.1,
  });

  const [donationCampaigns, setDonationCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch donation requests from API
  useEffect(() => {
    const fetchDonationRequests = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          "http://localhost:9000/pub/donation_requests",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error(
            "Response is not JSON - backend may not be running correctly"
          );
        }

        const data = await response.json();
        // Limit to 6 cards for the carousel
        setDonationCampaigns(data.slice(0, 6));
        setError(null);
      } catch (error) {
        console.error("Error fetching donation requests:", error);
        setError("Failed to load donation requests.");
        // Use fallback data if API fails
        setDonationCampaigns([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDonationRequests();
  }, []);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date to show days ago
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays === 0 ? "Today" : `${diffDays} days ago`;
  };

  // For slider functionality
  const [startIndex, setStartIndex] = useState(0);
  const cardsToShow =
    window?.innerWidth >= 1024 ? 3 : window?.innerWidth >= 768 ? 2 : 1;

  const handleNext = () => {
    if (startIndex + cardsToShow < donationCampaigns.length) {
      setStartIndex(startIndex + 1);
    }
  };

  const handlePrev = () => {
    if (startIndex > 0) {
      setStartIndex(startIndex - 1);
    }
  };

  return (
    <section id="donations" className="py-20 scroll-section bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="section-title">
            Support Our <span className="text-primary">Causes</span>
          </h2>
          <p className="section-subtitle">
            Organizations in our network are working on important causes that
            need your support. Your donation can make a real difference in these
            community-driven initiatives.
          </p>
          <p className="text-center text-gray-600 mb-8">
            <em>
              Note: Organizations can create donation campaigns by posting to
              the landing page. Contact information is provided for those
              interested in donating.
            </em>
          </p>
        </motion.div>

        {/* Donations slider */}
        {isLoading ? (
          <div className="mt-12 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="mt-12 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        ) : donationCampaigns.length === 0 ? (
          <div className="mt-12 text-center">
            <p className="text-gray-600">
              No donation requests available at the moment.
            </p>
          </div>
        ) : (
          <div className="mt-12 relative">
            <div className="overflow-hidden">
              <motion.div
                className="flex transition-all duration-500 ease-in-out"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  x: `-${startIndex * (100 / cardsToShow)}%`,
                }}
                transition={{ duration: 0.5 }}
              >
                {donationCampaigns.map((campaign, index) => (
                  <motion.div
                    key={campaign.request_id}
                    className="w-full md:w-1/2 lg:w-1/3 flex-shrink-0 p-3"
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.3 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <motion.div
                      className="bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:-translate-y-1 h-full"
                      whileHover={{ y: -5 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 15,
                      }}
                    >
                      <div className="p-6 h-full flex flex-col">
                        <div className="flex justify-between items-center mb-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            campaign.status === 'active' ? 'bg-green-100 text-green-700' : 
                            campaign.status === 'completed' ? 'bg-blue-100 text-blue-700' : 
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                          </span>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
                          {campaign.title}
                        </h3>
                        
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {campaign.description}
                        </p>
                        
                        <div className="bg-red-50 rounded-lg p-3 mb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">Target</span>
                            <span className="text-lg font-bold text-red-600">
                              {formatCurrency(campaign.target_amount)}
                            </span>
                          </div>
                        </div>
                        
                        {/* Campaign Details - Highlighted Section */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">Campaign Details</h4>
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs text-gray-500">Contact</p>
                              <p className="text-sm font-semibold text-gray-800">
                                {campaign.contact_info}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-auto">
                          <span className="text-xs text-gray-500">
                            Created: {formatDate(campaign.created_at)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Navigation buttons */}
            <motion.button
              onClick={handlePrev}
              disabled={startIndex === 0}
              className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 bg-white p-3 rounded-full shadow-lg z-10 ${
                startIndex === 0
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-100"
              }`}
              whileHover={startIndex !== 0 ? { scale: 1.1, x: -12 } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              aria-label="Previous campaign"
            >
              <FiArrowLeft className="text-primary" />
            </motion.button>

            <motion.button
              onClick={handleNext}
              disabled={startIndex + cardsToShow >= donationCampaigns.length}
              className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 bg-white p-3 rounded-full shadow-lg z-10 ${
                startIndex + cardsToShow >= donationCampaigns.length
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-100"
              }`}
              whileHover={
                startIndex + cardsToShow < donationCampaigns.length
                  ? { scale: 1.1, x: 12 }
                  : {}
              }
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              aria-label="Next campaign"
            >
              <FiArrowRight className="text-primary" />
            </motion.button>
          </div>
        )}

        {/* Show More Button */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          transition={{ duration: 0.35 }}
        >
          <Link to="/donations">
            <motion.button
              className="bg-white border border-primary text-primary hover:bg-primary/5 px-8 py-3 rounded-md flex items-center mx-auto font-medium transition-colors duration-300"
              whileHover={{ scale: 1.02, x: 3 }}
              whileTap={{ scale: 0.98 }}
            >
              View All Causes <FiArrowRight className="ml-2" />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default Donations;
