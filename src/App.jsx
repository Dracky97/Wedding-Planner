import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  PiggyBank,
  Briefcase,
  CheckSquare,
  Plus,
  Trash2,
} from 'lucide-react';

// --- Initial Data ---
const initialGuests = [
    { id: 1, name: 'Amanda Lucy', phone: '(+1) 555-0101', tag: 'Friends Bride', invited: true, rsvp: 'yes', numPeople: 2, rehearsal: true, farewell: true, meal: 'Beef' },
    { id: 2, name: 'Maria Michelle', phone: '(+1) 555-0102', tag: 'Parents Bride', invited: true, rsvp: 'yes', numPeople: 2, rehearsal: true, farewell: false, meal: 'Chicken' },
    { id: 3, name: 'Luka', phone: '(+1) 555-0103', tag: 'Friends Groom', invited: true, rsvp: 'no', numPeople: 1, rehearsal: false, farewell: false, meal: null },
    { id: 4, name: 'Rachael Taylor', phone: '(+1) 555-0104', tag: 'Friends Bride', invited: true, rsvp: null, numPeople: 1, rehearsal: false, farewell: false, meal: null },
    { id: 5, name: 'Daisy Georgia', phone: '(+1) 555-0105', tag: 'Family Groom', invited: true, rsvp: null, numPeople: 4, rehearsal: true, farewell: true, meal: null },
    { id: 6, name: 'Richard Gabriel', phone: '(+1) 555-0106', tag: 'Friends Groom', invited: false, rsvp: null, numPeople: 2, rehearsal: false, farewell: false, meal: null },
];

const initialBudgetItems = [
    { id: 1, type: 'Videographer', category: 'Ceremony', cost: 4000, paid: 1000 },
    { id: 2, type: 'Make-up Artist', category: 'Ceremony', cost: 500, paid: 500 },
    { id: 3, type: 'Hair Stylist', category: 'Ceremony', cost: 600, paid: 600 },
    { id: 4, type: 'Bride Dress', category: 'Reception', cost: 3500, paid: 3500 },
    { id: 5, type: 'Venue', category: 'Reception', cost: 20000, paid: 10000 },
    { id: 6, type: 'DJ', category: 'Reception', cost: 2000, paid: 500 },
    { id: 7, type: 'Wedding Cake', category: 'Reception', cost: 1000, paid: 1000 },
    { id: 8, type: 'Flowers', category: 'Ceremony', cost: 3000, paid: 1500 },
];

const initialVendors = [
    { id: 1, type: 'Venue', name: 'Hotel King', contact: '(+1) 555-0201', email: 'info@hotelking.com', packageNum: 3 },
    { id: 2, type: 'Venue', name: 'Tuscany Farmhouse', contact: '(+1) 555-0202', email: 'contact@tuscany.com', packageNum: 1 },
    { id: 3, type: 'Venue', name: 'Plaza Hotel', contact: '(+1) 555-0203', email: 'wedding@plaza.com', packageNum: 1 },
    { id: 4, type: 'Caterer', name: 'Tomson Wedding', contact: '(+1) 555-0301', email: 'food@tomson.com', packageNum: 2 },
    { id: 5, type: 'Caterer', name: 'Tuscany Farmhouse', contact: '(+1) 555-0202', email: 'contact@tuscany.com', packageNum: 3 },
];

const initialTasks = [
    { id: 1, text: 'Decide on a budget', timeline: '12+ Months', completed: true },
    { id: 2, text: 'Book venue', timeline: '12+ Months', completed: true },
    { id: 3, text: 'Create guest list', timeline: '12+ Months', completed: true },
    { id: 4, text: 'Book photographer/videographer', timeline: '10-12 Months', completed: true },
    { id: 5, text: 'Hire DJ/band', timeline: '10-12 Months', completed: false },
    { id: 6, text: 'Purchase wedding dress', timeline: '8-10 Months', completed: true },
    { id: 7, text: 'Send save-the-dates', timeline: '6-8 Months', completed: false },
    { id: 8, text: 'Book florist', timeline: '6-8 Months', completed: false },
    { id: 9, text: 'Order wedding cake', timeline: '4-6 Months', completed: false },
    { id: 10, text: 'Send invitations', timeline: '2-3 Months', completed: false },
    { id: 11, text: 'Finalize menu', timeline: '1-2 Months', completed: false },
    { id: 12, text: 'Create seating chart', timeline: '2-4 Weeks', completed: false },
    { id: 13, text: 'Get marriage license', timeline: '1 Week', completed: false },
];

