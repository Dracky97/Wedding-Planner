import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LandingPage from './LandingPage';

// Imports that were in App.jsx but are needed by LoginComponent
import { LogIn, UserPlus, UserCheck } from 'lucide-react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    signInAnonymously,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

/**
 * We are moving the LoginComponent from App.jsx into this file
 * to keep it neatly bundled with the authentication flow.
 */
const LoginComponent = ({ auth, db, error, setError, onGuestLogin }) => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [confirmEmail, setConfirmEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Show loading screen while Firebase auth is initializing
    if (!auth) {
        return (
            <div className="min-h-screen bg-rose-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-rose-900 mb-4">Loading...</h1>
                    <p className="text-gray-600">Initializing authentication service</p>
                    <div className="mt-4 animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto"></div>
                </div>
            </div>
        );
    }

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!auth) {
            setError('Authentication service not available. Please refresh the page.');
            return;
        }
        

        
        // Validation for signup
        if (!isLoginView) {

            if (password !== confirmPassword) {

                setError('Passwords do not match');
                return;
            }
            if (password.length < 6) {

                setError('Password must be at least 6 characters long');
                return;
            }
            if (email !== confirmEmail) {

                setError('Emails do not match');
                return;
            }
            if (!name.trim()) {

                setError('Name is required');
                return;
            }

        } else {

        }
        
        try {
            setIsLoading(true);

            
            if (isLoginView) {
                try {
                    const result = await signInWithEmailAndPassword(auth, email, password);
                    const currentUser = auth.currentUser;
                } catch (innerError) {
                    console.error("Authentication failed:", innerError);
                    throw innerError;
                }
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                // Update user profile with name
                await updateProfile(userCredential.user, {
                    displayName: name.trim()
                });
                // Save user details to Firestore
                await setDoc(doc(db, 'users', userCredential.user.uid), {
                    name: name.trim(),
                    email: email,
                    mobile: mobile || null,
                    role: 'user',
                    createdAt: new Date(),
                });
            }
        } catch (err) {
            console.error("Authentication error:", err.message);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

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
                            <Link to="/blog" className="text-gray-600 hover:text-rose-600 px-3 py-2 rounded-md text-sm font-medium">
                                Blog
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="flex items-center justify-center py-16 px-4">
                <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
                <h1 className="text-3xl font-bold text-center text-rose-900">
                    {isLoginView ? 'Login' : 'Sign Up'}
                </h1>
                <form onSubmit={handleAuth} className="space-y-4">
                    {!isLoginView && (
                        <div>
                            <label htmlFor="name" className="text-sm font-medium text-gray-700 block mb-1">Name</label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg"
                                placeholder="Enter your full name"
                            />
                        </div>
                    )}
                    <div>
                        <label htmlFor="email" className="text-sm font-medium text-gray-700 block mb-1">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            className="w-full p-3 border border-gray-300 rounded-lg"
                        />
                    </div>
                    {!isLoginView && (
                        <div>
                            <label htmlFor="confirmEmail" className="text-sm font-medium text-gray-700 block mb-1">Confirm Email</label>
                            <input
                                type="email"
                                id="confirmEmail"
                                value={confirmEmail}
                                onChange={e => setConfirmEmail(e.target.value)}
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg"
                                placeholder="Confirm your email"
                            />
                        </div>
                    )}
                    {!isLoginView && (
                        <div>
                            <label htmlFor="mobile" className="text-sm font-medium text-gray-700 block mb-1">Mobile Number <span className="text-gray-500">(optional)</span></label>
                            <input
                                type="tel"
                                id="mobile"
                                value={mobile}
                                onChange={e => setMobile(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg"
                                placeholder="Enter your mobile number"
                            />
                        </div>
                    )}
                    <div>
                        <label htmlFor="password" className="text-sm font-medium text-gray-700 block mb-1">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            className="w-full p-3 border border-gray-300 rounded-lg"
                            placeholder="Enter your password"
                        />
                    </div>
                    
                    {!isLoginView && (
                        <div>
                            <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 block mb-1">Confirm Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg"
                                placeholder="Confirm your password"
                            />
                        </div>
                    )}
                    
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    <button
                        type="submit"
                        disabled={isLoading || !auth}
                        onClick={(e) => {

                            if (!auth) {
                                console.error("Authentication service not available");
                                e.preventDefault();
                                setError('Authentication service not available. Please refresh the page.');
                                return;
                            }
                            // Let the form onSubmit handle it, but log the click
                        }}
                        className={`w-full p-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                            isLoading || !auth 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-rose-600 hover:bg-rose-700'
                        } text-white`}
                    >
                        {isLoginView ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                        <span>{isLoading ? 'Signing In...' : isLoginView ? 'Login' : 'Create Account'}</span>
                    </button>
                </form>
                <button
                    onClick={() => {
                        setIsLoginView(!isLoginView);
                        setError('');
                        setEmail('');
                        setPassword('');
                        setConfirmPassword('');
                        setName('');
                        setMobile('');
                        setConfirmEmail('');
                    }}
                    className="w-full text-sm text-center text-rose-600 hover:underline"
                >
                    {isLoginView ? 'Need an account? Sign Up' : 'Already have an account? Login'}
                </button>

                {/* Guest Login Button */}
                <div className="border-t pt-4">
                    <p className="text-sm text-gray-600 text-center mb-3">Want to try it out first?</p>
                    <button
                        onClick={() => {
                            if (onGuestLogin) {
                                onGuestLogin();
                            }
                        }}
                        className="w-full p-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
                    >
                        <UserCheck className="w-5 h-5" />
                        <span>Continue as Guest</span>
                    </button>
                    <p className="text-xs text-gray-500 text-center mt-2">
                        Test the app without creating an account. Data won't be saved.
                    </p>
                </div>

                </div>
            </div>
        </div>
    );
};


/**
 * This is the main AuthPage wrapper.
 * It holds a state `showLogin` to decide whether to show
 * the LandingPage or the LoginComponent.
 */
const AuthPage = ({ auth, db, error, setError, onGuestLogin }) => {
    const [showLogin, setShowLogin] = useState(true);

    if (showLogin) {
        return <LoginComponent auth={auth} db={db} error={error} setError={setError} onGuestLogin={onGuestLogin} />;
    }

    return <LandingPage onGetStarted={() => setShowLogin(true)} />;
};

export default AuthPage;