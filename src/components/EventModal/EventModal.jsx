import { useState } from 'react'
import { fileToAttachment } from '../../utils/storage'
import AttachmentPreview from '../AttachmentPreview/AttachmentPreview'
import './EventModal.css'

const DEFAULT_COLOR = '#e2a339' // marigold, matches the app's default accent

function emptyDraft(defaultDate) {
  return {
    title: '',
    startDate: defaultDate,
    endDate: defaultDate,
    startTime: '',
    endTime: '',
    notes: '',
    checklist: [],
    attachments: [],
    color: DEFAULT_COLOR,
  }
}

export default function EventModal({ defaultDate, existingEvent, onSave, onClose }) {
  const [draft, setDraft] = useState(() => existingEvent ?? emptyDraft(defaultDate))
  const [isMultiDay, setIsMultiDay] = useState(
    Boolean(existingEvent?.endDate && existingEvent.endDate !== existingEvent.startDate)
  )
  const [checklistInput, setChecklistInput] = useState('')
  const [uploading, setUploading] = useState(false)

  function update(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  function handleMultiDayToggle(checked) {
    setIsMultiDay(checked)
    if (!checked) update('endDate', draft.startDate)
  }

  function addChecklistItem() {
    const text = checklistInput.trim()
    if (!text) return
    setDraft((prev) => ({
      ...prev,
      checklist: [...prev.checklist, { id: crypto.randomUUID(), text, done: false }],
    }))
    setChecklistInput('')
  }

  function removeChecklistItem(id) {
    setDraft((prev) => ({
      ...prev,
      checklist: prev.checklist.filter((item) => item.id !== id),
    }))
  }

  function toggleChecklistItem(id) {
    setDraft((prev) => ({
      ...prev,
      checklist: prev.checklist.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item
      ),
    }))
  }

  async function handleFiles(fileList) {
    setUploading(true)
    try {
      const attachments = await Promise.all(Array.from(fileList).map(fileToAttachment))
      setDraft((prev) => ({ ...prev, attachments: [...prev.attachments, ...attachments] }))
    } catch (err) {
      console.error('Could not attach file(s).', err)
    } finally {
      setUploading(false)
    }
  }

  function removeAttachment(id) {
    setDraft((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((file) => file.id !== id),
    }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!draft.title.trim()) return
    const finalDraft = {
      ...draft,
      endDate: isMultiDay ? draft.endDate : draft.startDate,
    }
    onSave(finalDraft)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="modal__header">
            <h2>{existingEvent ? 'Edit event' : 'New event'}</h2>
            <button type="button" className="modal__close" onClick={onClose} aria-label="Close">×</button>
          </div>

          <label className="field">
            <span>Title</span>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="What's happening?"
              autoFocus
              required
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span>{isMultiDay ? 'Starts' : 'Date'}</span>
              <input
                type="date"
                value={draft.startDate}
                onChange={(e) => {
                  update('startDate', e.target.value)
                  if (!isMultiDay) update('endDate', e.target.value)
                }}
                required
              />
            </label>
            {isMultiDay && (
              <label className="field">
                <span>Ends</span>
                <input
                  type="date"
                  value={draft.endDate}
                  min={draft.startDate}
                  onChange={(e) => update('endDate', e.target.value)}
                  required
                />
              </label>
            )}
          </div>

          <label className="field field--checkbox">
            <input
              type="checkbox"
              checked={isMultiDay}
              onChange={(e) => handleMultiDayToggle(e.target.checked)}
            />
            <span>This spans multiple days</span>
          </label>

          <div className="field-row">
            <label className="field">
              <span>Start time</span>
              <input type="time" value={draft.startTime} onChange={(e) => update('startTime', e.target.value)} />
            </label>
            <label className="field">
              <span>End time</span>
              <input type="time" value={draft.endTime} onChange={(e) => update('endTime', e.target.value)} />
            </label>
          </div>

          <label className="field">
            <span>Color tag</span>
            <div className="color-picker">
              <input
                type="color"
                value={draft.color}
                onChange={(e) => update('color', e.target.value)}
                className="color-picker__input"
                aria-label="Event color"
              />
              <span className="color-picker__value">{draft.color}</span>
            </div>
          </label>

          <label className="field">
            <span>Notes</span>
            <textarea
              value={draft.notes}
              onChange={(e) => update('notes', e.target.value)}
              placeholder="Any details worth remembering..."
              rows={3}
            />
          </label>

          <div className="field">
            <span>Checklist (e.g. a grocery list)</span>
            <div className="checklist-input-row">
              <input
                type="text"
                value={checklistInput}
                onChange={(e) => setChecklistInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addChecklistItem()
                  }
                }}
                placeholder="Add an item and press Enter"
              />
              <button type="button" onClick={addChecklistItem}>Add</button>
            </div>
            {draft.checklist.length > 0 && (
              <ul className="checklist-preview">
                {draft.checklist.map((item) => (
                  <li key={item.id}>
                    <label>
                      <input type="checkbox" checked={item.done} onChange={() => toggleChecklistItem(item.id)} />
                      <span className={item.done ? 'checklist-done' : ''}>{item.text}</span>
                    </label>
                    <button type="button" onClick={() => removeChecklistItem(item.id)} aria-label={`Remove ${item.text}`}>×</button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="field">
            <span>Attachments</span>
            <input type="file" multiple onChange={(e) => e.target.files.length && handleFiles(e.target.files)} />
            {uploading && <p className="hint">Attaching…</p>}
            {draft.attachments.length > 0 && (
              <div className="attachments-grid">
                {draft.attachments.map((file) => (
                  <AttachmentPreview key={file.id} file={file} size="small" onRemove={removeAttachment} />
                ))}
              </div>
            )}
            <p className="hint">Images and videos preview inline; other files download when clicked. Everything is stored in your browser's local storage — keep files small.</p>
          </div>

          <div className="modal__footer">
            <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--primary">Save event</button>
          </div>
        </form>
      </div>
    </div>
  )
}
