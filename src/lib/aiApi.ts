// src/lib/aiApi.ts
// FIXED: Removed duplicate callGemini function. 
// The function is now only declared once.

// 1. GEMINI (Google)
export async function callGemini(apiKey: string, prompt: string, imageBase64?: string, imageMime?: string): Promise<string> {
  const parts: any[] = []
  if (imageBase64 && imageMime) {
    parts.push({ inline_data: { mime_type: imageMime, data: imageBase64 } })
  }
  parts.push({ text: prompt })

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts }] })
  })
  if (res.status === 429) throw new Error('Rate limit hit on Gemini')
  if (!res.ok) throw new Error(`Gemini API error ${res.status}`)
  const data = await res.json()
  return data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || ''
}

// 2. OPENROUTER
export async function callOpenRouter(apiKey: string, prompt: string, imageBase64?: string, imageMime?: string): Promise<string> {
  const content: any[] = []
  if (imageBase64 && imageMime) {
    content.push({ type: 'image_url', image_url: { url: `data:${imageMime};base64,${imageBase64}` } })
  }
  content.push({ type: 'text', text: prompt })

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'google/gemini-2.5-flash-preview-05-20', messages: [{ role: 'user', content }] })
  })
  if (res.status === 429) throw new Error('Rate limit hit on OpenRouter')
  if (!res.ok) throw new Error(`OpenRouter error ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

// 3. GROQ — TEXT ONLY, no image support
export async function callGroq(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }] })
  })
  if (res.status === 429) throw new Error('Rate limit hit on Groq')
  if (!res.ok) throw new Error(`Groq error ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

// VISION-CAPABLE SERVICES
const VISION_SERVICES = new Set(['gemini', 'openrouter'])

// MASTER FUNCTION
export async function callAI(
  apiKeys: Record<string, string>,
  prompt: string,
  selectedAi: string,
  autoFailover: boolean,
  imageBase64?: string,
  imageMime?: string,
  visionOnly = false
): Promise<string> {

  const serviceOrder = ['gemini', 'openrouter', 'groq']
  let servicesToTry: string[]

  if (autoFailover) {
    servicesToTry = serviceOrder.filter(s => apiKeys[s]?.trim())
  } else {
    servicesToTry = [selectedAi]
  }

  if (visionOnly || (imageBase64 && imageMime)) {
    servicesToTry = servicesToTry.filter(s => VISION_SERVICES.has(s))
  }

  if (servicesToTry.length === 0) {
    throw new Error(
      imageBase64
        ? 'No vision-capable API key found. Add a Gemini or OpenRouter key to use image features.'
        : 'No API key found for the selected service.'
    )
  }

  let lastError: any = null
  for (const service of servicesToTry) {
    const key = apiKeys[service]
    if (!key?.trim()) continue
    try {
      switch (service) {
        case 'groq':        return await callGroq(key, prompt)
        case 'openrouter':  return await callOpenRouter(key, prompt, imageBase64, imageMime)
        case 'gemini':
        default:            return await callGemini(key, prompt, imageBase64, imageMime)
      }
    } catch (e: any) {
      lastError = e
      console.warn(`Service ${service} failed:`, e.message)
    }
  }
  throw new Error(`All AI services failed. Last: ${lastError?.message || 'Unknown'}`)
}