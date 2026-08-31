// Small collection of date helpers used across the app.
// We keep dates as plain "YYYY-MM-DD" strings for storage/comparison,
// and only build JS Date objects when we need calendar math.

export function toKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function keyToDate(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function today() {
  return toKey(new Date())
}

export function addDays(key, amount) {
  const d = keyToDate(key)
  d.setDate(d.getDate() + amount)
  return toKey(d)
}

// Returns true if `dayKey` falls within [startKey, endKey] inclusive.
export function isWithinRange(dayKey, startKey, endKey) {
  return dayKey >= startKey && dayKey <= (endKey || startKey)
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Builds a 6x7 grid of day-keys covering the given month, including the
// tail end of the previous month and the start of the next so every
// week row is complete.
export function buildMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1)
  const startOffset = firstOfMonth.getDay() // 0 = Sunday
  const gridStart = new Date(year, month, 1 - startOffset)

  const days = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    days.push({
      key: toKey(d),
      dayNumber: d.getDate(),
      inCurrentMonth: d.getMonth() === month,
    })
  }
  return days
}

export function formatTime(time) {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

export function formatDateLong(key) {
  const d = keyToDate(key)
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}
