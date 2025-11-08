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
  UserPlus
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    // --- REMOVED: signInAnonymously
    onAuthStateChanged,
    // --- ADDED: Email/Password Auth ---
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
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
    writeBatch // --- ADDED: For initial plan setup
} from 'firebase/firestore';
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
const Sidebar = ({ currentView, setCurrentView, planId, handleLogout }) => {
    const views = [
        { key: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
        { key: 'guestlist', name: 'Guest List', icon: Users },
        { key: 'budget', name: 'Budget', icon: PiggyBank },
        { key: 'vendors', name: 'Vendors', icon: Briefcase },
        { key: 'checklist', name: 'Checklist', icon: CheckSquare },
    ];

    // --- ADDED: Copy Plan ID functionality ---
    const copyPlanId = () => {
        navigator.clipboard.writeText(planId)
            .then(() => alert(`Plan ID "${planId}" copied to clipboard!`))
            .catch(err => console.error('Failed to copy text: ', err));
    };

    return (
        <nav className="w-64 bg-rose-800 text-white p-6 shadow-lg flex flex-col">
            <h1 className="text-3xl font-bold mb-8 text-rose-100">Wedding Planner</h1>
            <ul className="space-y-3 flex-1">
                {views.map(view => {
                    const isActive = currentView === view.key;
                    const Icon = view.icon;
                    return (
                        <li key={view.key}>
                            <button
                                onClick={() => setCurrentView(view.key)}
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
                <p className="text-xs text-rose-300">© 2025 PlanPerfect</p>
            </div>
        </nav>
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

// --- ADDED: LoginComponent ---
const LoginComponent = ({ auth, error, setError }) => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isLoginView) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
        } catch (err) {
            console.error(err);
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
                        />
                    </div>
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
                    onClick={() => { setIsLoginView(!isLoginView); setError(''); }}
                    className="w-full text-sm text-center text-rose-600 hover:underline"
                >
                    {isLoginView ? 'Need an account? Sign Up' : 'Already have an account? Login'}
                </button>
            </div>
        </div>
    );
};

// --- ADDED: PlanSelector Component ---
const PlanSelector = ({ db, setPlanId, setError, error }) => {
    const [joinId, setJoinId] = useState('');

    const createNewPlan = async () => {
        setError('');
        const newPlanId = nanoid(10); // Generate a 10-char ID
        
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
    
        // Check if plan exists by trying to read its config
        const configDoc = doc(db, `/plans/${joinId}/config`, 'budget');
        const unsubscribe = onSnapshot(configDoc, (docSnap) => {
            unsubscribe(); // Unsubscribe immediately after the first read
            if (docSnap.exists()) {
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
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg text-center">
                <h1 className="text-3xl font-bold text-rose-900">Welcome!</h1>
                <p className="text-gray-600">Get started by creating a new plan or joining your partner's plan.</p>
                
                {/* Create Plan Button */}
                <button
                    onClick={createNewPlan}
                    className="w-full p-3 bg-rose-600 text-white rounded-lg font-medium hover:bg-rose-700 transition-colors flex items-center justify-center space-x-2"
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
    );
};


// --- Main App Component ---
export default function App() {
    // --- App State ---
    const [currentView, setCurrentView] = useState('dashboard');
    
    // --- Firebase State ---
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    // --- UPDATED: User object state ---
    const [user, setUser] = useState(null);
    // --- UPDATED: basePath to planId ---
    const [planId, setPlanId] = useState(null);
    const [basePath, setBasePath] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // --- Data State ---
    const [totalBudget, setTotalBudget] = useState(100000);
    const [guests, setGuests] = useState([]);
    const [budgetItems, setBudgetItems] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [tasks, setTasks] = useState([]);

    // --- 1. Initialize Firebase & Auth ---
    useEffect(() => {
        if (!firebaseConfig.apiKey) {
            console.error("Firebase config is missing!");
            return;
        }

        const authInstance = getAuth(app);
        const dbInstance = getFirestore(app);

        setAuth(authInstance);
        setDb(dbInstance);
        setIsLoading(true);

        const unsubscribe = onAuthStateChanged(authInstance, (user) => {
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

    // --- ADDED: Handle Logout ---
    const handleLogout = async () => {
        if (auth) {
            await signOut(auth);
        }
    };

    // --- 2. Update Base Path when Plan ID changes ---
    useEffect(() => {
        if (planId) {
            // --- UPDATED: Path is now based on planId ---
            setBasePath(`/plans/${planId}`);
        } else {
            setBasePath('');
        }
    }, [planId]);


    // --- 3. Listen to Firestore Data ---
    useEffect(() => {
        // --- UPDATED: Only run if we have a db and a basePath (which requires a planId) ---
        if (!db || !basePath) {
            // Clear data if no plan is selected
            setGuests([]);
            setBudgetItems([]);
            setVendors([]);
            setTasks([]);
            setTotalBudget(100000);
            return;
        }

        console.log(`Setting up listeners for plan path: ${basePath}`);

        // Listen to Guests
        const guestsQuery = query(collection(db, `${basePath}/guests`));
        const unsubGuests = onSnapshot(guestsQuery, (querySnapshot) => {
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

        // Listen to Total Budget
        // --- UPDATED: Path now uses config/budget relative to basePath ---
        const budgetConfigDoc = doc(db, `${basePath}/config`, 'budget');
        const unsubTotalBudget = onSnapshot(budgetConfigDoc, (docSnap) => {
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
        };

    }, [db, basePath]); // Rerun if db or basePath changes

    
    // --- Props for children ---
    // Data is passed down from state
    const pageProps = {
        guests,
        budgetItems,
        vendors,
        tasks,
        totalBudget,
        setCurrentView,
        setGuests, // Passing setters down
        setBudgetItems,
        setVendors,
        setTasks,
        setTotalBudget,
        db, // Pass db and basePath for writing data
        basePath
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
            default:
                return <h1 className="text-3xl font-bold">Page Not Found</h1>;
        }
    };

    // --- UPDATED: Main Render Logic ---
    if (isLoading) {
        return <h1 className="text-3xl font-bold p-10">Loading Planner...</h1>;
    }

    if (!user) {
        return <LoginComponent auth={auth} error={error} setError={setError} />;
    }
    
    if (!planId) {
        return <PlanSelector db={db} setPlanId={setPlanId} error={error} setError={setError} />;
    }

    return (
        <div className="flex h-screen bg-rose-50 font-sans">
            <Sidebar 
                currentView={currentView} 
                setCurrentView={setCurrentView}
                planId={planId}
                handleLogout={handleLogout} 
            />
            <main className="flex-1 p-6 md:p-10 overflow-y-auto">
                {renderContent()}
            </main>
        </div>
    );
}