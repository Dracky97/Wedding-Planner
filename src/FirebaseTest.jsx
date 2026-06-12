import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const FirebaseTest = () => {
  const [status, setStatus] = useState('Testing Firebase connection...');
  const [events, setEvents] = useState([]);

  useEffect(() => {
    try {
      const app = initializeApp(firebaseConfig);
      const db = getFirestore(app);
      
      setStatus('Firebase initialized successfully');
      
      // Try to access events collection
      const eventsQuery = query(collection(db, 'events'), orderBy('date', 'desc'));
      const unsubscribe = onSnapshot(eventsQuery, (querySnapshot) => {
        const eventsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEvents(eventsData);
        setStatus(`Successfully loaded ${eventsData.length} events`);
      }, (error) => {
        console.error("Error fetching events: ", error);
        setStatus(`Error fetching events: ${error.message}`);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Firebase initialization error:", error);
      setStatus(`Firebase error: ${error.message}`);
    }
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Firebase Connection Test</h1>
      <p>Status: {status}</p>
      <div>
        <h2>Events:</h2>
        {events.length > 0 ? (
          <ul>
            {events.map(event => (
              <li key={event.id}>
                {event.title} - {event.date}
              </li>
            ))}
          </ul>
        ) : (
          <p>No events found or error loading events</p>
        )}
      </div>
    </div>
  );
};

export default FirebaseTest;