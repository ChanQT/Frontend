import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate from react-router-dom

// Import path for the profile image
import profileImage from "../assets/NEWlogo.png"; // Update this path to change the profile image

function Header() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State to control dropdown visibility
    const [isLoading, setIsLoading] = useState(false); // State to track loading status
    const navigate = useNavigate(); // Initialize useNavigate

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen); // Toggle dropdown visibility
    };

    const handleLogout = async () => {
        setIsLoading(true); // Set loading to true
        // Simulate a delay for logout (e.g., API call)
        setTimeout(() => {
            setIsLoading(false); // Set loading to false
            navigate("/"); // Redirect to the login page
        }, 2000); // Simulate a 2-second delay
    };

    

    return (
        <>
            <header className="app-header sticky" id="header">
                <div className="main-header-container container-fluid flex justify-between items-center">
                    {/* Left Section */}
                    <div className="header-content-left flex items-center">
                        <div className="header-element mx-lg-0">
                          
                        </div>
                        
                    </div>

                    {/* Right Section */}
                    <div className="header-content-right flex items-center gap-4">
                        <div className="profile-dropdown relative">
                            <button
                                className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full hover:bg-gray-200"
                                onClick={toggleDropdown} // Toggle dropdown on click
                            >
                                <img
                                    src={profileImage} // Use imported profile image
                                    alt="Admin Avatar"
                                    className="w-8 h-8 rounded-full"
                                />
                                <span className="font-medium">NITZ</span>
                                <i className="ri-arrow-down-s-line"></i>
                            </button>
                            {/* Dropdown Menu */}
                            {isDropdownOpen && ( // Show dropdown if isDropdownOpen is true
                                <div className="absolute right-0 mt-2 bg-white shadow-lg rounded-lg w-48">
                                    <ul className="py-2">
                                        {/* Logout Button */}
                                        <li>
                                            <button
                                                onClick={handleLogout} // Call handleLogout on click
                                                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 w-full text-left"
                                                disabled={isLoading} // Disable button while loading
                                            >
                                                {isLoading ? (
                                                    <span>
                                                        <i className="ri-loader-4-line animate-spin mr-2"></i> Logging out...
                                                    </span>
                                                ) : (
                                                    <span>
                                                        <i className="ri-logout-box-line mr-2"></i> Logout
                                                    </span>
                                                )}
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>
        </>
    );
}

export default Header;