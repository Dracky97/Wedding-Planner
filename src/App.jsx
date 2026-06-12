import React, { useState, useMemo, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  PiggyBank,
  Briefcase,
  CheckSquare,
  Plus,
  Trash2,
  Copy,
  LogOut,
  PartyPopper,
  Menu,
  X,
  ListTodo,
  Folder,
  UploadCloud,
  FileText,
  Settings as SettingsIcon,
  Download,
  Upload,
  Key,
  Clock,
  Search,
  Table2,
  ChevronDown,
  ChevronUp,
  UserCheck,
  UserX,
  HelpCircle,
  BarChart2,
  Image,
  Calendar,
  AlertTriangle,
  Globe,
  Star,
  Share2,
  MapPin,
  CheckCircle2,
  Link2,
  Award,
  TrendingUp,
} from 'lucide-react';
import {
    onAuthStateChanged,
    signOut,
    sendPasswordResetEmail,
    updatePassword,
    signInAnonymously
} from 'firebase/auth';
import {
    doc,
    addDoc,
    setDoc,
    deleteDoc,
    onSnapshot,
    collection,
    query,
    where,
    writeBatch,
    getDocs,
    orderBy
} from 'firebase/firestore';
import {
    ref,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject
} from "firebase/storage";
import { auth as firebaseAuth, db as firebaseDb, storage as firebaseStorage } from './firebase.js';
// --- ADDED: For Plan ID generation ---
import { nanoid } from 'nanoid';

// --- ADDED: Import for the new AuthPage wrapper ---
import AuthPage from './AuthPage';
import AdBanner from './AdBanner';

// --- ADDED: Imports for new public pages ---
import LandingPage from './LandingPage';
import AboutUs from './AboutUs';
import PrivacyPolicy from './PrivacyPolicy';
import Blog from './Blog';
import Events from './Events';
import FirebaseTest from './FirebaseTest';
import RSVPPage from './RSVPPage';
import PhotoGallery from './PhotoGallery';

const timelineOrder = ['12+ Months', '10-12 Months', '8-10 Months', '6-8 Months', '4-6 Months', '2-3 Months', '1-2 Months', '2-4 Weeks', '1 Week'];
// --- Currency Updated to LKR ---
const currency = (val) => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 2 }).format(val);

// --- ADDED: Notification Component ---
const Notification = ({ message }) => {
    if (!message) return null;

    return (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in-out">
            {message}
        </div>
    );
};

// --- Reusable Doughnut Chart Component ---
const DoughnutChart = ({ percent, color, trackColor, text, subtext }) => {
    const background = `conic-gradient(${color} ${percent}%, ${trackColor} ${percent}% 100%)`;
    return (
        <div className="relative w-24 h-24 flex-shrink-0">
            <div className="w-24 h-24 rounded-full" style={{ background }}></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-white rounded-full flex flex-col items-center justify-center text-center">
                    <span className="text-lg font-bold text-rose-900 leading-none">{text}</span>
                    <span className="text-xs text-gray-500 leading-tight mt-0.5">{subtext}</span>
                </div>
            </div>
        </div>
    );
};

// --- Sidebar Component ---
const Sidebar = ({ currentView, setCurrentView, planId, handleLogout, isMobileMenuOpen, setIsMobileMenuOpen, showNotification, userRole }) => {
    const views = [
        { key: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
        { key: 'guest-tables', name: 'Guest Tables', icon: Table2 },
        { key: 'budget', name: 'Budget', icon: PiggyBank },
        { key: 'vendors', name: 'Vendors', icon: Briefcase },
        { key: 'checklist', name: 'Checklist', icon: CheckSquare },
        { key: 'agenda', name: 'Agenda', icon: ListTodo },
        { key: 'gallery', name: 'Gallery', icon: Image },
        { key: 'documents', name: 'Documents', icon: Folder },
        { key: 'settings', name: 'Settings', icon: SettingsIcon },
        ...(userRole === 'admin' ? [
            { key: 'admin', name: 'Admin Dashboard', icon: SettingsIcon },
            { key: 'blogs', name: 'Manage Blogs', icon: FileText },
            { key: 'users', name: 'Manage Users', icon: Users }
        ] : []),
    ];

    const copyPlanId = () => {
        if (!navigator.clipboard) {
            try {
                const textArea = document.createElement("textarea");
                textArea.value = planId;
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                showNotification(`Plan ID "${planId}" copied to clipboard!`);
            } catch (err) {
                console.error('Failed to copy text: ', err);
                showNotification(`Failed to copy. Please copy manually.`);
            }
            return;
        }

        navigator.clipboard.writeText(planId)
            .then(() => showNotification(`Plan ID "${planId}" copied to clipboard!`))
            .catch(err => {
                console.error('Failed to copy text: ', err);
                showNotification(`Failed to copy. Please copy manually.`);
            });
    };

    const sidebarContent = (
        <nav className="w-72 md:w-64 bg-rose-800 text-white p-6 shadow-lg flex flex-col h-full overflow-y-auto">
            <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 text-rose-100">Wedding Planner</h1>
            <ul className="space-y-2 flex-1">
                {views.map(view => {
                    const isActive = currentView === view.key;
                    const Icon = view.icon;
                    return (
                        <li key={view.key}>
                            <button
                                onClick={() => {
                                    setCurrentView(view.key);
                                    setIsMobileMenuOpen(false); // Close menu on navigation
                                }}
                                className={`flex items-center space-x-3 w-full text-left p-4 rounded-lg transition-colors duration-200 touch-manipulation ${
                                    isActive ? 'bg-rose-900 text-white shadow-md' : 'text-rose-200 hover:bg-rose-700 hover:text-white active:bg-rose-900'
                                }`}
                            >
                                <Icon className="w-6 h-6 flex-shrink-0" />
                                <span className="font-medium text-base">{view.name}</span>
                            </button>
                        </li>
                    );
                })}
            </ul>
            
            {planId && (
                <div className="mt-4 p-4 bg-rose-700 rounded-lg">
                    <label className="text-xs text-rose-200 font-medium block mb-2">Your Plan ID:</label>
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-mono text-white truncate flex-1">{planId}</span>
                        <button
                            onClick={copyPlanId}
                            title="Copy Plan ID"
                            className="text-rose-200 hover:text-white transition-colors p-2 hover:bg-rose-600 rounded touch-manipulation flex-shrink-0"
                        >
                            <Copy className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-xs text-rose-300 mt-3 leading-relaxed">Dont share the Planner ID with other than your loved ones.</p>
                </div>
            )}
            
            <button
                onClick={handleLogout}
                className="flex items-center space-x-3 w-full text-left p-4 rounded-lg transition-colors duration-200 text-rose-200 hover:bg-rose-700 hover:text-white active:bg-rose-900 mt-4 touch-manipulation"
            >
                <LogOut className="w-6 h-6" />
                <span className="font-medium text-base">Logout</span>
            </button>

            <div className="mt-6">
                <p className="text-xs text-rose-300">© 2025 SicatDigital</p>
            </div>
        </nav>
    );

    return (
        <>
            {/* --- Desktop Sidebar --- */}
            <div className="hidden md:flex h-screen flex-shrink-0">
                {sidebarContent}
            </div>

            {/* --- Mobile Menu (Modal) --- */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true">
                    {/* Overlay */}
                    <div 
                        className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity" 
                        aria-hidden="true"
                        onClick={() => setIsMobileMenuOpen(false)}
                    ></div>

                    {/* Sidebar Content */}
                    <div className="relative flex-shrink-0 transition-transform duration-300 ease-in-out">
                        {sidebarContent}
                    </div>
                    
                    {/* Close Button */}
                    <button 
                        className="absolute top-4 right-4 text-white"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <X className="w-8 h-8" />
                    </button>
                </div>
            )}
        </>
    );
};

// --- ADDED: Mobile Header Component ---
const MobileHeader = ({ setIsMobileMenuOpen, handleLogout }) => {
    return (
        <header className="md:hidden w-full px-4 py-3 bg-rose-800 text-white flex justify-between items-center shadow-lg sticky top-0 z-40">
            <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-3 -ml-2 hover:bg-rose-700 rounded-lg transition-colors active:bg-rose-900"
                aria-label="Open menu"
            >
                <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-white">Wedding Planner</h1>
            <button
                onClick={handleLogout}
                className="p-3 -mr-2 hover:bg-rose-700 rounded-lg transition-colors active:bg-rose-900"
                aria-label="Logout"
            >
                <LogOut className="w-6 h-6" />
            </button>
        </header>
    );
};


