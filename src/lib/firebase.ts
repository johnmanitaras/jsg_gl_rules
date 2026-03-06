import { initializeApp } from 'firebase/app';
import {
  Auth,
  getAuth,
  onAuthStateChanged,
  setPersistence,
} from 'firebase/auth';
import { AUTH_PERSISTENCE } from './config';
import { broadcastAuthState } from './broadcast';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let _auth: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (!_auth) {
    const app = initializeApp(firebaseConfig);
    _auth = getAuth(app);

    setPersistence(_auth, AUTH_PERSISTENCE)
      .then(() => console.log('Auth persistence configured'))
      .catch(error => console.error('Failed to configure auth persistence:', error));

    onAuthStateChanged(_auth, (user) => {
      console.log('Auth state changed:', user ? `User ${user.email} logged in` : 'User logged out');
      broadcastAuthState(user);
    });
  }
  return _auth;
}