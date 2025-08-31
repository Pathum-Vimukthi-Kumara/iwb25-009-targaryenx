import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FiHeart,
  FiPhone,
  FiMail,
  FiGlobe,
  FiArrowRight,
  FiArrowLeft,
  FiEdit,
  FiTrash2,
} from "react-icons/fi";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import LoadingSpinner from "../components/LoadingSpinner";

const AllDonations = () => {
  const [donationRequests, setDonationRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scrollY, setScrollY] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentDonation, setCurrentDonation] = useState(null);
  const [donationForm, setDonationForm] = useState({
    title: "",
    description: "",
    target_amount: "",
    contact_info: "",
    status: "active",
  });

  const itemsPerPage = 6;
  const totalPages = Math.ceil(donationRequests.length / itemsPerPage);

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

      // Check if response is actually JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(
          "Response is not JSON - backend may not be running correctly"
        );
								 
									 
									 
								
																	 
																				 
																			
      }

      const data = await response.json();
      setDonationRequests(data);
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error("Error fetching donation requests:", error);
      setError("Failed to load donation requests. Please try again later.");
    } finally {
      setIsLoading(false);
									 
								
																	 
																				
																				
    }
  };

  useEffect(() => {
    fetchDonationRequests();
  }, []);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "LKR",
    }).format(amount);
  };
																							 
			 
			
		 
						
																		
																					 
																																																													 
																																																																																																													
								 
									 
									 
								
																	 
																				 
																						 
			 
			
		 
						
																			 
																		
																																																													 
																																																																																															 
								 
									 
									 
								
																	 
																				
																			 
			 
		 
	 

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = donationRequests.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <Navbar scrollY={scrollY} />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="bg-primary text-white py-12">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center">
              <motion.h1
                className="text-4xl font-bold mb-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Donation Campaigns
              </motion.h1>
              <motion.p
                className="text-lg text-blue-100"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Browse all current donation campaigns from our partner
                organizations and support causes you believe in.
              </motion.p>
            </div>
          </div>
        </section>

        {/* Campaigns Grid */}
        <section className="py-16">
          <div className="container mx-auto px-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <div className="text-red-600 mb-4">{error}</div>
                <button
                  onClick={fetchDonationRequests}
                  className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : donationRequests.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-gray-600 mb-4">
                  No donation requests found.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {currentItems.map((donation, index) => (
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
                            <p className="text-xs text-gray-500">Contact</p>
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
                      </div>
                    </div>
                  </div>
												
														 
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && donationRequests.length > 0 && (
              <div className="flex justify-center mt-12">
                <nav className="flex items-center space-x-2">
                  <button
                    onClick={() => currentPage > 1 && paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-md ${
                      currentPage === 1
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-primary hover:bg-primary/10"
                    }`}
                    aria-label="Previous page"
                  >
                    <FiArrowLeft />
                  </button>

                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => paginate(i + 1)}
                      className={`w-10 h-10 rounded-md flex items-center justify-center ${
                        currentPage === i + 1
                          ? "bg-primary text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    onClick={() =>
                      currentPage < totalPages && paginate(currentPage + 1)
                    }
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-md ${
                      currentPage === totalPages
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-primary hover:bg-primary/10"
                    }`}
                    aria-label="Next page"
                  >
                    <FiArrowRight />
                  </button>
                </nav>
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <motion.section
          className="py-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: false }}
          transition={{ duration: 0.5 }}
        >
          <div className="container mx-auto px-6">
            <motion.div
              className="text-center bg-primary text-white py-12 px-4 rounded-2xl"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.3 }}
              transition={{ duration: 0.8 }}
            >
              <h3 className="text-2xl md:text-3xl font-bold mb-4">Looking for More Ways to Help?</h3>
              <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
                Besides donating, you can also volunteer your time and skills to
                make a difference in your community.
              </p>
              <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <Link to="/">
                  <motion.button 
                    className="bg-white text-primary hover:bg-gray-100 py-3 px-8 rounded-md font-medium transition-colors duration-300"
                    whileHover={{ scale: 1.05, boxShadow: "0px 5px 15px rgba(255, 255, 255, 0.3)" }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Back to Home
                  </motion.button>
                </Link>
                <motion.button 
                  className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary py-3 px-8 rounded-md font-medium transition-colors duration-300"
                  whileHover={{ scale: 1.05, boxShadow: "0px 5px 15px rgba(255, 255, 255, 0.2)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  Join as Volunteer
                </motion.button>
              </div>
            </motion.div>
          </div>
        </motion.section>
      </main>
<<<<<<< Updated upstream

=======
    
>>>>>>> Stashed changes
      <Footer />
    </>
  );
};

export default AllDonations;
