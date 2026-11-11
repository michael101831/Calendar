const API = 'https://localfind-fb.web.app/api/bookmarks'
const TOKEN_KEY = 'daybook.localfind.feed'

const DATE = /^\d{4}-\d{2}-\d{2}$/
const TIME = /^\d{2}:\d{2}$/
const ID = /^localfind-[A-Za-z0-9._-]{1,120}$/

export function loadFeedToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

export function saveFeedToken(token) {
  localStorage.setItem(TOKEN_KEY, token.trim())
}

export function clearFeedToken() {
  localStorage.removeItem(TOKEN_KEY)
}

function text(value, max) {
  if (typeof value !== 'string') return ''
  const cleaned = value.replace(/[\u0000-\u001F]+/g, ' ').replace(/\s+/g, ' ').trim()
  return cleaned.length > max ? cleaned.slice(0, max) : cleaned
}

export function asCalendarEvent(value) {
  if (!value || typeof value !== 'object') return null
  const id = text(value.id, 140)
  const startDate = text(value.startDate, 10)
  const endDate = text(value.endDate, 10)
  const title = text(value.title, 180)
  const startTime = text(value.startTime, 5)
  if (!ID.test(id) || !title || !DATE.test(startDate) || !DATE.test(endDate)) return null
  return {
    id,
    title,
    startDate,
    endDate,
    startTime: TIME.test(startTime) ? startTime : '',
    endTime: '',
    notes: text(value.notes, 600),
    checklist: [],
    attachments: [],
    color: '#e2a339',
  }
}

export async function pullBookmarks(token) {
  let response
  try {
    response = await fetch(API, { headers: { Authorization: `Bearer ${token.trim()}` } })
  } catch {
    throw new Error('Could not reach LocalFind. Check your connection and try again.')
  }
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message = payload && typeof payload.message === 'string' ? payload.message : 'Could not read LocalFind bookmarks.'
    throw new Error(message)
  }
  const events = Array.isArray(payload?.events) ? payload.events.flatMap((event) => {
    const next = asCalendarEvent(event)
    return next ? [next] : []
  }) : []
  return events
}
