import React, { useState, useMemo, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  PiggyBank,
  Briefcase,
  CheckSquare,
  Plus,
  Trash2,
  Copy,
  LogIn,
  LogOut,
  PartyPopper,
  UserPlus,
  Menu, // ADDED: For mobile menu
  X, // ADDED: For mobile menu close
  ListTodo, // ADDED: For Agenda
  Folder, // ADDED: For Documents tab
  UploadCloud, // ADDED: For new component
  FileText, // ADDED: For new component
  Settings as SettingsIcon, // ADDED: For Settings tab
  Download, // ADDED: For backup
  Upload, // ADDED: For restore
  Key, // ADDED: For password reset
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    // --- REMOVED: signInAnonymously
    onAuthStateChanged,
    // --- ADDED: Email/Password Auth ---
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail, // ADDED: For password reset
    updatePassword // ADDED: For password update
} from 'firebase/auth';
import {
    getFirestore,
    doc,
    addDoc,
    setDoc,
    deleteDoc,
    onSnapshot,
    collection,
    query,
    where, // ADDED: For user plans queries
    writeBatch, // --- ADDED: For initial plan setup
    getDocs // ADDED: For backup functionality
} from 'firebase/firestore';
// --- ADDED: Firebase Storage ---
import {
    getStorage,
    ref,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject
} from "firebase/storage";
// --- ADDED: For Plan ID generation ---
import { nanoid } from 'nanoid';


// --- YOUR FIREBASE CONFIG ---
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAJ9wBW6ao4CBP-YCxt1GXlvwA8CXHQFaE",
  authDomain: "my-wedding-app-39f14.firebaseapp.com",
  projectId: "my-wedding-app-39f14",
  storageBucket: "my-wedding-app-39f14.firebasestorage.app",
  messagingSenderId: "630903724575",
  appId: "1:630903724575:web:b9aa188aa01baa50f6932a"
};
// --- END YOUR FIREBASE CONFIG ---

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const timelineOrder = ['12+ Months', '10-12 Months', '8-10 Months', '6-8 Months', '4-6 Months', '2-3 Months', '1-2 Months', '2-4 Weeks', '1 Week'];
// --- Currency Updated to LKR ---
const currency = (val) => new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', minimumFractionDigits: 2 }).format(val);

