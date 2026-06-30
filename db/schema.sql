-- schema.sql
-- Run this once against your Neon Postgres database (via Neon SQL editor,
-- or `psql $DATABASE_URL -f db/schema.sql`).
--
-- Plain Postgres only — no Neon-specific extensions — so this dumps/restores
-- cleanly to any other Postgres host if you ever migrate.

-- ── Applicants ────────────────────────────────────────────────────────────
-- One row per real person. Built up incrementally as documents are uploaded
-- and merged in (Aadhaar today, SSC memo next week, etc.)

CREATE TABLE IF NOT EXISTS applicants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name       TEXT,
  father_name     TEXT,
  date_of_birth   DATE,
  gender          TEXT,
  aadhaar_number  TEXT,              -- 12 digits, stored without spaces
  pan_number      TEXT,              -- 10 char alphanumeric
  mobile          TEXT,
  email           TEXT,
  address         TEXT,
  pincode         TEXT,
  city            TEXT,
  state           TEXT,
  notes           TEXT,              -- free-text operator notes
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Search indexes — name search is fuzzy (ILIKE), Aadhaar/PAN are exact match
CREATE INDEX IF NOT EXISTS idx_applicants_name      ON applicants USING gin (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_applicants_aadhaar    ON applicants (aadhaar_number);
CREATE INDEX IF NOT EXISTS idx_applicants_pan        ON applicants (pan_number);
CREATE INDEX IF NOT EXISTS idx_applicants_mobile     ON applicants (mobile);

-- Required for fuzzy ILIKE name search via gin_trgm_ops above.
-- Free on Neon — just a standard Postgres contrib extension.
CREATE EXTENSION IF NOT EXISTS pg_trgm;


-- ── Documents ─────────────────────────────────────────────────────────────
-- One row per uploaded document (Aadhaar scan, SSC memo, PAN card, etc.)
-- Linked to an applicant. The raw AI-extracted JSON is kept in full as
-- provenance, even though individual fields also get merged up into
-- the applicants table.

CREATE TABLE IF NOT EXISTS documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id    UUID REFERENCES applicants(id) ON DELETE CASCADE,
  document_type   TEXT NOT NULL,      -- 'aadhaar' | 'pan' | 'voter' | 'passport' | 'ssc' | 'birth' | 'land' | 'affidavit' | 'resume' | 'other'
  file_name       TEXT,
  file_url        TEXT,               -- where the original/cleaned image is stored (e.g. Vercel Blob URL)
  extracted_data  JSONB NOT NULL DEFAULT '{}',  -- raw AI extraction, all fields, as returned
  ocr_text        TEXT,               -- raw OCR text if available
  confidence      JSONB,              -- per-field confidence scores, if available
  status          TEXT NOT NULL DEFAULT 'extracted',  -- 'extracted' | 'reviewed' | 'rejected'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_applicant ON documents (applicant_id);
CREATE INDEX IF NOT EXISTS idx_documents_type      ON documents (document_type);


-- ── Templates ─────────────────────────────────────────────────────────────
-- Mirrors the existing localStorage templateStorage.ts shape, now shared
-- across devices/operators instead of being per-browser.

CREATE TABLE IF NOT EXISTS templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  content         TEXT NOT NULL,       -- raw text with {{PLACEHOLDER}} tokens
  samples         JSONB NOT NULL DEFAULT '[]',  -- [{key, sample}, ...]
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ── Filled documents (template + applicant → generated output) ──────────
-- Optional history of "this applicant's data was used to fill this template"
-- so an operator can re-download or re-generate later without re-typing.

CREATE TABLE IF NOT EXISTS filled_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id    UUID REFERENCES applicants(id) ON DELETE SET NULL,
  template_id     UUID REFERENCES templates(id) ON DELETE SET NULL,
  filled_content  TEXT NOT NULL,
  field_values    JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_filled_applicant ON filled_documents (applicant_id);


-- ── updated_at auto-touch trigger ────────────────────────────────────────

CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_applicants_updated ON applicants;
CREATE TRIGGER trg_applicants_updated
  BEFORE UPDATE ON applicants
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS trg_templates_updated ON templates;
CREATE TRIGGER trg_templates_updated
  BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
