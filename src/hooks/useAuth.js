import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { useEffect, useState } from 'react'
import { auth, cloudEnabled } from '../lib/firebase'

function authMessage(error) {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : ''
  if (code === 'auth/email-already-in-use') return 'An account with that email already exists. Sign in instead.'
  if (code === 'auth/invalid-email') return 'Enter a valid email address.'
  if (code === 'auth/weak-password') return 'Use a password of at least 6 characters.'
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'That email and password did not match an account.'
  }
  if (code === 'auth/too-many-requests') return 'Too many attempts. Wait a minute and try again.'
  if (code === 'auth/network-request-failed') return 'Could not reach accounts. Check your connection and try again.'
  if (code === 'auth/unauthorized-domain') return 'Accounts are not available from this address.'
  if (code === 'auth/operation-not-allowed') return 'Password accounts are not turned on for this site yet.'
  if (code === 'auth/configuration-not-found') return 'Accounts are not set up on this site yet.'
  return 'Could not update your account. Try again.'
}

export function useAuth() {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(!cloudEnabled)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!auth) return undefined
    let settled = false
    const timeout = window.setTimeout(() => {
      if (settled) return
      settled = true
      setReady(true)
    }, 4000)
    const unsubscribe = onAuthStateChanged(
      auth,
      (next) => {
        settled = true
        window.clearTimeout(timeout)
        setUser(next)
        setReady(true)
      },
      () => {
        settled = true
        window.clearTimeout(timeout)
        setReady(true)
      },
    )
    return () => {
      settled = true
      window.clearTimeout(timeout)
      unsubscribe()
    }
  }, [])

  async function run(action) {
    if (!cloudEnabled || !auth) {
      setError('Accounts are not set up on this site yet.')
      return false
    }
    setBusy(true)
    setError(null)
    try {
      await action()
      return true
    } catch (caught) {
      setError(authMessage(caught))
      return false
    } finally {
      setBusy(false)
    }
  }

  return {
    user,
    ready,
    error,
    busy,
    cloudEnabled,
    signIn: (email, password) => run(() => signInWithEmailAndPassword(auth, email.trim(), password)),
    createAccount: (email, password) =>
      run(() => createUserWithEmailAndPassword(auth, email.trim(), password)),
    signOut: () => run(() => signOut(auth)),
  }
}
