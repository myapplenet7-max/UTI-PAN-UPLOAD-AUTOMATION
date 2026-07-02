// src/lib/aiApi.ts
// The universal engine for your Document Automation App

// 1. GEMINI (Google - Best for Telugu Templates)
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
  if (!res.ok) throw new Error(`Gemini API error ${res.status}`);
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('') || '';
}

// 2. OPENROUTER (Universal Failover)
export async function callOpenRouter(apiKey: string, prompt: string, imageBase64?: string, imageMime?: string): Promise<string> {
  const content: any[] = [];
  if (imageBase64 && imageMime) {
    content.push({ type: "image_url", image_url: { url: `data:${imageMime};base64,${imageBase64}` } });
  }
  content.push({ type: "text", text: prompt });

  const models = ["google/gemini-2.5-flash-preview-05-20", "anthropic/claude-3.5-sonnet"];
  for (const model of models) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages: [{ role: "user", content }] })
      });
      if (!res.ok) { if (res.status === 429) continue; throw new Error(`OpenRouter error ${res.status}`); }
      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    } catch {}
  }
  throw new Error('OpenRouter failed on all models.');
}

// 3. GROQ (Fast, cheap OCR)
export async function callGroq(apiKey: string, prompt: string, imageBase64?: string, imageMime?: string): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }] })
  });
  if (!res.ok) throw new Error(`Groq error ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// 4. HUGGING FACE (Open Source)
export async function callHuggingFace(apiKey: string, prompt: string, imageBase64?: string, imageMime?: string): Promise<string> {
  const finalPrompt = imageBase64 ? `<image>\n${prompt}` : prompt;
  const res = await fetch("https://api-inference.huggingface.co/models/Qwen/Qwen2-VL-7B-Instruct", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ inputs: finalPrompt, parameters: { max_new_tokens: 1024 } })
  });
  if (!res.ok) throw new Error(`Hugging Face API error ${res.status}`);
  const data = await res.json();
  return data?.[0]?.generated_text || '';
}

// THE MASTER FUNCTION: Supports Manual OR Auto-Failover
export async function callAI(
  apiKeys: Record<string, string>, 
  prompt: string, 
  selectedAi: string, 
  autoFailover: boolean,
  imageBase64?: string, 
  imageMime?: string
): Promise<string> {
  
  // Define the order to try services
  const serviceOrder = ['gemini', 'openrouter', 'groq', 'huggingface'];
  
  // Start with the user's selected AI
  let servicesToTry = [selectedAi];
  
  // If auto-failover is ON, add all the other services as backups
  if (autoFailover) {
    servicesToTry = serviceOrder.filter(s => apiKeys[s] && apiKeys[s].trim() !== '');
  }

  let lastError: any = null;

  for (const service of servicesToTry) {
    const key = apiKeys[service];
    if (!key) continue; // Skip if no key is saved for this service

    try {
      switch(service) {
        case 'groq': return await callGroq(key, prompt, imageBase64, imageMime);
        case 'openrouter': return await callOpenRouter(key, prompt, imageBase64, imageMime);
        case 'huggingface': return await callHuggingFace(key, prompt, imageBase64, imageMime);
        case 'gemini':
        default:
          return await callGemini(key, prompt, imageBase64, imageMime);
      }
    } catch (e: any) {
      lastError = e;
      console.warn(`Service ${service} failed. Trying next...`, e.message);
      // Continue to the next service in the loop
    }
  }

  // If all services failed
  throw new Error(`All AI services failed. Last error: ${lastError?.message || 'Unknown error'}`);
}