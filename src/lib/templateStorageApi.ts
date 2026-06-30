// src/lib/templateStorageApi.ts
//
// Server-backed replacement for src/lib/templateStorage.ts (which uses
// localStorage). Same function names and shapes so callers don't need to
// change — only the import line changes from:
//   import { getTemplates, saveTemplate, ... } from '../lib/templateStorage'
// to:
//   import { getTemplates, saveTemplate, ... } from '../lib/templateStorageApi'
//
// extractPlaceholders() and fillTemplate() are pure string functions with
// no I/O, so they're re-exported unchanged from the original file rather
// than duplicated here.

export { extractPlaceholders, fillTemplate } from './templateStorage'
export type { Template, FieldSample } from './templateStorage'

import type { Template, FieldSample } from './templateStorage'

const BASE = '/api/templates'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`)
  return data
}

export async function getTemplates(): Promise<Template[]> {
  const { templates } = await request<{ templates: Template[] }>(BASE)
  return templates
}

export async function getTemplate(id: string): Promise<Template | undefined> {
  try {
    const { template } = await request<{ template: Template }>(`${BASE}/${id}`)
    return template
  } catch {
    return undefined
  }
}

export async function saveTemplate(
  name: string,
  content: string,
  samples: FieldSample[]
): Promise<Template> {
  const { template } = await request<{ template: Template }>(BASE, {
    method: 'POST',
    body: JSON.stringify({ name, content, samples }),
  })
  return template
}

export async function updateTemplate(
  id: string,
  updates: Partial<Pick<Template, 'name' | 'content' | 'samples'>>
): Promise<void> {
  await request(`${BASE}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
}

export async function deleteTemplate(id: string): Promise<void> {
  await request(`${BASE}/${id}`, { method: 'DELETE' })
}
