import { useState } from 'react'
import Calendar from './components/Calendar/Calendar'
import EventList from './components/EventList/EventList'
import EventModal from './components/EventModal/EventModal'
import { useEvents } from './hooks/useEvents'
import { today } from './utils/dateUtils'
import './App.css'

export default function App() {
  const { events, addEvent, updateEvent, deleteEvent } = useEvents()

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

  return (
    <div className="app">
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
