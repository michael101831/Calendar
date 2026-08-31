import DayCell from './DayCell'
import { WEEKDAY_LABELS, isWithinRange, today as todayKey } from '../../utils/dateUtils'
import './CalendarGrid.css'

export default function CalendarGrid({ days, events, selectedDate, onSelectDate, onOpenEvent }) {
  const today = todayKey()

  function eventsForDay(dayKey) {
    return events
      .filter((event) => isWithinRange(dayKey, event.startDate, event.endDate))
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
  }

  return (
    <div className="calendar-grid">
      <div className="calendar-grid__weekdays">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="calendar-grid__weekday">{label}</div>
        ))}
      </div>
      <div className="calendar-grid__days">
        {days.map((day) => (
          <DayCell
            key={day.key}
            day={day}
            dayNumber={day.dayNumber}
            isToday={day.key === today}
            isSelected={day.key === selectedDate}
            events={eventsForDay(day.key)}
            onSelect={onSelectDate}
            onOpenEvent={onOpenEvent}
          />
        ))}
      </div>
    </div>
  )
}
