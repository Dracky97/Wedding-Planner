import React from 'react';
import { Link } from 'react-router-dom';

const AboutUs = () => {
    return (
        <div className="min-h-screen bg-rose-50">
            {/* Navigation */}
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link to="/" className="text-2xl font-bold text-rose-900">
                            Wedding Planner
                        </Link>
                        <div className="flex space-x-4">
                            <Link to="/" className="text-gray-600 hover:text-rose-600 px-3 py-2 rounded-md text-sm font-medium">
                                Home
                            </Link>
                            <Link to="/about" className="text-rose-600 px-3 py-2 rounded-md text-sm font-medium">
                                About Us
                            </Link>
                            <Link to="/privacy" className="text-gray-600 hover:text-rose-600 px-3 py-2 rounded-md text-sm font-medium">
                                Privacy Policy
                            </Link>
                            <Link to="/blog" className="text-gray-600 hover:text-rose-600 px-3 py-2 rounded-md text-sm font-medium">
                                Blog
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="bg-white">
                <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
                            About Us
                        </h1>
                        <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                            Making wedding planning simple, beautiful, and stress-free for couples worldwide.
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
                        <p className="text-gray-600 mb-4">
                            Wedding Planner was born from a simple idea: planning a wedding shouldn't be overwhelming.
                            We believe that every couple deserves to focus on what matters most - celebrating their love -
                            while we handle the details.
                        </p>
                        <p className="text-gray-600 mb-4">
                            Founded by a team of wedding enthusiasts and tech experts, we've created a platform that
                            combines the beauty of traditional planning with the convenience of modern technology.
                        </p>
                        <p className="text-gray-600">
                            Our mission is to make wedding planning accessible, collaborative, and enjoyable for everyone,
                            regardless of budget or experience level.
                        </p>
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-6">What We Offer</h2>
                        <ul className="space-y-4">
                            <li className="flex items-start">
                                <div className="flex-shrink-0 mt-1">
                                    <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <p className="ml-4 text-gray-600">Comprehensive planning tools for every aspect of your wedding</p>
                            </li>
                            <li className="flex items-start">
                                <div className="flex-shrink-0 mt-1">
                                    <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <p className="ml-4 text-gray-600">Real-time collaboration with your partner and wedding party</p>
                            </li>
                            <li className="flex items-start">
                                <div className="flex-shrink-0 mt-1">
                                    <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                </div>
                                <p className="ml-4 text-gray-600">Budget tracking and financial management tools</p>
                            </li>
                            <li className="flex items-start">
                                <div className="flex-shrink-0 mt-1">
                                    <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </div>
                                <p className="ml-4 text-gray-600">Guest list management and RSVP tracking</p>
                            </li>
                            <li className="flex items-start">
                                <div className="flex-shrink-0 mt-1">
                                    <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <p className="ml-4 text-gray-600">Vendor coordination and timeline planning</p>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="mt-16 bg-white rounded-lg shadow-sm p-8">
                    <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">Our Impact</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="text-4xl font-bold text-rose-600 mb-2">10,000+</div>
                            <div className="text-gray-600">Happy Couples</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-rose-600 mb-2">50,000+</div>
                            <div className="text-gray-600">Weddings Planned</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold text-rose-600 mb-2">4.9/5</div>
                            <div className="text-gray-600">Average Rating</div>
                        </div>
                    </div>
                </div>

                {/* Call to Action */}
                <div className="mt-16 text-center">
                    <Link
                        to="/auth"
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-rose-600 hover:bg-rose-700 transition-colors"
                    >
                        Get Started Today
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AboutUs;