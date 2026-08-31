import { formatDateLong, formatTime, isWithinRange } from '../../utils/dateUtils'
import AttachmentPreview from '../AttachmentPreview/AttachmentPreview'
import './EventList.css'

export default function EventList({ selectedDate, events, onNewEvent, onOpenEvent, onDeleteEvent, onToggleChecklistItem }) {
  const dayEvents = events
    .filter((event) => isWithinRange(selectedDate, event.startDate, event.endDate))
    .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))

  return (
    <aside className="agenda">
      <div className="agenda__header">
        <p className="agenda__date">{formatDateLong(selectedDate)}</p>
        <button type="button" className="agenda__add" onClick={onNewEvent}>
          + New event
        </button>
      </div>

      {dayEvents.length === 0 && (
        <p className="agenda__empty">Nothing on the books yet.</p>
      )}

      <ul className="agenda__list">
        {dayEvents.map((event) => {
          const isMultiDay = event.endDate && event.endDate !== event.startDate
          return (
            <li
              key={event.id}
              className="agenda__item"
              style={{ borderLeftColor: event.color || '#e2a339' }}
            >
              <div className="agenda__item-main" onClick={() => onOpenEvent(event)}>
                <p className="agenda__item-title">{event.title}</p>
                <p className="agenda__item-meta">
                  {event.startTime ? formatTime(event.startTime) : 'All day'}
                  {event.endTime ? ` – ${formatTime(event.endTime)}` : ''}
                  {isMultiDay ? ` · through ${event.endDate}` : ''}
                </p>
                {event.notes && <p className="agenda__item-notes">{event.notes}</p>}
              </div>

              {event.checklist?.length > 0 && (
                <ul className="agenda__checklist">
                  {event.checklist.map((item) => (
                    <li key={item.id}>
                      <label>
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => onToggleChecklistItem(event.id, item.id)}
                        />
                        <span className={item.done ? 'agenda__checklist-done' : ''}>{item.text}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}

              {event.attachments?.length > 0 && (
                <div className="attachments-grid">
                  {event.attachments.map((file) => (
                    <AttachmentPreview key={file.id} file={file} size="large" />
                  ))}
                </div>
              )}

              <button
                type="button"
                className="agenda__delete"
                onClick={() => onDeleteEvent(event.id)}
                aria-label={`Delete ${event.title}`}
              >
                Remove
              </button>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
