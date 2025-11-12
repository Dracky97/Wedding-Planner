import React, { useState } from 'react';
import LandingPage from './LandingPage';

// Imports that were in App.jsx but are needed by LoginComponent
import { LogIn, UserPlus } from 'lucide-react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
} from 'firebase/auth';

/**
 * We are moving the LoginComponent from App.jsx into this file
 * to keep it neatly bundled with the authentication flow.
 */
const LoginComponent = ({ auth, error, setError }) => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        console.log("DEBUG: Attempting auth", isLoginView ? "login" : "signup");
        
        // Password validation for signup
        if (!isLoginView) {
            if (password !== confirmPassword) {
                setError('Passwords do not match');
                return;
            }
            if (password.length < 6) {
                setError('Password must be at least 6 characters long');
                return;
            }
        }
        
        try {
            if (isLoginView) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
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
                    }}
                    className="w-full text-sm text-center text-rose-600 hover:underline"
                >
                    {isLoginView ? 'Need an account? Sign Up' : 'Already have an account? Login'}
                </button>
            </div>
        </div>
    );
};


/**
 * This is the main AuthPage wrapper.
 * It holds a state `showLogin` to decide whether to show
 * the LandingPage or the LoginComponent.
 */
const AuthPage = ({ auth, error, setError }) => {
    const [showLogin, setShowLogin] = useState(false);

    if (showLogin) {
        return <LoginComponent auth={auth} error={error} setError={setError} />;
    }

    return <LandingPage onGetStarted={() => setShowLogin(true)} />;
};

export default AuthPage;