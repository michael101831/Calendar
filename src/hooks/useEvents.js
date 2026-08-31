import { useEffect, useState } from 'react'
import { loadEvents, saveEvents } from '../utils/storage'

// Event shape:
// {
//   id: string,
//   title: string,
//   startDate: 'YYYY-MM-DD',
//   endDate: 'YYYY-MM-DD',      // same as startDate for single-day events
//   startTime: 'HH:MM' | '',
//   endTime: 'HH:MM' | '',
//   notes: string,
//   checklist: [{ id, text, done }],
//   attachments: [{ id, name, type, size, data }],
//   color: 'marigold' | 'teal' | 'clay',
// }

export function useEvents() {
  const [events, setEvents] = useState(() => loadEvents())

  useEffect(() => {
    saveEvents(events)
  }, [events])

  function addEvent(event) {
    setEvents((prev) => [...prev, { ...event, id: crypto.randomUUID() }])
  }

  function updateEvent(id, updates) {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    )
  }

  function deleteEvent(id) {
    setEvents((prev) => prev.filter((e) => e.id !== id))
  }

  return { events, addEvent, updateEvent, deleteEvent }
}
