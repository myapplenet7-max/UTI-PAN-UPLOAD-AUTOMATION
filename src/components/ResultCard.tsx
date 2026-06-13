import { Download } from 'lucide-react'
import { downloadDataUrl } from '../lib/utils'

interface ResultItem {
  label: string
  dataUrl: string
  filename: string
  width: number
  height: number
  sizeKb?: number
  dpi?: number
  format?: string
}

export default function ResultCard({ item }: { item: ResultItem }) {
  const kb = item.sizeKb ?? Math.round(item.dataUrl.length * 0.75 / 1024)
  return (
    <div className="result-card">
      <img src={item.dataUrl} alt={item.label} />
      <div className="result-card-info">
        <div className="result-card-label">{item.label}</div>
        <div className="result-card-meta">
          <span>{item.width} × {item.height} px</span>
          {item.dpi && <span>{item.dpi} DPI</span>}
          <span>~{kb} KB • {item.format || 'JPG'}</span>
        </div>
        <button
          className="btn btn-primary btn-sm"
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => downloadDataUrl(item.dataUrl, item.filename)}
        >
          <Download size={13} /> Download
        </button>
      </div>
    </div>
  )
}
