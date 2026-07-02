// src/lib/aiApi.ts
// UPDATED: Cleared for better JSON handling and failover

// 1. GEMINI (Google - Best for Telugu/JSON)
export async function callGemini(apiKey: string, prompt: string, imageBase64?: string, imageMime?: string): Promise<string> {
  const parts: any[] = [];
  if (imageBase64 && imageMime) {
    parts.push({ inline_data: { mime_type: imageMime, data: imageBase64 } });
  }
  parts.push({ text: prompt });

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseMimeType: 'application/json' } })
  });
  if (res.status === 429) throw new Error(`Rate limit hit on Gemini`);
  if (!res.ok) throw new Error(`Gemini API error ${res.status}`);
  
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || '';
}

// 2. OPENROUTER (The Ultimate Failover)
export async function callOpenRouter(apiKey: string, prompt: string, imageBase64?: string, imageMime?: string): Promise<string> {
  const content: any[] = [];
  if (imageBase64 && imageMime) {
    content.push({ type: "image_url", image_url: { url: `data:${imageMime};base64,${imageBase64}` } });
  }
  content.push({ type: "text", text: prompt });

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "google/gemini-2.5-flash-preview-05-20", messages: [{ role: "user", content }] })
  });
  if (res.status === 429) throw new Error(`Rate limit hit on OpenRouter`);
  if (!res.ok) throw new Error(`OpenRouter error ${res.status}`);
  
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// 3. GROQ (Fast, cheap basic extraction)
export async function callGroq(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }] })
  });
  if (res.status === 429) throw new Error(`Rate limit hit on Groq`);
  if (!res.ok) throw new Error(`Groq error ${res.status}`);
  
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// THE MASTER FUNCTION
export async function callAI(
  apiKeys: Record<string, string>, 
  prompt: string, 
  selectedAi: string, 
  autoFailover: boolean,
  imageBase64?: string, 
  imageMime?: string
): Promise<string> {
  
  const serviceOrder = ['gemini', 'openrouter', 'groq'];
  let servicesToTry = [selectedAi];
  
  if (autoFailover) {
    // If failover is on, try Gemini first, then OpenRouter, then Groq
    servicesToTry = serviceOrder.filter(s => apiKeys[s] && apiKeys[s].trim() !== '');
  }

  let lastError: any = null;

  for (const service of servicesToTry) {
    const key = apiKeys[service];
    if (!key) continue;

    try {
      switch(service) {
        case 'groq': return await callGroq(key, prompt);
        case 'openrouter': return await callOpenRouter(key, prompt, imageBase64, imageMime);
        case 'gemini':
        default:
          return await callGemini(key, prompt, imageBase64, imageMime);
      }
    } catch (e: any) {
      lastError = e;
      console.warn(`Service ${service} failed. Trying next...`, e.message);
    }
  }

  throw new Error(`All AI services failed. Last error: ${lastError?.message || 'Unknown error'}`);
}