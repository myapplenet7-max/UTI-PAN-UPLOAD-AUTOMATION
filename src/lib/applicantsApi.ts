// src/lib/applicantsApi.ts
//
// Frontend client for the applicants/documents backend.
// All AI extraction pages (DocumentExtractor, FormFiller, etc.) call
// saveExtractedDocument() right after getting AI results back, instead
// of just displaying them and throwing them away.

export interface ApplicantSearchResult {
  id: string
  full_name: string | null
  father_name: string | null
  date_of_birth: string | null
  aadhaar_number: string | null
  pan_number: string | null
  mobile: string | null
  document_count: number
  matched_on: 'name' | 'aadhaar' | 'pan' | 'mobile'
}

const BASE = '/api'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`)
  return data
}

// ── Search ───────────────────────────────────────────────────────────────

export async function searchApplicantsByName(name: string) {
  const { results } = await request<{ results: ApplicantSearchResult[] }>(
    `${BASE}/applicants/search?q=${encodeURIComponent(name)}`
  )
  return results
}

export async function searchApplicantByAadhaar(aadhaar: string) {
  const { results } = await request<{ results: ApplicantSearchResult[] }>(
    `${BASE}/applicants/search?aadhaar=${encodeURIComponent(aadhaar)}`
  )
  return results
}

export async function searchApplicantByPan(pan: string) {
  const { results } = await request<{ results: ApplicantSearchResult[] }>(
    `${BASE}/applicants/search?pan=${encodeURIComponent(pan)}`
  )
  return results
}

// Runs all three searches at once using whatever fields the AI extraction
// actually found — used right after extraction to suggest existing matches
// before the operator decides "new applicant" vs "merge into existing".
export async function findLikelyMatches(extracted: Record<string, any>) {
  const matches: ApplicantSearchResult[] = []
  const seen = new Set<string>()

  const tryAdd = (results: ApplicantSearchResult[]) => {
    for (const r of results) {
      if (!seen.has(r.id)) {
        seen.add(r.id)
        matches.push(r)
      }
    }
  }

  const aadhaar = extracted.aadhaar_number || extracted.aadhar_number
  const pan = extracted.pan_number
  const name = extracted.name || extracted.full_name || extracted.applicant_name

  if (aadhaar) tryAdd(await searchApplicantByAadhaar(aadhaar))
  if (pan) tryAdd(await searchApplicantByPan(pan))
  if (name && matches.length === 0) tryAdd(await searchApplicantsByName(name))

  return matches
}

// ── Applicants CRUD ──────────────────────────────────────────────────────

export async function getApplicant(id: string) {
  return request<{ applicant: any; documents: any[] }>(`${BASE}/applicants/${id}`)
}

export async function listApplicants(limit = 50, offset = 0) {
  const { applicants } = await request<{ applicants: any[] }>(
    `${BASE}/applicants?limit=${limit}&offset=${offset}`
  )
  return applicants
}

export async function updateApplicant(id: string, fields: Record<string, any>) {
  const { applicant } = await request<{ applicant: any }>(`${BASE}/applicants/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(fields),
  })
  return applicant
}

// ── Save extracted document (the main integration point) ────────────────
//
// Call this after AI extraction succeeds. Pass applicantId to merge into
// an existing person, or omit it to create a new applicant automatically.

export interface SaveDocumentParams {
  documentType: string
  fileName?: string
  fileUrl?: string
  extractedData: Record<string, any>
  ocrText?: string
  confidence?: Record<string, number>
  applicantId?: string       // omit to create new
  forceOverwrite?: boolean   // true = new data overwrites existing verified fields
}

export async function saveExtractedDocument(params: SaveDocumentParams) {
  return request<{ document: any; applicant: any; merged_fields: string[] }>(
    `${BASE}/documents`,
    {
      method: 'POST',
      body: JSON.stringify({
        document_type: params.documentType,
        file_name: params.fileName,
        file_url: params.fileUrl,
        extracted_data: params.extractedData,
        ocr_text: params.ocrText,
        confidence: params.confidence,
        applicant_id: params.applicantId,
        force_overwrite: params.forceOverwrite,
      }),
    }
  )
}
