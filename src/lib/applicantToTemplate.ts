// src/lib/applicantToTemplate.ts
//
// Bridges the Applicant Records system to the Template engine.
// Templates use {{PLACEHOLDER}} tokens with free-form names (operator
// types whatever they want: {{NAME}}, {{APPLICANT_NAME}}, {{DOB}}, etc.)
// while applicants table has fixed columns (full_name, date_of_birth, ...).
//
// This does best-effort automatic matching so the operator doesn't have
// to manually re-type data that's already on file, while still letting
// them review/edit before the template is filled.

import type { Applicant } from './applicantTypes'

// Common placeholder name variants → applicant column.
// Matching is case-insensitive and ignores underscores/spaces, so
// {{FULL_NAME}}, {{full name}}, {{FullName}} all match 'full_name'.
const PLACEHOLDER_TO_COLUMN: Record<string, keyof Applicant> = {
  NAME: 'full_name',
  FULLNAME: 'full_name',
  APPLICANTNAME: 'full_name',
  FATHERNAME: 'father_name',
  FATHERSNAME: 'father_name',
  PARENTNAME: 'father_name',
  DOB: 'date_of_birth',
  DATEOFBIRTH: 'date_of_birth',
  GENDER: 'gender',
  SEX: 'gender',
  AADHAAR: 'aadhaar_number',
  AADHAARNUMBER: 'aadhaar_number',
  AADHARNUMBER: 'aadhaar_number',
  PAN: 'pan_number',
  PANNUMBER: 'pan_number',
  MOBILE: 'mobile',
  PHONE: 'mobile',
  PHONENUMBER: 'mobile',
  EMAIL: 'email',
  ADDRESS: 'address',
  PINCODE: 'pincode',
  PIN: 'pincode',
  CITY: 'city',
  STATE: 'state',
  DISTRICT: 'state',  // best-effort fallback; applicant table has no district column
}

function normalizeKey(placeholder: string): string {
  return placeholder.toUpperCase().replace(/[_\s]/g, '')
}

// For each placeholder found in a template, try to find a matching value
// on the applicant record. Returns both the matched values (pre-filled)
// and the list of placeholders that had no match (operator fills manually).
export function autoFillFromApplicant(
  placeholders: string[],
  applicant: Applicant
): { values: Record<string, string>; unmatched: string[] } {
  const values: Record<string, string> = {}
  const unmatched: string[] = []

  for (const placeholder of placeholders) {
    const normalized = normalizeKey(placeholder)
    const column = PLACEHOLDER_TO_COLUMN[normalized]

    if (column && applicant[column]) {
      let value = String(applicant[column])
      // Format DOB as DD-MM-YYYY for document use (applicant table stores
      // it as ISO YYYY-MM-DD for sorting/DB purposes)
      if (column === 'date_of_birth') {
        const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
        if (m) value = `${m[3]}-${m[2]}-${m[1]}`
      }
      values[placeholder] = value
    } else {
      unmatched.push(placeholder)
    }
  }

  return { values, unmatched }
}
