import React, { useState, useMemo, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  PiggyBank,
  Briefcase,
  CheckSquare,
  Plus,
  Trash2,
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    signInAnonymously, 
    signInWithCustomToken, 
    onAuthStateChanged 
} from 'firebase/auth';
import { 
    getFirestore,
    doc,
    getDoc,
    addDoc,
    setDoc,
    deleteDoc,
    onSnapshot,
    collection,
    query,
    where
} from 'firebase/firestore';

// --- Global Config ---
// These are provided by the Canvas environment
// We'll comment these out because you are running locally
// const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
// const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
// const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// --- YOUR FIREBASE CONFIG ---
// Paste your Firebase config object here
const firebaseConfig = {
  apiKey: "AIzaSyAJ9wBW6ao4CBP-YCxt1GXlvwA8CXHQFaE",
  authDomain: "my-wedding-app-39f14.firebaseapp.com",
  projectId: "my-wedding-app-39f14",
  storageBucket: "my-wedding-app-39f14.firebasestorage.app",
  messagingSenderId: "630903724575",
  appId: "1:630903724575:web:b9aa188aa01baa50f6932a"
};
// --- END YOUR FIREBASE CONFIG ---

const timelineOrder = ['12+ Months', '10-12 Months', '8-10 Months', '6-8 Months', '4-6 Months', '2-3 Months', '1-2 Months', '2-4 Weeks', '1 Week'];
const currency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(val);

// --- Reusable Doughnut Chart Component ---
const DoughnutChart = ({ percent, color, trackColor, text, subtext }) => {
    const background = `conic-gradient(${color} ${percent}%, ${trackColor} ${percent}% 100%)`;
    return (
        <div className="relative w-24 h-24">
            <div className="w-24 h-24 rounded-full" style={{ background }}></div>
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full flex items-center justify-center flex-col line-height-1.2"
            >
                <span className="text-lg font-bold text-rose-900">{text}</span>
                <span className="text-xs text-gray-500">{subtext}</span>
            </div>
        </div>
    );
};

