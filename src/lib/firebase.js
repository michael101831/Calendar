import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Public web config for the Daybook Firebase project. Security comes from
// Auth and the Firestore rules, not from hiding this key.
const firebaseConfig = {
  apiKey: 'AIzaSyADY8Q3-3lQK74inTYtmSmdydWhGsqgP8A',
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
