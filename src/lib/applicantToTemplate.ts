// src/lib/applicantToTemplate.ts
import type { Applicant } from './applicantTypes'

const PLACEHOLDER_TO_COLUMN: Record<string, keyof Applicant> = {
  NAME: 'full_name',
  FULLNAME: 'full_name',
  APPLICANTNAME: 'full_name', // <--- THIS FIXES THE NAME ERROR
  APPLICANT_NAME: 'full_name', // <--- THIS FIXES THE NAME ERROR
  
  // ... rest of your existing code
}
// src/lib/applicantToTemplate.ts
import type { Applicant } from './applicantTypes'

// Expanded alias list to match standard certificate and Gift Deed fields
const PLACEHOLDER_TO_COLUMN: Record<string, keyof Applicant> = {
  // Base Names
  NAME: 'full_name',
  FULLNAME: 'full_name',
  APPLICANTNAME: 'full_name',
  RECIPIENTNAME: 'full_name',        // Gift Deed
  EXECUTANTNAME: 'full_name',        // Gift Deed
  DONORNAME: 'full_name',            // Gift Deed
  
  // Father / Parent Names
  FATHERNAME: 'father_name',
  FATHERSNAME: 'father_name',
  PARENTNAME: 'father_name',
  RECIPIENTFATHERNAME: 'father_name', // Gift Deed
  EXECUTANTFATHERNAME: 'father_name', // Gift Deed
  
  // Birth Info
  DOB: 'date_of_birth',
  DATEOFBIRTH: 'date_of_birth',
  AGE: 'date_of_birth',              // Best-effort fallback
  RECIPIENTAGE: 'date_of_birth',     // Gift Deed fallback
  
  // Gender
  GENDER: 'gender',
  SEX: 'gender',
  
  // ID Numbers
  AADHAAR: 'aadhaar_number',
  AADHAARNUMBER: 'aadhaar_number',
  AADHARNUMBER: 'aadhaar_number',
  RECIPIENTAADHAAR: 'aadhaar_number', // Gift Deed
  EXECUTANTAADHAAR: 'aadhaar_number', // Gift Deed
  
  PAN: 'pan_number',
  PANNUMBER: 'pan_number',
  RECIPIENTPAN: 'pan_number',         // Gift Deed
  EXECUTANTPAN: 'pan_number',         // Gift Deed

  // Contact
  MOBILE: 'mobile',
  PHONE: 'mobile',
  PHONENUMBER: 'mobile',
  EMAIL: 'email',

  // Location
  ADDRESS: 'address',
  RECIPIENTADDRESS: 'address',        // Gift Deed
  EXECUTANTADDRESS: 'address',        // Gift Deed
  
  PINCODE: 'pincode',
  PIN: 'pincode',
  CITY: 'city',
  STATE: 'state',
  DISTRICT: 'state',
  VILLAGE: 'city',
  MANDAL: 'state',
}

function normalizeKey(placeholder: string): string {
  return placeholder.toUpperCase().replace(/[_\s]/g, '')
}

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