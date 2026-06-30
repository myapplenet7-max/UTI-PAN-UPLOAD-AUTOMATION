# Setup — UTI PAN Automation (merged build)

This build merges 4 deliveries into one app:
1. Base UTI PAN tools (photo/signature/document extract, PDF/image tools)
2. Applicant Records backend (Neon Postgres — customers + documents)
3. Templates (reusable {{PLACEHOLDER}} docs, auto-filled from applicant data)
4. DOCX/PDF export for filled templates
5. **New:** Combined Scan — one A4 scan → auto-crop Aadhaar/PAN/Voter/Photo/Signature → AI extract → save under one customer, with images stored on Vercel Blob

## 1. Database (Neon)

1. Vercel Project → Storage → Create → **Postgres (powered by Neon)** → connect to this project.
   This sets `DATABASE_URL` automatically.
2. Run the schema once:
   ```bash
   psql $DATABASE_URL -f db/schema.sql
   ```
   (or paste `db/schema.sql` into the Neon SQL editor)

## 2. File storage (Vercel Blob)

1. Vercel Project → Storage → Create → **Blob** → connect to this project.
   This sets `BLOB_READ_WRITE_TOKEN` automatically — no manual copy needed.
2. That's it — `/api/upload` uses it automatically. Cropped Aadhaar/PAN/Voter/Photo/Signature images, and any file you choose to upload, land in your Blob store under a folder named after the customer.

## 3. Install & deploy

```bash
npm install
vercel deploy
```

Local dev:
```bash
npm run dev          # frontend (Vite)
vercel dev           # if you want /api/* serverless functions running locally too
```

## What's where

- **Combined Scan** (`src/pages/CombinedScan.tsx`) — the multi-document single-page scan workflow you asked for: draw a box per document on one scan, it crops + AI-reads each ID card, resizes photo/signature to UTI spec, uploads every file to Blob, and saves everything under one Applicant.
- **Document Extractor / Auto Form Filler** — single-document AI extraction, now wired to save into the same Applicant Records system via `ApplicantMatchPicker`.
- **Applicants** (`src/pages/Applicants.tsx`) — browse/search all saved customers and their document history.
- **Templates** (`src/pages/Templates.tsx`) — build reusable documents with `{{PLACEHOLDER}}` fields, auto-fill from a saved Applicant, and download as **.docx**, **.pdf**, or **.txt**.
- **API** (`api/*.ts`) — Vercel serverless functions backed by Neon (`lib/db.ts`) and Vercel Blob (`api/upload.ts`).

## Environment variables (auto-set by the Vercel integrations above)

| Variable | Set by |
|---|---|
| `DATABASE_URL` | Neon Postgres integration |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob integration |

No manual `.env` editing needed if you use the Storage tab integrations.
