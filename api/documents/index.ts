// api/documents/index.ts
//
// POST /api/documents
//
// Called right after AI extraction finishes on the frontend (DocumentExtractor.tsx
// or FormFiller.tsx). Saves the document record AND either:
//   (a) creates a new applicant from the extracted data, or
//   (b) merges the extracted data into an existing applicant (applicant_id provided)
//
// Body:
// {
//   "document_type": "aadhaar",
//   "file_name": "doc123.jpg",
//   "file_url": "https://...",            // optional — set if you upload to Vercel Blob
//   "extracted_data": { "name": "...", "date_of_birth": "...", ... },  // raw AI output
//   "ocr_text": "...",                     // optional
//   "confidence": { "name": 0.95, ... },   // optional
//
//   // ── ONE of the following two ──
//   "applicant_id": "uuid-of-existing-applicant",   // merge mode
//   // OR omit applicant_id entirely → creates a brand new applicant
//   "create_new": true                               // explicit flag, default true if no applicant_id
// }
//
// Response:
// {
//   "document": { ...documents row... },
//   "applicant": { ...applicants row, now updated/created... },
//   "merged_fields": ["full_name", "date_of_birth"]   // which fields actually got written
// }

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../../lib/db.js'
import { FIELD_ALIASES } from '../../lib/types.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const b = req.body || {}

    if (!b.document_type) {
      return res.status(400).json({ error: 'document_type is required' })
    }

    const extractedData: Record<string, any> = b.extracted_data || {}

    // ── Step 1: resolve applicant (merge into existing or create new) ─────
    let applicant
    let mergedFields: string[] = []

    if (b.applicant_id) {
      // Merge mode — only write fields that are present in extracted_data
      // AND currently empty on the applicant (don't clobber verified data
      // with a possibly-lower-quality re-scan, unless force_overwrite is set).
      const existingRows = await sql`SELECT * FROM applicants WHERE id = ${b.applicant_id}`
      if (existingRows.length === 0) {
        return res.status(404).json({ error: 'applicant_id not found' })
      }
      const existing = existingRows[0]

      const updates: Record<string, any> = {}
      for (const [rawKey, rawValue] of Object.entries(extractedData)) {
        if (rawValue === null || rawValue === undefined || rawValue === '') continue
        const column = FIELD_ALIASES[rawKey.toLowerCase()]
        if (!column) continue   // unmapped field — stays in extracted_data JSONB only

        const currentlyEmpty = !existing[column]
        if (currentlyEmpty || b.force_overwrite) {
          updates[column] = normalizeValue(column, rawValue)
          mergedFields.push(column)
        }
      }

      if (Object.keys(updates).length > 0) {
        const setClauses = Object.keys(updates).map((key, i) => `${key} = $${i + 2}`)
        const values = Object.values(updates)
        const rows = await sql.query(
          `UPDATE applicants SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`,
          [b.applicant_id, ...values]
        )
        applicant = rows[0]
      } else {
        applicant = existing
      }
    } else {
      // Create new applicant from extracted data
      const mapped: Record<string, any> = {}
      for (const [rawKey, rawValue] of Object.entries(extractedData)) {
        if (rawValue === null || rawValue === undefined || rawValue === '') continue
        const column = FIELD_ALIASES[rawKey.toLowerCase()]
        if (!column) continue
        mapped[column] = normalizeValue(column, rawValue)
        mergedFields.push(column)
      }

      const rows = await sql`
        INSERT INTO applicants (
          full_name, father_name, date_of_birth, gender,
          aadhaar_number, pan_number, mobile, email,
          address, pincode, city, state
        ) VALUES (
          ${mapped.full_name || null},
          ${mapped.father_name || null},
          ${mapped.date_of_birth || null},
          ${mapped.gender || null},
          ${mapped.aadhaar_number || null},
          ${mapped.pan_number || null},
          ${mapped.mobile || null},
          ${mapped.email || null},
          ${mapped.address || null},
          ${mapped.pincode || null},
          ${mapped.city || null},
          ${mapped.state || null}
        )
        RETURNING *
      `
      applicant = rows[0]
    }

    // ── Step 2: save the document record, linked to the applicant ────────
    const docRows = await sql`
      INSERT INTO documents (
        applicant_id, document_type, file_name, file_url,
        extracted_data, ocr_text, confidence, status
      ) VALUES (
        ${applicant.id},
        ${b.document_type},
        ${b.file_name || null},
        ${b.file_url || null},
        ${JSON.stringify(extractedData)},
        ${b.ocr_text || null},
        ${b.confidence ? JSON.stringify(b.confidence) : null},
        'extracted'
      )
      RETURNING *
    `

    return res.status(201).json({
      document: docRows[0],
      applicant,
      merged_fields: mergedFields,
    })
  } catch (err: any) {
    console.error('Create document error:', err)
    return res.status(500).json({ error: err.message || 'Failed to save document' })
  }
}

// Light normalization per field type before writing to the applicants table.
function normalizeValue(column: string, value: any): any {
  const str = String(value).trim()
  if (column === 'aadhaar_number') return str.replace(/\s/g, '')
  if (column === 'pan_number')     return str.toUpperCase()
  if (column === 'date_of_birth')  return normalizeDate(str)
  return str
}

// Accepts DD-MM-YYYY (what the AI prompts request) or YYYY-MM-DD,
// returns YYYY-MM-DD for Postgres DATE columns. Returns null if unparseable
// rather than throwing — a bad date shouldn't break the whole merge.
function normalizeDate(input: string): string | null {
  const ddmmyyyy = input.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
  if (ddmmyyyy) {
    const [, d, m, y] = ddmmyyyy
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  const yyyymmdd = input.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (yyyymmdd) return input
  return null
}
