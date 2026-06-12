import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import HeroImage from '/src/assets/hero-bg.jpg'; // <-- ADD THIS LINE
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import AdBanner from './AdBanner';
import { db } from './firebase.js';

/**
 * A minimalist, full-screen hero landing page, inspired by planning.wedding.
 * It receives one prop:
 * `onGetStarted`: A function to call when the user clicks the "Get Started" button.
 */
const LandingPage = ({ onGetStarted }) => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [blogs, setBlogs] = useState([]);

    useEffect(() => {
        const eventsQuery = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
        const eventsUnsubscribe = onSnapshot(eventsQuery, (querySnapshot) => {
            const eventsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setEvents(eventsData);
        }, (error) => {
            console.error("Error fetching events: ", error);
        });

        const blogsQuery = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
        const blogsUnsubscribe = onSnapshot(blogsQuery, (querySnapshot) => {
            const blogsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setBlogs(blogsData);
        }, (error) => {
            console.error("Error fetching blogs: ", error);
        });

        return () => {
            eventsUnsubscribe();
            blogsUnsubscribe();
        };
    }, []);

    const upcomingEvents = events.filter(event => !event.isPastEvent).slice(0, 2);
    const recentBlogs = blogs.slice(0, 3);

    return (
        // The main container uses the custom 'hero-background' class from index.css
       <div 
    className="w-screen text-white"
    style={{
      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.65)), url(${HeroImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      minHeight: '100vh'
    }}
>
            
            {/* Navigation (optional, kept simple) */}
            <nav className="absolute top-0 left-0 w-full p-4 md:p-6 flex justify-between items-center z-20">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                    Wedding Planner
                </h1>
                <div className="flex space-x-2 md:space-x-4">
                    <Link
                        to="/about"
                        className="text-sm md:text-base font-medium text-white hover:text-rose-100 transition-colors px-2 md:px-0"
                        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
                    >
                        About
                    </Link>
                    <Link
                        to="/blog"
                        className="text-sm md:text-base font-medium text-white hover:text-rose-100 transition-colors px-2 md:px-0"
                        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
                    >
                        Blog
                    </Link>
                    <Link
                        to="/events"
                        className="text-sm md:text-base font-medium text-white hover:text-rose-100 transition-colors px-2 md:px-0"
                        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
                    >
                        Events
                    </Link>
                    <button
                        onClick={onGetStarted || (() => navigate('/auth'))}
                        className="text-sm md:text-base font-medium text-white hover:text-rose-100 transition-colors px-2 md:px-0"
                        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
                    >
                        Planner
                    </button>
                </div>
            </nav>

            {/* Hero Content */}
            <main className="h-screen flex items-center justify-center text-center relative z-10 animate-fadeIn p-4 md:p-6">
                <div className="max-w-4xl mx-auto">
                    <h2 
                        className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white tracking-tight leading-tight"
                        style={{ textShadow: '0 4px 10px rgba(0,0,0,0.3)' }}
                    >
                        Plan your wedding,
                        <br />
                        all in one place.
                    </h2>
                    
                    <p 
                        className="text-lg sm:text-xl md:text-2xl text-rose-100 mt-4 md:mt-6 max-w-2xl md:max-w-3xl mx-auto"
                        style={{ textShadow: '0 2px 5px rgba(0,0,0,0.3)' }}
                    >
                        The simple, collaborative, and beautiful way to plan your perfect day.
                    </p>
                    
                    <button
                        onClick={onGetStarted || (() => navigate('/auth'))}
                        className="mt-8 md:mt-12 px-8 md:px-10 py-3 md:py-4 bg-rose-600 text-white text-base md:text-lg rounded-lg font-medium shadow-xl hover:bg-rose-700 transition-all duration-300 transform hover:scale-105"
                    >
                        Get Started for Free
                    </button>
                </div>
            </main>

            {/* About Section */}
            <section className="relative z-10 bg-white py-16">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-4xl font-bold text-gray-900 mb-8">
                            Why Choose Our Wedding Planner?
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy to Use</h3>
                                <p className="text-gray-600">Intuitive interface that makes wedding planning a joy, not a chore.</p>
                            </div>
                            <div className="text-center">
                                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Collaborative</h3>
                                <p className="text-gray-600">Work together with your partner and wedding party in real-time.</p>
                            </div>
                            <div className="text-center">
                                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">Budget Friendly</h3>
                                <p className="text-gray-600">Track expenses and stay within budget with our smart tools.</p>
                            </div>
                        </div>
                        <div className="mt-12">
                            <Link 
                                to="/about"
                                className="inline-flex items-center px-8 py-3 bg-rose-600 text-white font-medium rounded-lg hover:bg-rose-700 transition-colors"
                            >
                                Learn More About Us
                                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Ad Banner — between About and Blog sections */}
            <div className="relative z-10 bg-white py-4">
                <div className="container mx-auto px-6 max-w-4xl">
                    <AdBanner slot="SLOT_ID_LANDING_1" />
                </div>
            </div>

            {/* Blog Preview Section */}
            <section className="relative z-10 bg-rose-50 py-16">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Wedding Planning Tips & Blogs
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Get inspired and learn from our latest blog posts about wedding planning, trends.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {recentBlogs.length > 0 ? (
                            recentBlogs.map((blog, index) => (
                                <div key={blog.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                                    <div className="h-48 bg-gray-200">
                                        {blog.imageUrl ? (
                                            <img
                                                src={blog.imageUrl}
                                                alt={blog.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-rose-400 to-pink-500"></div>
                                        )}
                                    </div>
                                    <div className="p-6">
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{blog.title}</h3>
                                        <p className="text-gray-600 mb-4">{blog.excerpt}</p>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-500">{blog.readTime} min read</span>
                                            <Link to={`/blog/${blog.id}`} className="text-rose-600 hover:text-rose-800 font-medium">
                                                Read More →
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12">
                                <p className="text-gray-500 text-lg">No blog posts available yet. Check back soon!</p>
                            </div>
                        )}
                    </div>
                    <div className="text-center mt-12">
                        <Link 
                            to="/blog"
                            className="inline-flex items-center px-8 py-3 border border-rose-600 text-rose-600 font-medium rounded-lg hover:bg-rose-600 hover:text-white transition-colors"
                        >
                            View All Blog Posts
                            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Events Section */}
            <section className="relative z-10 bg-white py-16">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Upcoming Events & Workshops
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Exclusive events to meet Vendors, learn from experts, meet other couples, and get inspired for your perfect day.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {upcomingEvents.length > 0 ? (
                            upcomingEvents.map((event, index) => (
                                <div key={event.id} className={`bg-gradient-to-br ${index % 2 === 0 ? 'from-rose-500 to-pink-600' : 'from-purple-500 to-indigo-600'} rounded-lg p-8 text-white`}>
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-2xl font-bold mb-2">{event.title}</h3>
                                        <p className="mb-4 opacity-90">{new Date(event.date).toLocaleDateString()} • {event.time || 'TBD'}</p>
                                        <p className="mb-6 opacity-90">{event.description}</p>
                                        <Link
                                            to="/events"
                                            className={`bg-white ${index % 2 === 0 ? 'text-rose-600' : 'text-purple-600'} px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors inline-block`}
                                        >
                                            More Details
                                        </Link>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12">
                                <p className="text-gray-500 text-lg">No upcoming events at the moment. Check back soon!</p>
                            </div>
                        )}
                    </div>
                    <div className="text-center mt-12">
                        <Link 
                            to="/events"
                            className="inline-flex items-center px-8 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            View All Events
                            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Ad Banner — between Events section and Footer */}
            <div className="relative z-10 bg-white py-4">
                <div className="container mx-auto px-6 max-w-4xl">
                    <AdBanner slot="SLOT_ID_LANDING_2" />
                </div>
            </div>

            {/* Footer */}
            <footer className="relative z-10 bg-black bg-opacity-50 backdrop-blur-sm border-t border-white border-opacity-20">
                <div className="container mx-auto px-6 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {/* Brand Section */}
                        <div className="md:col-span-2">
                            <h3 className="text-xl font-bold text-white mb-4">Wedding Planner</h3>
                            <p className="text-rose-100 text-sm leading-relaxed">
                                Making your dream wedding come to life with beautiful planning tools and collaborative features. 
                                Start planning today and create memories that last a lifetime.
                            </p>
                        </div>
                        
                        {/* Quick Links */}
                        <div>
                            <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
                            <ul className="space-y-2">
                                <li>
                                    <Link 
                                        to="/about" 
                                        className="text-rose-100 hover:text-white transition-colors text-sm"
                                    >
                                        About Us
                                    </Link>
                                </li>
                                <li>
                                    <Link 
                                        to="/blog" 
                                        className="text-rose-100 hover:text-white transition-colors text-sm"
                                    >
                                        Wedding Blog
                                    </Link>
                                </li>
                                <li>
                                    <Link 
                                        to="/privacy" 
                                        className="text-rose-100 hover:text-white transition-colors text-sm"
                                    >
                                        Privacy Policy
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        
                        {/* Contact Info */}
                        <div>
                            <h4 className="text-lg font-semibold text-white mb-4">Connect</h4>
                            <ul className="space-y-2">
                                <li>
                                    <a 
                                        href="mailto:hello@weddingplanner.com" 
                                        className="text-rose-100 hover:text-white transition-colors text-sm"
                                    >
                                        hello@weddingplanner.com
                                    </a>
                                </li>
                                <li>
                                    <p className="text-rose-100 text-sm">
                                        Available 24/7 for all your planning needs
                                    </p>
                                </li>
                            </ul>
                        </div>
                    </div>
                    
                    {/* Bottom Bar */}
                    <div className="border-t border-white border-opacity-20 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
                        <p className="text-rose-100 text-sm">
                            © 2024 Wedding Planner. All rights reserved.
                        </p>
                        <div className="flex space-x-6 mt-4 md:mt-0">
                            <button
                                onClick={onGetStarted || (() => navigate('/auth'))}
                                className="text-rose-100 hover:text-white transition-colors text-sm font-medium"
                            >
                                Get Started
                            </button>
                            <Link
                                to="/about"
                                className="text-rose-100 hover:text-white transition-colors text-sm"
                            >
                                Learn More
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;