// api/applicants/[id].ts
//
// GET    /api/applicants/:id   — full applicant record + linked documents
// PATCH  /api/applicants/:id   — update fields (used by the merge flow,
//                                and by manual edits in the review UI)
// DELETE /api/applicants/:id   — delete applicant (documents cascade-delete
//                                per the FK constraint in schema.sql)
//
// PATCH semantics: only provided fields are updated. This is intentional —
// it's what makes "merge new document's data into existing applicant" safe:
// you only PATCH the fields the new document actually found, leaving
// everything else (already verified by the operator) untouched.
// To explicitly blank a field, send an empty string "" — undefined/missing
// keys are left alone, "" overwrites with blank.

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../../lib/db.js'

const UPDATABLE_FIELDS = [
  'full_name', 'father_name', 'date_of_birth', 'gender',
  'aadhaar_number', 'pan_number', 'mobile', 'email',
  'address', 'pincode', 'city', 'state', 'notes',
] as const

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = req.query.id as string
  if (!id) return res.status(400).json({ error: 'Missing applicant id' })

  if (req.method === 'GET')    return handleGet(id, res)
  if (req.method === 'PATCH')  return handlePatch(id, req, res)
  if (req.method === 'DELETE') return handleDelete(id, res)

  return res.status(405).json({ error: 'Method not allowed' })
}

async function handleGet(id: string, res: VercelResponse) {
  try {
    const applicantRows = await sql`SELECT * FROM applicants WHERE id = ${id}`
    if (applicantRows.length === 0) {
      return res.status(404).json({ error: 'Applicant not found' })
    }

    const documents = await sql`
      SELECT * FROM documents
      WHERE applicant_id = ${id}
      ORDER BY created_at DESC
    `

    return res.status(200).json({
      applicant: applicantRows[0],
      documents,
    })
  } catch (err: any) {
    console.error('Get applicant error:', err)
    return res.status(500).json({ error: err.message || 'Failed to fetch applicant' })
  }
}

async function handlePatch(id: string, req: VercelRequest, res: VercelResponse) {
  try {
    const body = req.body || {}

    // Build dynamic SET clause from only the fields actually present in body
    const updates: Record<string, any> = {}
    for (const field of UPDATABLE_FIELDS) {
      if (field in body) {
        let value = body[field]
        if (field === 'aadhaar_number' && value) value = String(value).replace(/\s/g, '')
        if (field === 'pan_number' && value) value = String(value).toUpperCase().trim()
        updates[field] = value
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No updatable fields provided' })
    }

    // neon's sql tagged template doesn't support dynamic column lists
    // directly, so build the query with sql() using a parameterized
    // statement instead.
    const setClauses = Object.keys(updates).map((key, i) => `${key} = $${i + 2}`)
    const values = Object.values(updates)

    const queryText = `
      UPDATE applicants
      SET ${setClauses.join(', ')}
      WHERE id = $1
      RETURNING *
    `
    const rows = await sql(queryText, [id, ...values])

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Applicant not found' })
    }

    return res.status(200).json({ applicant: rows[0] })
  } catch (err: any) {
    console.error('Update applicant error:', err)
    return res.status(500).json({ error: err.message || 'Failed to update applicant' })
  }
}

async function handleDelete(id: string, res: VercelResponse) {
  try {
    const rows = await sql`
      DELETE FROM applicants WHERE id = ${id} RETURNING id
    `
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Applicant not found' })
    }
    return res.status(200).json({ deleted: true, id })
  } catch (err: any) {
    console.error('Delete applicant error:', err)
    return res.status(500).json({ error: err.message || 'Failed to delete applicant' })
  }
}
