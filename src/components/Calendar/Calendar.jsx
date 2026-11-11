import CalendarGrid from '../CalendarGrid/CalendarGrid'
import { MONTH_NAMES, buildMonthGrid } from '../../utils/dateUtils'
import './Calendar.css'

export default function Calendar({
  year,
  month,
  events,
  selectedDate,
  onSelectDate,
  onOpenEvent,
  onNavigate,
  onToday,
  accountMenu,
  profileMenu,
  localFindMenu,
}) {
  const days = buildMonthGrid(year, month)

  return (
    <section className="calendar">
      <header className="calendar__header">
        <div>
          <p className="calendar__eyebrow">Daybook</p>
          <h1 className="calendar__title">
            {MONTH_NAMES[month]} <span className="calendar__year">{year}</span>
          </h1>
        </div>
        <div className="calendar__nav">
          {accountMenu}
          {profileMenu}
          {localFindMenu}
          <button type="button" onClick={onToday} className="calendar__nav-btn calendar__nav-btn--text">
            Today
          </button>
          <button type="button" onClick={() => onNavigate(-1)} className="calendar__nav-btn" aria-label="Previous month">
            &#8592;
          </button>
          <button type="button" onClick={() => onNavigate(1)} className="calendar__nav-btn" aria-label="Next month">
            &#8594;
          </button>
        </div>
      </header>

      <CalendarGrid
        days={days}
        events={events}
        selectedDate={selectedDate}
        onSelectDate={onSelectDate}
        onOpenEvent={onOpenEvent}
      />
    </section>
  )
}
