import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { formatBytes } from '../lib/utils'

interface Props {
  file: File | null
  onFile: (f: File) => void
  accept?: string
  label?: string
}

export default function UploadZone({ file, onFile, accept = 'image/*', label }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)

  const handle = (f: File) => {
    if (f) onFile(f)
  }

  return (
    <div>
      <div
        className={`upload-zone ${drag ? 'drag' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) handle(f) }}
      >
        <input ref={inputRef} type="file" accept={accept} onChange={e => { const f = e.target.files?.[0]; if (f) handle(f) }} />
        {file ? (
          <>
            {file.type.startsWith('image/') && (
              <img src={URL.createObjectURL(file)} style={{ maxHeight: 180, maxWidth: '100%', borderRadius: 8, marginBottom: 12 }} />
            )}
            <div style={{ fontWeight: 600, fontSize: 13 }}>{file.name}</div>
            <div style={{ color: 'var(--text2)', fontSize: 12 }}>{formatBytes(file.size)} — tap to change</div>
          </>
        ) : (
          <>
            <div className="icon"><Upload size={32} strokeWidth={1.5} /></div>
            <h3>{label || 'Upload Image'}</h3>
            <p>Tap to browse or drag & drop here</p>
            <p style={{ marginTop: 4, fontSize: 12, color: 'var(--text3)' }}>{accept === 'image/*' ? 'JPG, PNG, WEBP supported' : accept}</p>
          </>
        )}
      </div>
    </div>
  )
}
