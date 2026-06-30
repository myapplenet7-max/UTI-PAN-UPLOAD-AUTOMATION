// api/applicants/index.ts
//
// GET  /api/applicants            — list all applicants (paginated, most recent first)
// POST /api/applicants            — create a new applicant record
//
// POST body (all fields optional except at minimum a name or ID number —
// validated loosely since OCR extraction is often partial):
// {
//   "full_name": "Potti Reddy Subbareddy",
//   "father_name": "P Rajakumar Reddy",
//   "date_of_birth": "1998-05-12",
//   "aadhaar_number": "123456789012",
//   "pan_number": "ABCDE1234F",
//   "mobile": "9876543210",
//   "address": "...",
//   ...
// }

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../../lib/db'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return handleList(req, res)
  }
  if (req.method === 'POST') {
    return handleCreate(req, res)
  }
  return res.status(405).json({ error: 'Method not allowed' })
}

async function handleList(req: VercelRequest, res: VercelResponse) {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200)
    const offset = Number(req.query.offset) || 0

    const rows = await sql`
      SELECT a.*, COUNT(d.id)::int AS document_count
      FROM applicants a
      LEFT JOIN documents d ON d.applicant_id = a.id
      GROUP BY a.id
      ORDER BY a.updated_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `
    return res.status(200).json({ applicants: rows })
  } catch (err: any) {
    console.error('List applicants error:', err)
    return res.status(500).json({ error: err.message || 'Failed to list applicants' })
  }
}

async function handleCreate(req: VercelRequest, res: VercelResponse) {
  try {
    const b = req.body || {}

    if (!b.full_name && !b.aadhaar_number && !b.pan_number) {
      return res.status(400).json({
        error: 'At least one of full_name, aadhaar_number, or pan_number is required',
      })
    }

    const aadhaar = b.aadhaar_number ? String(b.aadhaar_number).replace(/\s/g, '') : null
    const pan     = b.pan_number ? String(b.pan_number).toUpperCase().trim() : null

    const rows = await sql`
      INSERT INTO applicants (
        full_name, father_name, date_of_birth, gender,
        aadhaar_number, pan_number, mobile, email,
        address, pincode, city, state, notes
      ) VALUES (
        ${b.full_name || null},
        ${b.father_name || null},
        ${b.date_of_birth || null},
        ${b.gender || null},
        ${aadhaar},
        ${pan},
        ${b.mobile || null},
        ${b.email || null},
        ${b.address || null},
        ${b.pincode || null},
        ${b.city || null},
        ${b.state || null},
        ${b.notes || null}
      )
      RETURNING *
    `
    return res.status(201).json({ applicant: rows[0] })
  } catch (err: any) {
    console.error('Create applicant error:', err)
    return res.status(500).json({ error: err.message || 'Failed to create applicant' })
  }
}
