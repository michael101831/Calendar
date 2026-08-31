import { formatTime } from '../../utils/dateUtils'

const MAX_VISIBLE = 3

export default function DayCell({ day, dayNumber, isToday, isSelected, events, onSelect, onOpenEvent }) {
  const visible = events.slice(0, MAX_VISIBLE)
  const overflow = events.length - visible.length

  return (
    <button
      type="button"
      className={[
        'day-cell',
        day.inCurrentMonth ? '' : 'day-cell--muted',
        isSelected ? 'day-cell--selected' : '',
      ].join(' ').trim()}
      onClick={() => onSelect(day.key)}
    >
      <span className={'day-cell__number' + (isToday ? ' day-cell__number--today' : '')}>
        {dayNumber}
      </span>

      <span className="day-cell__events">
        {visible.map((event) => (
          <span
            key={event.id}
            className="event-pill"
            style={{ '--pill-color': event.color || '#e2a339' }}
            onClick={(e) => {
              e.stopPropagation()
              onOpenEvent(event)
            }}
            title={event.title}
          >
            {event.startTime ? `${formatTime(event.startTime)} · ` : ''}
            {event.title}
          </span>
        ))}
        {overflow > 0 && <span className="event-pill event-pill--more">+{overflow} more</span>}
      </span>
    </button>
  )
}
