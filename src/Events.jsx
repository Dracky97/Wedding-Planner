import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, onSnapshot, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from './firebase.js';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const eventsQuery = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(eventsQuery, async (querySnapshot) => {
      const eventsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Check and update past events
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      for (const event of eventsData) {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        if (eventDate < today && !event.isPastEvent) {
          try {
            await updateDoc(doc(db, 'events', event.id), { isPastEvent: true });
          } catch (error) {
            console.error('Error updating event:', error);
          }
        }
      }

      setEvents(eventsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching events: ", error);
      setError(error.message);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-rose-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Events</h2>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
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
              <Link to="/about" className="text-gray-600 hover:text-rose-600 px-3 py-2 rounded-md text-sm font-medium">
                About Us
              </Link>
              <Link to="/events" className="text-rose-600 px-3 py-2 rounded-md text-sm font-medium">
                Events
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
              Events & Workshops
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Join events to learn, connect, and get inspired for your perfect wedding day.
            </p>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Upcoming Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.filter(event => !event.isPastEvent).length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">No upcoming events at the moment. Check back soon!</p>
            </div>
          ) : (
            events.filter(event => !event.isPastEvent).map((event) => (
              <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div 
                  className="h-48 bg-cover bg-center"
                  style={{ backgroundImage: `url(${event.image || '/src/assets/hero-bg.jpg'})` }}
                ></div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
                  <div className="text-sm text-gray-600 mb-2">
                    <p className="font-medium">{formatDate(event.date)}</p>
                    {event.time && <p>{event.time}</p>}
                    {event.location && <p>{event.location}</p>}
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{event.description}</p>
                  <button className="w-full bg-rose-600 text-white py-2 px-4 rounded-md hover:bg-rose-700 transition-colors">
                    More Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Past Events */}
      <div className="max-w-7xl mx-auto pb-16 px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Recent Events</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.filter(event => event.isPastEvent).length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">No past events to display.</p>
            </div>
          ) : (
            events.filter(event => event.isPastEvent).map((event) => (
              <div key={event.id} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{event.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{formatDate(event.date)}</p>
                <p className="text-gray-600 text-sm">{event.description}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Newsletter Signup */}
      <div className="bg-rose-600">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Stay Updated on Our Events
            </h2>
            <p className="text-rose-100 mb-8">
              Be the first to know about upcoming workshops, seminars, and networking events.
            </p>
            <div className="max-w-md mx-auto flex">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 rounded-l-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
              <button className="bg-rose-800 text-white px-6 py-2 rounded-r-md hover:bg-rose-900 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
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
              <Link
                to="/auth"
                className="text-rose-100 hover:text-white transition-colors text-sm font-medium"
              >
                Get Started
              </Link>
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

export default Events;