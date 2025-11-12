import React from 'react';
import { PartyPopper, CheckSquare, PiggyBank, Users } from 'lucide-react';

/**
 * This is the new LandingPage component.
 * It's a simple presentational component that receives one prop:
 * `onGetStarted`: A function to call when the user clicks the "Get Started" button.
 */
const LandingPage = ({ onGetStarted }) => {
    const features = [
        {
            icon: CheckSquare,
            title: 'Comprehensive Checklist',
            description: 'Never miss a detail with our timeline-based checklist.',
        },
        {
            icon: PiggyBank,
            title: 'Budget Tracking',
            description: 'Manage your expenses, track payments, and stay on budget.',
        },
        {
            icon: Users,
            title: 'Guest List Management',
            description: 'Organize your guests, track RSVPs, and manage meal choices.',
        },
        {
            icon: PartyPopper,
            title: 'Collaborative Planning',
            description: 'Share your plan with your partner and plan together in real-time.',
        },
    ];

    return (
        <div className="flex items-center justify-center min-h-screen bg-rose-50 p-6">
            <div className="w-full max-w-4xl p-10 bg-white rounded-xl shadow-lg text-center">
                <h1 className="text-5xl font-bold text-rose-900 mb-6">
                    Plan Your Perfect Day
                </h1>
                <p className="text-xl text-gray-600 mb-12">
                    The collaborative, real-time wedding planner designed to make your
                    dream wedding a stress-free reality.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 text-left">
                    {features.map((feature) => (
                        <div key={feature.title} className="flex flex-col items-center md:items-start text-center md:text-left">
                            <div className="flex-shrink-0 mb-4">
                                <feature.icon className="w-12 h-12 text-rose-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-rose-800 mb-2">{feature.title}</h3>
                            <p className="text-sm text-gray-500">{feature.description}</p>
                        </div>
                    ))}
                </div>

                <button
                    onClick={onGetStarted}
                    className="px-10 py-4 bg-rose-600 text-white text-lg rounded-lg font-medium hover:bg-rose-700 transition-colors shadow-md"
                >
                    Get Started
                </button>
            </div>
        </div>
    );
};

export default LandingPage;