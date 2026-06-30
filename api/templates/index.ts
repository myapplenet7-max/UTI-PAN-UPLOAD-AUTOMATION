// api/templates/index.ts
//
// GET  /api/templates          — list all templates
// POST /api/templates          — create new template
//
// Mirrors src/lib/templateStorage.ts exactly (same shape: name, content,
// samples) so the frontend swap from localStorage to API is a drop-in
// replacement — see src/lib/templateStorageApi.ts for the matching client.

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../../lib/db.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET')  return handleList(res)
  if (req.method === 'POST') return handleCreate(req, res)
  return res.status(405).json({ error: 'Method not allowed' })
}

async function handleList(res: VercelResponse) {
  try {
    const rows = await sql`
      SELECT * FROM templates ORDER BY updated_at DESC
    `
    return res.status(200).json({ templates: rows })
  } catch (err: any) {
    console.error('List templates error:', err)
    return res.status(500).json({ error: err.message || 'Failed to list templates' })
  }
}

async function handleCreate(req: VercelRequest, res: VercelResponse) {
  try {
    const { name, content, samples } = req.body || {}
    if (!name || !content) {
      return res.status(400).json({ error: 'name and content are required' })
    }
    const rows = await sql`
      INSERT INTO templates (name, content, samples)
      VALUES (${name}, ${content}, ${JSON.stringify(samples || [])})
      RETURNING *
    `
    return res.status(201).json({ template: rows[0] })
  } catch (err: any) {
    console.error('Create template error:', err)
    return res.status(500).json({ error: err.message || 'Failed to create template' })
  }
}
