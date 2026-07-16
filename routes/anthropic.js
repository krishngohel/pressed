// Shared Anthropic helpers. Every call caches the vault context block
// (cache_control: ephemeral) — the vault is large and repeated across
// generations, tailors and email parsing, so this cuts cost dramatically.

import Anthropic from '@anthropic-ai/sdk'

export const MODEL = 'claude-sonnet-4-6'

let client = null
export function anthropic() {
  if (!process.env.ANTHROPIC_API_KEY) return null
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  return client
}

export function extractJson(text) {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text]
  const candidate = match[1].trim()
  const start = candidate.search(/[[{]/)
  if (start === -1) throw new Error('no JSON in model output')
  return JSON.parse(candidate.slice(start))
}

// messages: vault block gets cache_control ephemeral; the task block stays uncached.
export async function askClaude({ system, cachedContext, prompt, maxTokens = 4096 }) {
  const ai = anthropic()
  if (!ai) throw new Error('ANTHROPIC_API_KEY not configured')
  const response = await ai.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [
      {
        role: 'user',
        content: [
          ...(cachedContext
            ? [{ type: 'text', text: cachedContext, cache_control: { type: 'ephemeral' } }]
            : []),
          { type: 'text', text: prompt },
        ],
      },
    ],
  })
  return response.content.find((b) => b.type === 'text')?.text || ''
}