// --- Sidebar Component ---
const Sidebar = ({ currentView, setCurrentView }) => {
    const views = [
        { key: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
        { key: 'guestlist', name: 'Guest List', icon: Users },
        { key: 'budget', name: 'Budget', icon: PiggyBank },
        { key: 'vendors', name: 'Vendors', icon: Briefcase },
        { key: 'checklist', name: 'Checklist', icon: CheckSquare },
    ];

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
            <div className="mt-auto">
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
        const duePercent = totalBudget > 0 ? (totalCost / totalBudget) * 100 : 0;
        return { totalSpent, balanceDue, remainingBudget, spentPercent, duePercent };
    }, [budgetItems, totalBudget]);

    // Attendance Calculations
    const attendanceStats = useMemo(() => {
        const totalInvited = guests.filter(g => g.invited).reduce((sum, g) => sum + g.numPeople, 0);
        const attending = guests.filter(g => g.rsvp === 'yes').reduce((sum, g) => sum + g.numPeople, 0);
        const notAttending = guests.filter(g => g.rsvp === 'no').reduce((sum, g) => sum + g.numPeople, 0);
        const unconfirmed = totalInvited - attending - notAttending;
        const attendingPercent = totalInvited > 0 ? (attending / totalInvited) * 100 : 0;
        const notAttendingPercent = totalInvited > 0 ? ((attending + notAttending) / totalInvited) * 100 : 0;
        return { totalInvited, attending, notAttending, unconfirmed, attendingPercent, notAttendingPercent };
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
                            <input type="checkbox" id={`task-dash-${task.id}`} className="h-5 w-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500" disabled />
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
    const tagOptions = ['Family Bride', 'Family Groom', 'Friends Bride', 'Friends Groom', 'Other'];
    const mealOptions = ['Beef', 'Chicken', 'Vegan', 'Kids'];

    const addGuest = async () => {
        const newGuest = { 
            name: 'New Guest', 
            phone: '', 
            tag: 'Other', 
            invited: false, 
            rsvp: null, 
            numPeople: 1, 
            rehearsal: false, 
            farewell: false, 
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
        const guestDoc = doc(db, `${basePath}/guests`, id);
        try {
            await setDoc(guestDoc, { [field]: value }, { merge: true });
        } catch (e) {
            console.error("Error updating guest: ", e);
        }
    };

    const deleteGuest = async (id) => {
        const guestDoc = doc(db, `${basePath}/guests`, id);
        try {
            await deleteDoc(guestDoc);
        } catch (e) {
            console.error("Error deleting guest: ", e);
        }
    };

    return (
        <>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold text-rose-900">Guest List</h1>
                <button onClick={addGuest} className="bg-rose-600 text-white px-5 py-2.5 rounded-lg shadow-md hover:bg-rose-700 transition-colors flex items-center space-x-2">
                    <Plus className="w-5 h-5" />
                    <span>Add Guest</span>
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
                            <th className="p-4 font-semibold text-rose-800">Rehearsal</th>
                            <th className="p-4 font-semibold text-rose-800">Farewell</th>
                            <th className="p-4 font-semibold text-rose-800">Meal</th>
                            <th className="p-4 font-semibold text-rose-800"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {guests.map(guest => (
                            <tr key={guest.id} className="border-b border-rose-100 last:border-b-0">
                                <td className="p-3"><input type="text" value={guest.name} onChange={e => updateGuest(guest.id, 'name', e.target.value)} className="w-full p-1 rounded border-gray-300" /></td>
                                <td className="p-3"><input type="text" value={guest.phone} onChange={e => updateGuest(guest.id, 'phone', e.target.value)} className="w-full p-1 rounded border-gray-300" /></td>
                                <td className="p-3">
                                    <select value={guest.tag} onChange={e => updateGuest(guest.id, 'tag', e.target.value)} className="w-full p-1 rounded border-gray-300">
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
                                <td className="p-3 text-center"><input type="checkbox" checked={guest.rehearsal} onChange={e => updateGuest(guest.id, 'rehearsal', e.target.checked)} className="h-5 w-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500" /></td>
                                <td className="p-3 text-center"><input type="checkbox" checked={guest.farewell} onChange={e => updateGuest(guest.id, 'farewell', e.target.checked)} className="h-5 w-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500" /></td>
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
        const newItem = { type: 'New Item', category: 'Other', cost: 0, paid: 0 };
        const itemsCol = collection(db, `${basePath}/budgetItems`);
        try {
            await addDoc(itemsCol, newItem);
        } catch (e) {
            console.error("Error adding budget item: ", e);
        }
    };

    const updateBudgetItem = async (id, field, value) => {
        const itemDoc = doc(db, `${basePath}/budgetItems`, id);
        try {
            await setDoc(itemDoc, { [field]: value }, { merge: true });
        } catch (e) {
            console.error("Error updating budget item: ", e);
        }
    };

    const deleteBudgetItem = async (id) => {
        const itemDoc = doc(db, `${basePath}/budgetItems`, id);
        try {
            await deleteDoc(itemDoc);
        } catch (e) {
            console.error("Error deleting budget item: ", e);
        }
    };

    const updateTotalBudget = async (newAmount) => {
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
        const newVendor = { type: 'Other', name: 'New Vendor', contact: '', email: '', packageNum: 1 };
        const vendorsCol = collection(db, `${basePath}/vendors`);
        try {
            await addDoc(vendorsCol, newVendor);
        } catch (e) {
            console.error("Error adding vendor: ", e);
        }
    };

    const updateVendor = async (id, field, value) => {
        const vendorDoc = doc(db, `${basePath}/vendors`, id);
        try {
            await setDoc(vendorDoc, { [field]: value }, { merge: true });
        } catch (e) {
            console.error("Error updating vendor: ", e);
        }
    };

    const deleteVendor = async (id) => {
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
        const taskDoc = doc(db, `${basePath}/tasks`, id);
        try {
            await setDoc(taskDoc, { completed: !currentStatus }, { merge: true });
        } catch (e) {
            console.error("Error toggling task: ", e);
        }
    };
    
    const addTask = async (event) => {
        event.preventDefault();
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

// --- Main App Component ---
export default function App() {
    // --- App State ---
    const [currentView, setCurrentView] = useState('dashboard');
    
    // --- Firebase State ---
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [basePath, setBasePath] = useState('');
    const [isAuthReady, setIsAuthReady] = useState(false);

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

        const app = initializeApp(firebaseConfig);
        const authInstance = getAuth(app);
        const dbInstance = getFirestore(app);

        setAuth(authInstance);
        setDb(dbInstance);

        const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
            if (user) {
                // User is signed in
                setUserId(user.uid);
                // We'll use a simpler path for your personal database
                setBasePath(`/users/${user.uid}`);
                setIsAuthReady(true);
            } else {
                // User is signed out, attempt to sign in
                try {
                    // When running locally, we don't have a custom token.
                    // Just sign in anonymously.
                    await signInAnonymously(authInstance);
                } catch (error) {
                    console.error("Error signing in: ", error);
                    setIsAuthReady(false); // Auth failed
                }
            }
        });

        // Cleanup auth listener on component unmount
        return () => unsubscribe();
    }, []); // Run only once

    // --- 2. Listen to Firestore Data ---
    useEffect(() => {
        // Only run if auth is ready and we have a db instance and user path
        if (!isAuthReady || !db || !basePath) return;

        console.log(`Setting up listeners for user path: ${basePath}`);

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
        const budgetConfigDoc = doc(db, `${basePath}/config`, 'budget');
        const unsubTotalBudget = onSnapshot(budgetConfigDoc, (docSnap) => {
            if (docSnap.exists()) {
                setTotalBudget(docSnap.data().amount || 100000);
            } else {
                // If doc doesn't exist, set default and maybe create it
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

    }, [isAuthReady, db, basePath]); // Rerun if auth/db changes

    
    // --- Props for children ---
    // Data is passed down from state
    const pageProps = {
        guests,
        budgetItems,
        vendors,
        tasks,
        totalBudget,
        setCurrentView,
        db, // Pass db and basePath for writing data
        basePath
    };
    
    // --- Content Router ---
    const renderContent = () => {
        if (!isAuthReady) {
            return <h1 className="text-3xl font-bold p-10">Loading Planner...</h1>;
        }
        
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

    return (
        <div className="flex h-screen bg-rose-50 font-sans">
            <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
            <main className="flex-1 p-6 md:p-10 overflow-y-auto">
                {renderContent()}
            </main>
        </div>
    );
}