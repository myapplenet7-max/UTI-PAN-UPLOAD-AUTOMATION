// api/applicants/search.ts
//
// GET /api/applicants/search?q=Vijay
// GET /api/applicants/search?aadhaar=123456789012
// GET /api/applicants/search?pan=ABCDE1234F
//
// Used by the "merge into existing applicant" flow: operator types a name
// or scans a new document, we search for likely matches before deciding
// whether to create a new applicant record or merge into an existing one.
//
// Name search is fuzzy (ILIKE + pg_trgm similarity) since OCR/AI extraction
// can introduce small spelling variations across different document scans
// of the same person. Aadhaar/PAN search is exact, since those are unique
// government-issued identifiers — a match there is authoritative.

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../../lib/db.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { q, aadhaar, pan, mobile } = req.query

  try {
    // ── Exact match: Aadhaar (highest confidence — government ID) ─────────
    if (aadhaar && typeof aadhaar === 'string') {
      const cleaned = aadhaar.replace(/\s/g, '')
      const rows = await sql`
        SELECT a.*, COUNT(d.id)::int AS document_count
        FROM applicants a
        LEFT JOIN documents d ON d.applicant_id = a.id
        WHERE a.aadhaar_number = ${cleaned}
        GROUP BY a.id
        LIMIT 5
      `
      return res.status(200).json({
        results: rows.map(r => ({ ...r, matched_on: 'aadhaar' })),
      })
    }

    // ── Exact match: PAN ────────────────────────────────────────────────
    if (pan && typeof pan === 'string') {
      const cleaned = pan.toUpperCase().trim()
      const rows = await sql`
        SELECT a.*, COUNT(d.id)::int AS document_count
        FROM applicants a
        LEFT JOIN documents d ON d.applicant_id = a.id
        WHERE a.pan_number = ${cleaned}
        GROUP BY a.id
        LIMIT 5
      `
      return res.status(200).json({
        results: rows.map(r => ({ ...r, matched_on: 'pan' })),
      })
    }

    // ── Exact-ish match: Mobile ─────────────────────────────────────────
    if (mobile && typeof mobile === 'string') {
      const cleaned = mobile.replace(/\s/g, '')
      const rows = await sql`
        SELECT a.*, COUNT(d.id)::int AS document_count
        FROM applicants a
        LEFT JOIN documents d ON d.applicant_id = a.id
        WHERE a.mobile = ${cleaned}
        GROUP BY a.id
        LIMIT 5
      `
      return res.status(200).json({
        results: rows.map(r => ({ ...r, matched_on: 'mobile' })),
      })
    }

    // ── Fuzzy match: Name ───────────────────────────────────────────────
    if (q && typeof q === 'string' && q.trim().length >= 2) {
      const query = q.trim()
      const rows = await sql`
        SELECT a.*, COUNT(d.id)::int AS document_count,
               similarity(a.full_name, ${query}) AS sim_score
        FROM applicants a
        LEFT JOIN documents d ON d.applicant_id = a.id
        WHERE a.full_name ILIKE ${'%' + query + '%'}
           OR similarity(a.full_name, ${query}) > 0.3
        GROUP BY a.id
        ORDER BY sim_score DESC NULLS LAST
        LIMIT 10
      `
      return res.status(200).json({
        results: rows.map(r => ({ ...r, matched_on: 'name' })),
      })
    }

    return res.status(400).json({
      error: 'Provide at least one of: q (name), aadhaar, pan, mobile',
    })
  } catch (err: any) {
    console.error('Applicant search error:', err)
    return res.status(500).json({ error: err.message || 'Search failed' })
  }
}
