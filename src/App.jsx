import { useState } from 'react'
import AccountMenu from './components/AccountMenu/AccountMenu'
import LocalFindImport from './components/LocalFindImport/LocalFindImport'
import Calendar from './components/Calendar/Calendar'
import EventList from './components/EventList/EventList'
import EventModal from './components/EventModal/EventModal'
import ProfileMenu from './components/ProfileMenu/ProfileMenu'
import { useAuth } from './hooks/useAuth'
import { useEvents } from './hooks/useEvents'
import { useProfiles } from './hooks/useProfiles'
import { today } from './utils/dateUtils'
import './App.css'

export default function App() {
  const { user, ready: authReady, error: authError, busy, signIn, createAccount, signOut } = useAuth()
  const {
    profiles,
    activeProfile,
    ready: profilesReady,
    syncError,
    createProfile,
    selectProfile,
    renameProfile,
    deleteProfile,
  } = useProfiles(user)
  const { events, saveError, addEvent, importEvents, updateEvent, deleteEvent } = useEvents(
    user,
    profilesReady ? activeProfile?.id : null,
  )

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selectedDate, setSelectedDate] = useState(today())
  const [modalState, setModalState] = useState(null) // null | { mode: 'new' | 'edit', event? }

  function navigateMonth(delta) {
    const next = new Date(year, month + delta, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth())
  }

  function goToToday() {
    const t = new Date()
    setYear(t.getFullYear())
    setMonth(t.getMonth())
    setSelectedDate(today())
  }

  function handleSelectDate(dateKey) {
    setSelectedDate(dateKey)
  }

  function handleSave(draft) {
    if (modalState?.event) {
      updateEvent(modalState.event.id, draft)
    } else {
      addEvent(draft)
    }
    setModalState(null)
  }

  function handleToggleChecklistItem(eventId, itemId) {
    const event = events.find((e) => e.id === eventId)
    if (!event) return
    updateEvent(eventId, {
      checklist: event.checklist.map((item) =>
        item.id === itemId ? { ...item, done: !item.done } : item
      ),
    })
  }

  const notice = syncError || saveError

  if (!authReady || (user && !profilesReady)) {
    return (
      <div className="app app--loading">
        <p className="app__loading">{user ? 'Opening your calendars…' : 'Opening Daybook…'}</p>
      </div>
    )
  }

  if (!activeProfile) {
    return (
      <div className="app app--loading">
        <p className="app__loading">{notice || 'Could not open your calendars.'}</p>
        {user && (
          <button type="button" className="app__retry" onClick={() => signOut()} disabled={busy}>
            Sign out
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="app">
      {notice && (
        <p className="app__alert" role="alert">
          {notice}
        </p>
      )}
      <div className="app__layout">
        <Calendar
          year={year}
          month={month}
          events={events}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
          onOpenEvent={(event) => setModalState({ mode: 'edit', event })}
          onNavigate={navigateMonth}
          onToday={goToToday}
          accountMenu={
            <AccountMenu
              user={user}
              busy={busy}
              error={authError}
              onCreate={createAccount}
              onSignIn={signIn}
              onSignOut={signOut}
            />
          }
          localFindMenu={<LocalFindImport onImport={importEvents} />}
          profileMenu={
            <ProfileMenu
              profiles={profiles}
              activeProfile={activeProfile}
              onSelect={selectProfile}
              onCreate={createProfile}
              onRename={renameProfile}
              onDelete={deleteProfile}
              hint={
                user
                  ? 'Each profile on this account keeps its own calendar.'
                  : 'Each profile keeps its own calendar on this browser.'
              }
            />
          }
        />

        <EventList
          selectedDate={selectedDate}
          events={events}
          onNewEvent={() => setModalState({ mode: 'new' })}
          onOpenEvent={(event) => setModalState({ mode: 'edit', event })}
          onDeleteEvent={deleteEvent}
          onToggleChecklistItem={handleToggleChecklistItem}
        />
      </div>

      {modalState && (
        <EventModal
          defaultDate={selectedDate}
          existingEvent={modalState.event}
          onSave={handleSave}
          onClose={() => setModalState(null)}
        />
      )}
    </div>
  )
}
