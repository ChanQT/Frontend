import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const Settings: React.FC = () => {
    const navigate = useNavigate();
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setProfileImage(ev.target?.result as string);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    return (
        <div className="container mx-auto p-6">
            {/* Back to Dashboard Button */}
            <button
                onClick={() => navigate("/dashboard")}
                className="mb-6 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
                <i className="ri-arrow-left-line mr-2"></i> Back to Dashboard
            </button>

            <h1 className="text-2xl font-bold mb-6">Settings</h1>
            <div className="grid grid-cols-12 gap-6">
                {/* Left Section: Account Information */}
                <div className="col-span-3 bg-white shadow-md rounded-lg p-6">
                    <div className="flex flex-col items-center">
                        {/* Profile Image */}
                        <div
                            className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center mb-6 overflow-hidden cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                            title="Click to change profile picture"
                        >
                            {profileImage ? (
                                <img
                                    src={profileImage}
                                    alt="Profile"
                                    className="object-cover w-full h-full"
                                />
                            ) : (
                                <i className="ri-user-line text-5xl text-gray-500"></i>
                            )}
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            style={{ display: "none" }}
                            onChange={handleImageChange}
                        />
                        <button
                            className="mb-4 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            Change Profile Picture
                        </button>
                        {/* Account Information */}
                        <h2 className="text-lg font-bold mb-4">Account Information</h2>
                        <div className="w-full">
                            <p className="text-sm font-medium text-gray-600">User Name</p>
                            <p className="text-base font-semibold mb-4">Nitz</p>
                        </div>
                    </div>
                </div>

                {/* Right Section: Basic Settings */}
                <div className="col-span-9 bg-white shadow-md rounded-lg p-6">
                    <h2 className="text-lg font-bold mb-4">Basic Settings</h2>
                    <div className="grid grid-cols-2 gap-6">
                        {/* Email */}
                        <div>
                            <p className="text-sm font-medium text-gray-600">Email</p>
                            <p className="text-base font-semibold">example@gmail.com</p>
                        </div>
                        {/* Phone Number */}
                        <div>
                            <p className="text-sm font-medium text-gray-600">Phone Number</p>
                            <p className="text-base font-semibold">+000000000</p>
                        </div>
                        {/* User Role */}
                        <div>
                        </div>
                        {/* Password */}
                        <div>
                            <p className="text-sm font-medium text-gray-600">Password</p>
                            <p className="text-base font-semibold">********</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;