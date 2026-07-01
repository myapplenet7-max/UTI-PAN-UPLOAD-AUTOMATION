export async function callClaude(apiKey: string, prompt: string, imageBase64?: string, imageMime?: string): Promise<string> {
  const content: any[] = []

  if (imageBase64 && imageMime) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: imageMime, data: imageBase64 }
    })
  }

  content.push({ type: 'text', text: prompt })

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content }]
    })
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `API error ${res.status}`)
  }

  const data = await res.json()
  return data.content.map((b: any) => b.text || '').join('')
}

// Gemini API — free tier on Flash models, no credit card required.
// Same signature as callClaude() so it's a drop-in swap in the calling code.
export async function callGemini(apiKey: string, prompt: string, imageBase64?: string, imageMime?: string): Promise<string> {
  const parts: any[] = []

  if (imageBase64 && imageMime) {
    parts.push({
      inline_data: { mime_type: imageMime, data: imageBase64 }
    })
  }

  parts.push({ text: prompt })

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `API error ${res.status}`)
  }

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || ''
  if (!text) throw new Error('Gemini returned an empty response')
  return text
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(2) + ' MB'
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = dataUrl; a.download = filename; a.click()
}

// Process image: resize + optional grayscale using canvas
export function processImage(
  file: File,
  opts: { width?: number; height?: number; grayscale?: boolean; quality?: number; whiteBg?: boolean }
): Promise<{ dataUrl: string; blob: Blob; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      let { width, height } = img

      if (opts.width && opts.height) {
        width = opts.width; height = opts.height
      } else if (opts.width) {
        height = Math.round((img.height / img.width) * opts.width)
        width = opts.width
      } else if (opts.height) {
        width = Math.round((img.width / img.height) * opts.height)
        height = opts.height
      }

      canvas.width = width; canvas.height = height
      const ctx = canvas.getContext('2d')!

      if (opts.whiteBg) {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, width, height)
      }

      ctx.drawImage(img, 0, 0, width, height)

      if (opts.grayscale) {
        const d = ctx.getImageData(0, 0, width, height)
        for (let i = 0; i < d.data.length; i += 4) {
          const g = d.data[i] * 0.299 + d.data[i+1] * 0.587 + d.data[i+2] * 0.114
          d.data[i] = d.data[i+1] = d.data[i+2] = g
        }
        ctx.putImageData(d, 0, 0)
      }

      const quality = opts.quality ?? 0.92
      const dataUrl = canvas.toDataURL('image/jpeg', quality)
      canvas.toBlob(blob => {
        if (!blob) return reject(new Error('Canvas toBlob failed'))
        resolve({ dataUrl, blob, width, height })
      }, 'image/jpeg', quality)
    }
    img.onerror = reject
    img.src = url
  })
}

export function processImagePng(
  file: File,
  opts: { width?: number; height?: number; grayscale?: boolean; threshold?: number }
): Promise<{ dataUrl: string; blob: Blob }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      let { width, height } = img
      if (opts.width && opts.height) { width = opts.width; height = opts.height }
      else if (opts.width) { height = Math.round((img.height / img.width) * opts.width); width = opts.width }
      canvas.width = width; canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)

      if (opts.threshold !== undefined) {
        const d = ctx.getImageData(0, 0, width, height)
        for (let i = 0; i < d.data.length; i += 4) {
          const g = d.data[i] * 0.299 + d.data[i+1] * 0.587 + d.data[i+2] * 0.114
          const v = g > opts.threshold ? 255 : 0
          d.data[i] = d.data[i+1] = d.data[i+2] = v
          d.data[i+3] = v === 255 ? 0 : 255 // transparent bg
        }
        ctx.putImageData(d, 0, 0)
      } else if (opts.grayscale) {
        const d = ctx.getImageData(0, 0, width, height)
        for (let i = 0; i < d.data.length; i += 4) {
          const g = d.data[i] * 0.299 + d.data[i+1] * 0.587 + d.data[i+2] * 0.114
          d.data[i] = d.data[i+1] = d.data[i+2] = g
        }
        ctx.putImageData(d, 0, 0)
      }

      const dataUrl = canvas.toDataURL('image/png')
      canvas.toBlob(blob => {
        if (!blob) return reject(new Error('Canvas toBlob failed'))
        resolve({ dataUrl, blob })
      }, 'image/png')
    }
    img.onerror = reject
    img.src = url
  })
}

export function compressToTargetKb(file: File, targetKb: number): Promise<{ dataUrl: string; blob: Blob }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      canvas.width = img.width; canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)

      let quality = 0.9
      const tryCompress = () => {
        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        const bytes = Math.round((dataUrl.length - 22) * 3 / 4)
        if (bytes <= targetKb * 1024 || quality <= 0.1) {
          canvas.toBlob(blob => {
            if (!blob) return reject(new Error('Failed'))
            resolve({ dataUrl, blob })
          }, 'image/jpeg', quality)
        } else {
          quality -= 0.1
          tryCompress()
        }
      }
      tryCompress()
    }
    img.onerror = reject
    img.src = url
  })
}

// Extract text from a PDF file using PDF.js (browser-side)
export async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');
    fullText += pageText + '\n\n';
  }

  return fullText.trim();
}