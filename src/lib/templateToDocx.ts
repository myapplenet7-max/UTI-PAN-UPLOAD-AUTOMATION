// src/lib/templateToDocx.ts
//
// Converts filled template text into a real Word document (.docx) using
// the `docx` package already installed in this project.
//
// Design choice: rather than trying to preserve arbitrary rich formatting
// from the plain-text template, this produces a clean, properly formatted
// A4 document suitable for government submission — readable paragraph
// spacing, a title line, justified body text, and a signature block at
// the bottom. This matches what MeeSeva/PAN-center operators actually need
// to print and submit, rather than a literal dump of the textarea content.
//
// Template authors can still control structure using simple conventions:
//   - A blank line between sentences = new paragraph
//   - A line that's ALL CAPS and short (<60 chars) = treated as a heading
//   - Everything else = regular justified body paragraph

import {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  HeadingLevel, PageOrientation, convertInchesToTwip,
} from 'docx'

export interface DocxOptions {
  title?: string          // document title shown at top, e.g. "Residence Certificate"
  applicantName?: string  // used in the filename and optionally a header line
  includeSignatureBlock?: boolean   // adds a "Signature" line at the bottom (default true)
  includeDateLine?: boolean         // adds "Date: ___" line (default true)
}

function isHeadingLine(line: string): boolean {
  const trimmed = line.trim()
  if (trimmed.length === 0 || trimmed.length > 60) return false
  // ALL CAPS (allowing spaces/punctuation) and at least 4 letters
  const letters = trimmed.replace(/[^A-Za-z]/g, '')
  if (letters.length < 4) return false
  return trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)
}

// Splits filled template content into paragraphs. Blank lines separate
// paragraphs; single newlines within a block are treated as the same
// paragraph (so wrapped lines in the textarea don't create awkward breaks).
function splitIntoBlocks(content: string): string[] {
  return content
    .split(/\n\s*\n/)         // blank-line-separated blocks
    .map(block => block.replace(/\n/g, ' ').trim())
    .filter(block => block.length > 0)
}

export function buildDocxDocument(
  filledContent: string,
  options: DocxOptions = {}
): Document {
  const {
    title,
    includeSignatureBlock = true,
    includeDateLine = true,
  } = options

  const blocks = splitIntoBlocks(filledContent)
  const children: Paragraph[] = []

  // ── Title ──────────────────────────────────────────────────────────────
  if (title) {
    children.push(
      new Paragraph({
        text: title.toUpperCase(),
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 360 },   // ~0.25in after title
      })
    )
  }

  // ── Body blocks ────────────────────────────────────────────────────────
  for (const block of blocks) {
    if (isHeadingLine(block)) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: block, bold: true, size: 24 })], // 12pt
          spacing: { before: 240, after: 160 },
        })
      )
    } else {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: block, size: 24 })],
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 240, line: 360 },   // 1.5 line spacing
        })
      )
    }
  }

  // ── Date line ──────────────────────────────────────────────────────────
  if (includeDateLine) {
    const today = new Date().toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric',
    })
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `Date: ${today}`, size: 22 })],
        spacing: { before: 480, after: 0 },
      })
    )
  }

  // ── Signature block ───────────────────────────────────────────────────
  if (includeSignatureBlock) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: '', size: 22 })],
        spacing: { before: 720 },   // gap for physical signature
      })
    )
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Signature', size: 22 })],
        alignment: AlignmentType.RIGHT,
      })
    )
  }

  return new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.PORTRAIT,
              // A4 in twips (1/20 pt): 210mm x 297mm = 11906 x 16838.
              // docx-js does not infer this from orientation alone —
              // width/height must be set explicitly for consistent
              // rendering across Word/LibreOffice/Google Docs.
              width: 11906,
              height: 16838,
            },
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
            },
          },
        },
        children,
      },
    ],
  })
}

// Builds the .docx and returns it as a Blob, ready for downloadBlob() /
// upload to storage. Runs entirely client-side — no server roundtrip.
export async function generateDocxBlob(
  filledContent: string,
  options: DocxOptions = {}
): Promise<Blob> {
  const doc = buildDocxDocument(filledContent, options)
  return Packer.toBlob(doc)
}

// Convenience: builds a sensible filename from the template/applicant info.
export function buildDocxFilename(templateName: string, applicantName?: string): string {
  const safe = (s: string) => s.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  const parts = [safe(templateName)]
  if (applicantName) parts.push(safe(applicantName))
  return parts.join('_') + '.docx'
}
