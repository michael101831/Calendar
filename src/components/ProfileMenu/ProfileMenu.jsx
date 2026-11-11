import { useEffect, useId, useRef, useState } from 'react'
import './ProfileMenu.css'

function initial(name) {
  return name.trim().slice(0, 1).toUpperCase() || '?'
}

export default function ProfileMenu({
  profiles,
  activeProfile,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  hint = 'Each profile keeps its own calendar on this browser.',
}) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('list')
  const [draftName, setDraftName] = useState('')
  const [renameId, setRenameId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const rootRef = useRef(null)
  const panelId = useId()
  const profileBeingRenamed = profiles.find((profile) => profile.id === renameId)

  useEffect(() => {
    if (!open) return undefined
    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  useEffect(() => {
    if (!open) setMode('list')
  }, [open])

  useEffect(() => {
    setMode('list')
  }, [activeProfile?.id])

  async function submitCreate(event) {
    event.preventDefault()
    const created = await onCreate(draftName)
    if (!created) return
    setDraftName('')
  }

  function startRename() {
    setRenameId(activeProfile.id)
    setRenameValue(activeProfile.name)
    setMode('rename')
  }

  async function submitRename(event) {
    event.preventDefault()
    if (!renameId) return
    const renamed = await onRename(renameId, renameValue)
    if (!renamed) return
    setMode('list')
  }

  async function confirmDelete() {
    const id = activeProfile.id
    setMode('list')
    const removed = await onDelete(id)
    if (removed) setOpen(false)
  }

  if (!activeProfile) return null

  return (
    <div className="profile-menu" ref={rootRef}>
      <button
        type="button"
        className="profile-menu__trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="profile-menu__mark" aria-hidden="true">
          {initial(activeProfile.name)}
        </span>
        <span className="profile-menu__name">{activeProfile.name}</span>
        <span className="profile-menu__chevron" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div id={panelId} className="profile-menu__panel" role="dialog" aria-label="Profiles">
          <p className="profile-menu__label">Profiles</p>
          <ul className="profile-menu__list">
            {profiles.map((profile) => {
              const selected = profile.id === activeProfile.id
              return (
                <li key={profile.id}>
                  <button
                    type="button"
                    className={
                      selected ? 'profile-menu__item profile-menu__item--active' : 'profile-menu__item'
                    }
                    aria-current={selected ? 'true' : undefined}
                    onClick={() => onSelect(profile.id)}
                  >
                    <span className="profile-menu__mark" aria-hidden="true">
                      {initial(profile.name)}
                    </span>
                    <span className="profile-menu__item-name">{profile.name}</span>
                  </button>
                </li>
              )
            })}
          </ul>

          {mode === 'rename' && profileBeingRenamed && (
            <form className="profile-menu__form profile-menu__form--stack" onSubmit={submitRename}>
              <label className="profile-menu__field">
                <span>Rename {profileBeingRenamed.name}</span>
                <input
                  value={renameValue}
                  onChange={(event) => setRenameValue(event.target.value)}
                  maxLength={40}
                  autoFocus
                  required
                />
              </label>
              <div className="profile-menu__actions">
                <button type="button" className="profile-menu__text" onClick={() => setMode('list')}>
                  Cancel
                </button>
                <button type="submit" className="profile-menu__add" disabled={!renameValue.trim()}>
                  Save
                </button>
              </div>
            </form>
          )}

          {mode === 'delete' && (
            <div className="profile-menu__confirm">
              <p>Remove {activeProfile.name} and every event on it?</p>
              <div className="profile-menu__actions">
                <button type="button" className="profile-menu__text" onClick={() => setMode('list')}>
                  Cancel
                </button>
                <button type="button" className="profile-menu__danger" onClick={confirmDelete}>
                  Remove
                </button>
              </div>
            </div>
          )}

          {mode === 'list' && (
            <>
              <form className="profile-menu__form" onSubmit={submitCreate}>
                <label className="profile-menu__field">
                  <span>New profile</span>
                  <input
                    value={draftName}
                    onChange={(event) => setDraftName(event.target.value)}
                    placeholder="Name"
                    aria-label="New profile name"
                    maxLength={40}
                  />
                </label>
                <button type="submit" className="profile-menu__add" disabled={!draftName.trim()}>
                  Add
                </button>
              </form>
              <div className="profile-menu__actions">
                <button type="button" className="profile-menu__text" onClick={startRename}>
                  Rename
                </button>
                {profiles.length > 1 && (
                  <button type="button" className="profile-menu__danger" onClick={() => setMode('delete')}>
                    Delete
                  </button>
                )}
              </div>
              <p className="profile-menu__hint">{hint}</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
