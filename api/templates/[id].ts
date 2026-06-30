// api/templates/[id].ts
//
// GET    /api/templates/:id
// PATCH  /api/templates/:id   — body: { name?, content?, samples? }
// DELETE /api/templates/:id

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../../lib/db.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = req.query.id as string
  if (!id) return res.status(400).json({ error: 'Missing template id' })

  if (req.method === 'GET')    return handleGet(id, res)
  if (req.method === 'PATCH')  return handlePatch(id, req, res)
  if (req.method === 'DELETE') return handleDelete(id, res)

  return res.status(405).json({ error: 'Method not allowed' })
}

async function handleGet(id: string, res: VercelResponse) {
  const rows = await sql`SELECT * FROM templates WHERE id = ${id}`
  if (rows.length === 0) return res.status(404).json({ error: 'Template not found' })
  return res.status(200).json({ template: rows[0] })
}

async function handlePatch(id: string, req: VercelRequest, res: VercelResponse) {
  try {
    const { name, content, samples } = req.body || {}

    const updates: Record<string, any> = {}
    if (name !== undefined) updates.name = name
    if (content !== undefined) updates.content = content
    if (samples !== undefined) updates.samples = JSON.stringify(samples)

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    const setClauses = Object.keys(updates).map((key, i) => `${key} = $${i + 2}`)
    const values = Object.values(updates)
    const rows = await sql.query(
      `UPDATE templates SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`,
      [id, ...values]
    )

    if (rows.length === 0) return res.status(404).json({ error: 'Template not found' })
    return res.status(200).json({ template: rows[0] })
  } catch (err: any) {
    console.error('Update template error:', err)
    return res.status(500).json({ error: err.message || 'Failed to update template' })
  }
}

async function handleDelete(id: string, res: VercelResponse) {
  const rows = await sql`DELETE FROM templates WHERE id = ${id} RETURNING id`
  if (rows.length === 0) return res.status(404).json({ error: 'Template not found' })
  return res.status(200).json({ deleted: true, id })
}
