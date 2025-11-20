import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import HeroImage from '/src/assets/hero-bg.jpg'; // <-- ADD THIS LINE

/**
 * A minimalist, full-screen hero landing page, inspired by planning.wedding.
 * It receives one prop:
 * `onGetStarted`: A function to call when the user clicks the "Get Started" button.
 */
const LandingPage = ({ onGetStarted }) => {
    const navigate = useNavigate();
    return (
        // The main container uses the custom 'hero-background' class from index.css
       <div 
    className="h-screen w-screen flex flex-col items-center justify-center text-center text-white p-6"
    style={{
      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.65)), url(${HeroImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}
>
            
            {/* Navigation (optional, kept simple) */}
            <nav className="absolute top-0 left-0 w-full p-6 flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                    Wedding Planner
                </h1>
                <div className="flex space-x-4">
                    <Link
                        to="/about"
                        className="font-medium text-white hover:text-rose-100 transition-colors"
                        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
                    >
                        About
                    </Link>
                    <Link
                        to="/blog"
                        className="font-medium text-white hover:text-rose-100 transition-colors"
                        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
                    >
                        Blog
                    </Link>
                    <Link
                        to="/privacy"
                        className="font-medium text-white hover:text-rose-100 transition-colors"
                        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
                    >
                        Privacy
                    </Link>
                    <button
                        onClick={onGetStarted || (() => navigate('/auth'))}
                        className="font-medium text-white hover:text-rose-100 transition-colors"
                        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
                    >
                        Login / Sign Up
                    </button>
                </div>
            </nav>

            {/* Hero Content */}
            <main className="relative z-10 animate-fadeIn">
                <h2 
                    className="text-5xl md:text-7xl font-bold text-white tracking-tight"
                    style={{ textShadow: '0 4px 10px rgba(0,0,0,0.3)' }}
                >
                    Plan your wedding,
                    <br />
                    all in one place.
                </h2>
                
                <p 
                    className="text-xl md:text-2xl text-rose-100 mt-6 max-w-2xl mx-auto"
                    style={{ textShadow: '0 2px 5px rgba(0,0,0,0.3)' }}
                >
                    The simple, collaborative, and beautiful way to plan your perfect day.
                </p>
                
                <button
                    onClick={onGetStarted || (() => navigate('/auth'))}
                    className="mt-12 px-10 py-4 bg-rose-600 text-white text-lg rounded-lg font-medium shadow-xl hover:bg-rose-700 transition-all duration-300 transform hover:scale-105"
                >
                    Get Started for Free
                </button>
            </main>
        </div>
    );
};

export default LandingPage;