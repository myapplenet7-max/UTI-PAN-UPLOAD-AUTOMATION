# UTI PAN Automation

**Upload Once • Extract Everything • Generate UTI PAN Forms Automatically**

AI-powered UTI PAN processing platform for agents and consultants.

## Features

- 🖼️ **UTI Photo Extraction** — 413×531px, 200 DPI, white background
- ✍️ **Signature Extraction** — 281×106px UTI format, transparent PNG
- 🪪 **Photo + Signature Creator** — Combine with overlay controls
- 📋 **Document Extractor** — Aadhaar, PAN, Voter ID, Passport (AI-powered)
- 📝 **Auto Form Filler** — AI reads filled UTI PAN forms
- 🗂️ **Correction Packet** — Auto 5-page PDF compilation
- 📦 **New PAN Packet** — Auto 5-page new application PDF
- 📄 **PDF Tools** — Merge, split, compress, convert
- 🔧 **Image Tools** — Resize, compress, DPI changer, A4 photo sheet

## Deploy to Vercel

### Step 1: Push to GitHub
1. Create a new repo at github.com
2. Upload all files from this folder

### Step 2: Deploy on Vercel
1. Go to vercel.com → New Project
2. Import your GitHub repo
3. Framework: Vite (auto-detected)
4. Click Deploy

### Step 3: Use the App
1. Open your Vercel URL
2. Enter your Claude API key (from console.anthropic.com) in the top bar
3. Start processing UTI PAN applications!

## Local Development

```bash
npm install
npm run dev
```

## Tech Stack
- React + TypeScript
- Vite
- Claude AI API (claude-opus-4-6)
- Canvas API for image processing
- No backend required — runs entirely in browser
