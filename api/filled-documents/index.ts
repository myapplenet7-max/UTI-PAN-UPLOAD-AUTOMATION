// api/filled-documents/index.ts
//
// POST /api/filled-documents   — save a generated/filled document
// GET  /api/filled-documents?applicant_id=...   — list filled docs for an applicant
//
// Called after the operator fills a template with an applicant's data and
// confirms the preview. Keeps a record so they can re-download later
// without re-typing, and so the Applicant detail page can show
// "Documents Generated" alongside "Documents Uploaded".

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../../lib/db'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') return handleCreate(req, res)
  if (req.method === 'GET')  return handleList(req, res)
  return res.status(405).json({ error: 'Method not allowed' })
}

async function handleCreate(req: VercelRequest, res: VercelResponse) {
  try {
    const { applicant_id, template_id, filled_content, field_values } = req.body || {}

    if (!filled_content) {
      return res.status(400).json({ error: 'filled_content is required' })
    }

    const rows = await sql`
      INSERT INTO filled_documents (applicant_id, template_id, filled_content, field_values)
      VALUES (
        ${applicant_id || null},
        ${template_id || null},
        ${filled_content},
        ${JSON.stringify(field_values || {})}
      )
      RETURNING *
    `
    return res.status(201).json({ filled_document: rows[0] })
  } catch (err: any) {
    console.error('Save filled document error:', err)
    return res.status(500).json({ error: err.message || 'Failed to save filled document' })
  }
}

async function handleList(req: VercelRequest, res: VercelResponse) {
  try {
    const applicantId = req.query.applicant_id as string | undefined

    const rows = applicantId
      ? await sql`
          SELECT fd.*, t.name AS template_name
          FROM filled_documents fd
          LEFT JOIN templates t ON t.id = fd.template_id
          WHERE fd.applicant_id = ${applicantId}
          ORDER BY fd.created_at DESC
        `
      : await sql`
          SELECT fd.*, t.name AS template_name
          FROM filled_documents fd
          LEFT JOIN templates t ON t.id = fd.template_id
          ORDER BY fd.created_at DESC
          LIMIT 100
        `
    return res.status(200).json({ filled_documents: rows })
  } catch (err: any) {
    console.error('List filled documents error:', err)
    return res.status(500).json({ error: err.message || 'Failed to list filled documents' })
  }
}