// --- ADDED: Notification Component ---
const Notification = ({ message }) => {
    if (!message) return null;

    return (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in-out">
            {message}
            {/* We can add a simple fade animation with Tailwind config, but for now, it just appears and disappears */}
            {/* Or add a keyframe animation in index.html's <style> tag if needed */}
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
// --- UPDATED: To accept planId and handle logout/copy ---
// UPDATED: Now accepts mobile menu state handlers
const Sidebar = ({ currentView, setCurrentView, planId, handleLogout, isMobileMenuOpen, setIsMobileMenuOpen, showNotification }) => {
    const views = [
        { key: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
        { key: 'guestlist', name: 'Guest List', icon: Users },
        { key: 'budget', name: 'Budget', icon: PiggyBank },
        { key: 'vendors', name: 'Vendors', icon: Briefcase },
        { key: 'checklist', name: 'Checklist', icon: CheckSquare },
        { key: 'agenda', name: 'Agenda', icon: ListTodo }, // ADDED: Agenda nav item
        { key: 'documents', name: 'Documents', icon: Folder }, // ADDED: Documents tab
        { key: 'settings', name: 'Settings', icon: SettingsIcon }, // ADDED: Settings tab
    ];

    // --- UPDATED: Copy Plan ID functionality ---
    const copyPlanId = () => {
        if (!navigator.clipboard) {
            // Fallback for insecure contexts
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

    // This is the content for the sidebar, reused in desktop and mobile
    const sidebarContent = (
        <nav className="w-64 bg-rose-800 text-white p-6 shadow-lg flex flex-col h-full">
            <h1 className="text-3xl font-bold mb-8 text-rose-100">Wedding Planner</h1>
            <ul className="space-y-3 flex-1">
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
                                className={`flex items-center space-x-3 w-full text-left p-3 rounded-lg transition-colors duration-200 ${
                                    isActive ? 'bg-rose-900 text-white' : 'text-rose-200 hover:bg-rose-700 hover:text-white'
                                }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="font-medium">{view.name}</span>
                            </button>
                        </li>
                    );
                })}
            </ul>
            
            {/* --- ADDED: Plan ID Sharing Section --- */}
            {planId && (
                <div className="mt-4 p-3 bg-rose-700 rounded-lg">
                    <label className="text-xs text-rose-200 font-medium">Your Plan ID:</label>
                    <div className="flex items-center justify-between mt-1">
                        <span className="text-sm font-mono text-white truncate mr-2">{planId}</span>
                        <button 
                            onClick={copyPlanId}
                            title="Copy Plan ID"
                            className="text-rose-200 hover:text-white transition-colors"
                        >
                            <Copy className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
            
            {/* --- ADDED: Logout Button --- */}
            <button
                onClick={handleLogout}
                className="flex items-center space-x-3 w-full text-left p-3 rounded-lg transition-colors duration-200 text-rose-200 hover:bg-rose-700 hover:text-white mt-4"
            >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
            </button>

            <div className="mt-6">
                <p className="text-xs text-rose-300">© 2025 SicatDigital</p>
            </div>
        </nav>
    );

    return (
        <>
            {/* --- Desktop Sidebar --- */}
            {/* Hides on small screens, shows on medium and up */}
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
        // --- UPDATED: Removed "fixed top-0 left-0 z-40" to make the bar scroll normally ---
        <header className="md:hidden w-full p-4 bg-rose-800 text-white flex justify-between items-center shadow-lg">
            <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2"
            >
                <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-rose-100">Wedding Planner</h1>
            <button
                onClick={handleLogout}
                className="p-2"
            >
                <LogOut className="w-6 h-6" />
            </button>
        </header>
    );
};


// --- Dashboard Component ---
const Dashboard = ({ guests, budgetItems, tasks, totalBudget, setCurrentView }) => {
    // Budget Calculations
    const budgetStats = useMemo(() => {
        const totalSpent = budgetItems.reduce((sum, item) => sum + item.paid, 0);
        const totalCost = budgetItems.reduce((sum, item) => sum + item.cost, 0);
        const balanceDue = totalCost - totalSpent;
        const remainingBudget = totalBudget - totalCost;
        const spentPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
        return { totalSpent, balanceDue, remainingBudget, spentPercent };
    }, [budgetItems, totalBudget]);

    // Attendance Calculations
    const attendanceStats = useMemo(() => {
        const totalInvited = guests.filter(g => g.invited).reduce((sum, g) => sum + g.numPeople, 0);
        const attending = guests.filter(g => g.rsvp === 'yes').reduce((sum, g) => sum + g.numPeople, 0);
        const notAttending = guests.filter(g => g.rsvp === 'no').reduce((sum, g) => sum + g.numPeople, 0);
        const unconfirmed = totalInvited - attending - notAttending;
        const attendingPercent = totalInvited > 0 ? (attending / totalInvited) * 100 : 0;
        return { totalInvited, attending, notAttending, unconfirmed, attendingPercent };
    }, [guests]);

    // Task Calculations
    const taskStats = useMemo(() => {
        const tasksCompleted = tasks.filter(t => t.completed).length;
        const totalTasks = tasks.length;
        const tasksPercent = totalTasks > 0 ? (tasksCompleted / totalTasks) * 100 : 0;
        const upcomingTasks = tasks.filter(t => !t.completed).slice(0, 5);
        return { tasksCompleted, totalTasks, tasksPercent, upcomingTasks };
    }, [tasks]);

    return (
        <>
            <h1 className="text-4xl font-bold text-rose-900 mb-8">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
        </>
    );
};

// --- Guest List Component ---
const GuestList = ({ guests, db, basePath }) => {
    // --- STATE for filtering
    const [filterSide, setFilterSide] = useState('Brides Side'); // 'Brides Side' or 'Grooms Side'
    
    // --- NEW: Updated tag options
    const tagOptions = ['Brides Side', 'Grooms Side'];
    const mealOptions = ['Beef', 'Chicken', 'Vegan', 'Kids'];

    const addGuest = async () => {
        if (!db || !basePath) return; // Prevent adding if db not ready
        const newGuest = { 
            name: 'New Guest', 
            phone: '', 
            // --- NEW: Updated default tag
            tag: filterSide, // Default to the currently viewed side
            invited: false, 
            rsvp: null, 
            numPeople: 1, 
            // --- REMOVED: rehearsal and farewell
            meal: null 
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

    // --- NEW: Filter guests based on state
    const filteredGuests = useMemo(() => {
        return guests.filter(guest => guest.tag === filterSide);
    }, [guests, filterSide]);

    // --- NEW: Calculate totals for tabs
    const bridesSideTotal = useMemo(() => {
        return guests
            .filter(g => g.tag === 'Brides Side')
            .reduce((sum, g) => sum + g.numPeople, 0);
    }, [guests]);
    
    const groomsSideTotal = useMemo(() => {
        return guests
            .filter(g => g.tag === 'Grooms Side')
            .reduce((sum, g) => sum + g.numPeople, 0);
    }, [guests]);

    return (
        <>
            <div className="flex justify-between items-center mb-4"> {/* Reduced margin bottom */}
                <h1 className="text-4xl font-bold text-rose-900">Guest List</h1>
                <button onClick={addGuest} className="bg-rose-600 text-white px-5 py-2.5 rounded-lg shadow-md hover:bg-rose-700 transition-colors flex items-center space-x-2">
                    <Plus className="w-5 h-5" />
                    <span>Add Guest</span>
                </button>
            </div>
            
            {/* --- NEW: Filter Tabs --- */}
            <div className="flex mb-4 border-b border-gray-300">
                <button
                    onClick={() => setFilterSide('Brides Side')}
                    className={`px-6 py-3 font-medium ${
                        filterSide === 'Brides Side' 
                        ? 'text-rose-700 border-b-2 border-rose-700' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Brides Side ({bridesSideTotal})
                </button>
                <button
                    onClick={() => setFilterSide('Grooms Side')}
                    className={`px-6 py-3 font-medium ${
                        filterSide === 'Grooms Side' 
                        ? 'text-rose-700 border-b-2 border-rose-700' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    Grooms Side ({groomsSideTotal})
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-rose-100">
                        <tr>
                            <th className="p-4 font-semibold text-rose-800">Name</th>
                            <th className="p-4 font-semibold text-rose-800">Phone</th>
                            <th className="p-4 font-semibold text-rose-800">Tag</th>
                            <th className="p-4 font-semibold text-rose-800">Invited</th>
                            <th className="p-4 font-semibold text-rose-800">#</th>
                            <th className="p-4 font-semibold text-rose-800">RSVP</th>
                            {/* --- REMOVED: Rehearsal and Farewell Headers --- */}
                            <th className="p-4 font-semibold text-rose-800">Meal</th>
                            <th className="p-4 font-semibold text-rose-800"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* --- NEW: Use filteredGuests array --- */}
                        {filteredGuests.map(guest => (
                            <tr key={guest.id} className="border-b border-rose-100 last:border-b-0">
                                <td className="p-3"><input type="text" value={guest.name} onChange={e => updateGuest(guest.id, 'name', e.target.value)} className="w-full p-1 rounded border-gray-300" /></td>
                                <td className="p-3"><input type="text" value={guest.phone} onChange={e => updateGuest(guest.id, 'phone', e.target.value)} className="w-full p-1 rounded border-gray-300" /></td>
                                <td className="p-3">
                                    <select value={guest.tag} onChange={e => updateGuest(guest.id, 'tag', e.target.value)} className="w-full p-1 rounded border-gray-300">
                                        {/* --- NEW: Updated tag options --- */}
                                        {tagOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </td>
                                <td className="p-3 text-center"><input type="checkbox" checked={guest.invited} onChange={e => updateGuest(guest.id, 'invited', e.target.checked)} className="h-5 w-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500" /></td>
                                <td className="p-3"><input type="number" value={guest.numPeople} onChange={e => updateGuest(guest.id, 'numPeople', parseInt(e.target.value) || 0)} className="w-16 p-1 rounded border-gray-300" /></td>
                                <td className="p-3">
                                    <select value={guest.rsvp || ''} onChange={e => updateGuest(guest.id, 'rsvp', e.target.value || null)} className="w-full p-1 rounded border-gray-300">
                                        <option value="">-</option>
                                        <option value="yes">Yes</option>
                                        <option value="no">No</option>
                                    </select>
                                </td>
                                {/* --- REMOVED: Rehearsal and Farewell Cells --- */}
                                <td className="p-3">
                                    <select value={guest.meal || ''} onChange={e => updateGuest(guest.id, 'meal', e.target.value || null)} className="w-full p-1 rounded border-gray-300" disabled={guest.rsvp !== 'yes'}>
                                        <option value="">-</option>
                                        {mealOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
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
        // --- UPDATED: Path now uses config/budget relative to basePath ---
        const configDoc = doc(db, `${basePath}/config`, 'budget');
        try {
            // Use setDoc with merge to create or update
            await setDoc(configDoc, { amount: newAmount }, { merge: true });
        } catch (e) {
            console.error("Error updating total budget: ", e);
        }
    };

    return (
        <>
            <h1 className="text-4xl font-bold text-rose-900 mb-8">Budget Tracker</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <label htmlFor="totalBudget" className="text-sm font-medium text-rose-800">Total Budget</label>
                    <input 
                        type="number" 
                        id="totalBudget" 
                        value={totalBudget} 
                        onChange={e => updateTotalBudget(parseFloat(e.target.value) || 0)} 
                        className="text-3xl font-bold text-rose-900 w-full p-1 -ml-1 rounded" 
                    />
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <p className="text-sm font-medium text-rose-800">Remaining Budget</p>
                    <p className={`text-3xl font-bold ${budgetTotals.remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>{currency(budgetTotals.remainingBudget)}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <p className="text-sm font-medium text-rose-800">Already Paid</p>
                    <p className="text-3xl font-bold text-gray-700">{currency(budgetTotals.totalPaid)}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <p className="text-sm font-medium text-rose-800">Balance Due</p>
                    <p className="text-3xl font-bold text-yellow-600">{currency(budgetTotals.balanceDue)}</p>
                </div>
            </div>

            <div className="flex justify-end mb-4">
                <button onClick={addBudgetItem} className="bg-rose-600 text-white px-5 py-2.5 rounded-lg shadow-md hover:bg-rose-700 transition-colors flex items-center space-x-2">
                    <Plus className="w-5 h-5" />
                    <span>Add Item</span>
                </button>
            </div>
            <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
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
        </>
    );
};

// --- Vendors Component ---
const Vendors = ({ vendors, db, basePath }) => {
    const vendorTypes = ['Venue', 'Caterer', 'Photographer', 'Videographer', 'Florist', 'Band/DJ', 'Other'];

    const addVendor = async () => {
        if (!db || !basePath) return;
        const newVendor = { type: 'Other', name: 'New Vendor', contact: '', email: '', packageNum: 1 };
        const vendorsCol = collection(db, `${basePath}/vendors`);
        try {
            await addDoc(vendorsCol, newVendor);
        } catch (e) {
            console.error("Error adding vendor: ", e);
        }
    };

    const updateVendor = async (id, field, value) => {
        if (!db || !basePath) return;
        const vendorDoc = doc(db, `${basePath}/vendors`, id);
        try {
            await setDoc(vendorDoc, { [field]: value }, { merge: true });
        } catch (e) {
            console.error("Error updating vendor: ", e);
        }
    };

    const deleteVendor = async (id) => {
        if (!db || !basePath) return;
        const vendorDoc = doc(db, `${basePath}/vendors`, id);
        try {
            await deleteDoc(vendorDoc);
        } catch (e) {
            console.error("Error deleting vendor: ", e);
        }
    };
    
    return (
        <>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold text-rose-900">Vendor Comparison</h1>
                <button onClick={addVendor} className="bg-rose-600 text-white px-5 py-2.5 rounded-lg shadow-md hover:bg-rose-700 transition-colors flex items-center space-x-2">
                    <Plus className="w-5 h-5" />
                    <span>Add Vendor</span>
                </button>
            </div>
            <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-rose-100">
                        <tr>
                            <th className="p-4 font-semibold text-rose-800">Type</th>
                            <th className="p-4 font-semibold text-rose-800">Name</th>
                            <th className="p-4 font-semibold text-rose-800">Contact</th>
                            <th className="p-4 font-semibold text-rose-800">Email</th>
                            <th className="p-4 font-semibold text-rose-800">Package #</th>
                            <th className="p-4 font-semibold text-rose-800"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {vendors.map(vendor => (
                            <tr key={vendor.id} className="border-b border-rose-100 last:border-b-0">
                                <td className="p-3">
                                    <select value={vendor.type} onChange={e => updateVendor(vendor.id, 'type', e.target.value)} className="w-full p-1 rounded border-gray-300">
                                        {vendorTypes.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </td>
                                <td className="p-3"><input type="text" value={vendor.name} onChange={e => updateVendor(vendor.id, 'name', e.target.value)} className="w-full p-1 rounded border-gray-300" /></td>
                                <td className="p-3"><input type="text" value={vendor.contact} onChange={e => updateVendor(vendor.id, 'contact', e.target.value)} className="w-full p-1 rounded border-gray-300" /></td>
                                <td className="p-3"><input type="email" value={vendor.email} onChange={e => updateVendor(vendor.id, 'email', e.target.value)} className="w-full p-1 rounded border-gray-300" /></td>
                                <td className="p-3"><input type="number" value={vendor.packageNum} onChange={e => updateVendor(vendor.id, 'packageNum', parseInt(e.target.value) || 1)} className="w-20 p-1 rounded border-gray-300" /></td>
                                <td className="p-3 text-center">
                                    <button onClick={() => deleteVendor(vendor.id)} className="text-gray-400 hover:text-red-600 p-1">
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

// --- Checklist Component ---
const Checklist = ({ tasks, db, basePath }) => {
    
    const timelines = useMemo(() => {
        // Use a static list to ensure order and presence, even if empty
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

    return (
        <>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold text-rose-900">Wedding Checklist</h1>
            </div>
            
            <div className="space-y-8">
                {timelines.map(timeline => {
                    const tasksForTimeline = tasksByTimeline[timeline] || [];
                    return (
                        <div key={timeline} className="bg-white p-6 rounded-xl shadow-lg">
                            <h2 className="text-2xl font-semibold text-rose-800 mb-5 border-b border-rose-200 pb-3">{timeline}</h2>
                            {tasksForTimeline.length === 0 ? (
                                <p className="text-gray-400 italic">No tasks for this period.</p>
                            ) : (
                                <ul className="space-y-4">
                                    {tasksForTimeline.map(task => (
                                        <li key={task.id} className="flex items-center">
                                            <input 
                                                type="checkbox" 
                                                id={`task-${task.id}`} 
                                                checked={task.completed} 
                                                onChange={() => toggleTask(task.id, task.completed)} 
                                                className="h-5 w-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500" 
                                            />
                                            <label htmlFor={`task-${task.id}`} className={`ml-3 text-gray-800 ${task.completed ? 'line-through text-gray-400' : ''}`}>{task.text}</label>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    );
                })}
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg mt-8">
                <h2 className="text-xl font-semibold text-rose-800 mb-4">Add New Task</h2>
                <form onSubmit={addTask} className="flex flex-col md:flex-row gap-4">
                    <input id="new-task-text" type="text" placeholder="Task description" className="flex-1 p-2 rounded border-gray-300" required />
                    <select id="new-task-timeline" className="p-2 rounded border-gray-300">
                        {timelineOrder.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <button type="submit" className="bg-rose-600 text-white px-5 py-2.5 rounded-lg shadow-md hover:bg-rose-700 transition-colors flex items-center justify-center space-x-2">
                        <Plus className="w-5 h-5" />
                        <span>Add Task</span>
                    </button>
                </form>
            </div>
        </>
    );
};

// --- ADDED: Agenda Component ---
const Agenda = ({ agendaItems, db, basePath }) => {
    
    // Sort items by time
    const sortedAgenda = useMemo(() => {
        return [...agendaItems].sort((a, b) => {
            // Simple string sort for time (e.g., "09:00 AM" vs "10:00 AM")
            return (a.time || '').localeCompare(b.time || '');
        });
    }, [agendaItems]);

    const addAgendaItem = async () => {
        if (!db || !basePath) return;
        const newItem = { 
            time: '09:00 AM', 
            event: 'New Event', 
            // --- REMOVED: Location ---
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

    return (
        <>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold text-rose-900">Wedding Agenda</h1>
                <button onClick={addAgendaItem} className="bg-rose-600 text-white px-5 py-2.5 rounded-lg shadow-md hover:bg-rose-700 transition-colors flex items-center space-x-2">
                    <Plus className="w-5 h-5" />
                    <span>Add Event</span>
                </button>
            </div>
            
            {/* --- UPDATED: Switched from <table> to a list-based layout --- */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Header Row */}
                <div className="flex bg-rose-100">
                    <h2 className="p-4 font-semibold text-rose-800 w-1/3 md:w-1/4">Time</h2>
                    <h2 className="p-4 font-semibold text-rose-800 flex-1">Event</h2>
                    <div className="p-4 w-12"></div> {/* Spacer for delete button */}
                </div>
                
                {/* Agenda Items */}
                <div className="divide-y divide-rose-100">
                    {sortedAgenda.length === 0 && (
                        <p className="p-4 text-gray-500 italic">Your agenda is empty. Add an event to get started!</p>
                    )}
                    {sortedAgenda.map(item => (
                        <div key={item.id} className="flex items-center">
                            <div className="p-3 w-1/3 md:w-1/4">
                                <input 
                                    type="text" 
                                    value={item.time} 
                                    onChange={e => updateAgendaItem(item.id, 'time', e.target.value)} 
                                    className="w-full p-2 rounded border-gray-300" 
                                    placeholder="e.g., 10:00 AM"
                                />
                            </div>
                            <div className="p-3 flex-1">
                                <input 
                                    type="text" 
                                    value={item.event} 
                                    onChange={e => updateAgendaItem(item.id, 'event', e.target.value)} 
                                    className="w-full p-2 rounded border-gray-300"
                                    placeholder="e.g., Ceremony Starts"
                                />
                            </div>
                            {/* --- REMOVED: Location Input --- */}
                            <div className="p-3 w-12 text-center">
                                <button onClick={() => deleteAgendaItem(item.id)} className="text-gray-400 hover:text-red-600 p-1">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
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
            // Check file size (5MB limit)
            if (e.target.files[0].size > 5 * 1024 * 1024) {
                showNotification("File is too large. Max size is 5MB.");
                e.target.value = null; // Clear the input
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

        // 1. Create a new document in Firestore to get an ID
        const newDoc = {
            name: docName,
            category: docCategory,
            fileName: selectedFile.name,
            fileURL: '',
            filePath: '',
            createdAt: new Date(),
        };
        const docRef = await addDoc(collection(db, `${basePath}/documents`), newDoc);

        // 2. Use the ID to create a storage path and upload the file
        const filePath = `plans/${planId}/documents/${docRef.id}/${selectedFile.name}`;
        const fileRef = ref(storage, filePath);
        const uploadTask = uploadBytesResumable(fileRef, selectedFile);

        uploadTask.on('state_changed', 
            () => {}, // Progress (optional)
            (error) => {
                console.error("Upload failed: ", error);
                showNotification("Upload failed. Please try again.");
                // If upload fails, delete the Firestore doc we just created
                deleteDoc(doc(db, `${basePath}/documents`, docRef.id));
                setIsUploading(false);
            }, 
            () => {
                // 3. On success, get URL and update the Firestore doc
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    setDoc(doc(db, `${basePath}/documents`, docRef.id), { 
                        fileURL: downloadURL, 
                        filePath: filePath 
                    }, { merge: true });
                    
                    // Reset form
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
        // Use the new confirmation modal
        setConfirmModal({
            isOpen: true,
            title: 'Delete Document?',
            message: `Are you sure you want to delete "${docName}"? This cannot be undone.`,
            onConfirm: () => handleFileDelete(docId, filePath)
        });
    };

    const handleFileDelete = async (docId, filePath) => {
        console.log("DEBUG: Deleting document", docId, filePath);
        if (!storage || !filePath || !db || !basePath) return;

        const fileRef = ref(storage, filePath);
        try {
            // 1. Delete from Storage
            await deleteObject(fileRef);
            // 2. Delete from Firestore
            await deleteDoc(doc(db, `${basePath}/documents`, docId));
            showNotification("Document deleted.");
        } catch (error) {
            console.error("Error deleting file: ", error);
            // Handle case where file doesn't exist in storage but doc does
            if (error.code === 'storage/object-not-found') {
                await deleteDoc(doc(db, `${basePath}/documents`, docId));
                showNotification("Document record deleted.");
            } else {
                showNotification("Error deleting file.");
            }
        }
    };

    // Sort documents by category, then name
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

            {/* Upload Form */}
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

            {/* Document List */}
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


// --- ADDED: LoginComponent ---
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
                    
                    {/* Password confirmation field for signup */}
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
                        // Clear form when switching views
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

// --- ADDED: RecentPlans Component ---
const RecentPlans = ({ user, db, setPlanId, setError }) => {
    const [recentPlans, setRecentPlans] = useState([]);

    useEffect(() => {
        if (!user || !db) return;

        const userPlansQuery = query(collection(db, `/users/${user.uid}/plans`));
        const unsubscribe = onSnapshot(userPlansQuery, (querySnapshot) => {
            const plansData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Sort by last accessed, most recent first
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
            // Verify plan still exists
            const configDoc = doc(db, `/plans/${planId}/config`, 'budget');
            const docSnap = await new Promise((resolve) => {
                const unsubscribe = onSnapshot(configDoc, (docSnap) => {
                    unsubscribe();
                    resolve(docSnap);
                });
            });

            if (docSnap.exists()) {
                // Update last accessed time
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
                // Plan no longer exists, remove from recent list
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
const PlanSelector = ({ db, user, setPlanId, setError, error }) => {
    const [joinId, setJoinId] = useState('');

    const createNewPlan = async () => {
        setError('');
        const newPlanId = nanoid(10); // Generate a 10-char ID
        console.log("DEBUG: Creating new plan", newPlanId);

        try {
            // Create a "config" doc to ensure the plan exists
            const configDoc = doc(db, `/plans/${newPlanId}/config`, 'budget');
            await setDoc(configDoc, { amount: 100000 }); // Set default budget

            // Optionally, create a default "welcome" task
            const tasksCol = collection(db, `/plans/${newPlanId}/tasks`);
            await addDoc(tasksCol, {
                text: 'Start planning your wedding!',
                timeline: '12+ Months',
                completed: false
            });

            // Check if plan already exists in user's plans list to prevent duplicates
            const userPlansQuery = query(
                collection(db, `/users/${user.uid}/plans`),
                where('planId', '==', newPlanId)
            );
            const userPlansSnapshot = await getDocs(userPlansQuery);
            
            if (userPlansSnapshot.empty) {
                // Plan doesn't exist in user's list, add it
                const userPlansCol = collection(db, `/users/${user.uid}/plans`);
                await addDoc(userPlansCol, {
                    planId: newPlanId,
                    createdAt: new Date(),
                    lastAccessed: new Date(),
                    role: 'owner'
                });
            } else {
                // Plan already exists, just update last accessed time
                const userPlanDoc = doc(db, `/users/${user.uid}/plans`, userPlansSnapshot.docs[0].id);
                await setDoc(userPlanDoc, { lastAccessed: new Date() }, { merge: true });
            }

            setPlanId(newPlanId);
        } catch (err) {
            console.error("Error creating new plan: ", err);
            setError(err.message);
        }
    };

    const joinPlan = async (e) => {
        e.preventDefault();
        setError('');
        if (!joinId) {
            setError("Please enter a Plan ID.");
            return;
        }

        // Check if plan exists by trying to read its config
        try {
            const configDoc = doc(db, `/plans/${joinId}/config`, 'budget');
            const docSnap = await onSnapshot(configDoc, (docSnap) => {
                if (docSnap.exists()) {
                    setPlanId(joinId); // Plan exists, join it
                } else {
                    setError("Plan ID not found. Please check the ID and try again.");
                }
            });
            // Call docSnap() to get an unsubscribe function, then immediately call it
            // This is a one-time check, not a persistent listener
            docSnap(); 
        } catch (err) {
            console.error("Error joining plan: ", err);
            setError("Error checking Plan ID.");
        }
    };
    
    // A quick-fix for the one-time read issue in the 'joinPlan' function.
    // A better implementation would use getDoc, but we'll stick to onSnapshot
    // as getDoc isn't imported. This is a hack.
    const joinPlanFix = async (e) => {
        e.preventDefault();
        setError('');
        if (!joinId) {
            setError("Please enter a Plan ID.");
            return;
        }

        console.log("DEBUG: Joining plan", joinId);
        // Check if plan exists by trying to read its config
        const configDoc = doc(db, `/plans/${joinId}/config`, 'budget');
        const unsubscribe = onSnapshot(configDoc, async (docSnap) => {
            console.log("DEBUG: Plan check result", docSnap.exists());
            unsubscribe(); // Unsubscribe immediately after the first read
            if (docSnap.exists()) {
                // Check if plan already exists in user's plans
                const userPlansQuery = query(
                    collection(db, `/users/${user.uid}/plans`),
                    where('planId', '==', joinId)
                );
                const userPlansSnapshot = await getDocs(userPlansQuery);
                
                if (userPlansSnapshot.empty) {
                    // Plan doesn't exist in user's list, add it
                    const userPlansCol = collection(db, `/users/${user.uid}/plans`);
                    await addDoc(userPlansCol, {
                        planId: joinId,
                        createdAt: new Date(),
                        lastAccessed: new Date(),
                        role: 'collaborator'
                    });
                } else {
                    // Plan already exists, update last accessed time
                    const userPlanDoc = doc(db, `/users/${user.uid}/plans`, userPlansSnapshot.docs[0].id);
                    await setDoc(userPlanDoc, { lastAccessed: new Date() }, { merge: true });
                }
                
                setPlanId(joinId); // Plan exists, join it
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
            <div className="w-full max-w-2xl p-8 space-y-6 bg-white rounded-xl shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-rose-900">Welcome!</h1>
                    <p className="text-gray-600 mt-2">Get started by creating a new plan or joining your partner's plan.</p>
                </div>
                
                {/* Recent Plans Section */}
                <RecentPlans user={user} db={db} setPlanId={setPlanId} setError={setError} />

                <div className="border-t pt-6">
                    {/* Create Plan Button */}
                    <button
                        onClick={createNewPlan}
                        className="w-full p-3 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 transition-colors flex items-center justify-center space-x-2 mb-4"
                    >
                        <PartyPopper className="w-5 h-5" />
                        <span>Create a New Plan</span>
                    </button>

                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-300"></span>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">or</span>
                        </div>
                    </div>

                    {/* Join Plan Form */}
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
                            <LogIn className="w-5 h-5" />
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

// --- ADDED: Settings Component ---
const Settings = ({ auth, user, db, basePath, planId, guests, budgetItems, vendors, tasks, agendaItems, documents, totalBudget, showNotification, setConfirmModal, setPlanId, setError }) => {
    const [resetEmail, setResetEmail] = useState(user?.email || '');
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [isCreatingPlan, setIsCreatingPlan] = useState(false);

    // Password reset functionality
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

    // Create new plan functionality
    const createNewPlan = async () => {
        setError('');
        const newPlanId = nanoid(10); // Generate a 10-char ID
        console.log("DEBUG: Creating new plan", newPlanId);

        setIsCreatingPlan(true);
        try {
            // Create a "config" doc to ensure the plan exists
            const configDoc = doc(db, `/plans/${newPlanId}/config`, 'budget');
            await setDoc(configDoc, { amount: 100000 }); // Set default budget

            // Optionally, create a default "welcome" task
            const tasksCol = collection(db, `/plans/${newPlanId}/tasks`);
            await addDoc(tasksCol, {
                text: 'Start planning your wedding!',
                timeline: '12+ Months',
                completed: false
            });

            // Check if plan already exists in user's plans list to prevent duplicates
            const userPlansQuery = query(
                collection(db, `/users/${user.uid}/plans`),
                where('planId', '==', newPlanId)
            );
            const userPlansSnapshot = await getDocs(userPlansQuery);
            
            if (userPlansSnapshot.empty) {
                // Plan doesn't exist in user's list, add it
                const userPlansCol = collection(db, `/users/${user.uid}/plans`);
                await addDoc(userPlansCol, {
                    planId: newPlanId,
                    createdAt: new Date(),
                    lastAccessed: new Date(),
                    role: 'owner'
                });
            } else {
                // Plan already exists, just update last accessed time
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

    // Backup functionality - Export all data
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
                    // Remove fileURL and filePath as they might not be accessible
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

    // Restore functionality - Import data
    const handleRestore = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const backupData = JSON.parse(text);
            
            // Validate backup data structure
            if (!backupData.planId || !backupData.exportDate) {
                showNotification('Invalid backup file format');
                return;
            }

            // Confirm restore action
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
            // Clear the file input
            e.target.value = '';
        }
    };

    // Perform the actual restore operation
    const performRestore = async (backupData) => {
        try {
            if (!db || !basePath) {
                showNotification('Database not available');
                return;
            }

            // Clear existing data and restore backup data
            const batch = writeBatch(db);

            // Restore budget
            if (backupData.totalBudget !== undefined) {
                const budgetDoc = doc(db, `${basePath}/config`, 'budget');
                batch.set(budgetDoc, { amount: backupData.totalBudget }, { merge: true });
            }

            // Helper function to restore collection
            const restoreCollection = async (collectionName, dataArray, excludeFields = []) => {
                if (!dataArray || !Array.isArray(dataArray)) return;

                // Clear existing data first
                const existingQuery = query(collection(db, `${basePath}/${collectionName}`));
                const existingDocs = await getDocs(existingQuery);
                existingDocs.docs.forEach(docSnapshot => {
                    batch.delete(doc(db, `${basePath}/${collectionName}`, docSnapshot.id));
                });

                // Add backup data
                dataArray.forEach(item => {
                    const cleanItem = { ...item };
                    excludeFields.forEach(field => delete cleanItem[field]);
                    delete cleanItem.id; // Remove ID to let Firestore generate new ones
                    
                    const newDocRef = doc(collection(db, `${basePath}/${collectionName}`));
                    batch.set(newDocRef, cleanItem);
                });
            };

            // Restore all collections
            await restoreCollection('guests', backupData.guests);
            await restoreCollection('budgetItems', backupData.budgetItems);
            await restoreCollection('vendors', backupData.vendors);
            await restoreCollection('tasks', backupData.tasks);
            await restoreCollection('agendaItems', backupData.agendaItems);
            await restoreCollection('documents', backupData.documents, ['fileURL', 'filePath']);

            // Commit the batch
            await batch.commit();
            
            showNotification('Data restored successfully! Please refresh the page to see all changes.');
        } catch (error) {
            console.error('Restore operation error:', error);
            showNotification('Error restoring data: ' + error.message);
        }
    };

    return (
        <>
            <h1 className="text-4xl font-bold text-rose-900 mb-8">Settings</h1>
            
            <div className="space-y-8">
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
                        {/* Email-based Password Reset */}
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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // ADDED: State for mobile menu
    
    // --- Firebase State ---
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [storage, setStorage] = useState(null); // --- ADDED: Storage state
    const [user, setUser] = useState(null);
    // --- UPDATED: basePath to planId ---
    const [planId, setPlanId] = useState(null);
    const [basePath, setBasePath] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [notification, setNotification] = useState(''); // ADDED: Notification state
    // --- ADDED: Modal State ---
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
    });

    // --- Data State ---
    const [totalBudget, setTotalBudget] = useState(100000);
    const [guests, setGuests] = useState([]);
    const [budgetItems, setBudgetItems] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [agendaItems, setAgendaItems] = useState([]); // ADDED: Agenda state
    const [documents, setDocuments] = useState([]); // ADDED: Documents state

    // --- 1. Initialize Firebase & Auth ---
    useEffect(() => {
        console.log("DEBUG: Initializing Firebase & Auth");
        if (!firebaseConfig.apiKey) {
            console.error("Firebase config is missing!");
            return;
        }

        const authInstance = getAuth(app);
        const dbInstance = getFirestore(app);
        const storageInstance = getStorage(app); // --- ADDED: Init Storage

        setAuth(authInstance);
        setDb(dbInstance);
        setStorage(storageInstance); // --- ADDED: Set Storage
        setIsLoading(true);

        const unsubscribe = onAuthStateChanged(authInstance, (user) => {
            console.log("DEBUG: Auth state changed", user ? "User signed in" : "User signed out");
            if (user) {
                // User is signed in
                setUser(user);
                // --- REMOVED: Anonymous sign-in logic ---
            } else {
                // User is signed out
                setUser(null);
                setPlanId(null); // Clear plan on logout
                setBasePath(''); // Clear path on logout
            }
            setIsLoading(false);
        });

        // Cleanup auth listener on component unmount
        return () => unsubscribe();
    }, []); // Run only once

    // --- ADDED: Handle Notification ---
    const showNotification = (message) => {
        setNotification(message);
        setTimeout(() => {
            setNotification('');
        }, 3000); // Notification disappears after 3 seconds
    };

    // --- ADDED: Handle Logout ---
    const handleLogout = async () => {
        if (auth && user && planId) {
            // Update last accessed time before logout
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

    // --- 2. Update Base Path when Plan ID changes ---
    useEffect(() => {
        console.log("DEBUG: Plan ID changed", planId);
        if (planId) {
            // --- UPDATED: Path is now based on planId ---
            setBasePath(`/plans/${planId}`);
        } else {
            setBasePath('');
        }
    }, [planId]);


    // --- 3. Listen to Firestore Data ---
    useEffect(() => {
        console.log("DEBUG: Firestore data listener effect triggered", { db: !!db, basePath });
        // --- UPDATED: Only run if we have a db and a basePath (which requires a planId) ---
        if (!db || !basePath) {
            console.log("DEBUG: Clearing data - no db or basePath");
            // Clear data if no plan is selected
            setGuests([]);
            setBudgetItems([]);
            setVendors([]);
            setTasks([]);
            setTotalBudget(100000);
            setAgendaItems([]); // ADDED: Clear agenda
            setDocuments([]); // ADDED: Clear documents
            return;
        }

        console.log(`Setting up listeners for plan path: ${basePath}`);

        // Listen to Guests
        const guestsQuery = query(collection(db, `${basePath}/guests`));
        const unsubGuests = onSnapshot(guestsQuery, (querySnapshot) => {
            console.log("DEBUG: Guests data received", querySnapshot.docs.length);
            const guestData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setGuests(guestData);
        }, (error) => console.error("Error listening to guests: ", error));

        // Listen to Budget Items
        const budgetQuery = query(collection(db, `${basePath}/budgetItems`));
        const unsubBudgetItems = onSnapshot(budgetQuery, (querySnapshot) => {
            const budgetData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setBudgetItems(budgetData);
        }, (error) => console.error("Error listening to budget items: ", error));

        // Listen to Vendors
        const vendorsQuery = query(collection(db, `${basePath}/vendors`));
        const unsubVendors = onSnapshot(vendorsQuery, (querySnapshot) => {
            const vendorData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setVendors(vendorData);
        }, (error) => console.error("Error listening to vendors: ", error));

        // Listen to Tasks
        const tasksQuery = query(collection(db, `${basePath}/tasks`));
        const unsubTasks = onSnapshot(tasksQuery, (querySnapshot) => {
            const taskData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Sort tasks by timeline order
            taskData.sort((a, b) => timelineOrder.indexOf(a.timeline) - timelineOrder.indexOf(b.timeline));
            setTasks(taskData);
        }, (error) => console.error("Error listening to tasks: ", error));

        // ADDED: Listen to Agenda
        const agendaQuery = query(collection(db, `${basePath}/agenda`));
        const unsubAgenda = onSnapshot(agendaQuery, (querySnapshot) => {
            const agendaData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAgendaItems(agendaData);
        }, (error) => console.error("Error listening to agenda: ", error));

        // ADDED: Listen to Documents
        const documentsQuery = query(collection(db, `${basePath}/documents`));
        const unsubDocuments = onSnapshot(documentsQuery, (querySnapshot) => {
            const docData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setDocuments(docData);
        }, (error) => console.error("Error listening to documents: ", error));

        // Listen to Total Budget
        // --- UPDATED: Path now uses config/budget relative to basePath ---
        const budgetConfigDoc = doc(db, `${basePath}/config`, 'budget');
        const unsubTotalBudget = onSnapshot(budgetConfigDoc, (docSnap) => {
            console.log("DEBUG: Budget config received", docSnap.exists());
            if (docSnap.exists()) {
                setTotalBudget(docSnap.data().amount || 100000);
            } else {
                // If doc doesn't exist, set default
                setTotalBudget(100000);
            }
        }, (error) => console.error("Error listening to total budget: ", error));

        // Cleanup all listeners on component unmount or when path changes
        return () => {
            unsubGuests();
            unsubBudgetItems();
            unsubVendors();
            unsubTasks();
            unsubTotalBudget();
            unsubAgenda(); // ADDED: Cleanup agenda listener
            unsubDocuments(); // ADDED: Cleanup documents listener
        };

    }, [db, basePath]); // Rerun if db or basePath changes

    // --- ADDED: Update last accessed time periodically when plan is active ---
    useEffect(() => {
        if (!user || !planId || !db) return;

        // Update last accessed time when plan becomes active
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

        // Update every 5 minutes while plan is active
        const interval = setInterval(updateLastAccessed, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [user, planId, db, basePath]);
    
    // --- Props for children ---
    // Data is passed down from state
    const pageProps = {
        guests,
        budgetItems,
        vendors,
        tasks,
        agendaItems, // ADDED: Pass agenda items
        documents, // ADDED: Pass documents
        totalBudget,
        setCurrentView,
        setGuests, // Passing setters down
        setBudgetItems,
        setVendors,
        setTasks,
        setTotalBudget,
        db, // Pass db and basePath for writing data
        basePath,
        storage, // --- ADDED: Pass storage
        planId, // --- ADDED: Pass planId
        showNotification, // ADDED: Pass notification
        setConfirmModal, // ADDED: Pass modal setter
    };
    
    // --- Content Router ---
    const renderContent = () => {
        // --- UPDATED: Main app content ---
        switch (currentView) {
            case 'dashboard':
                return <Dashboard {...pageProps} />;
            case 'guestlist':
                return <GuestList {...pageProps} />;
            case 'budget':
                return <Budget {...pageProps} />;
            case 'vendors':
                return <Vendors {...pageProps} />;
            case 'checklist':
                return <Checklist {...pageProps} />;
            case 'agenda': // ADDED: Agenda route
                return <Agenda {...pageProps} />;
            case 'documents': // ADDED: Documents route
                return <Documents {...pageProps} />;
            case 'settings': // ADDED: Settings route
                return <Settings {...pageProps} auth={auth} user={user} setPlanId={setPlanId} setError={setError} />;
            default:
                return <h1 className="text-3xl font-bold">Page Not Found</h1>;
        }
    };

// --- Main Render Logic ---
    if (isLoading) {
        return <h1 className="text-3xl font-bold p-10">Loading Planner...</h1>;
    }

    if (!user) {
        return <LoginComponent auth={auth} error={error} setError={setError} />;
    }
    
    if (!planId) {
        return <PlanSelector db={db} user={user} setPlanId={setPlanId} error={error} setError={setError} />;
    }

    return (
        // UPDATED: Main layout for mobile
        <div className="flex flex-col md:flex-row md:h-screen bg-rose-50 font-sans">
            <Notification message={notification} /> {/* ADDED: Notification component */}
            {/* --- ADDED: Confirmation Modal --- */}
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
                showNotification={showNotification} // PASSED: Notification handler
            />
            {/* --- UPDATED: Removed "mt-16" and adjusted desktop padding --- */}
            <main className="flex-1 overflow-y-auto p-6 md:px-10 md:pt-12 md:pb-10">
                {/* - p-6: Sets base padding for mobile
                  - md:px-10 md:pb-10: Sets desktop padding for sides/bottom
                  - md:pt-12: Sets a larger desktop padding-top (3rem) to move headers down
                */}
                {renderContent()}
            </main>
        </div>
    );
}