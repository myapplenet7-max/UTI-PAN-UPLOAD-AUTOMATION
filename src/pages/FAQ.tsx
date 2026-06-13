const FAQS = [
  { q: 'What is UTI PAN Automation?', a: 'UTI PAN Automation is a professional tool for UTI PAN agents and consultants to process UTI PAN applications faster. It automatically extracts photos, signatures, and documents from scanned forms.' },
  { q: 'Do I need a Claude API key?', a: 'Some features like Auto Form Filler and AI Document Extraction require a Claude API key. Basic tools like photo extraction, signature processing, and image tools work without an API key.' },
  { q: 'What photo size is required for UTI PAN?', a: 'UTI PAN requires photos of 413 × 531 pixels at 200 DPI minimum. The background should be white and the photo must show a clear front-facing view of the face.' },
  { q: 'What is the UTI signature size?', a: 'UTI PAN requires signatures of 281 × 106 pixels at 200 DPI. The signature should be on a white background in black or blue ink.' },
  { q: 'How many pages does the correction packet have?', a: 'The UTI PAN correction packet has 5 pages: Page 1 & 2 are UTI PAN application, Page 3 is Aadhaar Card, Page 4 is PAN Card, Page 5 is Voter ID/SSC/Birth Certificate.' },
  { q: 'How many pages does the new PAN packet have?', a: 'The new UTI PAN packet has 5 pages: Page 1 & 2 are UTI PAN application, Page 3 is Aadhaar Card, Page 4 is Voter ID, Page 5 is Passport or Birth Certificate.' },
  { q: 'Is my data safe?', a: 'All processing happens in your browser. Images are not uploaded to any server (except when using AI features which send to Claude API). Your data stays private.' },
  { q: 'What image formats are supported?', a: 'JPG, PNG, and WEBP formats are supported for input. Outputs are generated as JPG or PNG depending on the tool.' },
  { q: 'Can I use this on mobile?', a: 'Yes! UTI PAN Automation is fully responsive and works on Android and iPhone browsers.' },
  { q: 'How do I get a Claude API key?', a: 'Go to console.anthropic.com, create an account, and generate an API key. The key starts with "sk-ant-api03-".' },
]

export default function FAQ() {
  return (
    <div className="page">
      <div className="page-header">
        <h2>❓ Frequently Asked Questions</h2>
        <p>Common questions about UTI PAN Automation and how to use it.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {FAQS.map((faq, i) => (
          <div key={i} className="card" style={{ marginBottom: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: 'var(--text)' }}>
              Q: {faq.q}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
              {faq.a}
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 20, background: 'rgba(59,110,245,0.08)', borderColor: 'rgba(59,110,245,0.2)' }}>
        <div className="card-title">📞 Need More Help?</div>
        <p style={{ fontSize: 13, color: 'var(--text2)' }}>
          For UTI PAN related queries, contact UTI Infrastructure Technology And Services Limited (UTIITSL) directly through their official website.
        </p>
      </div>
    </div>
  )
}
