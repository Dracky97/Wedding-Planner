import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
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
                            <Link to="/about" className="text-gray-600 hover:text-rose-600 px-3 py-2 rounded-md text-sm font-medium">
                                About Us
                            </Link>
                            <Link to="/privacy" className="text-rose-600 px-3 py-2 rounded-md text-sm font-medium">
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
                        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
                            Privacy Policy
                        </h1>
                        <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:max-w-3xl">
                            Your privacy is important to us. Learn how we collect, use, and protect your information.
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow-sm p-8">
                    {/* Table of Contents */}
                    <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Table of Contents</h3>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#info-collect" className="text-rose-600 hover:text-rose-700">1. Information We Collect</a></li>
                            <li><a href="#use-info" className="text-rose-600 hover:text-rose-700">2. How We Use Your Information</a></li>
                            <li><a href="#info-sharing" className="text-rose-600 hover:text-rose-700">3. Information Sharing</a></li>
                            <li><a href="#data-security" className="text-rose-600 hover:text-rose-700">4. Data Security</a></li>
                            <li><a href="#data-retention" className="text-rose-600 hover:text-rose-700">5. Data Retention</a></li>
                            <li><a href="#your-rights" className="text-rose-600 hover:text-rose-700">6. Your Rights</a></li>
                            <li><a href="#cookies" className="text-rose-600 hover:text-rose-700">7. Cookies and Tracking</a></li>
                            <li><a href="#policy-changes" className="text-rose-600 hover:text-rose-700">8. Changes to This Policy</a></li>
                            <li><a href="#contact" className="text-rose-600 hover:text-rose-700">9. Contact Us</a></li>
                        </ul>
                    </div>

                    <div className="prose prose-lg max-w-none">
                        <p className="text-gray-600 mb-6">
                            <strong>Last updated:</strong> {new Date().toLocaleDateString()}
                        </p>

                        <h2 id="info-collect" className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
                        <p className="text-gray-600 mb-4">
                            We collect information you provide directly to us, such as when you create an account,
                            use our services, or contact us for support. This may include:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 mb-6">
                            <li>Name, email address and number</li>
                            <li>Communications with our support team</li>
                        </ul>

                        <h2 id="use-info" className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
                        <p className="text-gray-600 mb-4">
                            We use the information we collect to:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 mb-6">
                            <li>Provide, maintain, and improve our services</li>
                            <li>Process transactions and manage your account</li>
                            <li>Send you technical notices and support messages</li>
                            <li>Communicate with you about products, services, and promotions</li>
                            <li>Monitor and analyze usage patterns and trends</li>
                        </ul>

                        <h2 id="info-sharing" className="text-2xl font-bold text-gray-900 mb-4">3. Information Sharing</h2>
                        <p className="text-gray-600 mb-4">
                            We do not sell, trade, or otherwise transfer your personal information to third parties
                            without your consent, except as described in this policy:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 mb-6">
                            <li>With service providers who assist us in operating our platform</li>
                            <li>When required by law or to protect our rights</li>
                            <li>In connection with a business transfer or acquisition</li>
                            <li>With your explicit consent</li>
                        </ul>

                        <h2 id="data-security" className="text-2xl font-bold text-gray-900 mb-4">4. Data Security</h2>
                        <p className="text-gray-600 mb-6">
                            We implement appropriate security measures to protect your personal information against
                            unauthorized access, alteration, disclosure, or destruction. This includes encryption
                            of data in transit and at rest, regular security audits, and access controls.
                        </p>

                        <h2 id="data-retention" className="text-2xl font-bold text-gray-900 mb-4">5. Data Retention</h2>
                        <p className="text-gray-600 mb-6">
                            We retain your personal information for as long as necessary to provide our services
                            and fulfill the purposes outlined in this policy, unless a longer retention period
                            is required by law.
                        </p>

                        <h2 id="your-rights" className="text-2xl font-bold text-gray-900 mb-4">6. Your Rights</h2>
                        <p className="text-gray-600 mb-4">
                            You have the right to:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 mb-6">
                            <li>Access and update your personal information</li>
                            <li>Request deletion of your data</li>
                            <li>Opt out of marketing communications</li>
                            <li>Request data portability</li>
                        </ul>

                        <h2 id="cookies" className="text-2xl font-bold text-gray-900 mb-4">7. Cookies and Tracking</h2>
                        <p className="text-gray-600 mb-6">
                            We use cookies and similar technologies to enhance your experience, analyze usage,
                            and assist in our marketing efforts. You can control cookie settings through your
                            browser preferences.
                        </p>

                        <h2 id="policy-changes" className="text-2xl font-bold text-gray-900 mb-4">8. Changes to This Policy</h2>
                        <p className="text-gray-600 mb-6">
                            We may update this privacy policy from time to time. We will notify you of any
                            material changes by posting the new policy on this page and updating the "last updated" date.
                        </p>

                        <h2 id="contact" className="text-2xl font-bold text-gray-900 mb-4">9. Contact Us</h2>
                        <p className="text-gray-600">
                            If you have any questions about this privacy policy, please contact us at:
                        </p>
                        <p className="text-gray-600 mt-2">
                            Email: privacy@weddingplanner.com<br />
                            Address: [Your Business Address]
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;