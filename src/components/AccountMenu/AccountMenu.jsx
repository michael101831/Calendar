import { useState } from 'react'
import './AccountMenu.css'

export default function AccountMenu({ user, busy, error, onCreate, onSignIn, onSignOut }) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('create')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function submit(event) {
    event.preventDefault()
    const ok = mode === 'create' ? await onCreate(email, password) : await onSignIn(email, password)
    if (!ok) return
    setPassword('')
    setOpen(false)
  }

  async function handleSignOut() {
    const ok = await onSignOut()
    if (ok) setOpen(false)
  }

  const label = user?.email || 'Sign in'

  return (
    <>
      <button
        type="button"
        className="account-menu__trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        {label}
      </button>

      {open && (
        <div className="account-menu__backdrop" onClick={() => setOpen(false)}>
          <div
            className="account-menu"
            role="dialog"
            aria-label="Account"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="account-menu__header">
              <h2>{user ? 'Account' : mode === 'create' ? 'Create account' : 'Sign in'}</h2>
              <button type="button" className="account-menu__close" onClick={() => setOpen(false)} aria-label="Close">
                ×
              </button>
            </div>

            {user ? (
              <div className="account-menu__signed-in">
                <p>
                  Signed in as <strong>{user.email}</strong>. Profiles on this account open on your other devices.
                </p>
                <button type="button" className="account-menu__primary" onClick={handleSignOut} disabled={busy}>
                  {busy ? 'Working…' : 'Sign out'}
                </button>
              </div>
            ) : (
              <form onSubmit={submit}>
                <p className="account-menu__copy">
                  {mode === 'create'
                    ? 'Create an account and these calendars open on your other devices. A new account starts with the calendars on this browser.'
                    : 'Sign in to see the calendars saved on this account.'}
                </p>
                <label className="account-menu__field">
                  <span>Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    required
                  />
                </label>
                <label className="account-menu__field">
                  <span>Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete={mode === 'create' ? 'new-password' : 'current-password'}
                    minLength={6}
                    required
                  />
                </label>
                <div className="account-menu__footer">
                  <button
                    type="button"
                    className="account-menu__text"
                    onClick={() => setMode((value) => (value === 'create' ? 'sign-in' : 'create'))}
                  >
                    {mode === 'create' ? 'I have an account' : 'Create an account'}
                  </button>
                  <button type="submit" className="account-menu__primary" disabled={busy}>
                    {busy ? 'Working…' : mode === 'create' ? 'Create account' : 'Sign in'}
                  </button>
                </div>
              </form>
            )}

            {error && (
              <p className="account-menu__error" role="alert">
                {error}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
