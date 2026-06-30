// src/lib/uploadApi.ts
//
// Frontend client for /api/upload — pushes a processed image (cropped
// Aadhaar/PAN/Voter card, UTI photo, signature, generated docx, etc.) to
// Vercel Blob storage and returns the public URL to save as
// documents.file_url / filled_documents.file_url.

export async function uploadDataUrl(
  dataUrl: string,
  filename: string,
  customerName?: string
): Promise<string> {
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, dataUrl, customerName }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `Upload failed: ${res.status}`)
  return data.url as string
}

export async function uploadBlob(
  blob: Blob,
  filename: string,
  customerName?: string
): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
  return uploadDataUrl(dataUrl, filename, customerName)
}