// --- Dashboard Component ---
const Dashboard = ({ guests, budgetItems, vendors, tasks, totalBudget, weddingDate, db, basePath, setCurrentView }) => {
    const saveWeddingDate = async (date) => {
        if (!db || !basePath) return;
        try { await setDoc(doc(db, `${basePath}/config`, 'plan'), { weddingDate: date }, { merge: true }); }
        catch (e) { console.error(e); }
    };
    const budgetStats = useMemo(() => {
        const totalSpent = budgetItems.reduce((sum, item) => sum + item.paid, 0);
        const totalCost = budgetItems.reduce((sum, item) => sum + item.cost, 0);
        const balanceDue = totalCost - totalSpent;
        const remainingBudget = totalBudget - totalCost;
        const spentPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
        return { totalSpent, balanceDue, remainingBudget, spentPercent };
    }, [budgetItems, totalBudget]);

    const attendanceStats = useMemo(() => {
        const totalInvited = guests.filter(g => g.invited).reduce((sum, g) => sum + g.numPeople, 0);
        const attending = guests.filter(g => g.rsvp === 'yes').reduce((sum, g) => sum + g.numPeople, 0);
        const notAttending = guests.filter(g => g.rsvp === 'no').reduce((sum, g) => sum + g.numPeople, 0);
        const unconfirmed = totalInvited - attending - notAttending;
        const attendingPercent = totalInvited > 0 ? (attending / totalInvited) * 100 : 0;
        return { totalInvited, attending, notAttending, unconfirmed, attendingPercent };
    }, [guests]);

    const taskStats = useMemo(() => {
        const tasksCompleted = tasks.filter(t => t.completed).length;
        const totalTasks = tasks.length;
        const tasksPercent = totalTasks > 0 ? (tasksCompleted / totalTasks) * 100 : 0;
        const upcomingTasks = tasks.filter(t => !t.completed).slice(0, 5);
        return { tasksCompleted, totalTasks, tasksPercent, upcomingTasks };
    }, [tasks]);

    const vendorStats = useMemo(() => {
        const totalVendorCost = vendors.reduce((s, v) => s + (v.quoted || 0), 0);
        const totalVendorPaid = vendors.reduce((s, v) => s + (v.paid || 0), 0);
        const unpaidVendors = vendors.filter(v => v.status !== 'Paid' && v.status !== 'Rejected' && (v.quoted || 0) > (v.paid || 0));
        return { totalVendorCost, totalVendorPaid, unpaidBalance: totalVendorCost - totalVendorPaid, unpaidVendors };
    }, [vendors]);

    const countdown = useMemo(() => {
        if (!weddingDate) return null;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const wed = new Date(weddingDate); wed.setHours(0, 0, 0, 0);
        const diff = Math.round((wed - today) / (1000 * 60 * 60 * 24));
        return diff;
    }, [weddingDate]);

    return (
        <>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-rose-900 mb-6 md:mb-8">Dashboard</h1>

            {/* Countdown Banner */}
            {countdown === null ? (
                <div className="mb-6 p-5 rounded-xl shadow-lg bg-white border-2 border-dashed border-rose-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <p className="text-rose-800 font-semibold text-lg">Set your wedding date</p>
                        <p className="text-gray-500 text-sm mt-0.5">Add your date to see a countdown here.</p>
                    </div>
                    <input
                        type="date"
                        onChange={e => e.target.value && saveWeddingDate(e.target.value)}
                        className="p-2.5 border border-rose-300 rounded-lg focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-sm font-medium text-gray-700"
                    />
                </div>
            ) : (
                <div className={`mb-6 p-5 rounded-xl shadow-lg ${countdown < 0 ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gradient-to-r from-rose-600 to-pink-500'} text-white`}>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-center sm:text-left">
                            {countdown === 0 && <p className="text-3xl font-bold">Today is Your Wedding Day! 🎉💍</p>}
                            {countdown > 0 && <>
                                <p className="text-sm font-medium opacity-90 mb-1">Counting down to your big day</p>
                                <p className="text-4xl font-bold">{countdown} <span className="text-xl font-medium">day{countdown !== 1 ? 's' : ''} to go</span></p>
                                <p className="text-sm opacity-75 mt-1">{new Date(weddingDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </>}
                            {countdown < 0 && <>
                                <p className="text-sm font-medium opacity-90 mb-1">Congratulations! You did it!</p>
                                <p className="text-3xl font-bold">Married {Math.abs(countdown)} day{Math.abs(countdown) !== 1 ? 's' : ''} ago 💍</p>
                            </>}
                        </div>
                        <div className="flex flex-col items-center sm:items-end gap-1">
                            <label className="text-xs opacity-75">Change date</label>
                            <input
                                type="date"
                                value={weddingDate || ''}
                                onChange={e => e.target.value && saveWeddingDate(e.target.value)}
                                className="p-2 bg-white/20 border border-white/40 rounded-lg text-sm text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 md:mb-8">
                {/* Budget Widget */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold text-rose-800 mb-4">Budget Overview</h2>
                    <div className="flex items-center space-x-4">
                        <DoughnutChart
                            percent={budgetStats.spentPercent}
                            color="#e11d48"
                            trackColor="#fecdd3"
                            text={`${Math.round(budgetStats.spentPercent)}%`}
                            subtext="Paid"
                        />
                        <div className="flex-1">
                            <p className="text-sm text-gray-500">Remaining Budget</p>
                            <p className="text-2xl font-bold text-green-600">{currency(budgetStats.remainingBudget)}</p>
                            <p className="text-sm text-gray-500 mt-2">Total Spent: <span className="font-medium text-rose-700">{currency(budgetStats.totalSpent)}</span></p>
                            <p className="text-sm text-gray-500">Balance Due: <span className="font-medium text-yellow-600">{currency(budgetStats.balanceDue)}</span></p>
                        </div>
                    </div>
                </div>

                {/* Attendance Widget */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold text-rose-800 mb-4">Attendance</h2>
                    <div className="flex items-center space-x-4">
                         <DoughnutChart
                            percent={attendanceStats.attendingPercent}
                            color="#16a34a"
                            trackColor="#e2e8f0"
                            text={attendanceStats.attending}
                            subtext="Attending"
                        />
                        <div className="flex-1">
                            <p className="text-sm text-gray-600"><span className="font-bold text-green-600">{attendanceStats.attending}</span> Attending</p>
                            <p className="text-sm text-gray-600"><span className="font-bold text-red-600">{attendanceStats.notAttending}</span> Not Attending</p>
                            <p className="text-sm text-gray-600"><span className="font-bold text-gray-500">{attendanceStats.unconfirmed}</span> Unconfirmed</p>
                            <p className="text-lg font-bold text-rose-900 mt-2">{attendanceStats.totalInvited} <span className="text-sm font-medium text-gray-500">Total Invited</span></p>
                        </div>
                    </div>
                </div>

                {/* Checklist Widget */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold text-rose-800 mb-4">Checklist Progress</h2>
                    <div className="flex items-center space-x-4">
                        <DoughnutChart
                            percent={taskStats.tasksPercent}
                            color="#e11d48"
                            trackColor="#f1f5f9"
                            text={`${Math.round(taskStats.tasksPercent)}%`}
                            subtext="Done"
                        />
                        <div className="flex-1">
                            <p className="text-2xl font-bold text-rose-900">{taskStats.tasksCompleted} / {taskStats.totalTasks}</p>
                            <p className="text-sm text-gray-500 mb-2">Tasks Completed</p>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div className="bg-rose-600 h-2.5 rounded-full" style={{ width: `${taskStats.tasksPercent}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Vendor Balance & Upcoming Tasks row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
                {/* Vendor Balance Summary */}
                {vendors.length > 0 && (
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-xl font-semibold text-rose-800 mb-4 flex items-center gap-2"><Briefcase className="w-5 h-5"/>Vendor Payments</h2>
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="text-center p-3 bg-rose-50 rounded-lg">
                                <p className="text-xl font-bold text-rose-900">{vendors.length}</p>
                                <p className="text-xs text-gray-500 mt-0.5">Vendors</p>
                            </div>
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                <p className="text-sm font-bold text-green-700">{currency(vendorStats.totalVendorPaid)}</p>
                                <p className="text-xs text-gray-500 mt-0.5">Paid</p>
                            </div>
                            <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                <p className="text-sm font-bold text-yellow-700">{currency(vendorStats.unpaidBalance)}</p>
                                <p className="text-xs text-gray-500 mt-0.5">Outstanding</p>
                            </div>
                        </div>
                        {vendorStats.unpaidVendors.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-gray-500 mb-2">Unpaid vendors:</p>
                                <ul className="space-y-1">
                                    {vendorStats.unpaidVendors.slice(0, 4).map(v => (
                                        <li key={v.id} className="flex justify-between text-sm">
                                            <span className="text-gray-700 truncate">{v.name}</span>
                                            <span className="text-yellow-600 font-medium ml-2 shrink-0">{currency((v.quoted || 0) - (v.paid || 0))}</span>
                                        </li>
                                    ))}
                                    {vendorStats.unpaidVendors.length > 4 && <li className="text-xs text-gray-400">+{vendorStats.unpaidVendors.length - 4} more</li>}
                                </ul>
                            </div>
                        )}
                        <button onClick={() => setCurrentView('vendors')} className="mt-3 text-sm font-medium text-rose-600 hover:text-rose-800">Manage Vendors &rarr;</button>
                    </div>
                )}

                {/* Quick Actions / To-Do */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold text-rose-800 mb-4">Upcoming Tasks</h2>
                    <ul className="space-y-3">
                        {taskStats.upcomingTasks.length === 0 && <p className="text-gray-500">All tasks completed! 🎉</p>}
                        {taskStats.upcomingTasks.map(task => (
                            <li key={task.id} className="flex items-center">
                                <input type="checkbox" id={`task-dash-${task.id}`} className="h-5 w-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500" defaultChecked={task.completed} disabled />
                                <label htmlFor={`task-dash-${task.id}`} className="ml-3 text-gray-700">{task.text} <span className="text-xs text-gray-400 ml-2">({task.timeline})</span></label>
                            </li>
                        ))}
                    </ul>
                    <button onClick={() => setCurrentView('checklist')} className="mt-4 text-sm font-medium text-rose-600 hover:text-rose-800">View All Tasks &rarr;</button>
                </div>
            </div>
        </>
    );
};

// --- Guest List Component ---
const GuestList = ({ guests, db, basePath }) => {
    const mealOptions = ['Beef', 'Chicken', 'Vegan', 'Kids'];

    const addGuest = async () => {
        if (!db || !basePath) return;
        const newGuest = {
            name: 'New Guest',
            phone: '',
            invited: false,
            rsvp: null,
            numPeople: 1,
            meal: null,
            side: null,
            createdAt: new Date().toISOString()
        };
        const guestsCol = collection(db, `${basePath}/guests`);
        try {
            await addDoc(guestsCol, newGuest);
        } catch (e) {
            console.error("Error adding guest: ", e);
        }
    };

    const updateGuest = async (id, field, value) => {
        if (!db || !basePath) return;
        const guestDoc = doc(db, `${basePath}/guests`, id);
        try {
            await setDoc(guestDoc, { [field]: value }, { merge: true });
        } catch (e) {
            console.error("Error updating guest: ", e);
        }
    };

    const deleteGuest = async (id) => {
        if (!db || !basePath) return;
        const guestDoc = doc(db, `${basePath}/guests`, id);
        try {
            await deleteDoc(guestDoc);
        } catch (e) {
            console.error("Error deleting guest: ", e);
        }
    };

    const sortedAndFilteredGuests = useMemo(() => {
        const sortedGuests = [...guests].sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return dateA - dateB;
        });
        return sortedGuests;
    }, [guests]);

    const totalGuests = useMemo(() => {
        return guests.reduce((sum, g) => sum + g.numPeople, 0);
    }, [guests]);

    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-rose-900">Guest List</h1>
                    <p className="text-gray-600 mt-1">Total Guests: <span className="font-semibold text-rose-700">{totalGuests}</span></p>
                </div>
                <button onClick={addGuest} className="bg-rose-600 text-white px-5 py-3 rounded-lg shadow-md hover:bg-rose-700 active:bg-rose-800 transition-colors flex items-center space-x-2 touch-manipulation w-full sm:w-auto justify-center">
                    <Plus className="w-5 h-5" />
                    <span className="font-medium">Add Guest</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Mobile Card View */}
                <div className="block md:hidden">
                    {sortedAndFilteredGuests.map(guest => (
                        <div key={guest.id} className="p-4 border-b border-rose-100 last:border-b-0">
                            <div className="flex justify-between items-start mb-3">
                                <input 
                                    type="text" 
                                    value={guest.name} 
                                    onChange={e => updateGuest(guest.id, 'name', e.target.value)} 
                                    className="text-lg font-semibold text-gray-900 flex-1 p-2 rounded border border-gray-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 mr-2" 
                                    placeholder="Guest name"
                                />
                                <button 
                                    onClick={() => deleteGuest(guest.id)} 
                                    className="text-gray-400 hover:text-red-600 p-2 touch-manipulation"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-medium text-gray-600 block mb-1">Phone</label>
                                    <input 
                                        type="tel" 
                                        value={guest.phone} 
                                        onChange={e => updateGuest(guest.id, 'phone', e.target.value)} 
                                        className="w-full p-2 rounded border border-gray-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-sm"
                                        placeholder="Phone number"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-medium text-gray-600 block mb-1">RSVP</label>
                                        <select 
                                            value={guest.rsvp || ''} 
                                            onChange={e => updateGuest(guest.id, 'rsvp', e.target.value || null)} 
                                            className="w-full p-2 rounded border border-gray-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-sm"
                                        >
                                            <option value="">-</option>
                                            <option value="yes">Yes</option>
                                            <option value="no">No</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-600 block mb-1">Side</label>
                                        <select 
                                            value={guest.side || ''} 
                                            onChange={e => updateGuest(guest.id, 'side', e.target.value || null)} 
                                            className="w-full p-2 rounded border border-gray-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-sm"
                                        >
                                            <option value="">-</option>
                                            <option value="Groom's">Groom's</option>
                                            <option value="Bride's">Bride's</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-medium text-gray-600 block mb-1">Number of People</label>
                                        <input 
                                            type="number" 
                                            value={guest.numPeople} 
                                            onChange={e => updateGuest(guest.id, 'numPeople', parseInt(e.target.value) || 0)} 
                                            className="w-full p-2 rounded border border-gray-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-sm font-medium"
                                            min="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-600 block mb-1">Invited</label>
                                        <div className="flex items-center h-full">
                                            <input 
                                                type="checkbox" 
                                                checked={guest.invited} 
                                                onChange={e => updateGuest(guest.id, 'invited', e.target.checked)} 
                                                className="h-6 w-6 rounded border-gray-300 text-rose-600 focus:ring-rose-500 touch-manipulation"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">{guest.invited ? 'Yes' : 'No'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-rose-100">
                            <tr>
                                <th className="p-4 font-semibold text-rose-800">Name</th>
                                <th className="p-4 font-semibold text-rose-800">Phone</th>
                                <th className="p-4 font-semibold text-rose-800">Invited</th>
                                <th className="p-4 font-semibold text-rose-800">#</th>
                                <th className="p-4 font-semibold text-rose-800">RSVP</th>
                                <th className="p-4 font-semibold text-rose-800">Side</th>
                                <th className="p-4 font-semibold text-rose-800"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedAndFilteredGuests.map(guest => (
                                <tr key={guest.id} className="border-b border-rose-100 last:border-b-0">
                                    <td className="p-3"><input type="text" value={guest.name} onChange={e => updateGuest(guest.id, 'name', e.target.value)} className="w-full p-1 rounded border-gray-300" /></td>
                                    <td className="p-3"><input type="text" value={guest.phone} onChange={e => updateGuest(guest.id, 'phone', e.target.value)} className="w-full p-1 rounded border-gray-300" /></td>
                                    <td className="p-3 text-center"><input type="checkbox" checked={guest.invited} onChange={e => updateGuest(guest.id, 'invited', e.target.checked)} className="h-5 w-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500" /></td>
                                    <td className="p-3"><input type="number" value={guest.numPeople} onChange={e => updateGuest(guest.id, 'numPeople', parseInt(e.target.value) || 0)} className="w-16 p-1 rounded border-gray-300" /></td>
                                    <td className="p-3">
                                        <select value={guest.rsvp || ''} onChange={e => updateGuest(guest.id, 'rsvp', e.target.value || null)} className="w-full p-1 rounded border-gray-300">
                                            <option value="">-</option>
                                            <option value="yes">Yes</option>
                                            <option value="no">No</option>
                                        </select>
                                    </td>
                                    <td className="p-3">
                                        <select value={guest.side || ''} onChange={e => updateGuest(guest.id, 'side', e.target.value || null)} className="w-full p-1 rounded border-gray-300">
                                            <option value="">-</option>
                                            <option value="Groom's">Groom's</option>
                                            <option value="Bride's">Bride's</option>
                                        </select>
                                    </td>
                                    <td className="p-3 text-center">
                                        <button onClick={() => deleteGuest(guest.id)} className="text-gray-400 hover:text-red-600 p-1">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

// --- Guest Row (Desktop) — must live OUTSIDE GuestTableManagement to keep stable identity ---
const GuestRowDesktop = ({ guest, updateGuest, deleteGuest, mealOptions, tableNumbers, getRSVPBadge }) => {
    const [localName, setLocalName] = useState(guest.name || '');
    const [localPhone, setLocalPhone] = useState(guest.phone || '');
    const [localNote, setLocalNote] = useState(guest.tableNote || '');
    const [localNum, setLocalNum] = useState(String(guest.numPeople ?? 1));

    // Sync from Firestore only when the field value actually changes externally
    useEffect(() => { setLocalName(guest.name || ''); }, [guest.name]);
    useEffect(() => { setLocalPhone(guest.phone || ''); }, [guest.phone]);
    useEffect(() => { setLocalNote(guest.tableNote || ''); }, [guest.tableNote]);
    useEffect(() => { setLocalNum(String(guest.numPeople ?? 1)); }, [guest.numPeople]);

    // tableNumber stored as Number in Firestore — normalise to string for select value
    const tableVal = guest.tableNumber != null ? String(guest.tableNumber) : '';

    return (
        <tr className="border-b border-rose-50 hover:bg-rose-50/40 transition-colors">
            <td className="p-2">
                <input type="text" value={localName}
                    onChange={e => setLocalName(e.target.value)}
                    onBlur={e => updateGuest(guest.id, 'name', e.target.value)}
                    className="w-full p-1.5 rounded border border-gray-200 focus:border-rose-400 focus:ring-1 focus:ring-rose-200 text-sm min-w-[120px]" />
            </td>
            <td className="p-2">
                <input type="text" value={localPhone}
                    onChange={e => setLocalPhone(e.target.value)}
                    onBlur={e => updateGuest(guest.id, 'phone', e.target.value)}
                    className="w-full p-1.5 rounded border border-gray-200 focus:border-rose-400 focus:ring-1 focus:ring-rose-200 text-sm min-w-[110px]" placeholder="-" />
            </td>
            <td className="p-2">
                <input type="number" value={localNum}
                    onChange={e => setLocalNum(e.target.value)}
                    onBlur={e => updateGuest(guest.id, 'numPeople', parseInt(e.target.value) || 1)}
                    className="w-14 p-1.5 rounded border border-gray-200 focus:border-rose-400 focus:ring-1 focus:ring-rose-200 text-sm" min="1" />
            </td>
            <td className="p-2">
                <select value={guest.side || ''} onChange={e => updateGuest(guest.id, 'side', e.target.value || null)} className="p-1.5 rounded border border-gray-200 focus:border-rose-400 text-sm">
                    <option value="">-</option>
                    <option value="Groom's">Groom's</option>
                    <option value="Bride's">Bride's</option>
                </select>
            </td>
            <td className="p-2">
                <select value={guest.meal || ''} onChange={e => updateGuest(guest.id, 'meal', e.target.value || null)} className="p-1.5 rounded border border-gray-200 focus:border-rose-400 text-sm">
                    <option value="">-</option>
                    {mealOptions.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
            </td>
            <td className="p-2">
                {getRSVPBadge(guest.rsvp)}
                <select value={guest.rsvp || ''} onChange={e => updateGuest(guest.id, 'rsvp', e.target.value || null)} className="mt-1 p-1 rounded border border-gray-200 focus:border-rose-400 text-xs w-full">
                    <option value="">-</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                </select>
            </td>
            <td className="p-2">
                <select
                    value={tableVal}
                    onChange={e => updateGuest(guest.id, 'tableNumber', e.target.value ? Number(e.target.value) : null)}
                    className="p-1.5 rounded border border-gray-200 focus:border-rose-400 text-sm"
                >
                    <option value="">-</option>
                    {tableNumbers.map(t => <option key={t} value={String(t)}>Table {t}</option>)}
                </select>
            </td>
            <td className="p-2">
                <input type="text" value={localNote}
                    onChange={e => setLocalNote(e.target.value)}
                    onBlur={e => updateGuest(guest.id, 'tableNote', e.target.value)}
                    className="w-full p-1.5 rounded border border-gray-200 focus:border-rose-400 text-sm min-w-[120px]" placeholder="Note..." />
            </td>
            <td className="p-2 text-center">
                <input type="checkbox" checked={!!guest.invited} onChange={e => updateGuest(guest.id, 'invited', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500" />
            </td>
            <td className="p-2 text-center">
                <button onClick={() => deleteGuest(guest.id)} className="text-gray-400 hover:text-red-600 p-1 transition-colors">
                    <Trash2 className="w-4 h-4" />
                </button>
            </td>
        </tr>
    );
};

// --- Guest Card (Mobile) — must live OUTSIDE GuestTableManagement ---
const GuestCardMobile = ({ guest, updateGuest, deleteGuest, mealOptions, tableNumbers }) => {
    const [localName, setLocalName] = useState(guest.name || '');
    const [localPhone, setLocalPhone] = useState(guest.phone || '');
    const [localNote, setLocalNote] = useState(guest.tableNote || '');
    const [localNum, setLocalNum] = useState(String(guest.numPeople ?? 1));

    useEffect(() => { setLocalName(guest.name || ''); }, [guest.name]);
    useEffect(() => { setLocalPhone(guest.phone || ''); }, [guest.phone]);
    useEffect(() => { setLocalNote(guest.tableNote || ''); }, [guest.tableNote]);
    useEffect(() => { setLocalNum(String(guest.numPeople ?? 1)); }, [guest.numPeople]);

    const tableVal = guest.tableNumber != null ? String(guest.tableNumber) : '';

    return (
        <div className="p-4 border-b border-rose-100 last:border-b-0">
            <div className="flex justify-between items-start mb-3">
                <input type="text" value={localName}
                    onChange={e => setLocalName(e.target.value)}
                    onBlur={e => updateGuest(guest.id, 'name', e.target.value)}
                    className="text-lg font-semibold text-gray-900 flex-1 p-2 rounded border border-gray-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 mr-2"
                    placeholder="Guest name" />
                <button onClick={() => deleteGuest(guest.id)} className="text-gray-400 hover:text-red-600 p-2 touch-manipulation">
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>
            <div className="space-y-3">
                <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Phone</label>
                    <input type="tel" value={localPhone}
                        onChange={e => setLocalPhone(e.target.value)}
                        onBlur={e => updateGuest(guest.id, 'phone', e.target.value)}
                        className="w-full p-2 rounded border border-gray-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-sm" placeholder="Phone number" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">RSVP</label>
                        <select value={guest.rsvp || ''} onChange={e => updateGuest(guest.id, 'rsvp', e.target.value || null)} className="w-full p-2 rounded border border-gray-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-sm">
                            <option value="">-</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">Side</label>
                        <select value={guest.side || ''} onChange={e => updateGuest(guest.id, 'side', e.target.value || null)} className="w-full p-2 rounded border border-gray-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-sm">
                            <option value="">-</option>
                            <option value="Groom's">Groom's</option>
                            <option value="Bride's">Bride's</option>
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1"># People</label>
                        <input type="number" value={localNum}
                            onChange={e => setLocalNum(e.target.value)}
                            onBlur={e => updateGuest(guest.id, 'numPeople', parseInt(e.target.value) || 1)}
                            className="w-full p-2 rounded border border-gray-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-sm" min="1" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">Table #</label>
                        <select
                            value={tableVal}
                            onChange={e => updateGuest(guest.id, 'tableNumber', e.target.value ? Number(e.target.value) : null)}
                            className="w-full p-2 rounded border border-gray-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-sm"
                        >
                            <option value="">-</option>
                            {tableNumbers.map(t => <option key={t} value={String(t)}>Table {t}</option>)}
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">Meal</label>
                        <select value={guest.meal || ''} onChange={e => updateGuest(guest.id, 'meal', e.target.value || null)} className="w-full p-2 rounded border border-gray-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-sm">
                            <option value="">-</option>
                            {mealOptions.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-600 block mb-1">Invited</label>
                        <div className="flex items-center h-full pt-1">
                            <input type="checkbox" checked={!!guest.invited} onChange={e => updateGuest(guest.id, 'invited', e.target.checked)} className="h-5 w-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500" />
                            <span className="ml-2 text-sm text-gray-700">{guest.invited ? 'Yes' : 'No'}</span>
                        </div>
                    </div>
                </div>
                <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Note</label>
                    <input type="text" value={localNote}
                        onChange={e => setLocalNote(e.target.value)}
                        onBlur={e => updateGuest(guest.id, 'tableNote', e.target.value)}
                        className="w-full p-2 rounded border border-gray-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-sm" placeholder="Dietary, accessibility, etc." />
                </div>
            </div>
        </div>
    );
};

// --- CSV export helper ---
const downloadCSV = (filename, rows) => {
    const escape = (v) => {
        const s = v == null ? '' : String(v);
        return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = rows.map(r => r.map(escape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// --- Guest Table Management Component ---
const GuestTableManagement = ({ guests, db, basePath, tableConfig }) => {
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'tables' | 'stats'
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRSVP, setFilterRSVP] = useState('');
    const [filterSide, setFilterSide] = useState('');
    const [filterTable, setFilterTable] = useState('');
    const [sortField, setSortField] = useState('name');
    const [sortDir, setSortDir] = useState('asc');
    const [tableCount, setTableCount] = useState(tableConfig?.tableCount ?? 10);
    const [tableCapacity, setTableCapacity] = useState(tableConfig?.tableCapacity ?? 8);
    const [tableCapacities, setTableCapacities] = useState(tableConfig?.tableCapacities ?? {});

    // Sync from Firestore when tableConfig prop changes (e.g. on initial load)
    useEffect(() => {
        if (tableConfig) {
            setTableCount(tableConfig.tableCount ?? 10);
            setTableCapacity(tableConfig.tableCapacity ?? 8);
            setTableCapacities(tableConfig.tableCapacities ?? {});
        }
    }, [tableConfig]);

    // Returns the effective capacity for a given table number
    const getTableCapacity = (tableNum) => tableCapacities[tableNum] ?? tableCapacity;

    const saveTableConfig = async (count, capacity, capacities) => {
        if (!db || !basePath) return;
        try {
            await setDoc(doc(db, `${basePath}/config`, 'tables'), {
                tableCount: count,
                tableCapacity: capacity,
                tableCapacities: capacities ?? tableCapacities,
            }, { merge: true });
        } catch (e) {
            console.error('Error saving table config: ', e);
        }
    };

    const updateTableCapacity = (tableNum, value) => {
        const updated = { ...tableCapacities, [tableNum]: value };
        setTableCapacities(updated);
        saveTableConfig(tableCount, tableCapacity, updated);
    };

    const mealOptions = ['Beef', 'Chicken', 'Vegan', 'Kids'];

    const addGuest = async () => {
        if (!db || !basePath) return;
        const newGuest = {
            name: 'New Guest',
            phone: '',
            invited: false,
            rsvp: null,
            numPeople: 1,
            meal: null,
            side: null,
            tableNumber: null,
            tableNote: '',
            createdAt: new Date().toISOString()
        };
        try {
            await addDoc(collection(db, `${basePath}/guests`), newGuest);
        } catch (e) {
            console.error('Error adding guest: ', e);
        }
    };

    const updateGuest = async (id, field, value) => {
        if (!db || !basePath) return;
        try {
            await setDoc(doc(db, `${basePath}/guests`, id), { [field]: value }, { merge: true });
        } catch (e) {
            console.error('Error updating guest: ', e);
        }
    };

    const deleteGuest = async (id) => {
        if (!db || !basePath) return;
        try {
            await deleteDoc(doc(db, `${basePath}/guests`, id));
        } catch (e) {
            console.error('Error deleting guest: ', e);
        }
    };

    const toggleSort = (field) => {
        if (sortField === field) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('asc');
        }
    };

    const SortIcon = ({ field }) => {
        if (sortField !== field) return <ChevronDown className="w-3 h-3 text-gray-400 inline ml-1" />;
        return sortDir === 'asc'
            ? <ChevronUp className="w-3 h-3 text-rose-600 inline ml-1" />
            : <ChevronDown className="w-3 h-3 text-rose-600 inline ml-1" />;
    };

    const filteredAndSorted = useMemo(() => {
        let list = [...guests];
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(g =>
                g.name.toLowerCase().includes(q) ||
                (g.phone || '').toLowerCase().includes(q)
            );
        }
        if (filterRSVP) {
            if (filterRSVP === 'yes') list = list.filter(g => g.rsvp === 'yes');
            else if (filterRSVP === 'no') list = list.filter(g => g.rsvp === 'no');
            else if (filterRSVP === 'pending') list = list.filter(g => !g.rsvp);
        }
        if (filterSide) list = list.filter(g => g.side === filterSide);
        if (filterTable) {
            if (filterTable === 'unassigned') list = list.filter(g => !g.tableNumber);
            else list = list.filter(g => String(g.tableNumber) === filterTable);
        }
        list.sort((a, b) => {
            let valA = a[sortField] ?? '';
            let valB = b[sortField] ?? '';
            if (sortField === 'tableNumber') {
                valA = Number(valA) || 9999;
                valB = Number(valB) || 9999;
            } else if (sortField === 'numPeople') {
                valA = Number(valA);
                valB = Number(valB);
            } else {
                valA = String(valA).toLowerCase();
                valB = String(valB).toLowerCase();
            }
            if (valA < valB) return sortDir === 'asc' ? -1 : 1;
            if (valA > valB) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
        return list;
    }, [guests, searchQuery, filterRSVP, filterSide, filterTable, sortField, sortDir]);

    // Stats
    const stats = useMemo(() => {
        const total = guests.reduce((s, g) => s + (g.numPeople || 1), 0);
        const invited = guests.filter(g => g.invited).reduce((s, g) => s + (g.numPeople || 1), 0);
        const confirmed = guests.filter(g => g.rsvp === 'yes').reduce((s, g) => s + (g.numPeople || 1), 0);
        const declined = guests.filter(g => g.rsvp === 'no').reduce((s, g) => s + (g.numPeople || 1), 0);
        const pending = guests.filter(g => g.invited && !g.rsvp).reduce((s, g) => s + (g.numPeople || 1), 0);
        const assigned = guests.filter(g => g.tableNumber).reduce((s, g) => s + (g.numPeople || 1), 0);
        const unassigned = confirmed - assigned < 0 ? 0 : confirmed - assigned;
        const groomSide = guests.filter(g => g.side === "Groom's").reduce((s, g) => s + (g.numPeople || 1), 0);
        const brideSide = guests.filter(g => g.side === "Bride's").reduce((s, g) => s + (g.numPeople || 1), 0);
        // meal breakdown
        const meals = {};
        mealOptions.forEach(m => {
            meals[m] = guests.filter(g => g.meal === m).reduce((s, g) => s + (g.numPeople || 1), 0);
        });
        return { total, invited, confirmed, declined, pending, assigned, unassigned, groomSide, brideSide, meals };
    }, [guests]);

    // Table groups for the Table Assignment tab
    const tableGroups = useMemo(() => {
        const tables = {};
        for (let t = 1; t <= tableCount; t++) {
            tables[t] = guests.filter(g => Number(g.tableNumber) === t);
        }
        tables['unassigned'] = guests.filter(g => !g.tableNumber);
        return tables;
    }, [guests, tableCount]);

    const getRSVPBadge = (rsvp) => {
        if (rsvp === 'yes') return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1"><UserCheck className="w-3 h-3"/>Yes</span>;
        if (rsvp === 'no') return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1"><UserX className="w-3 h-3"/>No</span>;
        return <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs font-medium flex items-center gap-1"><HelpCircle className="w-3 h-3"/>-</span>;
    };

    const tableNumbers = Array.from({ length: tableCount }, (_, i) => i + 1);
    const [dragOverTable, setDragOverTable] = useState(null);

    return (
        <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-rose-900">Guest Table Management</h1>
                    <p className="text-gray-600 mt-1">
                        <span className="font-semibold text-rose-700">{guests.length}</span> entries &nbsp;·&nbsp;
                        <span className="font-semibold text-green-600">{stats.confirmed}</span> confirmed &nbsp;·&nbsp;
                        <span className="font-semibold text-gray-500">{stats.pending}</span> pending
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap w-full sm:w-auto">
                    <button
                        onClick={() => {
                            const headers = ['Name', 'Phone', 'RSVP', 'Side', 'Meal', 'Table', 'People', 'Note', 'Invited'];
                            const rows = guests.map(g => [g.name, g.phone, g.rsvp || '', g.side || '', g.meal || '', g.tableNumber || '', g.numPeople, g.tableNote || '', g.invited ? 'Yes' : 'No']);
                            downloadCSV('guest-list.csv', [headers, ...rows]);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors"
                    >
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                    <button
                        onClick={addGuest}
                        className="bg-rose-600 text-white px-5 py-3 rounded-lg shadow-md hover:bg-rose-700 active:bg-rose-800 transition-colors flex items-center space-x-2 touch-manipulation justify-center"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="font-medium">Add Guest</span>
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-rose-200">
                {[
                    { key: 'all', label: 'All Guests', icon: Users },
                    { key: 'tables', label: 'Table Assignment', icon: Table2 },
                    { key: 'stats', label: 'Statistics', icon: BarChart2 },
                ].map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                            activeTab === key
                                ? 'border-rose-600 text-rose-700 bg-rose-50'
                                : 'border-transparent text-gray-500 hover:text-rose-600 hover:bg-rose-50'
                        }`}
                    >
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{label}</span>
                    </button>
                ))}
            </div>

            {/* === Tab: All Guests === */}
            {activeTab === 'all' && (
                <>
                    {/* Search & Filters */}
                    <div className="bg-white rounded-xl shadow-sm border border-rose-100 p-4 mb-5">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search by name or phone..."
                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                                />
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                <select
                                    value={filterRSVP}
                                    onChange={e => setFilterRSVP(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                                >
                                    <option value="">All RSVP</option>
                                    <option value="yes">Confirmed</option>
                                    <option value="no">Declined</option>
                                    <option value="pending">Pending</option>
                                </select>
                                <select
                                    value={filterSide}
                                    onChange={e => setFilterSide(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                                >
                                    <option value="">All Sides</option>
                                    <option value="Groom's">Groom's</option>
                                    <option value="Bride's">Bride's</option>
                                </select>
                                <select
                                    value={filterTable}
                                    onChange={e => setFilterTable(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                                >
                                    <option value="">All Tables</option>
                                    <option value="unassigned">Unassigned</option>
                                    {tableNumbers.map(t => (
                                        <option key={t} value={String(t)}>Table {t}</option>
                                    ))}
                                </select>
                                {(searchQuery || filterRSVP || filterSide || filterTable) && (
                                    <button
                                        onClick={() => { setSearchQuery(''); setFilterRSVP(''); setFilterSide(''); setFilterTable(''); }}
                                        className="px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Showing {filteredAndSorted.length} of {guests.length} guests</p>
                    </div>

                    {/* Mobile Card View */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        <div className="block md:hidden">
                            {filteredAndSorted.length === 0 ? (
                                <p className="p-6 text-center text-gray-500">No guests found.</p>
                            ) : filteredAndSorted.map(guest => (
                                <GuestCardMobile key={guest.id} guest={guest} updateGuest={updateGuest} deleteGuest={deleteGuest} mealOptions={mealOptions} tableNumbers={tableNumbers} />
                            ))}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            {filteredAndSorted.length === 0 ? (
                                <p className="p-8 text-center text-gray-500">No guests match the current filters.</p>
                            ) : (
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-rose-50 border-b border-rose-200">
                                        <tr>
                                            {[
                                                { label: 'Name', field: 'name' },
                                                { label: 'Phone', field: 'phone' },
                                                { label: '#', field: 'numPeople' },
                                                { label: 'Side', field: 'side' },
                                                { label: 'Meal', field: 'meal' },
                                                { label: 'RSVP', field: 'rsvp' },
                                                { label: 'Table', field: 'tableNumber' },
                                                { label: 'Note', field: null },
                                                { label: 'Invited', field: 'invited' },
                                            ].map(({ label, field }) => (
                                                <th
                                                    key={label}
                                                    className={`p-3 font-semibold text-rose-800 ${field ? 'cursor-pointer select-none hover:bg-rose-100' : ''}`}
                                                    onClick={() => field && toggleSort(field)}
                                                >
                                                    {label}{field && <SortIcon field={field} />}
                                                </th>
                                            ))}
                                            <th className="p-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAndSorted.map(guest => (
                                            <GuestRowDesktop key={guest.id} guest={guest} updateGuest={updateGuest} deleteGuest={deleteGuest} mealOptions={mealOptions} tableNumbers={tableNumbers} getRSVPBadge={getRSVPBadge} />
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* === Tab: Table Assignment === */}
            {activeTab === 'tables' && (
                <>
                    <div className="bg-white rounded-xl shadow-sm border border-rose-100 p-4 mb-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-medium text-gray-700">Number of Tables:</label>
                            <input
                                type="number"
                                value={tableCount}
                                onChange={e => setTableCount(Math.max(1, parseInt(e.target.value) || 1))}
                                onBlur={e => {
                                    const val = Math.max(1, parseInt(e.target.value) || 1);
                                    setTableCount(val);
                                    saveTableConfig(val, tableCapacity, tableCapacities);
                                }}
                                className="w-20 p-2 border border-gray-300 rounded-lg text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                                min="1"
                                max="50"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-medium text-gray-700">Seats per Table:</label>
                            <input
                                type="number"
                                value={tableCapacity}
                                onChange={e => setTableCapacity(Math.max(1, parseInt(e.target.value) || 1))}
                                onBlur={e => {
                                    const val = Math.max(1, parseInt(e.target.value) || 1);
                                    setTableCapacity(val);
                                    saveTableConfig(tableCount, val, tableCapacities);
                                }}
                                className="w-20 p-2 border border-gray-300 rounded-lg text-sm focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                                min="1"
                            />
                        </div>
                        <p className="text-sm text-gray-500 ml-auto">
                            Total capacity: <span className="font-semibold text-rose-700">{tableNumbers.reduce((sum, t) => sum + getTableCapacity(t), 0)}</span> seats
                        </p>
                    </div>

                    <p className="text-xs text-gray-400 mb-3">Drag guests from the Unassigned section onto a table to assign them.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tableNumbers.map(t => {
                            const tableGuests = tableGroups[t] || [];
                            const seatedCount = tableGuests.reduce((s, g) => s + (g.numPeople || 1), 0);
                            const thisCapacity = getTableCapacity(t);
                            const isFull = seatedCount >= thisCapacity;
                            const isOver = seatedCount > thisCapacity;
                            const isDropTarget = dragOverTable === t;
                            return (
                                <div
                                    key={t}
                                    className={`bg-white rounded-xl shadow-md border-2 p-4 transition-colors ${isDropTarget ? 'border-rose-500 bg-rose-50 scale-[1.02]' : isOver ? 'border-red-400' : isFull ? 'border-orange-400' : 'border-rose-100'}`}
                                    onDragOver={e => { e.preventDefault(); setDragOverTable(t); }}
                                    onDragLeave={() => setDragOverTable(null)}
                                    onDrop={e => {
                                        e.preventDefault();
                                        setDragOverTable(null);
                                        const guestId = e.dataTransfer.getData('guestId');
                                        if (guestId) updateGuest(guestId, 'tableNumber', t);
                                    }}
                                >
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="font-bold text-rose-800 text-lg">Table {t}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isOver ? 'bg-red-100 text-red-700' : isFull ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                                {seatedCount}/{thisCapacity}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
                                        <label className="text-xs text-gray-500 whitespace-nowrap">Seats:</label>
                                        <input
                                            type="number"
                                            value={tableCapacities[t] ?? tableCapacity}
                                            onChange={e => {
                                                const val = Math.max(1, parseInt(e.target.value) || 1);
                                                setTableCapacities(prev => ({ ...prev, [t]: val }));
                                            }}
                                            onBlur={e => {
                                                const val = Math.max(1, parseInt(e.target.value) || 1);
                                                updateTableCapacity(t, val);
                                            }}
                                            className="w-16 p-1 text-xs border border-gray-300 rounded focus:border-rose-400 focus:ring-1 focus:ring-rose-200"
                                            min="1"
                                            max="100"
                                        />
                                        {tableCapacities[t] !== undefined && tableCapacities[t] !== tableCapacity && (
                                            <button
                                                onClick={() => {
                                                    const updated = { ...tableCapacities };
                                                    delete updated[t];
                                                    setTableCapacities(updated);
                                                    saveTableConfig(tableCount, tableCapacity, updated);
                                                }}
                                                className="text-xs text-gray-400 hover:text-rose-500 transition-colors"
                                                title="Reset to default"
                                            >
                                                reset
                                            </button>
                                        )}
                                    </div>
                                    {tableGuests.length === 0 ? (
                                        <p className="text-sm text-gray-400 italic">No guests assigned</p>
                                    ) : (
                                        <ul className="space-y-2">
                                            {tableGuests.map(g => (
                                                <li key={g.id} className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        {getRSVPBadge(g.rsvp)}
                                                        <span className="text-gray-800 font-medium">{g.name}</span>
                                                        {g.numPeople > 1 && <span className="text-gray-400 text-xs">×{g.numPeople}</span>}
                                                    </div>
                                                    <button
                                                        onClick={() => updateGuest(g.id, 'tableNumber', null)}
                                                        className="text-gray-300 hover:text-red-500 transition-colors p-0.5"
                                                        title="Remove from table"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            );
                        })}

                        {/* Unassigned */}
                        {tableGroups['unassigned']?.length > 0 && (
                            <div className="bg-white rounded-xl shadow-md border-2 border-dashed border-gray-300 p-4 sm:col-span-2 lg:col-span-3">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="font-bold text-gray-600 text-lg">Unassigned Guests</h3>
                                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                                        {tableGroups['unassigned'].reduce((s, g) => s + (g.numPeople || 1), 0)} guests
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {tableGroups['unassigned'].map(g => (
                                        <div
                                            key={g.id}
                                            draggable
                                            onDragStart={e => { e.dataTransfer.setData('guestId', g.id); e.dataTransfer.effectAllowed = 'move'; }}
                                            className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm cursor-grab active:cursor-grabbing hover:border-rose-300 hover:bg-rose-50 transition-colors"
                                            title="Drag to assign to a table"
                                        >
                                            <span className="text-gray-400 text-xs">⠿</span>
                                            <span className="text-gray-700 font-medium">{g.name}</span>
                                            {g.numPeople > 1 && <span className="text-gray-400 text-xs">×{g.numPeople}</span>}
                                            <select
                                                value=""
                                                onChange={e => e.target.value && updateGuest(g.id, 'tableNumber', Number(e.target.value))}
                                                className="ml-1 p-0.5 border border-gray-300 rounded text-xs focus:border-rose-400"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <option value="">Assign →</option>
                                                {tableNumbers.map(t => <option key={t} value={t}>Table {t}</option>)}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* === Tab: Statistics === */}
            {activeTab === 'stats' && (
                <div className="space-y-6">
                    {/* Top summary row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: 'Tables', value: tableCount, color: 'bg-rose-50 text-rose-700 border-rose-200' },
                            { label: 'Total Capacity', value: tableNumbers.reduce((sum, t) => sum + getTableCapacity(t), 0), color: 'bg-purple-50 text-purple-700 border-purple-200' },
                            { label: 'Seated', value: stats.assigned, color: 'bg-green-50 text-green-700 border-green-200' },
                            { label: 'Unassigned', value: tableGroups['unassigned']?.reduce((s, g) => s + (g.numPeople || 1), 0) || 0, color: 'bg-orange-50 text-orange-700 border-orange-200' },
                        ].map(({ label, value, color }) => (
                            <div key={label} className={`text-center rounded-xl border p-4 ${color}`}>
                                <p className="text-3xl font-bold">{value}</p>
                                <p className="text-xs font-medium mt-1 opacity-80">{label}</p>
                            </div>
                        ))}
                    </div>

                    {/* RSVP + Sides row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* RSVP Summary */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-lg font-bold text-rose-800 mb-4 flex items-center gap-2"><BarChart2 className="w-5 h-5"/>RSVP Summary</h2>
                            <div className="space-y-3">
                                {[
                                    { label: 'Total Invited', value: stats.invited, color: 'bg-rose-500' },
                                    { label: 'Confirmed', value: stats.confirmed, color: 'bg-green-500' },
                                    { label: 'Declined', value: stats.declined, color: 'bg-red-500' },
                                    { label: 'Awaiting Response', value: stats.pending, color: 'bg-yellow-400' },
                                ].map(({ label, value, color }) => (
                                    <div key={label}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-700">{label}</span>
                                            <span className="font-semibold text-gray-900">{value}</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${color} rounded-full transition-all`}
                                                style={{ width: stats.invited > 0 ? `${(value / stats.invited) * 100}%` : '0%' }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Side breakdown */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-lg font-bold text-rose-800 mb-4 flex items-center gap-2"><Users className="w-5 h-5"/>Guest Sides</h2>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <p className="text-3xl font-bold text-blue-700">{stats.groomSide}</p>
                                    <p className="text-sm text-gray-600 mt-1">Groom's Side</p>
                                </div>
                                <div className="bg-rose-50 rounded-lg p-4">
                                    <p className="text-3xl font-bold text-rose-700">{stats.brideSide}</p>
                                    <p className="text-sm text-gray-600 mt-1">Bride's Side</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-3xl font-bold text-gray-600">{stats.total - stats.groomSide - stats.brideSide}</p>
                                    <p className="text-sm text-gray-600 mt-1">Unspecified</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table Arrangement Layout */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-lg font-bold text-rose-800 mb-2 flex items-center gap-2">
                            <Table2 className="w-5 h-5" />
                            Table Arrangement
                        </h2>
                        <p className="text-xs text-gray-400 mb-5">Visual layout of all tables — hover a table to see guests</p>

                        {/* Legend */}
                        <div className="flex flex-wrap gap-4 mb-5 text-xs">
                            {[
                                { color: 'bg-green-400', label: 'Available seats' },
                                { color: 'bg-rose-400', label: 'Occupied seats' },
                                { color: 'bg-orange-400', label: 'Full table' },
                                { color: 'bg-red-500', label: 'Over capacity' },
                            ].map(({ color, label }) => (
                                <div key={label} className="flex items-center gap-1.5">
                                    <span className={`w-3 h-3 rounded-full ${color} inline-block`} />
                                    <span className="text-gray-600">{label}</span>
                                </div>
                            ))}
                        </div>

                        {/* Table grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {tableNumbers.map(t => {
                                const tGuests = tableGroups[t] || [];
                                const seated = tGuests.reduce((s, g) => s + (g.numPeople || 1), 0);
                                const cap = getTableCapacity(t);
                                const isOver = seated > cap;
                                const isFull = seated === cap && cap > 0;
                                const fillPct = cap > 0 ? Math.min(100, (seated / cap) * 100) : 0;

                                // Seat dots: up to 16 shown, rest summarised
                                const dotCount = Math.min(cap, 16);
                                const dots = Array.from({ length: dotCount }, (_, i) => i < seated);

                                return (
                                    <div
                                        key={t}
                                        className="group relative flex flex-col items-center cursor-default select-none"
                                    >
                                        {/* Table circle */}
                                        <div className={`relative w-20 h-20 rounded-full border-4 flex flex-col items-center justify-center shadow-md transition-transform group-hover:scale-105
                                            ${isOver ? 'border-red-500 bg-red-50' : isFull ? 'border-orange-400 bg-orange-50' : 'border-rose-300 bg-rose-50'}`}
                                        >
                                            <span className="text-xs font-bold text-gray-700 leading-none">T{t}</span>
                                            <span className={`text-[11px] font-semibold mt-0.5 ${isOver ? 'text-red-600' : isFull ? 'text-orange-600' : 'text-green-600'}`}>
                                                {seated}/{cap}
                                            </span>
                                            {/* Fill arc overlay */}
                                            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                                                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                                                <circle
                                                    cx="18" cy="18" r="15.9" fill="none"
                                                    stroke={isOver ? '#ef4444' : isFull ? '#fb923c' : '#34d399'}
                                                    strokeWidth="3"
                                                    strokeDasharray={`${fillPct} 100`}
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                        </div>

                                        {/* Seat dots */}
                                        <div className="flex flex-wrap justify-center gap-0.5 mt-2 w-20">
                                            {dots.map((occupied, i) => (
                                                <span
                                                    key={i}
                                                    className={`w-2 h-2 rounded-full ${occupied ? (isOver && i >= cap ? 'bg-red-500' : 'bg-rose-400') : 'bg-gray-200'}`}
                                                />
                                            ))}
                                            {cap > 16 && (
                                                <span className="text-[9px] text-gray-400 w-full text-center">+{cap - 16} more</span>
                                            )}
                                        </div>

                                        {/* Hover tooltip with guest names */}
                                        {tGuests.length > 0 && (
                                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 hidden group-hover:block w-44 bg-gray-900 text-white text-xs rounded-lg shadow-xl p-2.5">
                                                <p className="font-semibold text-rose-300 mb-1.5 border-b border-gray-700 pb-1">Table {t} guests</p>
                                                <ul className="space-y-0.5 max-h-40 overflow-y-auto">
                                                    {tGuests.map(g => (
                                                        <li key={g.id} className="flex items-center justify-between gap-1">
                                                            <span className="truncate">{g.name}</span>
                                                            <span className={`shrink-0 px-1 rounded text-[10px] font-medium ${g.rsvp === 'yes' ? 'bg-green-700 text-green-200' : g.rsvp === 'no' ? 'bg-red-800 text-red-200' : 'bg-gray-600 text-gray-300'}`}>
                                                                {g.rsvp === 'yes' ? '✓' : g.rsvp === 'no' ? '✗' : '?'}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                                {/* Arrow */}
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
                                            </div>
                                        )}
                                        {tGuests.length === 0 && (
                                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 hidden group-hover:block w-28 bg-gray-900 text-white text-xs rounded-lg shadow-xl p-2 text-center">
                                                <span className="text-gray-400 italic">No guests yet</span>
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Occupancy progress bar */}
                        <div className="mt-6 pt-5 border-t border-gray-100">
                            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                                <span>Overall occupancy</span>
                                <span className="font-semibold text-gray-700">
                                    {stats.assigned} / {tableNumbers.reduce((sum, t) => sum + getTableCapacity(t), 0)} seats filled
                                </span>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                {(() => {
                                    const totalCap = tableNumbers.reduce((sum, t) => sum + getTableCapacity(t), 0);
                                    const pct = totalCap > 0 ? Math.min(100, (stats.assigned / totalCap) * 100) : 0;
                                    return (
                                        <div
                                            className="h-full rounded-full transition-all"
                                            style={{
                                                width: `${pct}%`,
                                                background: pct >= 100 ? '#ef4444' : pct >= 80 ? '#fb923c' : '#34d399'
                                            }}
                                        />
                                    );
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* Meal breakdown */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-lg font-bold text-rose-800 mb-4">Meal Preferences</h2>
                        <div className="space-y-3">
                            {mealOptions.map(meal => (
                                <div key={meal} className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700">{meal}</span>
                                    <div className="flex items-center gap-3 flex-1 ml-4">
                                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-rose-400 rounded-full transition-all"
                                                style={{ width: stats.confirmed > 0 ? `${(stats.meals[meal] / stats.confirmed) * 100}%` : '0%' }}
                                            />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-700 w-8 text-right">{stats.meals[meal]}</span>
                                    </div>
                                </div>
                            ))}
                            <p className="text-xs text-gray-400 mt-2">Based on confirmed guest count</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// --- Budget Component ---
const Budget = ({ budgetItems, totalBudget, db, basePath }) => {
    const categoryOptions = ['Ceremony', 'Reception', 'Flowers', 'Attire', 'Other'];

    const budgetTotals = useMemo(() => {
        const totalCost = budgetItems.reduce((sum, item) => sum + item.cost, 0);
        const totalPaid = budgetItems.reduce((sum, item) => sum + item.paid, 0);
        const balanceDue = totalCost - totalPaid;
        const remainingBudget = totalBudget - totalCost;
        return { totalCost, totalPaid, balanceDue, remainingBudget };
    }, [budgetItems, totalBudget]);
    
    const addBudgetItem = async () => {
        if (!db || !basePath) return;
        const newItem = { type: 'New Item', category: 'Other', cost: 0, paid: 0 };
        const itemsCol = collection(db, `${basePath}/budgetItems`);
        try {
            await addDoc(itemsCol, newItem);
        } catch (e) {
            console.error("Error adding budget item: ", e);
        }
    };

    const updateBudgetItem = async (id, field, value) => {
        if (!db || !basePath) return;
        const itemDoc = doc(db, `${basePath}/budgetItems`, id);
        try {
            await setDoc(itemDoc, { [field]: value }, { merge: true });
        } catch (e) {
            console.error("Error updating budget item: ", e);
        }
    };

    const deleteBudgetItem = async (id) => {
        if (!db || !basePath) return;
        const itemDoc = doc(db, `${basePath}/budgetItems`, id);
        try {
            await deleteDoc(itemDoc);
        } catch (e) {
            console.error("Error deleting budget item: ", e);
        }
    };

    const updateTotalBudget = async (newAmount) => {
        if (!db || !basePath) return;
        const configDoc = doc(db, `${basePath}/config`, 'budget');
        try {
            await setDoc(configDoc, { amount: newAmount }, { merge: true });
        } catch (e) {
            console.error("Error updating total budget: ", e);
        }
    };

    return (
        <>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-rose-900 mb-6 md:mb-8">Budget Tracker</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 md:mb-8">
                <div className="bg-white p-5 sm:p-6 rounded-xl shadow-lg">
                    <label htmlFor="totalBudget" className="text-sm font-medium text-rose-800 block mb-1">Total Budget</label>
                    <input
                        type="number"
                        id="totalBudget"
                        value={totalBudget}
                        onChange={e => updateTotalBudget(parseFloat(e.target.value) || 0)}
                        className="text-2xl sm:text-3xl font-bold text-rose-900 w-full p-2 rounded border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                    />
                </div>
                <div className="bg-white p-5 sm:p-6 rounded-xl shadow-lg">
                    <p className="text-sm font-medium text-rose-800 mb-1">Remaining Budget</p>
                    <p className={`text-2xl sm:text-3xl font-bold ${budgetTotals.remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>{currency(budgetTotals.remainingBudget)}</p>
                </div>
                <div className="bg-white p-5 sm:p-6 rounded-xl shadow-lg">
                    <p className="text-sm font-medium text-rose-800 mb-1">Already Paid</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-700">{currency(budgetTotals.totalPaid)}</p>
                </div>
                <div className="bg-white p-5 sm:p-6 rounded-xl shadow-lg">
                    <p className="text-sm font-medium text-rose-800 mb-1">Balance Due</p>
                    <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{currency(budgetTotals.balanceDue)}</p>
                </div>
            </div>

            <div className="flex justify-end gap-3 mb-4">
                <button
                    onClick={() => {
                        const headers = ['Type', 'Category', 'Cost (LKR)', 'Paid (LKR)', 'Balance Due (LKR)'];
                        const rows = budgetItems.map(i => [i.type, i.category, i.cost, i.paid, i.cost - i.paid]);
                        downloadCSV('budget.csv', [headers, ...rows]);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors"
                >
                    <Download className="w-4 h-4" /> Export CSV
                </button>
                <button onClick={addBudgetItem} className="bg-rose-600 text-white px-5 py-3 rounded-lg shadow-md hover:bg-rose-700 active:bg-rose-800 transition-colors flex items-center space-x-2 touch-manipulation">
                    <Plus className="w-5 h-5" />
                    <span className="font-medium">Add Item</span>
                </button>
            </div>
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Mobile Card View */}
                <div className="block md:hidden">
                    {budgetItems.map(item => (
                        <div key={item.id} className="p-4 border-b border-rose-100 last:border-b-0">
                            <div className="flex justify-between items-start mb-3">
                                <input
                                    type="text"
                                    value={item.type}
                                    onChange={e => updateBudgetItem(item.id, 'type', e.target.value)}
                                    className="text-lg font-semibold text-gray-900 flex-1 p-2 rounded border border-gray-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 mr-2"
                                    placeholder="Item name"
                                />
                                <button
                                    onClick={() => deleteBudgetItem(item.id)}
                                    className="text-gray-400 hover:text-red-600 p-2 touch-manipulation"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="space-y-2">
                                <div>
                                    <label className="text-xs font-medium text-gray-600 block mb-1">Category</label>
                                    <select
                                        value={item.category}
                                        onChange={e => updateBudgetItem(item.id, 'category', e.target.value)}
                                        className="w-full p-2 rounded border border-gray-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-sm"
                                    >
                                        {categoryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs font-medium text-gray-600 block mb-1">Cost</label>
                                        <input
                                            type="number"
                                            value={item.cost}
                                            onChange={e => updateBudgetItem(item.id, 'cost', parseFloat(e.target.value) || 0)}
                                            className="w-full p-2 rounded border border-gray-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-sm font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-600 block mb-1">Paid</label>
                                        <input
                                            type="number"
                                            value={item.paid}
                                            onChange={e => updateBudgetItem(item.id, 'paid', parseFloat(e.target.value) || 0)}
                                            className="w-full p-2 rounded border border-gray-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-sm font-medium"
                                        />
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-gray-200">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-600">Balance:</span>
                                        <span className="text-lg font-bold text-yellow-600">{currency(item.cost - item.paid)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    <div className="p-4 bg-rose-50 border-t-2 border-rose-200">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-rose-900">Total Cost:</span>
                                <span className="text-lg font-bold text-rose-900">{currency(budgetTotals.totalCost)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-gray-700">Total Paid:</span>
                                <span className="text-lg font-bold text-gray-700">{currency(budgetTotals.totalPaid)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-yellow-700">Balance Due:</span>
                                <span className="text-lg font-bold text-yellow-600">{currency(budgetTotals.balanceDue)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-rose-100">
                            <tr>
                                <th className="p-4 font-semibold text-rose-800">Type</th>
                                <th className="p-4 font-semibold text-rose-800">Category</th>
                                <th className="p-4 font-semibold text-rose-800">Cost</th>
                                <th className="p-4 font-semibold text-rose-800">Paid</th>
                                <th className="p-4 font-semibold text-rose-800">Balance</th>
                                <th className="p-4 font-semibold text-rose-800"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {budgetItems.map(item => (
                                <tr key={item.id} className="border-b border-rose-100 last:border-b-0">
                                    <td className="p-3"><input type="text" value={item.type} onChange={e => updateBudgetItem(item.id, 'type', e.target.value)} className="w-full p-1 rounded border-gray-300" /></td>
                                    <td className="p-3">
                                        <select value={item.category} onChange={e => updateBudgetItem(item.id, 'category', e.target.value)} className="w-full p-1 rounded border-gray-300">
                                            {categoryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </td>
                                    <td className="p-3"><input type="number" value={item.cost} onChange={e => updateBudgetItem(item.id, 'cost', parseFloat(e.target.value) || 0)} className="w-full p-1 rounded border-gray-300" /></td>
                                    <td className="p-3"><input type="number" value={item.paid} onChange={e => updateBudgetItem(item.id, 'paid', parseFloat(e.target.value) || 0)} className="w-full p-1 rounded border-gray-300" /></td>
                                    <td className="p-3 font-medium text-yellow-700">{currency(item.cost - item.paid)}</td>
                                    <td className="p-3 text-center">
                                        <button onClick={() => deleteBudgetItem(item.id)} className="text-gray-400 hover:text-red-600 p-1">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-rose-50 font-bold">
                            <tr>
                                <td className="p-4 text-rose-900" colSpan="2">Total</td>
                                <td className="p-4 text-rose-900">{currency(budgetTotals.totalCost)}</td>
                                <td className="p-4 text-gray-700">{currency(budgetTotals.totalPaid)}</td>
                                <td className="p-4 text-yellow-600">{currency(budgetTotals.balanceDue)}</td>
                                <td className="p-4"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </>
    );
};

// --- Vendors Component ---
const Vendors = ({ vendors, db, basePath }) => {
    const vendorTypes = ['Venue', 'Caterer', 'Photographer', 'Videographer', 'Florist', 'Band/DJ', 'Hair & Makeup', 'Cake', 'Transport', 'Entertainment', 'Other'];
    const statusOptions = ['Considering', 'Contacted', 'Booked', 'Paid', 'Rejected'];
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [expandedId, setExpandedId] = useState(null);

    const statusColors = {
        Considering: 'bg-yellow-100 text-yellow-700',
        Contacted: 'bg-blue-100 text-blue-700',
        Booked: 'bg-green-100 text-green-700',
        Paid: 'bg-emerald-100 text-emerald-700',
        Rejected: 'bg-red-100 text-red-700',
    };

    const addVendor = async () => {
        if (!db || !basePath) return;
        const newVendor = { type: 'Other', name: 'New Vendor', contact: '', email: '', website: '', address: '', quoted: 0, paid: 0, status: 'Considering', notes: '', rating: 0 };
        try { await addDoc(collection(db, `${basePath}/vendors`), newVendor); }
        catch (e) { console.error(e); }
    };

    const updateVendor = async (id, field, value) => {
        if (!db || !basePath) return;
        try { await setDoc(doc(db, `${basePath}/vendors`, id), { [field]: value }, { merge: true }); }
        catch (e) { console.error(e); }
    };

    const deleteVendor = async (id) => {
        if (!db || !basePath) return;
        try { await deleteDoc(doc(db, `${basePath}/vendors`, id)); }
        catch (e) { console.error(e); }
    };

    const totals = useMemo(() => {
        const active = vendors.filter(v => v.status !== 'Rejected');
        return {
            total: active.reduce((s, v) => s + (v.quoted || 0), 0),
            paid: vendors.reduce((s, v) => s + (v.paid || 0), 0),
            balance: active.reduce((s, v) => s + ((v.quoted || 0) - (v.paid || 0)), 0),
        };
    }, [vendors]);

    const filtered = useMemo(() => {
        let list = [...vendors];
        if (filterType) list = list.filter(v => v.type === filterType);
        if (filterStatus) list = list.filter(v => v.status === filterStatus);
        return list;
    }, [vendors, filterType, filterStatus]);

    const StarRating = ({ value, onChange }) => (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => onChange(n === value ? 0 : n)} className="p-0">
                    <Star className={`w-4 h-4 ${n <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                </button>
            ))}
        </div>
    );

    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-rose-900">Vendors</h1>
                    <p className="text-gray-600 mt-1">{vendors.length} vendor{vendors.length !== 1 ? 's' : ''} tracked</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            const headers = ['Type', 'Name', 'Status', 'Contact', 'Email', 'Website', 'Quoted (LKR)', 'Paid (LKR)', 'Balance (LKR)', 'Rating', 'Notes'];
                            const rows = vendors.map(v => [v.type, v.name, v.status || '', v.contact || '', v.email || '', v.website || '', v.quoted || 0, v.paid || 0, (v.quoted || 0) - (v.paid || 0), v.rating || '', v.notes || '']);
                            downloadCSV('vendors.csv', [headers, ...rows]);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm font-medium"
                    >
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <button onClick={addVendor} className="bg-rose-600 text-white px-5 py-3 rounded-lg shadow-md hover:bg-rose-700 transition-colors flex items-center gap-2">
                        <Plus className="w-5 h-5" /><span className="font-medium">Add Vendor</span>
                    </button>
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                    { label: 'Total Quoted', value: currency(totals.total), color: 'bg-rose-50 text-rose-700' },
                    { label: 'Total Paid', value: currency(totals.paid), color: 'bg-green-50 text-green-700' },
                    { label: 'Balance Due', value: currency(totals.balance), color: 'bg-yellow-50 text-yellow-700' },
                ].map(({ label, value, color }) => (
                    <div key={label} className={`rounded-xl p-4 text-center ${color}`}>
                        <p className="text-sm font-bold truncate">{value}</p>
                        <p className="text-xs opacity-70 mt-0.5">{label}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-5 flex-wrap">
                <select value={filterType} onChange={e => setFilterType(e.target.value)} className="p-2 rounded-lg border border-gray-300 text-sm">
                    <option value="">All Types</option>
                    {vendorTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="p-2 rounded-lg border border-gray-300 text-sm">
                    <option value="">All Statuses</option>
                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {(filterType || filterStatus) && (
                    <button onClick={() => { setFilterType(''); setFilterStatus(''); }} className="px-3 py-2 text-sm text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50">Clear</button>
                )}
            </div>

            {/* Vendor Cards */}
            {filtered.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                    <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No vendors yet</p>
                    <p className="text-gray-400 text-sm mt-1">Add your first vendor to start tracking quotes and payments.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(vendor => {
                        const isExpanded = expandedId === vendor.id;
                        const balance = (vendor.quoted || 0) - (vendor.paid || 0);
                        return (
                            <div key={vendor.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                                {/* Card Header - always visible */}
                                <div
                                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => setExpandedId(isExpanded ? null : vendor.id)}
                                >
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-gray-900">{vendor.name}</span>
                                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{vendor.type}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[vendor.status] || 'bg-gray-100 text-gray-600'}`}>
                                                    {vendor.status || 'Considering'}
                                                </span>
                                                {vendor.rating > 0 && (
                                                    <span className="flex items-center gap-0.5">
                                                        {Array.from({ length: vendor.rating }).map((_, i) => <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex gap-4 mt-1 text-sm text-gray-500">
                                                {vendor.contact && <span>{vendor.contact}</span>}
                                                {vendor.email && <span className="truncate">{vendor.email}</span>}
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-bold text-gray-900">{currency(vendor.quoted || 0)}</p>
                                            {balance > 0 && <p className="text-xs text-yellow-600">Due: {currency(balance)}</p>}
                                            {vendor.status === 'Paid' && <p className="text-xs text-green-600">Fully paid</p>}
                                        </div>
                                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="border-t border-gray-100 p-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 block mb-1">Vendor Name</label>
                                                <input type="text" value={vendor.name} onChange={e => updateVendor(vendor.id, 'name', e.target.value)} className="w-full p-2 rounded-lg border border-gray-200 focus:border-rose-400 text-sm" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 block mb-1">Type</label>
                                                <select value={vendor.type} onChange={e => updateVendor(vendor.id, 'type', e.target.value)} className="w-full p-2 rounded-lg border border-gray-200 focus:border-rose-400 text-sm">
                                                    {vendorTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 block mb-1">Status</label>
                                                <select value={vendor.status || 'Considering'} onChange={e => updateVendor(vendor.id, 'status', e.target.value)} className="w-full p-2 rounded-lg border border-gray-200 focus:border-rose-400 text-sm">
                                                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 block mb-1">Rating</label>
                                                <StarRating value={vendor.rating || 0} onChange={v => updateVendor(vendor.id, 'rating', v)} />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 block mb-1">Phone / Contact</label>
                                                <input type="text" value={vendor.contact || ''} onChange={e => updateVendor(vendor.id, 'contact', e.target.value)} className="w-full p-2 rounded-lg border border-gray-200 focus:border-rose-400 text-sm" placeholder="+94 77..." />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 block mb-1">Email</label>
                                                <input type="email" value={vendor.email || ''} onChange={e => updateVendor(vendor.id, 'email', e.target.value)} className="w-full p-2 rounded-lg border border-gray-200 focus:border-rose-400 text-sm" placeholder="vendor@example.com" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 block mb-1 flex items-center gap-1"><Globe className="w-3 h-3"/>Website</label>
                                                <input type="url" value={vendor.website || ''} onChange={e => updateVendor(vendor.id, 'website', e.target.value)} className="w-full p-2 rounded-lg border border-gray-200 focus:border-rose-400 text-sm" placeholder="https://..." />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 block mb-1 flex items-center gap-1"><MapPin className="w-3 h-3"/>Address</label>
                                                <input type="text" value={vendor.address || ''} onChange={e => updateVendor(vendor.id, 'address', e.target.value)} className="w-full p-2 rounded-lg border border-gray-200 focus:border-rose-400 text-sm" placeholder="City, area..." />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 block mb-1">Quoted Price (LKR)</label>
                                                <input type="number" value={vendor.quoted || 0} onChange={e => updateVendor(vendor.id, 'quoted', parseFloat(e.target.value) || 0)} className="w-full p-2 rounded-lg border border-gray-200 focus:border-rose-400 text-sm" min="0" />
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 block mb-1">Amount Paid (LKR)</label>
                                                <input type="number" value={vendor.paid || 0} onChange={e => updateVendor(vendor.id, 'paid', parseFloat(e.target.value) || 0)} className="w-full p-2 rounded-lg border border-gray-200 focus:border-rose-400 text-sm" min="0" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 block mb-1">Notes</label>
                                            <textarea value={vendor.notes || ''} onChange={e => updateVendor(vendor.id, 'notes', e.target.value)} rows={2} className="w-full p-2 rounded-lg border border-gray-200 focus:border-rose-400 text-sm resize-none" placeholder="Package details, special requirements..." />
                                        </div>
                                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                                            <div className="text-sm">
                                                <span className="text-gray-500">Balance: </span>
                                                <span className={`font-semibold ${balance > 0 ? 'text-yellow-600' : 'text-green-600'}`}>{currency(balance)}</span>
                                            </div>
                                            <button onClick={() => { deleteVendor(vendor.id); setExpandedId(null); }} className="text-red-400 hover:text-red-600 flex items-center gap-1 text-sm transition-colors">
                                                <Trash2 className="w-4 h-4" /> Remove
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
};

const SUGGESTED_TASKS = {
    '12+ Months': ['Book your venue', 'Set your wedding date', 'Create your guest list', 'Set your overall budget', 'Hire a wedding planner (optional)', 'Start looking for a photographer', 'Choose your wedding theme/style'],
    '10-12 Months': ['Book your photographer', 'Book your videographer', 'Book your caterer', 'Send save-the-dates', 'Start dress shopping', 'Book hair & makeup artist'],
    '8-10 Months': ['Book florist', 'Book band/DJ', 'Choose bridesmaids & groomsmen', 'Register for gifts', 'Plan honeymoon', 'Book accommodation for out-of-town guests'],
    '6-8 Months': ['Order wedding dress', 'Order suits/tuxedos', 'Book cake baker', 'Choose wedding invitations', 'Plan rehearsal dinner', 'Hire officiant'],
    '4-6 Months': ['Send wedding invitations', 'Order wedding rings', 'Book transportation', 'Finalize menu with caterer', 'Schedule dress fittings', 'Book honeymoon flights & hotels'],
    '2-3 Months': ['Follow up on RSVPs', 'Finalize guest list & seating', 'Schedule hair & makeup trial', 'Buy wedding favors', 'Write your vows', 'Arrange marriage license'],
    '1-2 Months': ['Confirm all vendors', 'Create day-of timeline', 'Final dress fitting', 'Prepare vendor payments', 'Break in wedding shoes', 'Create ceremony program'],
    '2-4 Weeks': ['Final venue walkthrough', 'Prepare emergency kit', 'Confirm transportation details', 'Pack for honeymoon', 'Prepare tips for vendors', 'Send final headcount to caterer'],
    '1 Week': ['Pick up wedding dress', 'Rehearsal dinner', 'Final vendor confirmations', 'Rest and relax', 'Prepare wedding day bag', 'Charge all electronics'],
};

// --- Checklist Component ---
const Checklist = ({ tasks, db, basePath, weddingDate }) => {
    const [showSuggestModal, setShowSuggestModal] = useState(false);
    const [selectedSuggestions, setSelectedSuggestions] = useState({});

    const timelines = useMemo(() => {
        return timelineOrder;
    }, []);

    const tasksByTimeline = useMemo(() => {
        const grouped = {};
        tasks.forEach(task => {
            if (!grouped[task.timeline]) {
                grouped[task.timeline] = [];
            }
            grouped[task.timeline].push(task);
        });
        return grouped;
    }, [tasks]);

    const toggleTask = async (id, currentStatus) => {
        if (!db || !basePath) return;
        const taskDoc = doc(db, `${basePath}/tasks`, id);
        try {
            await setDoc(taskDoc, { completed: !currentStatus }, { merge: true });
        } catch (e) {
            console.error("Error toggling task: ", e);
        }
    };
    
    const addTask = async (event) => {
        event.preventDefault();
        if (!db || !basePath) return;
        const text = event.target.elements['new-task-text'].value;
        const timeline = event.target.elements['new-task-timeline'].value;

        if (text) {
            const newTask = { text, timeline, completed: false };
            const tasksCol = collection(db, `${basePath}/tasks`);
            try {
                await addDoc(tasksCol, newTask);
                event.target.reset();
            } catch (e) {
                console.error("Error adding task: ", e);
            }
        }
    };

    const deleteTask = async (id) => {
        if (!db || !basePath) return;
        try { await deleteDoc(doc(db, `${basePath}/tasks`, id)); }
        catch (e) { console.error(e); }
    };

    const addSuggestedTasks = async () => {
        if (!db || !basePath) return;
        const col = collection(db, `${basePath}/tasks`);
        const existingTexts = new Set(tasks.map(t => t.text.toLowerCase()));
        for (const [timeline, taskTexts] of Object.entries(selectedSuggestions)) {
            for (const text of taskTexts) {
                if (!existingTexts.has(text.toLowerCase())) {
                    await addDoc(col, { text, timeline, completed: false });
                }
            }
        }
        setShowSuggestModal(false);
        setSelectedSuggestions({});
    };

    const toggleSuggestion = (timeline, text) => {
        setSelectedSuggestions(prev => {
            const current = prev[timeline] || [];
            const exists = current.includes(text);
            return { ...prev, [timeline]: exists ? current.filter(t => t !== text) : [...current, text] };
        });
    };

    const selectedCount = Object.values(selectedSuggestions).flat().length;

    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-rose-900">Wedding Checklist</h1>
                <button
                    onClick={() => { setShowSuggestModal(true); setSelectedSuggestions({}); }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-sm font-medium transition-colors"
                >
                    <CheckCircle2 className="w-4 h-4" /> Smart Suggestions
                </button>
            </div>

            {/* Smart Suggestions Modal */}
            {showSuggestModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-bold text-rose-900">Smart Checklist Suggestions</h2>
                            <p className="text-sm text-gray-500 mt-1">Select tasks to add. Already-existing tasks are skipped automatically.</p>
                        </div>
                        <div className="overflow-y-auto flex-1 p-6 space-y-5">
                            {timelineOrder.map(timeline => {
                                const suggestions = SUGGESTED_TASKS[timeline] || [];
                                const existingTexts = new Set(tasks.map(t => t.text.toLowerCase()));
                                const available = suggestions.filter(s => !existingTexts.has(s.toLowerCase()));
                                if (available.length === 0) return null;
                                const sel = selectedSuggestions[timeline] || [];
                                return (
                                    <div key={timeline}>
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-semibold text-gray-800 text-sm">{timeline}</h3>
                                            <button
                                                onClick={() => {
                                                    const allSel = available.every(t => sel.includes(t));
                                                    setSelectedSuggestions(prev => ({ ...prev, [timeline]: allSel ? [] : [...available] }));
                                                }}
                                                className="text-xs text-rose-600 hover:text-rose-800"
                                            >
                                                {available.every(t => sel.includes(t)) ? 'Deselect all' : 'Select all'}
                                            </button>
                                        </div>
                                        <div className="space-y-1.5">
                                            {available.map(text => (
                                                <label key={text} className="flex items-center gap-2 p-2 rounded-lg hover:bg-rose-50 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={sel.includes(text)}
                                                        onChange={() => toggleSuggestion(timeline, text)}
                                                        className="h-4 w-4 rounded border-gray-300 text-rose-600"
                                                    />
                                                    <span className="text-sm text-gray-700">{text}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="p-6 border-t flex gap-3 justify-end">
                            <button onClick={() => setShowSuggestModal(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium">Cancel</button>
                            <button onClick={addSuggestedTasks} disabled={selectedCount === 0} className="px-5 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 disabled:opacity-50 transition-colors">
                                Add {selectedCount > 0 ? `${selectedCount} ` : ''}Task{selectedCount !== 1 ? 's' : ''}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="space-y-6 md:space-y-8">
                {timelines.map(timeline => {
                    const tasksForTimeline = tasksByTimeline[timeline] || [];
                    return (
                        <div key={timeline} className="bg-white p-5 sm:p-6 rounded-xl shadow-lg">
                            <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-rose-800 mb-4 sm:mb-5 border-b border-rose-200 pb-3">{timeline}</h2>
                            {tasksForTimeline.length === 0 ? (
                                <p className="text-gray-400 italic text-sm">No tasks for this period.</p>
                            ) : (
                                <ul className="space-y-2 sm:space-y-3">
                                    {tasksForTimeline.map(task => (
                                        <li key={task.id} className="flex items-center gap-2 group">
                                            <input
                                                type="checkbox"
                                                id={`task-${task.id}`}
                                                checked={task.completed}
                                                onChange={() => toggleTask(task.id, task.completed)}
                                                className="h-5 w-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500 touch-manipulation flex-shrink-0"
                                            />
                                            <label htmlFor={`task-${task.id}`} className={`flex-1 text-sm sm:text-base text-gray-800 leading-relaxed cursor-pointer ${task.completed ? 'line-through text-gray-400' : ''}`}>{task.text}</label>
                                            <button onClick={() => deleteTask(task.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-0.5 flex-shrink-0">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    );
                })}
            </div>
            
            <div className="bg-white p-5 sm:p-6 rounded-xl shadow-lg mt-6 md:mt-8">
                <h2 className="text-lg sm:text-xl font-semibold text-rose-800 mb-4">Add New Task</h2>
                <form onSubmit={addTask} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <input
                        id="new-task-text"
                        type="text"
                        placeholder="Task description"
                        className="flex-1 p-3 rounded border border-gray-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-sm sm:text-base"
                        required
                    />
                    <select
                        id="new-task-timeline"
                        className="p-3 rounded border border-gray-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-sm sm:text-base"
                    >
                        {timelineOrder.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <button
                        type="submit"
                        className="bg-rose-600 text-white px-5 py-3 rounded-lg shadow-md hover:bg-rose-700 active:bg-rose-800 transition-colors flex items-center justify-center space-x-2 touch-manipulation font-medium"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Add Task</span>
                    </button>
                </form>
            </div>
        </>
    );
};

// --- ICS calendar export helper ---
const downloadICS = (filename, events) => {
    const pad = (n) => String(n).padStart(2, '0');
    const fmtDT = (d) => `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
    const uid = () => Math.random().toString(36).slice(2) + '@weddingplanner';
    const lines = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//WeddingPlanner//EN', 'CALSCALE:GREGORIAN',
        ...events.flatMap(ev => [
            'BEGIN:VEVENT',
            `UID:${uid()}`,
            `DTSTART:${fmtDT(ev.start)}`,
            `DTEND:${fmtDT(ev.end)}`,
            `SUMMARY:${ev.title.replace(/[,;\\]/g, '\\$&')}`,
            ev.desc ? `DESCRIPTION:${ev.desc.replace(/[,;\\]/g, '\\$&')}` : '',
            'END:VEVENT'
        ].filter(Boolean)),
        'END:VCALENDAR'
    ];
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// --- ADDED: Agenda Component ---
const Agenda = ({ agendaItems, db, basePath, weddingDate }) => {
    
    const sortedAgenda = useMemo(() => {
        return [...agendaItems].sort((a, b) => {
            return (a.time || '').localeCompare(b.time || '');
        });
    }, [agendaItems]);

    const addAgendaItem = async () => {
        if (!db || !basePath) return;
        const newItem = { 
            time: '09:00 AM', 
            event: 'New Event', 
        };
        const agendaCol = collection(db, `${basePath}/agenda`);
        try {
            await addDoc(agendaCol, newItem);
        } catch (e) {
            console.error("Error adding agenda item: ", e);
        }
    };

    const updateAgendaItem = async (id, field, value) => {
        if (!db || !basePath) return;
        const itemDoc = doc(db, `${basePath}/agenda`, id);
        try {
            await setDoc(itemDoc, { [field]: value }, { merge: true });
        } catch (e) {
            console.error("Error updating agenda item: ", e);
        }
    };

    const deleteAgendaItem = async (id) => {
        if (!db || !basePath) return;
        const itemDoc = doc(db, `${basePath}/agenda`, id);
        try {
            await deleteDoc(itemDoc);
        } catch (e) {
            console.error("Error deleting agenda item: ", e);
        }
    };

    const exportAgendaICS = () => {
        const base = weddingDate ? new Date(weddingDate) : new Date();
        const events = sortedAgenda.map((item, idx) => {
            const start = new Date(base);
            const [timePart, ampm] = (item.time || '09:00 AM').split(' ');
            let [h, m] = (timePart || '09:00').split(':').map(Number);
            if (ampm === 'PM' && h !== 12) h += 12;
            if (ampm === 'AM' && h === 12) h = 0;
            start.setHours(h || 9, m || 0, 0, 0);
            const end = new Date(start.getTime() + 60 * 60 * 1000);
            return { title: item.event || 'Event', start, end, desc: '' };
        });
        downloadICS('wedding-agenda.ics', events);
    };

    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-rose-900 flex items-center space-x-3">
                    <Clock className="w-8 h-8" />
                    <span>Wedding Day Agenda</span>
                </h1>
                <div className="flex gap-2">
                    {sortedAgenda.length > 0 && (
                        <button onClick={exportAgendaICS} className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm font-medium">
                            <Calendar className="w-4 h-4" /> Export .ics
                        </button>
                    )}
                    <button onClick={addAgendaItem} className="bg-rose-600 text-white px-5 py-2.5 rounded-lg shadow-md hover:bg-rose-700 transition-colors flex items-center space-x-2">
                        <Plus className="w-5 h-5" />
                        <span>Add Event</span>
                    </button>
                </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
                {sortedAgenda.length === 0 ? (
                    <p className="p-4 text-center text-gray-500 italic">Your agenda is empty. Add an event to get started!</p>
                ) : (
                    <div className="relative border-l-2 border-rose-200 ml-6 space-y-8">
                        {sortedAgenda.map((item, index) => (
                            <div key={item.id} className="relative">
                                <div className="absolute -left-4 top-1.5 w-6 h-6 bg-rose-600 rounded-full border-4 border-white"></div>
                                <div className="ml-10 bg-white p-4 rounded-lg shadow-sm border border-rose-100 relative">
                                    <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
                                        <input
                                            type="text"
                                            value={item.time}
                                            onChange={e => updateAgendaItem(item.id, 'time', e.target.value)}
                                            className="w-full md:w-32 p-2 rounded border-gray-300 font-medium text-rose-900"
                                            placeholder="e.g., 10:00 AM"
                                        />
                                        <input
                                            type="text"
                                            value={item.event}
                                            onChange={e => updateAgendaItem(item.id, 'event', e.target.value)}
                                            className="w-full flex-1 p-2 rounded border-gray-300 mt-2 md:mt-0"
                                            placeholder="e.g., Ceremony Starts"
                                        />
                                    </div>
                                    <button onClick={() => deleteAgendaItem(item.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-600 p-1">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

// --- ADDED: Documents Component ---
const Documents = ({ documents, db, basePath, storage, planId, showNotification, setConfirmModal }) => {
    const [docName, setDocName] = useState('');
    const [docCategory, setDocCategory] = useState('Other');
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const categoryOptions = ['Advance Payments', 'Full Payment', 'Vendor', 'Other'];

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            if (e.target.files[0].size > 5 * 1024 * 1024) {
                showNotification("File is too large. Max size is 5MB.");
                e.target.value = null;
                return;
            }
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile || !docName || !docCategory) {
            showNotification("Please provide a name, category, and file.");
            return;
        }
        if (!storage || !planId || !db || !basePath) return;

        setIsUploading(true);

        const newDoc = {
            name: docName,
            category: docCategory,
            fileName: selectedFile.name,
            fileURL: '',
            filePath: '',
            createdAt: new Date(),
        };
        const docRef = await addDoc(collection(db, `${basePath}/documents`), newDoc);

        const filePath = `plans/${planId}/documents/${docRef.id}/${selectedFile.name}`;
        const fileRef = ref(storage, filePath);
        const uploadTask = uploadBytesResumable(fileRef, selectedFile);

        uploadTask.on('state_changed', 
            () => {},
            (error) => {
                console.error("Upload failed: ", error);
                showNotification("Upload failed. Please try again.");
                deleteDoc(doc(db, `${basePath}/documents`, docRef.id));
                setIsUploading(false);
            }, 
            () => {
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    setDoc(doc(db, `${basePath}/documents`, docRef.id), { 
                        fileURL: downloadURL, 
                        filePath: filePath 
                    }, { merge: true });
                    
                    setDocName('');
                    setDocCategory('Other');
                    setSelectedFile(null);
                    if (document.getElementById('file-upload-input')) {
                        document.getElementById('file-upload-input').value = '';
                    }
                    setIsUploading(false);
                    showNotification("Document uploaded!");
                });
            }
        );
    };

    const triggerDelete = (docId, filePath, docName) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Document?',
            message: `Are you sure you want to delete "${docName}"? This cannot be undone.`,
            onConfirm: () => handleFileDelete(docId, filePath)
        });
    };

    const handleFileDelete = async (docId, filePath) => {

        if (!storage || !filePath || !db || !basePath) return;

        const fileRef = ref(storage, filePath);
        try {
            await deleteObject(fileRef);
            await deleteDoc(doc(db, `${basePath}/documents`, docId));
            showNotification("Document deleted.");
        } catch (error) {
            console.error("Error deleting file: ", error);
            if (error.code === 'storage/object-not-found') {
                await deleteDoc(doc(db, `${basePath}/documents`, docId));
                showNotification("Document record deleted.");
            } else {
                showNotification("Error deleting file.");
            }
        }
    };

    const sortedDocuments = useMemo(() => {
        return [...documents].sort((a, b) => {
            if (a.category !== b.category) {
                return a.category.localeCompare(b.category);
            }
            return a.name.localeCompare(b.name);
        });
    }, [documents]);

    return (
        <>
            <h1 className="text-4xl font-bold text-rose-900 mb-8">Documents</h1>

            <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
                <h2 className="text-xl font-semibold text-rose-800 mb-4">Add New Document</h2>
                <form onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                        <label htmlFor="doc-name" className="block text-sm font-medium text-gray-700 mb-1">Document Name</label>
                        <input 
                            type="text" 
                            id="doc-name" 
                            value={docName} 
                            onChange={e => setDocName(e.target.value)} 
                            className="w-full p-2 rounded border-gray-300" 
                            placeholder="e.g., Venue Contract"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="doc-category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <select 
                            id="doc-category" 
                            value={docCategory} 
                            onChange={e => setDocCategory(e.target.value)} 
                            className="w-full p-2 rounded border-gray-300"
                        >
                            {categoryOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <input 
                            type="file" 
                            id="file-upload-input" 
                            onChange={handleFileSelect} 
                            className="w-full text-sm text-gray-500
                                       file:mr-4 file:py-2 file:px-4
                                       file:rounded-lg file:border-0
                                       file:text-sm file:font-semibold
                                       file:bg-rose-100 file:text-rose-700
                                       hover:file:bg-rose-200 cursor-pointer"
                            required
                        />
                    </div>
                    <div className="md:col-span-4">
                        <button 
                            type="submit" 
                            className="w-full md:w-auto bg-rose-600 text-white px-5 py-2.5 rounded-lg shadow-md hover:bg-rose-700 transition-colors flex items-center justify-center space-x-2"
                            disabled={isUploading}
                        >
                            <UploadCloud className="w-5 h-5" />
                            <span>{isUploading ? 'Uploading...' : 'Upload Document'}</span>
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-rose-100">
                        <tr>
                            <th className="p-4 font-semibold text-rose-800">Name</th>
                            <th className="p-4 font-semibold text-rose-800">Category</th>
                            <th className="p-4 font-semibold text-rose-800">File</th>
                            <th className="p-4 font-semibold text-rose-800"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedDocuments.length === 0 && (
                            <tr>
                                <td colSpan="4" className="p-4 text-gray-500 italic">No documents uploaded yet.</td>
                            </tr>
                        )}
                        {sortedDocuments.map(doc => (
                            <tr key={doc.id} className="border-b border-rose-100 last:border-b-0">
                                <td className="p-4 font-medium text-gray-800">{doc.name}</td>
                                <td className="p-4"><span className="text-xs font-medium bg-gray-200 text-gray-700 px-2 py-1 rounded-full">{doc.category}</span></td>
                                <td className="p-4">
                                    <a 
                                        href={doc.fileURL} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-rose-600 hover:text-rose-800 flex items-center space-x-1" 
                                        title={doc.fileName}
                                    >
                                        <FileText className="w-5 h-5" />
                                        <span className="truncate w-32 md:w-auto">{doc.fileName}</span>
                                    </a>
                                </td>
                                <td className="p-4 text-center">
                                    <button onClick={() => triggerDelete(doc.id, doc.filePath, doc.name)} className="text-gray-400 hover:text-red-600 p-1">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};


// --- ADDED: RecentPlans Component ---
const RecentPlans = ({ user, db, setPlanId, setError }) => {
    const [recentPlans, setRecentPlans] = useState([]);

    useEffect(() => {
        if (!user || !db) return;

        const userPlansQuery = query(collection(db, `/users/${user.uid}/plans`));
        const unsubscribe = onSnapshot(userPlansQuery, (querySnapshot) => {
            const plansData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            plansData.sort((a, b) => {
                const dateA = a.lastAccessed?.toDate ? a.lastAccessed.toDate() : new Date(a.lastAccessed);
                const dateB = b.lastAccessed?.toDate ? b.lastAccessed.toDate() : new Date(b.lastAccessed);
                return dateB - dateA;
            });
            setRecentPlans(plansData);
        }, (error) => {
            console.error("Error fetching recent plans: ", error);
        });

        return () => unsubscribe();
    }, [user, db]);

    const selectPlan = async (planId) => {
        try {
            setError('');
            const configDoc = doc(db, `/plans/${planId}/config`, 'budget');
            const docSnap = await new Promise((resolve) => {
                const unsubscribe = onSnapshot(configDoc, (docSnap) => {
                    unsubscribe();
                    resolve(docSnap);
                });
            });

            if (docSnap.exists()) {
                const userPlanQuery = query(
                    collection(db, `/users/${user.uid}/plans`),
                    where('planId', '==', planId)
                );
                const userPlanSnapshot = await getDocs(userPlanQuery);
                if (!userPlanSnapshot.empty) {
                    const userPlanDoc = doc(db, `/users/${user.uid}/plans`, userPlanSnapshot.docs[0].id);
                    await setDoc(userPlanDoc, { lastAccessed: new Date() }, { merge: true });
                }
                
                setPlanId(planId);
            } else {
                const userPlanQuery = query(
                    collection(db, `/users/${user.uid}/plans`),
                    where('planId', '==', planId)
                );
                const userPlanSnapshot = await getDocs(userPlanQuery);
                if (!userPlanSnapshot.empty) {
                    const userPlanDoc = doc(db, `/users/${user.uid}/plans`, userPlanSnapshot.docs[0].id);
                    await deleteDoc(userPlanDoc);
                }
                setError("This plan is no longer available and has been removed from your recent list.");
            }
        } catch (error) {
            console.error("Error selecting plan: ", error);
            setError("Error accessing plan. Please try again.");
        }
    };

    const removePlan = async (planId, event) => {
        event.stopPropagation();
        try {
            const userPlanQuery = query(
                collection(db, `/users/${user.uid}/plans`),
                where('planId', '==', planId)
            );
            const userPlanSnapshot = await getDocs(userPlanQuery);
            if (!userPlanSnapshot.empty) {
                const userPlanDoc = doc(db, `/users/${user.uid}/plans`, userPlanSnapshot.docs[0].id);
                await deleteDoc(userPlanDoc);
            }
        } catch (error) {
            console.error("Error removing plan: ", error);
            setError("Error removing plan from list.");
        }
    };

    if (recentPlans.length === 0) return null;

    return (
        <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Recent Plans</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentPlans.map((plan) => (
                    <div
                        key={plan.id}
                        onClick={() => selectPlan(plan.planId)}
                        className="bg-white p-4 rounded-lg border border-gray-200 hover:border-rose-300 hover:shadow-md transition-all cursor-pointer relative group"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900">
                                Plan {plan.planId}
                            </h4>
                            <button
                                onClick={(e) => removePlan(plan.planId, e)}
                                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove from recent list"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="text-sm text-gray-600">
                            <p>Role: <span className="capitalize">{plan.role}</span></p>
                            <p>
                                Last accessed: {
                                    plan.lastAccessed?.toDate ?
                                        plan.lastAccessed.toDate().toLocaleDateString() :
                                        new Date(plan.lastAccessed).toLocaleDateString()
                                }
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- ADDED: PlanSelector Component ---
const PlanSelector = ({ db, user, setPlanId, setError, error, handleLogout }) => {
    const [joinId, setJoinId] = useState('');
    

    
    // If user is null, show loading
    if (!user) {

        return (
            <div className="min-h-screen bg-rose-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-rose-900 mb-4">Loading...</h1>
                    <p className="text-gray-600">Checking authentication status</p>
                    <div className="mt-4 animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto"></div>
                </div>
            </div>
        );
    }

    const createNewPlan = async () => {
        setError('');
        const newPlanId = nanoid(10);
        if (!db || !user) {
            console.error("Database or user not available for plan creation");
            setError('Database or user not available');
            return;
        }

        try {
            const configDoc = doc(db, `/plans/${newPlanId}/config`, 'budget');
            await setDoc(configDoc, { amount: 100000 });

            const tasksCol = collection(db, `/plans/${newPlanId}/tasks`);
            await addDoc(tasksCol, {
                text: 'Start planning your wedding!',
                timeline: '12+ Months',
                completed: false
            });

            const userPlansQuery = query(
                collection(db, `/users/${user.uid}/plans`),
                where('planId', '==', newPlanId)
            );
            const userPlansSnapshot = await getDocs(userPlansQuery);
            
            if (userPlansSnapshot.empty) {
                const userPlansCol = collection(db, `/users/${user.uid}/plans`);
                await addDoc(userPlansCol, {
                    planId: newPlanId,
                    createdAt: new Date(),
                    lastAccessed: new Date(),
                    role: 'owner'
                });
            } else {
                const userPlanDoc = doc(db, `/users/${user.uid}/plans`, userPlansSnapshot.docs[0].id);
                await setDoc(userPlanDoc, { lastAccessed: new Date() }, { merge: true });
            }

            setPlanId(newPlanId);

        } catch (err) {
            console.error("Error creating new plan: ", err);
            setError(err.message);
        }
    };
    
    const joinPlanFix = async (e) => {
        e.preventDefault();
        setError('');
        if (!joinId) {
            setError("Please enter a Plan ID.");
            return;
        }


        const configDoc = doc(db, `/plans/${joinId}/config`, 'budget');
        const unsubscribe = onSnapshot(configDoc, async (docSnap) => {

            unsubscribe(); 
            if (docSnap.exists()) {
                const userPlansQuery = query(
                    collection(db, `/users/${user.uid}/plans`),
                    where('planId', '==', joinId)
                );
                const userPlansSnapshot = await getDocs(userPlansQuery);
                
                if (userPlansSnapshot.empty) {
                    const userPlansCol = collection(db, `/users/${user.uid}/plans`);
                    await addDoc(userPlansCol, {
                        planId: joinId,
                        createdAt: new Date(),
                        lastAccessed: new Date(),
                        role: 'collaborator'
                    });
                } else {
                    const userPlanDoc = doc(db, `/users/${user.uid}/plans`, userPlansSnapshot.docs[0].id);
                    await setDoc(userPlanDoc, { lastAccessed: new Date() }, { merge: true });
                }
                
                setPlanId(joinId);
            } else {
                setError("Plan ID not found. Please check the ID and try again.");
            }
        }, (err) => {
            console.error("Error joining plan: ", err);
            setError("Error checking Plan ID.");
            unsubscribe();
        });
    };


    return (
        <div className="flex items-center justify-center h-screen w-full bg-rose-50">
            <div className="w-full max-w-2xl p-8 space-y-6 bg-white rounded-xl shadow-lg relative">
                <div className="absolute top-4 right-4">
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        title="Logout"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                    </button>
                </div>
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-rose-900">Welcome!</h1>
                    <p className="text-gray-600 mt-2">Get started by creating a new plan or joining your partner's plan.</p>
                </div>
                
                <RecentPlans user={user} db={db} setPlanId={setPlanId} setError={setError} />

                <div className="border-t pt-6">
                    
                    {/* --- 1. Create Plan Button (MOVED UP) --- */}
                    <button
                        onClick={createNewPlan}
                        className="w-full p-3 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 transition-colors flex items-center justify-center space-x-2"
                    >
                        <PartyPopper className="w-5 h-5" />
                        <span>Create a New Plan</span>
                    </button>



                    {/* --- 3. "or" separator --- */}
                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-300"></span>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">or</span>
                        </div>
                    </div>

                    {/* --- 4. Join Plan Form --- */}
                    <form onSubmit={joinPlanFix} className="space-y-4">
                        <div>
                            <label htmlFor="planId" className="text-sm font-medium text-gray-700 block mb-1 text-left">Join an Existing Plan</label>
                            <input
                                type="text"
                                id="planId"
                                placeholder="Enter Plan ID from partner"
                                value={joinId}
                                onChange={e => setJoinId(e.target.value)}
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg"
                            />
                        </div>
                        {error && <p className="text-sm text-red-600">{error}</p>}
                        <button
                            type="submit"
                            className="w-full p-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
                        >
                            <Users className="w-5 h-5" />
                            <span>Join Plan</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

// --- ADDED: Custom Confirmation Modal Component ---
const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-600 bg-opacity-75">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
                <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm text-gray-600">{message}</p>
                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- ADDED: ManageBlogs Component ---
const ManageBlogs = ({ db, showNotification }) => {
    const [blogs, setBlogs] = useState([]);
    const [title, setTitle] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        if (!db) return;
        const blogsQuery = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(blogsQuery, (querySnapshot) => {
            const blogsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setBlogs(blogsData);
        }, (error) => console.error("Error fetching blogs: ", error));
        return () => unsubscribe();
    }, [db]);

    const addBlog = async (e) => {
        e.preventDefault();
        if (!title || !excerpt || !content) {
            showNotification("Please fill all fields.");
            return;
        }
        setIsAdding(true);
        try {
            await addDoc(collection(db, 'blogs'), {
                title,
                excerpt,
                content,
                imageUrl,
                createdAt: new Date(),
                readTime: `${Math.ceil(content.split(' ').length / 200)} min read`
            });
            setTitle('');
            setExcerpt('');
            setContent('');
            setImageUrl('');
            showNotification("Blog added successfully!");
        } catch (error) {
            console.error("Error adding blog: ", error);
            showNotification("Error adding blog.");
        } finally {
            setIsAdding(false);
        }
    };

    const deleteBlog = async (id) => {
        try {
            await deleteDoc(doc(db, 'blogs', id));
            showNotification("Blog deleted.");
        } catch (error) {
            console.error("Error deleting blog: ", error);
            showNotification("Error deleting blog.");
        }
    };

    return (
        <>
            <h1 className="text-4xl font-bold text-rose-900 mb-8">Manage Blogs</h1>

            <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
                <h2 className="text-xl font-semibold text-rose-800 mb-4">Add New Blog</h2>
                <form onSubmit={addBlog} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
                        <textarea
                            value={excerpt}
                            onChange={e => setExcerpt(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            rows="3"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                        <textarea
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            rows="10"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (optional)</label>
                        <input
                            type="url"
                            value={imageUrl}
                            onChange={e => setImageUrl(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            placeholder="https://example.com/image.jpg"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isAdding}
                        className="bg-rose-600 text-white px-5 py-2 rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50"
                    >
                        {isAdding ? 'Adding...' : 'Add Blog'}
                    </button>
                </form>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-rose-100">
                        <tr>
                            <th className="p-4 font-semibold text-rose-800">Title</th>
                            <th className="p-4 font-semibold text-rose-800">Excerpt</th>
                            <th className="p-4 font-semibold text-rose-800">Date</th>
                            <th className="p-4 font-semibold text-rose-800"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {blogs.map(blog => (
                            <tr key={blog.id} className="border-b border-rose-100 last:border-b-0">
                                <td className="p-4 font-medium text-gray-800">{blog.title}</td>
                                <td className="p-4 text-gray-600 truncate max-w-xs">{blog.excerpt}</td>
                                <td className="p-4 text-gray-500">{blog.createdAt?.toDate().toLocaleDateString()}</td>
                                <td className="p-4 text-center">
                                    <button onClick={() => deleteBlog(blog.id)} className="text-gray-400 hover:text-red-600 p-1">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

// --- ADDED: ManageEvents Component ---
const ManageEvents = ({ db, showNotification }) => {
    const [events, setEvents] = useState([]);
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState('');
    const [isPastEvent, setIsPastEvent] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        if (!db) return;
        const eventsQuery = query(collection(db, 'events'), orderBy('date', 'desc'));
        const unsubscribe = onSnapshot(eventsQuery, (querySnapshot) => {
            const eventsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setEvents(eventsData);
        }, (error) => console.error("Error fetching events: ", error));
        return () => unsubscribe();
    }, [db]);

    const addEvent = async (e) => {
        e.preventDefault();
        if (!title || !date || !description) {
            showNotification("Please fill in all required fields.");
            return;
        }
        setIsAdding(true);
        try {
            await addDoc(collection(db, 'events'), {
                title,
                date,
                time,
                location,
                description,
                image: image || '/src/assets/hero-bg.jpg',
                isPastEvent,
                createdAt: new Date()
            });
            setTitle('');
            setDate('');
            setTime('');
            setLocation('');
            setDescription('');
            setImage('');
            setIsPastEvent(false);
            showNotification("Event added successfully!");
        } catch (error) {
            console.error("Error adding event: ", error);
            showNotification("Error adding event.");
        } finally {
            setIsAdding(false);
        }
    };

    const deleteEvent = async (id) => {
        try {
            await deleteDoc(doc(db, 'events', id));
            showNotification("Event deleted.");
        } catch (error) {
            console.error("Error deleting event: ", error);
            showNotification("Error deleting event.");
        }
    };

    const updateEvent = async (id, field, value) => {
        try {
            await setDoc(doc(db, 'events', id), { [field]: value }, { merge: true });
        } catch (error) {
            console.error("Error updating event: ", error);
            showNotification("Error updating event.");
        }
    };

    return (
        <>
            <h1 className="text-4xl font-bold text-rose-900 mb-8">Manage Events</h1>

            <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
                <h2 className="text-xl font-semibold text-rose-800 mb-4">Add New Event</h2>
                <form onSubmit={addEvent} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                            <input
                                type="text"
                                value={time}
                                onChange={e => setTime(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                placeholder="e.g., 2:00 PM - 5:00 PM"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                            <input
                                type="text"
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                                placeholder="e.g., Grand Ballroom, Downtown"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                        <input
                            type="text"
                            value={image}
                            onChange={e => setImage(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            placeholder="/src/assets/hero-bg.jpg"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            rows="4"
                            required
                        />
                    </div>
                    <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={isPastEvent}
                                onChange={e => setIsPastEvent(e.target.checked)}
                                className="mr-2"
                            />
                            <span className="text-sm text-gray-700">Mark as past event</span>
                        </label>
                    </div>
                    <button
                        type="submit"
                        disabled={isAdding}
                        className="bg-rose-600 text-white px-5 py-2 rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50"
                    >
                        {isAdding ? 'Adding...' : 'Add Event'}
                    </button>
                </form>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-rose-100">
                        <tr>
                            <th className="p-4 font-semibold text-rose-800">Title</th>
                            <th className="p-4 font-semibold text-rose-800">Date</th>
                            <th className="p-4 font-semibold text-rose-800">Time</th>
                            <th className="p-4 font-semibold text-rose-800">Location</th>
                            <th className="p-4 font-semibold text-rose-800">Status</th>
                            <th className="p-4 font-semibold text-rose-800"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.map(event => (
                            <tr key={event.id} className="border-b border-rose-100 last:border-b-0">
                                <td className="p-4">
                                    <input 
                                        type="text" 
                                        value={event.title} 
                                        onChange={e => updateEvent(event.id, 'title', e.target.value)}
                                        className="w-full p-1 rounded border-gray-300 font-medium" 
                                    />
                                </td>
                                <td className="p-4">
                                    <input 
                                        type="date" 
                                        value={event.date} 
                                        onChange={e => updateEvent(event.id, 'date', e.target.value)}
                                        className="w-full p-1 rounded border-gray-300" 
                                    />
                                </td>
                                <td className="p-4">
                                    <input 
                                        type="text" 
                                        value={event.time || ''} 
                                        onChange={e => updateEvent(event.id, 'time', e.target.value)}
                                        className="w-full p-1 rounded border-gray-300" 
                                    />
                                </td>
                                <td className="p-4">
                                    <input 
                                        type="text" 
                                        value={event.location || ''} 
                                        onChange={e => updateEvent(event.id, 'location', e.target.value)}
                                        className="w-full p-1 rounded border-gray-300" 
                                    />
                                </td>
                                <td className="p-4">
                                    <select
                                        value={event.isPastEvent ? 'past' : 'upcoming'}
                                        onChange={e => updateEvent(event.id, 'isPastEvent', e.target.value === 'past')}
                                        className="p-1 border border-gray-300 rounded"
                                    >
                                        <option value="upcoming">Upcoming</option>
                                        <option value="past">Past</option>
                                    </select>
                                </td>
                                <td className="p-4 text-center">
                                    <button onClick={() => deleteEvent(event.id)} className="text-gray-400 hover:text-red-600 p-1">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

// --- ADDED: AdminDashboard Component ---
const AdminDashboard = ({ db, showNotification }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [allUsers, setAllUsers] = useState([]);
    const [allPlans, setAllPlans] = useState([]);

    useEffect(() => {
        if (!db) return;
        const unsub = onSnapshot(collection(db, 'users'), snap => setAllUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        return () => unsub();
    }, [db]);

    const adminStats = useMemo(() => {
        const now = new Date();
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        const newThisMonth = allUsers.filter(u => {
            const d = u.createdAt?.toDate ? u.createdAt.toDate() : u.createdAt ? new Date(u.createdAt) : null;
            return d && d > monthAgo;
        }).length;
        const admins = allUsers.filter(u => u.role === 'admin').length;
        return { total: allUsers.length, newThisMonth, admins, regular: allUsers.length - admins };
    }, [allUsers]);

    const tabs = [
        { key: 'overview', label: 'Overview' },
        { key: 'blogs', label: 'Blogs' },
        { key: 'events', label: 'Events' },
        { key: 'users', label: 'Users' },
    ];

    return (
        <>
            <h1 className="text-4xl font-bold text-rose-900 mb-8">Admin Dashboard</h1>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Total Users', value: adminStats.total, icon: Users, color: 'text-blue-600 bg-blue-50' },
                    { label: 'New This Month', value: adminStats.newThisMonth, icon: TrendingUp, color: 'text-green-600 bg-green-50' },
                    { label: 'Regular Users', value: adminStats.regular, icon: UserCheck, color: 'text-rose-600 bg-rose-50' },
                    { label: 'Admins', value: adminStats.admins, icon: Award, color: 'text-purple-600 bg-purple-50' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-white rounded-xl shadow-lg p-5 flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${color}`}><Icon className="w-6 h-6" /></div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{value}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tab Navigation */}
            <div className="bg-white rounded-xl shadow-lg mb-8">
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-1 px-4 overflow-x-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`py-4 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
                                    activeTab === tab.key
                                        ? 'border-rose-500 text-rose-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="p-6">
                    {activeTab === 'overview' && (
                        <div>
                            <h2 className="text-lg font-bold text-rose-800 mb-4">Recent Users</h2>
                            {allUsers.length === 0 ? <p className="text-gray-500">No users found.</p> : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-rose-50">
                                            <tr>
                                                <th className="p-3 font-semibold text-rose-800">Name</th>
                                                <th className="p-3 font-semibold text-rose-800">Email</th>
                                                <th className="p-3 font-semibold text-rose-800">Role</th>
                                                <th className="p-3 font-semibold text-rose-800">Joined</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[...allUsers].sort((a, b) => {
                                                const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
                                                const db2 = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
                                                return db2 - da;
                                            }).slice(0, 10).map(u => (
                                                <tr key={u.id} className="border-b border-gray-100">
                                                    <td className="p-3 font-medium text-gray-800">{u.name || '—'}</td>
                                                    <td className="p-3 text-gray-600">{u.email || '—'}</td>
                                                    <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>{u.role || 'user'}</span></td>
                                                    <td className="p-3 text-gray-500 text-xs">{u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                    {activeTab === 'blogs' && <ManageBlogs db={db} showNotification={showNotification} />}
                    {activeTab === 'events' && <ManageEvents db={db} showNotification={showNotification} />}
                    {activeTab === 'users' && <ManageUsers db={db} showNotification={showNotification} />}
                </div>
            </div>
        </>
    );
};

// --- ADDED: ManageUsers Component ---
const ManageUsers = ({ db, showNotification }) => {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        if (!db) return;
        const usersQuery = query(collection(db, 'users'));
        const unsubscribe = onSnapshot(usersQuery, (querySnapshot) => {
            const usersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsers(usersData);
        }, (error) => console.error("Error fetching users: ", error));
        return () => unsubscribe();
    }, [db]);

    const updateUserRole = async (userId, newRole) => {
        try {
            await setDoc(doc(db, 'users', userId), { role: newRole }, { merge: true });
            showNotification("User role updated.");
        } catch (error) {
            console.error("Error updating user role: ", error);
            showNotification("Error updating user role.");
        }
    };

    return (
        <>
            <h1 className="text-4xl font-bold text-rose-900 mb-8">Manage Users</h1>

            <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-rose-100">
                        <tr>
                            <th className="p-4 font-semibold text-rose-800">Name</th>
                            <th className="p-4 font-semibold text-rose-800">Email</th>
                            <th className="p-4 font-semibold text-rose-800">Role</th>
                            <th className="p-4 font-semibold text-rose-800">Created</th>
                            <th className="p-4 font-semibold text-rose-800"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="border-b border-rose-100 last:border-b-0">
                                <td className="p-4 font-medium text-gray-800">{user.name}</td>
                                <td className="p-4 text-gray-600">{user.email}</td>
                                <td className="p-4">
                                    <select
                                        value={user.role || 'user'}
                                        onChange={e => updateUserRole(user.id, e.target.value)}
                                        className="p-1 border border-gray-300 rounded"
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </td>
                                <td className="p-4 text-gray-500">{user.createdAt?.toDate().toLocaleDateString()}</td>
                                <td className="p-4"></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

// --- ADDED: Settings Component ---
const Settings = ({ auth, user, db, basePath, planId, guests, budgetItems, vendors, tasks, agendaItems, documents, totalBudget, weddingDate, showNotification, setConfirmModal, setPlanId, setError }) => {
    const [resetEmail, setResetEmail] = useState(user?.email || '');
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [isCreatingPlan, setIsCreatingPlan] = useState(false);

    const handlePasswordReset = async (e) => {
        e.preventDefault();
        if (!resetEmail) {
            showNotification('Please enter your email address');
            return;
        }

        setIsResettingPassword(true);
        try {
            await sendPasswordResetEmail(auth, resetEmail);
            showNotification('Password reset email sent! Check your inbox.');
        } catch (error) {
            console.error('Password reset error:', error);
            showNotification('Error sending password reset email: ' + error.message);
        } finally {
            setIsResettingPassword(false);
        }
    };

    const createNewPlan = async () => {
        setError('');
        const newPlanId = nanoid(10);
        setIsCreatingPlan(true);
        try {
            const configDoc = doc(db, `/plans/${newPlanId}/config`, 'budget');
            await setDoc(configDoc, { amount: 100000 });

            const tasksCol = collection(db, `/plans/${newPlanId}/tasks`);
            await addDoc(tasksCol, {
                text: 'Start planning your wedding!',
                timeline: '12+ Months',
                completed: false
            });

            const userPlansQuery = query(
                collection(db, `/users/${user.uid}/plans`),
                where('planId', '==', newPlanId)
            );
            const userPlansSnapshot = await getDocs(userPlansQuery);
            
            if (userPlansSnapshot.empty) {
                const userPlansCol = collection(db, `/users/${user.uid}/plans`);
                await addDoc(userPlansCol, {
                    planId: newPlanId,
                    createdAt: new Date(),
                    lastAccessed: new Date(),
                    role: 'owner'
                });
            } else {
                const userPlanDoc = doc(db, `/users/${user.uid}/plans`, userPlansSnapshot.docs[0].id);
                await setDoc(userPlanDoc, { lastAccessed: new Date() }, { merge: true });
            }

            showNotification('New plan created successfully!');
            setPlanId(newPlanId);
        } catch (err) {
            console.error("Error creating new plan: ", err);
            setError(err.message);
        } finally {
            setIsCreatingPlan(false);
        }
    };

    const handleBackup = () => {
        try {
            const backupData = {
                planId: planId,
                exportDate: new Date().toISOString(),
                totalBudget: totalBudget,
                guests: guests,
                budgetItems: budgetItems,
                vendors: vendors,
                tasks: tasks,
                agendaItems: agendaItems,
                documents: documents.map(doc => ({
                    ...doc,
                    fileURL: undefined,
                    filePath: undefined
                }))
            };

            const dataStr = JSON.stringify(backupData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `wedding-planner-backup-${planId}-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            showNotification('Backup downloaded successfully!');
        } catch (error) {
            console.error('Backup error:', error);
            showNotification('Error creating backup: ' + error.message);
        }
    };

    const handleRestore = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const backupData = JSON.parse(text);
            
            if (!backupData.planId || !backupData.exportDate) {
                showNotification('Invalid backup file format');
                return;
            }

            setConfirmModal({
                isOpen: true,
                title: 'Restore Backup Data?',
                message: 'This will replace all current data with the backup data. This action cannot be undone. Continue?',
                onConfirm: () => performRestore(backupData)
            });

        } catch (error) {
            console.error('Restore error:', error);
            showNotification('Error reading backup file: ' + error.message);
        } finally {
            e.target.value = '';
        }
    };

    const performRestore = async (backupData) => {
        try {
            if (!db || !basePath) {
                showNotification('Database not available');
                return;
            }

            const batch = writeBatch(db);

            if (backupData.totalBudget !== undefined) {
                const budgetDoc = doc(db, `${basePath}/config`, 'budget');
                batch.set(budgetDoc, { amount: backupData.totalBudget }, { merge: true });
            }

            const restoreCollection = async (collectionName, dataArray, excludeFields = []) => {
                if (!dataArray || !Array.isArray(dataArray)) return;

                const existingQuery = query(collection(db, `${basePath}/${collectionName}`));
                const existingDocs = await getDocs(existingQuery);
                existingDocs.docs.forEach(docSnapshot => {
                    batch.delete(doc(db, `${basePath}/${collectionName}`, docSnapshot.id));
                });

                dataArray.forEach(item => {
                    const cleanItem = { ...item };
                    excludeFields.forEach(field => delete cleanItem[field]);
                    delete cleanItem.id;
                    
                    const newDocRef = doc(collection(db, `${basePath}/${collectionName}`));
                    batch.set(newDocRef, cleanItem);
                });
            };

            await restoreCollection('guests', backupData.guests);
            await restoreCollection('budgetItems', backupData.budgetItems);
            await restoreCollection('vendors', backupData.vendors);
            await restoreCollection('tasks', backupData.tasks);
            await restoreCollection('agendaItems', backupData.agendaItems);
            await restoreCollection('documents', backupData.documents, ['fileURL', 'filePath']);

            await batch.commit();
            
            showNotification('Data restored successfully! Please refresh the page to see all changes.');
        } catch (error) {
            console.error('Restore operation error:', error);
            showNotification('Error restoring data: ' + error.message);
        }
    };

    const rsvpLink = planId ? `${window.location.origin}/rsvp/${planId}` : '';
    const copyLink = (link, label) => {
        navigator.clipboard.writeText(link).then(() => showNotification(`${label} copied!`));
    };

    const saveWeddingDate = async (date) => {
        if (!db || !basePath) return;
        try { await setDoc(doc(db, `${basePath}/config`, 'plan'), { weddingDate: date }, { merge: true }); }
        catch (e) { console.error(e); }
    };

    return (
        <>
            <h1 className="text-4xl font-bold text-rose-900 mb-8">Settings</h1>

            <div className="space-y-8">
                {/* Wedding Date & Sharing */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold text-rose-800 mb-4 flex items-center space-x-2">
                        <Share2 className="w-6 h-6" />
                        <span>Wedding Date & Sharing</span>
                    </h2>
                    <div className="space-y-5">
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Wedding Date</label>
                            <input
                                type="date"
                                value={weddingDate || ''}
                                onChange={e => saveWeddingDate(e.target.value)}
                                className="p-2 border border-gray-300 rounded-lg focus:border-rose-400 text-sm"
                            />
                            <p className="text-xs text-gray-500 mt-1">Sets the countdown on your dashboard.</p>
                        </div>
                        {planId && (
                            <>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">Guest RSVP Link</label>
                                    <div className="flex items-center gap-2">
                                        <input readOnly value={rsvpLink} className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-700 truncate" />
                                        <button onClick={() => copyLink(rsvpLink, 'RSVP link')} className="flex items-center gap-1 px-3 py-2 bg-rose-600 text-white rounded-lg text-sm hover:bg-rose-700 transition-colors shrink-0">
                                            <Copy className="w-4 h-4" /> Copy
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Share this link with guests so they can confirm attendance without an account.</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-1">Co-planner Plan ID</label>
                                    <div className="flex items-center gap-2">
                                        <input readOnly value={planId} className="flex-1 p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-700" />
                                        <button onClick={() => copyLink(planId, 'Plan ID')} className="flex items-center gap-1 px-3 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors shrink-0">
                                            <Copy className="w-4 h-4" /> Copy
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">Share this ID with your partner or coordinator — they can enter it on the plan selector screen to access the same plan.</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Plan Management Section */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold text-rose-800 mb-4 flex items-center space-x-2">
                        <PartyPopper className="w-6 h-6" />
                        <span>Plan Management</span>
                    </h2>
                    
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium text-gray-800 mb-3">Create New Plan</h3>
                            <p className="text-gray-600 mb-3">
                                Start a new wedding planning session. You can switch between multiple plans at any time.
                            </p>
                            <button
                                onClick={createNewPlan}
                                disabled={isCreatingPlan}
                                className="bg-rose-600 text-white px-5 py-2 rounded-lg hover:bg-rose-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                            >
                                <Plus className="w-4 h-4" />
                                <span>{isCreatingPlan ? 'Creating...' : 'Create New Plan'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Password Reset Section */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold text-rose-800 mb-4 flex items-center space-x-2">
                        <Key className="w-6 h-6" />
                        <span>Password Management</span>
                    </h2>
                    
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium text-gray-800 mb-3">Reset Password</h3>
                            <form onSubmit={handlePasswordReset} className="flex flex-col sm:flex-row gap-3">
                                <input
                                    type="email"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    placeholder="Enter your email address"
                                    className="flex-1 p-2 border border-gray-300 rounded-lg"
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={isResettingPassword}
                                    className="bg-rose-600 text-white px-5 py-2 rounded-lg hover:bg-rose-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                                >
                                    <Key className="w-4 h-4" />
                                    <span>{isResettingPassword ? 'Sending...' : 'Send Reset Email'}</span>
                                </button>
                            </form>
                            <p className="text-sm text-gray-600 mt-2">
                                Enter your email address and we'll send you a link to reset your password.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Backup & Restore Section */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold text-rose-800 mb-4 flex items-center space-x-2">
                        <UploadCloud className="w-6 h-6" />
                        <span>Backup & Restore</span>
                    </h2>
                    
                    <div className="space-y-6">
                        {/* Backup */}
                        <div>
                            <h3 className="text-lg font-medium text-gray-800 mb-3">Backup Your Data</h3>
                            <p className="text-gray-600 mb-3">
                                Download all your wedding planner data as a JSON file. This includes guests, budget items, vendors, tasks, agenda, and documents (excluding file contents).
                            </p>
                            <button
                                onClick={handleBackup}
                                className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                            >
                                <Download className="w-4 h-4" />
                                <span>Download Backup</span>
                            </button>
                        </div>

                        {/* Restore */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-medium text-gray-800 mb-3">Restore from Backup</h3>
                            <p className="text-gray-600 mb-3">
                                Upload a previously saved backup file to restore your data. This will replace all current data with the backup data.
                            </p>
                            <div className="flex items-center space-x-3">
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleRestore}
                                    className="hidden"
                                    id="restore-file-input"
                                />
                                <label
                                    htmlFor="restore-file-input"
                                    className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 cursor-pointer"
                                >
                                    <Upload className="w-4 h-4" />
                                    <span>Select Backup File</span>
                                </label>
                                <span className="text-sm text-gray-500">Choose a .json backup file</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Plan Information */}
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h2 className="text-xl font-semibold text-rose-800 mb-4">Plan Information</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700">Current Plan ID</label>
                            <p className="text-lg font-mono text-gray-900">{planId || 'No plan selected'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">User Email</label>
                            <p className="text-lg text-gray-900">{user?.email}</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};


// --- Main App Component ---
export default function App() {
    // --- App State ---
    const [currentView, setCurrentView] = useState('dashboard');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // --- Firebase State ---
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [storage, setStorage] = useState(null);
    const [user, setUser] = useState(null);
    const [planId, setPlanId] = useState(null);
    const [basePath, setBasePath] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [notification, setNotification] = useState('');
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
    });

    // --- Data State ---
    const [totalBudget, setTotalBudget] = useState(100000);
    const [tableConfig, setTableConfig] = useState({ tableCount: 10, tableCapacity: 8 });
    const [guests, setGuests] = useState([]);
    const [budgetItems, setBudgetItems] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [agendaItems, setAgendaItems] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [photos, setPhotos] = useState([]);
    const [weddingDate, setWeddingDate] = useState(null);
    const [userRole, setUserRole] = useState(null);

    // --- 1. Initialize Firebase & Auth ---
    useEffect(() => {

        if (!import.meta.env.VITE_FIREBASE_API_KEY) {
            setError("Firebase configuration is missing. Please check your .env file and ensure all Firebase environment variables are set.");
            setIsLoading(false);
            return;
        }

        const authInstance = firebaseAuth;
        const dbInstance = firebaseDb;
        const storageInstance = firebaseStorage;

        setAuth(authInstance);
        setDb(dbInstance);
        setStorage(storageInstance);
        setIsLoading(true);
        
        // Set up auth state listener
        const unsubscribe = onAuthStateChanged(authInstance, (user) => {
            console.log('Auth state changed:', user ? 'User logged in' : 'No user');
            
            if (user) {
                setUser(user);
                setIsLoading(false);
                
                // Fetch user role
                getDocs(query(collection(dbInstance, 'users'), where('__name__', '==', user.uid)))
                    .then(userDoc => {
                        if (!userDoc.empty) {
                            const userData = userDoc.docs[0].data();
                            setUserRole(userData.role || 'user');

                        } else {
                            setUserRole('user');

                        }
                    })
                    .catch(error => {
                        console.error("Error fetching user role:", error);
                        setUserRole('user');
                    });
            } else {
                console.log('No user found, setting states to null');
                setUser(null);
                setPlanId(null);
                setBasePath('');
                setUserRole(null);
                setIsLoading(false);

            }
        });

        return () => unsubscribe();
    }, []);

    // --- ADDED: Handle Notification ---
    const showNotification = (message) => {
        setNotification(message);
        setTimeout(() => {
            setNotification('');
        }, 3000);
    };

    // --- ADDED: Handle Logout ---
    const handleLogout = async () => {
        if (auth && user && planId) {
            try {
                const userPlanQuery = query(
                    collection(db, `/users/${user.uid}/plans`),
                    where('planId', '==', planId)
                );
                const userPlanSnapshot = await getDocs(userPlanQuery);
                if (!userPlanSnapshot.empty) {
                    const userPlanDoc = doc(db, `/users/${user.uid}/plans`, userPlanSnapshot.docs[0].id);
                    await setDoc(userPlanDoc, { lastAccessed: new Date() }, { merge: true });
                }
            } catch (error) {
                console.error("Error updating last accessed time: ", error);
            }
            await signOut(auth);
        } else if (auth) {
            await signOut(auth);
        }
    };

    // --- ADDED: Handle Guest Login ---
    const handleGuestLogin = async () => {
        if (!auth) return;
        try {
            await signInAnonymously(auth);
        } catch (err) {
            setError(err.message);
        }
    };

    // --- 2. Update Base Path when Plan ID changes ---
    useEffect(() => {

        if (planId) {
            setBasePath(`/plans/${planId}`);
        } else {
            setBasePath('');
        }
    }, [planId]);


    // --- 3. Listen to Firestore Data ---
    useEffect(() => {

        if (!db || !basePath) {
            setGuests([]);
            setBudgetItems([]);
            setVendors([]);
            setTasks([]);
            setTotalBudget(100000);
            setAgendaItems([]);
            setDocuments([]);
            setPhotos([]);
            setWeddingDate(null);
            return;
        }



        const guestsQuery = query(collection(db, `${basePath}/guests`));
        const unsubGuests = onSnapshot(guestsQuery, (querySnapshot) => {

            const guestData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setGuests(guestData);
        }, (error) => console.error("Error listening to guests: ", error));

        const budgetQuery = query(collection(db, `${basePath}/budgetItems`));
        const unsubBudgetItems = onSnapshot(budgetQuery, (querySnapshot) => {
            const budgetData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setBudgetItems(budgetData);
        }, (error) => console.error("Error listening to budget items: ", error));

        const vendorsQuery = query(collection(db, `${basePath}/vendors`));
        const unsubVendors = onSnapshot(vendorsQuery, (querySnapshot) => {
            const vendorData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setVendors(vendorData);
        }, (error) => console.error("Error listening to vendors: ", error));

        const tasksQuery = query(collection(db, `${basePath}/tasks`));
        const unsubTasks = onSnapshot(tasksQuery, (querySnapshot) => {
            const taskData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            taskData.sort((a, b) => timelineOrder.indexOf(a.timeline) - timelineOrder.indexOf(b.timeline));
            setTasks(taskData);
        }, (error) => console.error("Error listening to tasks: ", error));

        const agendaQuery = query(collection(db, `${basePath}/agenda`));
        const unsubAgenda = onSnapshot(agendaQuery, (querySnapshot) => {
            const agendaData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAgendaItems(agendaData);
        }, (error) => console.error("Error listening to agenda: ", error));

        const documentsQuery = query(collection(db, `${basePath}/documents`));
        const unsubDocuments = onSnapshot(documentsQuery, (querySnapshot) => {
            const docData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setDocuments(docData);
        }, (error) => console.error("Error listening to documents: ", error));

        const budgetConfigDoc = doc(db, `${basePath}/config`, 'budget');
        const unsubTotalBudget = onSnapshot(budgetConfigDoc, (docSnap) => {

            if (docSnap.exists()) {
                setTotalBudget(docSnap.data().amount || 100000);
            } else {
                setTotalBudget(100000);
            }
        }, (error) => console.error("Error listening to total budget: ", error));

        const tableConfigDoc = doc(db, `${basePath}/config`, 'tables');
        const unsubTableConfig = onSnapshot(tableConfigDoc, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setTableConfig({
                    tableCount: data.tableCount || 10,
                    tableCapacity: data.tableCapacity || 8,
                    tableCapacities: data.tableCapacities || {},
                });
            }
        }, (error) => console.error("Error listening to table config: ", error));

        const galleryQuery = query(collection(db, `${basePath}/gallery`));
        const unsubGallery = onSnapshot(galleryQuery, snap => {
            setPhotos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (error) => console.error("Error listening to gallery: ", error));

        const planConfigDoc = doc(db, `${basePath}/config`, 'plan');
        const unsubPlanConfig = onSnapshot(planConfigDoc, (docSnap) => {
            if (docSnap.exists()) {
                setWeddingDate(docSnap.data().weddingDate || null);
            }
        }, (error) => console.error("Error listening to plan config: ", error));

        return () => {
            unsubGuests();
            unsubBudgetItems();
            unsubVendors();
            unsubTasks();
            unsubTotalBudget();
            unsubTableConfig();
            unsubAgenda();
            unsubDocuments();
            unsubGallery();
            unsubPlanConfig();
        };

    }, [db, basePath]);

    // --- ADDED: Update last accessed time periodically when plan is active ---
    useEffect(() => {
        if (!user || !planId || !db) return;

        const updateLastAccessed = async () => {
            try {
                const userPlanQuery = query(
                    collection(db, `/users/${user.uid}/plans`),
                    where('planId', '==', planId)
                );
                const userPlanSnapshot = await getDocs(userPlanQuery);
                if (!userPlanSnapshot.empty) {
                    const userPlanDoc = doc(db, `/users/${user.uid}/plans`, userPlanSnapshot.docs[0].id);
                    await setDoc(userPlanDoc, { lastAccessed: new Date() }, { merge: true });
                }
            } catch (error) {
                console.error("Error updating last accessed time: ", error);
            }
        };

        updateLastAccessed();
        const interval = setInterval(updateLastAccessed, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [user, planId, db, basePath]);
    
    // --- Props for children ---
    const pageProps = {
        guests,
        budgetItems,
        vendors,
        tasks,
        agendaItems,
        documents,
        photos,
        totalBudget,
        tableConfig,
        weddingDate,
        setCurrentView,
        setGuests,
        setBudgetItems,
        setVendors,
        setTasks,
        setTotalBudget,
        db,
        basePath,
        storage,
        planId,
        showNotification,
        setConfirmModal,
        user,
        userRole,
    };
    
    // --- Content Router ---
    const renderContent = () => {
        switch (currentView) {
            case 'dashboard':
                return <Dashboard {...pageProps} />;
            case 'guest-tables':
                return <GuestTableManagement {...pageProps} />;
            case 'budget':
                return <Budget {...pageProps} />;
            case 'vendors':
                return <Vendors {...pageProps} />;
            case 'checklist':
                return <Checklist {...pageProps} />;
            case 'agenda':
                return <Agenda {...pageProps} />;
            case 'gallery':
                return <PhotoGallery {...pageProps} />;
            case 'documents':
                return <Documents {...pageProps} />;
            case 'settings':
                return <Settings {...pageProps} auth={auth} user={user} setPlanId={setPlanId} setError={setError} />;
            case 'admin':
                return <AdminDashboard db={db} showNotification={showNotification} />;
            case 'blogs':
                return <ManageBlogs db={db} showNotification={showNotification} />;
            case 'users':
                return <ManageUsers db={db} showNotification={showNotification} />;
            default:
                return <h1 className="text-3xl font-bold">Page Not Found</h1>;
        }
    };

// --- Main Render Logic ---
    if (isLoading) {
        console.log('App is in loading state');
        return <h1 className="text-3xl font-bold p-10">Loading Planner...</h1>;
    }

    if (error && !auth) {
        return (
            <div className="flex items-center justify-center h-screen w-full bg-rose-50">
                <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
                    <h1 className="text-3xl font-bold text-center text-red-600">Configuration Error</h1>
                    <p className="text-gray-600 text-center">{error}</p>
                    <p className="text-sm text-gray-500 text-center">
                        Please check your environment configuration and try again.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:id" element={<Blog />} />
            <Route path="/events" element={<Events />} />
            <Route path="/firebase-test" element={<FirebaseTest />} />
            <Route path="/rsvp/:planId" element={<RSVPPage />} />
            <Route path="/auth" element={!user ? (auth ? <AuthPage auth={auth} db={db} error={error} setError={setError} onGuestLogin={handleGuestLogin} /> : <div className="min-h-screen bg-rose-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-rose-900 mb-4">Loading...</h1><p className="text-gray-600">Initializing authentication service</p><div className="mt-4 animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto"></div></div></div>) : <Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={
                !user ? (
                    <Navigate to="/auth" replace />
                ) : (
                    !planId ? (
                        <PlanSelector 
                            db={db} 
                            user={user} 
                            setPlanId={setPlanId} 
                            error={error} 
                            setError={setError} 
                            handleLogout={handleLogout} 
                        />
                    ) : (
                        <div className="flex flex-col md:flex-row md:h-screen bg-rose-50 font-sans">
                            <Notification message={notification} />
                            <ConfirmationModal
                                isOpen={confirmModal.isOpen}
                                title={confirmModal.title}
                                message={confirmModal.message}
                                onConfirm={() => {
                                    confirmModal.onConfirm();
                                    setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
                                }}
                                onCancel={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
                            />
                            <MobileHeader
                                setIsMobileMenuOpen={setIsMobileMenuOpen}
                                handleLogout={handleLogout}
                            />
                            <Sidebar
                                currentView={currentView}
                                setCurrentView={setCurrentView}
                                planId={planId}
                                handleLogout={handleLogout}
                                isMobileMenuOpen={isMobileMenuOpen}
                                setIsMobileMenuOpen={setIsMobileMenuOpen}
                                showNotification={showNotification}
                                userRole={userRole}
                            />
                            <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:px-10 md:pt-12 md:pb-10">
                                {renderContent()}
                                <div className="mt-8 pt-4 border-t border-rose-100">
                                    <AdBanner slot="SLOT_ID_PLANNER_FOOTER" />
                                </div>
                            </main>
                        </div>
                    )
                )
            } />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    );
}