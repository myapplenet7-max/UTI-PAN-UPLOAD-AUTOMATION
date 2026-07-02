import { useMemo } from 'react'

const PLACEHOLDER_RE = /\{\{([A-Z0-9_]+)\}\}/g

type Part = { type: 'text'; value: string } | { type: 'field'; value: string; key: string }

interface Props {
  content: string
  values?: Record<string, string>
  activeField?: string | null
  onFieldClick?: (field: string) => void
}

/**
 * Renders reconstructed document text with {{PLACEHOLDER}} tokens highlighted
 * so the operator can see exactly which words were templatized.
 * - Untouched placeholders: amber highlight, raw token shown.
 * - Filled placeholders: blue highlight, actual value shown.
 * - The field currently being edited (activeField): blinking accent highlight.
 */
export default function TemplateHighlightPreview({ content, values, activeField, onFieldClick }: Props) {
  const parts = useMemo<Part[]>(() => {
    const out: Part[] = []
    let lastIndex = 0
    const re = new RegExp(PLACEHOLDER_RE)
    let m: RegExpExecArray | null
    while ((m = re.exec(content))) {
      if (m.index > lastIndex) out.push({ type: 'text', value: content.slice(lastIndex, m.index) })
      out.push({ type: 'field', value: m[0], key: m[1] })
      lastIndex = m.index + m[0].length
    }
    if (lastIndex < content.length) out.push({ type: 'text', value: content.slice(lastIndex) })
    return out
  }, [content])

  return (
    <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 13, lineHeight: 1.9, background: 'var(--bg3)', padding: 16, borderRadius: 8, border: '1px solid var(--border)', margin: 0 }}>
      <style>{`@keyframes tpl-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }`}</style>
      {parts.map((p, i) => {
        if (p.type === 'text') return <span key={i}>{p.value}</span>
        const filled = values?.[p.key]
        const isActive = activeField === p.key
        return (
          <span
            key={i}
            onClick={() => onFieldClick?.(p.key)}
            title={p.key.replace(/_/g, ' ')}
            style={{
              background: isActive ? 'var(--accent)' : filled ? 'rgba(56,189,248,0.20)' : 'rgba(217,119,6,0.20)',
              color: isActive ? '#fff' : filled ? 'var(--text)' : 'var(--amber, #d97706)',
              padding: '1px 5px',
              borderRadius: 4,
              fontWeight: 600,
              cursor: onFieldClick ? 'pointer' : 'default',
              border: isActive ? '1px solid var(--accent)' : '1px solid transparent',
              animation: isActive ? 'tpl-blink 0.9s ease-in-out infinite' : undefined,
            }}
          >
            {filled ? filled : p.value}
          </span>
        )
      })}
    </pre>
  )
}