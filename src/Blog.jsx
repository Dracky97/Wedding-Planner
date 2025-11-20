import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, onSnapshot, orderBy } from 'firebase/firestore';

// Firebase config (same as in App.jsx)
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const Blog = () => {
    const [blogPosts, setBlogPosts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    useEffect(() => {
        const blogsQuery = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(blogsQuery, (querySnapshot) => {
            const posts = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().createdAt?.toDate().toISOString().split('T')[0]
            }));
            setBlogPosts(posts);
        }, (error) => console.error("Error fetching blogs: ", error));
        return () => unsubscribe();
    }, []);

    const filteredPosts = blogPosts.filter(post => {
        const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const categories = ['All', ...new Set(blogPosts.map(post => post.category).filter(Boolean))];

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
                            <Link to="/privacy" className="text-gray-600 hover:text-rose-600 px-3 py-2 rounded-md text-sm font-medium">
                                Privacy Policy
                            </Link>
                            <Link to="/blog" className="text-rose-600 px-3 py-2 rounded-md text-sm font-medium">
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
                            Wedding Planning Blog
                        </h1>
                        <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:max-w-3xl">
                            Expert tips, guides, and inspiration to help you plan the wedding of your dreams.
                        </p>
                    </div>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                        <svg className="absolute left-3 top-3 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search blog posts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                        />
                    </div>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
                    >
                        {categories.map(category => (
                            <option key={category} value={category}>{category}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Blog Posts */}
            <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {filteredPosts.map(post => (
                        <article key={post.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                            <div className="aspect-w-16 aspect-h-9 bg-gray-200 flex items-center justify-center">
                                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div className="p-6">
                                <div className="flex items-center text-sm text-gray-500 mb-2">
                                    <time dateTime={post.date}>
                                        {new Date(post.date).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </time>
                                    <span className="mx-2">•</span>
                                    <span>{post.readTime}</span>
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mb-3 hover:text-rose-600 transition-colors">
                                    <Link to={`/blog/${post.id}`}>
                                        {post.title}
                                    </Link>
                                </h2>
                                <p className="text-gray-600 mb-4">
                                    {post.excerpt}
                                </p>
                                <Link
                                    to={`/blog/${post.id}`}
                                    className="text-rose-600 hover:text-rose-700 font-medium text-sm"
                                >
                                    Read more →
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>

                {/* Newsletter Signup */}
                <div className="mt-16 bg-rose-600 rounded-lg p-8 text-center text-white">
                    <h2 className="text-2xl font-bold mb-4">Stay Updated</h2>
                    <p className="mb-6 max-w-md mx-auto">
                        Subscribe to our newsletter for the latest wedding planning tips and inspiration.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="flex-1 px-4 py-2 rounded-md text-gray-900"
                        />
                        <button className="bg-white text-rose-600 px-6 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors">
                            Subscribe
                        </button>
                    </div>
                </div>

                {/* Call to Action */}
                <div className="mt-16 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        Ready to Start Planning?
                    </h2>
                    <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                        Join thousands of couples who trust Wedding Planner to make their special day unforgettable.
                    </p>
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

export default Blog;