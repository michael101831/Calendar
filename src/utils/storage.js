// Everything is persisted to localStorage so the app works with zero
// backend. Each event is a plain object; see hooks/useEvents.js for shape.

const STORAGE_KEY = 'daybook.events.v1'

export function loadEvents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch (err) {
    console.error('Could not read saved events, starting fresh.', err)
    return []
  }
}

export function saveEvents(events) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events))
  } catch (err) {
    // Most likely quota exceeded, usually from large attachments.
    console.error('Could not save events.', err)
  }
}

// Reads a File into a base64 data URL so it can be stored alongside the
// event in localStorage (no backend/file server involved).
export function fileToAttachment(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () =>
      resolve({
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type,
        size: file.size,
        data: reader.result,
      })
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}
