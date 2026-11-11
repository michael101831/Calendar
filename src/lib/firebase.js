import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// The browser key is injected at build time and limited to this site's
// domains. Access is enforced by Auth and the Firestore rules.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: 'calendar-project-fb.firebaseapp.com',
  projectId: 'calendar-project-fb',
  storageBucket: 'calendar-project-fb.firebasestorage.app',
  messagingSenderId: '560774267039',
  appId: '1:560774267039:web:59f05a7b3274c4deb5e2aa',
}

export const cloudEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.appId)

const app = cloudEnabled ? initializeApp(firebaseConfig) : null

export const auth = app ? getAuth(app) : null
export const db = app ? getFirestore(app) : null
