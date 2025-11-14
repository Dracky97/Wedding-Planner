import React, { useState } from 'react';
import LandingPage from './LandingPage';

// --- 1. IMPORT THE AD COMPONENT ---
import AdsterraNativeBanner from './AdsterraNativeBanner';

// Imports that were in App.jsx but are needed by LoginComponent
import { LogIn, UserPlus } from 'lucide-react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

/**
 * We are moving the LoginComponent from App.jsx into this file
 * to keep it neatly bundled with the authentication flow.
 */
const LoginComponent = ({ auth, db, error, setError }) => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [confirmEmail, setConfirmEmail] = useState('');

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        console.log("DEBUG: Attempting auth", isLoginView ? "login" : "signup");
        
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
        }
        
        try {
            if (isLoginView) {
                await signInWithEmailAndPassword(auth, email, password);
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
                    createdAt: new Date(),
                });
            }
        } catch (err) {
            console.error("DEBUG: Auth error", err);
            setError(err.message);
        }
    };

    return (
        <div className="flex items-center justify-center h-screen w-full bg-rose-50">
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
                        className="w-full p-3 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 transition-colors flex items-center justify-center space-x-2"
                    >
                        {isLoginView ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                        <span>{isLoginView ? 'Login' : 'Create Account'}</span>
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
                {/* --- 2. ADD YOUR NATIVE BANNER AD BLOCK HERE --- */}
                <div className="pt-4 mt-4 border-t border-gray-200">
                    <p className="text-center text-xs text-gray-500 mb-2">
                        Advertisements help us keep this service free.
                    </p>
                    <div className="flex justify-center">
                        <AdsterraNativeBanner
                            scriptSrc="//pl28049633.effectivegatecpm.com/a66f11eac893e2a95ec6f14d617ff20c/invoke.js"
                            containerId="container-a66f11eac893e2a95ec6f14d617ff20c"
                        />
                    </div>
                </div>
                {/* --- END AD BLOCK --- */}
                
            </div>
        </div>
    );
};


/**
 * This is the main AuthPage wrapper.
 * It holds a state `showLogin` to decide whether to show
 * the LandingPage or the LoginComponent.
 */
const AuthPage = ({ auth, db, error, setError }) => {
    const [showLogin, setShowLogin] = useState(false);

    if (showLogin) {
        return <LoginComponent auth={auth} db={db} error={error} setError={setError} />;
    }

    return <LandingPage onGetStarted={() => setShowLogin(true)} />;
};

export default AuthPage;