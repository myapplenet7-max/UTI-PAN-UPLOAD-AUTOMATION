// src/lib/applicantTypes.ts
//
// Frontend-side copy of the Applicant shape (mirrors lib/types.ts used by
// the API routes). Kept separate so src/ never imports from the top-level
// api/lib folder directly — Vite's frontend build and Vercel's serverless
// function build are compiled independently, and crossing that boundary
// with relative imports causes bundling issues.

export interface Applicant {
  id: string
  full_name: string | null
  father_name: string | null
  date_of_birth: string | null
  gender: string | null
  aadhaar_number: string | null
  pan_number: string | null
  mobile: string | null
  email: string | null
  address: string | null
  pincode: string | null
  city: string | null
  state: string | null
  notes: string | null
  created_at: string
  updated_at: string
}