const timelineOrder = ['12+ Months', '10-12 Months', '8-10 Months', '6-8 Months', '4-6 Months', '2-3 Months', '1-2 Months', '2-4 Weeks', '1 Week'];
const currency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'LKR', minimumFractionDigits: 2 }).format(val);

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
                <p className="text-xs text-rose-300">© 2025 SicatDigital</p>
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
const GuestList = ({ guests, setGuests }) => {
    const tagOptions = ['Family Bride', 'Family Groom', 'Friends Bride', 'Friends Groom', 'Other'];
    const mealOptions = ['Beef', 'Chicken', 'Vegan', 'Kids'];

    const addGuest = () => {
        const newId = Math.max(0, ...guests.map(g => g.id)) + 1;
        const newGuest = { id: newId, name: 'New Guest', phone: '', tag: 'Other', invited: false, rsvp: null, numPeople: 1, rehearsal: false, farewell: false, meal: null };
        setGuests(prevGuests => [...prevGuests, newGuest]);
    };

    const updateGuest = (id, field, value) => {
        setGuests(prevGuests =>
            prevGuests.map(guest =>
                guest.id === id ? { ...guest, [field]: value } : guest
            )
        );
    };

    const deleteGuest = (id) => {
        setGuests(prevGuests => prevGuests.filter(guest => guest.id !== id));
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
const Budget = ({ budgetItems, setBudgetItems, totalBudget, setTotalBudget }) => {
    const categoryOptions = ['Ceremony', 'Reception', 'Flowers', 'Attire', 'Other'];

    const budgetTotals = useMemo(() => {
        const totalCost = budgetItems.reduce((sum, item) => sum + item.cost, 0);
        const totalPaid = budgetItems.reduce((sum, item) => sum + item.paid, 0);
        const balanceDue = totalCost - totalPaid;
        const remainingBudget = totalBudget - totalCost;
        return { totalCost, totalPaid, balanceDue, remainingBudget };
    }, [budgetItems, totalBudget]);
    
    const addBudgetItem = () => {
        const newId = Math.max(0, ...budgetItems.map(i => i.id)) + 1;
        const newItem = { id: newId, type: 'New Item', category: 'Other', cost: 0, paid: 0 };
        setBudgetItems(prev => [...prev, newItem]);
    };

    const updateBudgetItem = (id, field, value) => {
        setBudgetItems(prev =>
            prev.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );
    };

    const deleteBudgetItem = (id) => {
        setBudgetItems(prev => prev.filter(item => item.id !== id));
    };

    return (
        <>
            <h1 className="text-4xl font-bold text-rose-900 mb-8">Budget Tracker</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <label htmlFor="totalBudget" className="text-sm font-medium text-rose-800">Total Budget</label>
                    <input type="number" id="totalBudget" value={totalBudget} onChange={e => setTotalBudget(parseFloat(e.target.value) || 0)} className="text-3xl font-bold text-rose-900 w-full p-1 -ml-1 rounded" />
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
const Vendors = ({ vendors, setVendors }) => {
    const vendorTypes = ['Venue', 'Caterer', 'Photographer', 'Videographer', 'Florist', 'Band/DJ', 'Other'];

    const addVendor = () => {
        const newId = Math.max(0, ...vendors.map(v => v.id)) + 1;
        const newVendor = { id: newId, type: 'Other', name: 'New Vendor', contact: '', email: '', packageNum: 1 };
        setVendors(prev => [...prev, newVendor]);
    };

    const updateVendor = (id, field, value) => {
        setVendors(prev =>
            prev.map(vendor =>
                vendor.id === id ? { ...vendor, [field]: value } : vendor
            )
        );
    };

    const deleteVendor = (id) => {
        setVendors(prev => prev.filter(vendor => vendor.id !== id));
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
const Checklist = ({ tasks, setTasks }) => {
    
    const timelines = useMemo(() => {
        const uniqueTimelines = [...new Set(tasks.map(t => t.timeline))];
        uniqueTimelines.sort((a, b) => timelineOrder.indexOf(a) - timelineOrder.indexOf(b));
        return uniqueTimelines;
    }, [tasks]);

    const toggleTask = (id) => {
        setTasks(prev =>
            prev.map(task =>
                task.id === id ? { ...task, completed: !task.completed } : task
            )
        );
    };
    
    const addTask = (event) => {
        event.preventDefault();
        const text = event.target.elements['new-task-text'].value;
        const timeline = event.target.elements['new-task-timeline'].value;
        
        if (text) {
            const newId = Math.max(0, ...tasks.map(t => t.id)) + 1;
            const newTask = { id: newId, text, timeline, completed: false };
            setTasks(prev => [...prev, newTask].sort((a, b) => timelineOrder.indexOf(a.timeline) - timelineOrder.indexOf(b.timeline)));
            event.target.reset();
        }
    };

    return (
        <>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold text-rose-900">Wedding Checklist</h1>
            </div>
            
            <div className="space-y-8">
                {timelines.map(timeline => (
                    <div key={timeline} className="bg-white p-6 rounded-xl shadow-lg">
                        <h2 className="text-2xl font-semibold text-rose-800 mb-5 border-b border-rose-200 pb-3">{timeline}</h2>
                        <ul className="space-y-4">
                            {tasks.filter(t => t.timeline === timeline).map(task => (
                                <li key={task.id} className="flex items-center">
                                    <input type="checkbox" id={`task-${task.id}`} checked={task.completed} onChange={() => toggleTask(task.id)} className="h-5 w-5 rounded border-gray-300 text-rose-600 focus:ring-rose-500" />
                                    <label htmlFor={`task-${task.id}`} className={`ml-3 text-gray-800 ${task.completed ? 'line-through text-gray-400' : ''}`}>{task.text}</label>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
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
    // --- State ---
    const [currentView, setCurrentView] = useState('dashboard');
    const [totalBudget, setTotalBudget] = useState(100000);
    const [guests, setGuests] = useState(initialGuests);
    const [budgetItems, setBudgetItems] = useState(initialBudgetItems);
    const [vendors, setVendors] = useState(initialVendors);
    const [tasks, setTasks] = useState(initialTasks);

    // --- Props for children ---
    const pageProps = {
        guests, setGuests,
        budgetItems, setBudgetItems,
        vendors, setVendors,
        tasks, setTasks,
        totalBudget, setTotalBudget,
        setCurrentView
    };
    
    // --- Content Router ---
    const renderContent = () => {
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