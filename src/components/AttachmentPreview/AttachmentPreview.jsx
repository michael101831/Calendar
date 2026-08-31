import './AttachmentPreview.css'

// Renders one attachment. Images and videos get an inline preview;
// anything else (PDFs, docs, etc.) falls back to a plain download link.
export default function AttachmentPreview({ file, size = 'small', onRemove }) {
  const isImage = file.type?.startsWith('image/')
  const isVideo = file.type?.startsWith('video/')

  return (
    <div className={`attachment attachment--${size}`}>
      {isImage && (
        <a href={file.data} target="_blank" rel="noreferrer" className="attachment__media-link">
          <img src={file.data} alt={file.name} className="attachment__media" />
        </a>
      )}

      {isVideo && (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video src={file.data} controls className="attachment__media" />
      )}

      {!isImage && !isVideo && (
        <a href={file.data} download={file.name} className="attachment__file">
          📎 {file.name}
        </a>
      )}

      {(isImage || isVideo) && <span className="attachment__name">{file.name}</span>}

      {onRemove && (
        <button
          type="button"
          className="attachment__remove"
          onClick={() => onRemove(file.id)}
          aria-label={`Remove ${file.name}`}
        >
          ×
        </button>
      )}
    </div>
  )
}
