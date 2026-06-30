// lib/types.ts
// Shared types — import from both api/*.ts (backend) and src/*.tsx (frontend).

export interface Applicant {
  id: string
  full_name: string | null
  father_name: string | null
  date_of_birth: string | null   // ISO date string 'YYYY-MM-DD'
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

export interface DocumentRecord {
  id: string
  applicant_id: string | null
  document_type: string
  file_name: string | null
  file_url: string | null
  extracted_data: Record<string, any>
  ocr_text: string | null
  confidence: Record<string, number> | null
  status: 'extracted' | 'reviewed' | 'rejected'
  created_at: string
}

export interface ApplicantSearchResult extends Applicant {
  document_count: number
  matched_on: 'name' | 'aadhaar' | 'pan' | 'mobile'
}

// Maps the loose AI-extracted field names (which vary per document type,
// e.g. "applicant_name" vs "name" vs "full_name") onto the fixed
// applicants table columns. Used by the merge endpoint.
export const FIELD_ALIASES: Record<string, keyof Applicant> = {
  name: 'full_name',
  applicant_name: 'full_name',
  full_name: 'full_name',
  father_name: 'father_name',
  relative_name: 'father_name',
  date_of_birth: 'date_of_birth',
  dob: 'date_of_birth',
  gender: 'gender',
  aadhaar_number: 'aadhaar_number',
  aadhar_number: 'aadhaar_number',
  pan_number: 'pan_number',
  mobile: 'mobile',
  phone: 'mobile',
  email: 'email',
  address: 'address',
  pincode: 'pincode',
  city: 'city',
  state: 'state',
}
