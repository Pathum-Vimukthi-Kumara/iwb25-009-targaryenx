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

      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-primary text-white py-16">
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
																								 
																								
                    className="bg-white rounded-xl shadow-md hover:shadow-lg overflow-hidden h-full flex flex-col transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="bg-red-50 p-3 flex justify-center items-center border-b border-primary/10">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-100 rounded-full flex items-center justify-center">
                        <FiHeart
                          size={24}
																						 
                          className="text-red-500 sm:text-2xl"
                        />
                      </div>
                    </div>
                    <div className="p-3 sm:p-5 flex-grow flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-base sm:text-lg font-semibold line-clamp-2">
                          {donation.title}
                        </h3>
                        <div className="flex space-x-2 ml-2"></div>
																	 
                      </div>

                      <div className="flex items-center text-primary font-medium mb-2 text-sm">
                        <FiHeart className="mr-2 text-red-500" size={16} />
                        <span>
                          Target: {formatCurrency(donation.target_amount)}
                        </span>
                      </div>

                      <p className="text-gray-600 mb-3 line-clamp-10 text-sm">
                        {donation.description}
                      </p>

                      {/* Contact Information - Highlighted */}
																	
                      <div className="border border-primary/20 p-2 sm:p-3 rounded-lg mb-2 sm:mb-3 hover:shadow-md transition-shadow">
																									
																			
																																							
																			
																		
													
																											
											 
                        <h4 className="font-medium text-primary mb-1 sm:mb-2 text-xs sm:text-sm">
                          Contact Information:
                        </h4>
                        <div className="space-y-1.5">
                          <div className="flex items-start hover:translate-x-1 transition-transform">
																												 
																								 
																													
													 
                            <FiPhone
                              className="text-primary mr-2 flex-shrink-0 mt-0.5"
                              size={14}
																			
																												 
																								 
																													
													 
                            />
                            <span className="text-xs sm:text-sm font-medium break-words">
																			 
																			
																												 
																								 
																													
													 
																																		 
                              {donation.contact_info}
                            </span>
                          </div>
																	 
											
																					
																							 
																																										
																			
																																			
																									
																																															
																																		
																				
                        </div>
																																			
																																																				 
																																																		 
                      </div>

                      <div className="mt-auto flex flex-wrap justify-between text-xs sm:text-sm gap-2">
                        <span
                          className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            donation.status === "active"
                              ? "bg-green-100 text-green-800"
                              : donation.status === "completed"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {donation.status.charAt(0).toUpperCase() +
                            donation.status.slice(1)}
                        </span>

                        <span className="text-xs sm:text-sm text-gray-500 truncate">
                          {window.innerWidth < 350 ? "Created:" : "Created:"}{" "}
                          {formatDate(donation.created_at)}
																												
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
            <div className="max-w-3xl mx-auto text-center bg-gradient-to-r from-primary to-blue-700 text-white p-8 rounded-lg">
              <motion.h2
                className="text-3xl font-bold mb-6"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false }}
                transition={{ duration: 0.4 }}
              >
                Looking for More Ways to Help?
              </motion.h2>
              <motion.p
                className="text-lg opacity-90 mb-8"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: false }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                Besides donating, you can also volunteer your time and skills to
                make a difference in your community.
              </motion.p>
              <motion.div
                className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <Link to="/">
                  <motion.button
                    className="bg-white text-primary hover:bg-gray-100 py-3 px-8 rounded-md font-medium transition-colors duration-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Back to Home
                  </motion.button>
                </Link>
                <motion.button
                  className="border border-white bg-transparent hover:bg-white/10 py-3 px-8 rounded-md text-white font-medium transition-colors duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Join as Volunteer
                </motion.button>
              </motion.div>
            </div>
          </div>
        </motion.section>
      </main>

      <Footer />
    </>
  );
};

export default AllDonations;
