import { useEffect, useState } from 'react'
import { deleteCloudEvent, saveCloudEvent, subscribeEvents, updateCloudEvent } from '../lib/cloudCalendar'
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

function writeError(err) {
  const code = err && typeof err === 'object' && 'code' in err ? String(err.code) : ''
  const message = err instanceof Error ? err.message : ''
  if (code === 'permission-denied') return 'This account cannot change that calendar.'
  if (code === 'unavailable' || code === 'deadline-exceeded') {
    return 'Could not reach your calendars. Check your connection and try again.'
  }
  if (message.includes('longer than') || message.includes('exceeds the maximum')) {
    return 'That event is too large to sync. Try a smaller attachment.'
  }
  return 'Could not sync that change. Try again.'
}

export function useEvents(user, profileId) {
  const [bucket, setBucket] = useState(() => ({
    source: 'local',
    profileId,
    events: profileId ? loadEvents(profileId) : [],
  }))
  const [saveError, setSaveError] = useState(null)

  if (!user && profileId && (bucket.source !== 'local' || bucket.profileId !== profileId)) {
    setBucket({ source: 'local', profileId, events: loadEvents(profileId) })
  }

  useEffect(() => {
    if (user || bucket.source !== 'local' || !profileId || bucket.profileId !== profileId) return
    saveEvents(profileId, bucket.events)
  }, [user, profileId, bucket])

  useEffect(() => {
    if (!user || !profileId) return undefined
    return subscribeEvents(
      user.uid,
      profileId,
      (events) => {
        setBucket({ source: 'cloud', profileId, events })
        setSaveError(null)
      },
      (err) => {
        console.error(err)
        setSaveError('Could not load events for this profile.')
      },
    )
  }, [user, profileId])

  const events = profileId && bucket.profileId === profileId && (user ? bucket.source === 'cloud' : bucket.source === 'local')
    ? bucket.events
    : []

  function currentEvents(prev) {
    const source = user ? 'cloud' : 'local'
    if (prev.profileId === profileId && prev.source === source) return prev.events
    return []
  }

  function addEvent(event) {
    const next = { ...event, id: crypto.randomUUID() }
    setBucket((prev) => ({
      source: user ? 'cloud' : 'local',
      profileId,
      events: [...currentEvents(prev), next],
    }))
    if (!user || !profileId) return
    saveCloudEvent(user.uid, profileId, next).catch((err) => {
      console.error(err)
      setSaveError(writeError(err))
    })
  }

  function updateEvent(id, updates) {
    setBucket((prev) => ({
      source: user ? 'cloud' : 'local',
      profileId,
      events: currentEvents(prev).map((item) => (item.id === id ? { ...item, ...updates } : item)),
    }))
    if (!user || !profileId) return
    updateCloudEvent(user.uid, profileId, id, updates).catch((err) => {
      console.error(err)
      setSaveError(writeError(err))
    })
  }

  function deleteEvent(id) {
    setBucket((prev) => ({
      source: user ? 'cloud' : 'local',
      profileId,
      events: currentEvents(prev).filter((item) => item.id !== id),
    }))
    if (!user || !profileId) return
    deleteCloudEvent(user.uid, profileId, id).catch((err) => {
      console.error(err)
      setSaveError(writeError(err))
    })
  }

  return { events, saveError, addEvent, updateEvent, deleteEvent }
}
