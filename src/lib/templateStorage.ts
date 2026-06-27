// Stores reusable document templates (Income Certificate, Affidavit, etc.)
// Templates are plain text with {{PLACEHOLDER}} tokens. Same token repeated
// anywhere in the text is filled with one value, everywhere, automatically.

export interface FieldSample {
  key: string       // e.g. NAME
  sample: string    // e.g. "Vijay" — shown as grey example text
}

export interface Template {
  id: string
  name: string                // e.g. "Income Certificate"
  content: string             // raw text with {{PLACEHOLDER}} tokens
  samples: FieldSample[]       // sample/example values per placeholder
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = 'uti_pan_templates'

function readAll(): Template[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeAll(templates: Template[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
}

// Finds every unique {{PLACEHOLDER}} in the template text, in order of first appearance.
export function extractPlaceholders(content: string): string[] {
  const matches = content.match(/\{\{([A-Z0-9_]+)\}\}/g) || []
  const unique: string[] = []
  for (const m of matches) {
    const key = m.replace(/[{}]/g, '')
    if (!unique.includes(key)) unique.push(key)
  }
  return unique
}

export function getTemplates(): Template[] {
  return readAll().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

export function getTemplate(id: string): Template | undefined {
  return readAll().find(t => t.id === id)
}

export function saveTemplate(name: string, content: string, samples: FieldSample[]): Template {
  const templates = readAll()
  const now = new Date().toISOString()
  const template: Template = {
    id: 'tpl_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    name,
    content,
    samples,
    createdAt: now,
    updatedAt: now,
  }
  templates.push(template)
  writeAll(templates)
  return template
}

export function updateTemplate(id: string, updates: Partial<Pick<Template, 'name' | 'content' | 'samples'>>) {
  const templates = readAll()
  const idx = templates.findIndex(t => t.id === id)
  if (idx === -1) return
  templates[idx] = { ...templates[idx], ...updates, updatedAt: new Date().toISOString() }
  writeAll(templates)
}

export function deleteTemplate(id: string) {
  writeAll(readAll().filter(t => t.id !== id))
}

// Replaces every {{PLACEHOLDER}} occurrence in the content with the given values.
// Any placeholder with no value supplied is left as-is so it's obvious in preview.
export function fillTemplate(content: string, values: Record<string, string>): string {
  let result = content
  for (const [key, value] of Object.entries(values)) {
    const re = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    result = result.replace(re, value || `{{${key}}}`)
  }
  return result
}
