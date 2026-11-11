import { useState } from 'react'
import { clearFeedToken, loadFeedToken, pullBookmarks, saveFeedToken } from '../../lib/localFind'
import './LocalFindImport.css'

export default function LocalFindImport({ onImport }) {
  const [open, setOpen] = useState(false)
  const [token, setToken] = useState(() => loadFeedToken())
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  async function connect(event) {
    event.preventDefault()
    const next = draft.trim()
    if (!next) return
    saveFeedToken(next)
    setToken(next)
    setDraft('')
    setError('')
    setNotice('Daybook can now pull bookmarks from that LocalFind account.')
  }

  async function pull() {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const events = await pullBookmarks(token)
      const added = onImport(events)
      setNotice(added === 0 ? 'Those bookmarks are already on this calendar.' : `Added ${added} bookmarked ${added === 1 ? 'event' : 'events'}.`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not read LocalFind bookmarks.')
    } finally {
      setBusy(false)
    }
  }

  function disconnect() {
    clearFeedToken()
    setToken('')
    setNotice('')
    setError('')
  }

  return (
    <>
      <button type="button" className="localfind__trigger" onClick={() => setOpen(true)}>
        LocalFind
      </button>
      {open && (
        <div className="localfind__backdrop" onClick={() => setOpen(false)}>
          <div className="localfind" role="dialog" aria-label="LocalFind bookmarks" onClick={(event) => event.stopPropagation()}>
            <div className="localfind__header">
              <h2>LocalFind</h2>
              <button type="button" className="localfind__close" onClick={() => setOpen(false)} aria-label="Close">
                ×
              </button>
            </div>
            {token ? (
              <div className="localfind__body">
                <p>Pull bookmarks from the connected LocalFind account onto this calendar.</p>
                <button type="button" className="localfind__primary" onClick={() => void pull()} disabled={busy}>
                  {busy ? 'Pulling…' : 'Add bookmarked events'}
                </button>
                <button type="button" className="localfind__quiet" onClick={disconnect} disabled={busy}>
                  Remove connection
                </button>
              </div>
            ) : (
              <form onSubmit={connect}>
                <p>Paste the connection from your LocalFind account. It can read that account’s bookmarks.</p>
                <label className="localfind__field">
                  <span>Connection</span>
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    autoComplete="off"
                    required
                  />
                </label>
                <button type="submit" className="localfind__primary">
                  Save connection
                </button>
              </form>
            )}
            {notice ? <p className="localfind__notice">{notice}</p> : null}
            {error ? (
              <p className="localfind__error" role="alert">
                {error}
              </p>
            ) : null}
          </div>
        </div>
      )}
    </>
  )
}
