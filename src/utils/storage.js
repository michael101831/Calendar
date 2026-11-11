// Everything is persisted to localStorage so the app works with zero
// backend. Profiles live in one record; each profile's events live in a
// map keyed by profile id. See hooks/useEvents.js for the event shape.

const PROFILES_KEY = 'daybook.profiles.v1'
const EVENTS_KEY = 'daybook.events.v2'
const LEGACY_EVENTS_KEY = 'daybook.events.v1'
const DEFAULT_PROFILE_NAME = 'Personal'

function readJson(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch (err) {
    console.error(`Could not read ${key}.`, err)
    return null
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    // Most likely quota exceeded, usually from large attachments.
    console.error(`Could not save ${key}.`, err)
  }
}

function isProfile(value) {
  return Boolean(
    value &&
      typeof value.id === 'string' &&
      value.id &&
      typeof value.name === 'string' &&
      value.name.trim()
  )
}

function normalizeStore(value) {
  if (!value || !Array.isArray(value.profiles)) return null
  const profiles = value.profiles.filter(isProfile).map((profile) => ({
    id: profile.id,
    name: profile.name.trim(),
  }))
  if (profiles.length === 0) return null
  const activeId = profiles.some((profile) => profile.id === value.activeId)
    ? value.activeId
    : profiles[0].id
  return { activeId, profiles }
}

function readEventMap() {
  const map = readJson(EVENTS_KEY)
  if (!map || typeof map !== 'object' || Array.isArray(map)) return {}
  return map
}

export function loadProfileStore() {
  const existing = normalizeStore(readJson(PROFILES_KEY))
  if (existing) return existing

  const id = crypto.randomUUID()
  const store = {
    activeId: id,
    profiles: [{ id, name: DEFAULT_PROFILE_NAME }],
  }
  const legacy = readJson(LEGACY_EVENTS_KEY)
  const events = Array.isArray(legacy) ? legacy : []
  writeJson(EVENTS_KEY, { ...readEventMap(), [id]: events })
  writeJson(PROFILES_KEY, store)
  return store
}

export function saveProfileStore(store) {
  writeJson(PROFILES_KEY, store)
}

export function loadEvents(profileId) {
  const events = readEventMap()[profileId]
  return Array.isArray(events) ? events : []
}

export function saveEvents(profileId, events) {
  writeJson(EVENTS_KEY, { ...readEventMap(), [profileId]: events })
}

export function removeProfileEvents(profileId) {
  const map = readEventMap()
  if (!(profileId in map)) return
  delete map[profileId]
  writeJson(EVENTS_KEY, map)
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
