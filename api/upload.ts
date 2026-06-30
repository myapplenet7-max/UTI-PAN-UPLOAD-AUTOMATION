// api/upload.ts
//
// POST /api/upload
// Body: { filename: string, dataUrl: string }   // dataUrl = "data:image/jpeg;base64,...."
//
// Uploads an already-processed image (cropped Aadhaar/PAN/Voter/Photo/Signature,
// generated docx, etc.) to Vercel Blob storage and returns its public URL.
// The returned URL is what gets saved into documents.file_url / filled_documents
// so an applicant's files can be re-downloaded later from any device.
//
// Setup:
//   1. Vercel Project → Storage → Create → Blob store, connect it to this project.
//      (This auto-sets the BLOB_READ_WRITE_TOKEN env var — no manual copy needed.)
//   2. npm install @vercel/blob

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { put } from '@vercel/blob'

// Folder the file gets stored under inside the blob store, derived from the
// customer's name so files for the same applicant land together and stay
// human-browsable from the Vercel Blob dashboard.
function safeFolder(name?: string): string {
  if (!name) return 'unassigned'
  return name.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 60) || 'unassigned'
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { filename, dataUrl, customerName } = req.body || {}

    if (!filename || !dataUrl || typeof dataUrl !== 'string') {
      return res.status(400).json({ error: 'filename and dataUrl are required' })
    }

    const match = dataUrl.match(/^data:(.+?);base64,(.*)$/)
    if (!match) {
      return res.status(400).json({ error: 'dataUrl must be a base64 data URL' })
    }
    const [, contentType, base64] = match
    const buffer = Buffer.from(base64, 'base64')

    if (buffer.length > 15 * 1024 * 1024) {
      return res.status(413).json({ error: 'File too large (max 15MB)' })
    }

    const folder = safeFolder(customerName)
    const key = `${folder}/${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`

    const blob = await put(key, buffer, {
      access: 'public',
      contentType: contentType || 'application/octet-stream',
      addRandomSuffix: true,
    })

    return res.status(201).json({ url: blob.url, pathname: blob.pathname })
  } catch (err: any) {
    console.error('Upload error:', err)
    return res.status(500).json({ error: err.message || 'Upload failed' })
  }
}
