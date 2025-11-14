# Wedding Planner

A collaborative wedding planning application built with React, Vite, Firebase, and Tailwind CSS.

## Features

- User authentication with Firebase Auth
- Real-time collaborative planning
- Guest list management
- Budget tracking
- Vendor comparison
- Wedding checklist
- Document storage
- Agenda planning

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Firebase:
   - Create a Firebase project at https://console.firebase.google.com/
   - Enable Authentication, Firestore, and Storage
   - Copy your Firebase config values

4. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your Firebase configuration values in `.env`

5. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

The application uses the following environment variables (stored in `.env`):

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

## Security

API keys and sensitive configuration are stored in environment variables and excluded from version control via `.gitignore`.

## Tech Stack

- React 18
- Vite
- Firebase (Auth, Firestore, Storage)
- Tailwind CSS
- Lucide React (icons)
