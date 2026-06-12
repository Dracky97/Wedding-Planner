import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase.js';

const mealLabels = { Beef: '🥩 Beef', Chicken: '🍗 Chicken', Vegan: '🥗 Vegan', Kids: '🧒 Kids Meal' };

export default function RSVPPage() {
  const { planId } = useParams();
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [rsvp, setRsvp] = useState('');
  const [meal, setMeal] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!planId) { setError('Invalid RSVP link.'); setLoading(false); return; }
    const guestsCol = collection(db, `/plans/${planId}/guests`);
    const unsub = onSnapshot(guestsCol, snap => {
      setGuests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => { setError('Could not load guest list.'); setLoading(false); });
    return () => unsub();
  }, [planId]);

  const filteredGuests = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return guests;
    return guests.filter(g => g.name?.toLowerCase().includes(q));
  }, [guests, search]);

  const openRSVP = (guest) => {
    setSelectedGuest(guest);
    setRsvp(guest.rsvp || '');
    setMeal(guest.meal || '');
    setSubmitted(false);
  };

  const submitRSVP = async () => {
    if (!selectedGuest || !rsvp) return;
    setSubmitting(true);
    try {
      await updateDoc(doc(db, `/plans/${planId}/guests`, selectedGuest.id), { rsvp, meal: meal || null });
      setSubmitted(true);
      setSelectedGuest(null);
    } catch (e) {
      console.error(e);
      setError('Could not save your RSVP. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const rsvpBadge = (status) => {
    if (status === 'yes') return <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Attending</span>;
    if (status === 'no') return <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Declined</span>;
    return <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">Pending</span>;
  };

  if (loading) return (
    <div className="min-h-screen bg-rose-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-rose-300 border-t-rose-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-rose-700 font-medium">Loading RSVP...</p>
      </div>
    </div>
  );

  if (error && guests.length === 0) return (
    <div className="min-h-screen bg-rose-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <p className="text-red-600 font-medium mb-4">{error}</p>
        <Link to="/" className="text-rose-600 hover:text-rose-800 underline text-sm">Go to homepage</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 py-10 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">💍</div>
          <h1 className="text-3xl font-bold text-rose-900 mb-2">Wedding RSVP</h1>
          <p className="text-gray-600">Find your name below and confirm your attendance.</p>
        </div>

        {submitted && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-center">
            <p className="text-green-700 font-semibold">Your RSVP has been saved! Thank you.</p>
          </div>
        )}

        {/* Search */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Search your name</label>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Type your name..."
            className="w-full p-3 rounded-xl border border-gray-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none text-base"
          />
        </div>

        {/* Guest List */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {filteredGuests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {search ? 'No guests found with that name.' : 'No guests on this list yet.'}
            </div>
          ) : (
            <ul className="divide-y divide-rose-50">
              {filteredGuests.map(guest => (
                <li key={guest.id} className="p-4 flex items-center justify-between gap-3 hover:bg-rose-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{guest.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {rsvpBadge(guest.rsvp)}
                      {guest.meal && <span className="text-xs text-gray-500">{mealLabels[guest.meal] || guest.meal}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => openRSVP(guest)}
                    className="shrink-0 bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-700 active:bg-rose-800 transition-colors"
                  >
                    RSVP
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by <Link to="/" className="text-rose-400 hover:text-rose-600">Wedding Planner</Link>
        </p>
      </div>

      {/* RSVP Modal */}
      {selectedGuest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-rose-900 mb-1">RSVP for {selectedGuest.name}</h2>
            <p className="text-sm text-gray-500 mb-5">Please confirm your attendance below.</p>

            {/* Attendance */}
            <div className="mb-5">
              <p className="text-sm font-semibold text-gray-700 mb-3">Will you attend?</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setRsvp('yes')}
                  className={`p-3 rounded-xl border-2 font-semibold text-sm transition-colors ${
                    rsvp === 'yes'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 text-gray-600 hover:border-green-300'
                  }`}
                >
                  Yes, I'll be there!
                </button>
                <button
                  onClick={() => setRsvp('no')}
                  className={`p-3 rounded-xl border-2 font-semibold text-sm transition-colors ${
                    rsvp === 'no'
                      ? 'border-red-400 bg-red-50 text-red-700'
                      : 'border-gray-200 text-gray-600 hover:border-red-300'
                  }`}
                >
                  Sorry, can't make it
                </button>
              </div>
            </div>

            {/* Meal Preference */}
            {rsvp === 'yes' && (
              <div className="mb-5">
                <p className="text-sm font-semibold text-gray-700 mb-3">Meal preference (optional)</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(mealLabels).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setMeal(meal === key ? '' : key)}
                      className={`p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                        meal === key
                          ? 'border-rose-500 bg-rose-50 text-rose-700'
                          : 'border-gray-200 text-gray-600 hover:border-rose-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedGuest(null)}
                className="flex-1 p-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitRSVP}
                disabled={!rsvp || submitting}
                className="flex-1 p-3 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Saving...' : 'Submit RSVP'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
