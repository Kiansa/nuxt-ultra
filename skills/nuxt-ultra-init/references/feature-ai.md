# AI Feature

## Condition
Apply only when at least one AI provider is selected.

OpenAI, xAI and Gemini share the OpenAI SDK through their OpenAI-compatible endpoints. Claude uses the official Anthropic SDK; Anthropic's OpenAI-compatibility layer is documented as a testing tool, not a production path.

## File Updates

### Path: server/utils/ai.ts
Generate only the selected providers: the import, the destructured key and the export. Keys are private runtime config, so this file is server-only.

```ts
import OpenAI from 'openai'                 // if openai, xai or gemini selected
import Anthropic from '@anthropic-ai/sdk'   // if claude selected

const {
  openaiApiKey,      // if openai selected
  xaiApiKey,         // if xai selected
  geminiApiKey,      // if gemini selected
  anthropicApiKey,   // if claude selected
} = useRuntimeConfig()

// if openai selected:
export const openai = new OpenAI({ apiKey: openaiApiKey })

// if xai selected:
export const grok = new OpenAI({ apiKey: xaiApiKey, baseURL: 'https://api.x.ai/v1' })

// if gemini selected (note the trailing /openai/):
export const gemini = new OpenAI({
  apiKey: geminiApiKey,
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
})

// if claude selected:
export const claude = new Anthropic({ apiKey: anthropicApiKey })
```

### Path: nuxt.config.ts
Add to `runtimeConfig` (private), only selected keys:
```ts
openaiApiKey: '',
xaiApiKey: '',
geminiApiKey: '',
anthropicApiKey: '',
```

### Path: server/api/ai/chat.post.ts
Example route; create it only if the user wants a starting point. Shown for Claude; for the OpenAI-compatible clients use `client.chat.completions.create({ model, messages })`.

```ts
import { z } from 'zod'

const bodySchema = z.object({
  prompt: z.string().min(1).max(8000),
})

export default defineEventHandler(async (event) => {
  const { prompt } = await readValidatedBody(event, bodySchema.parse)

  const response = await claude.messages.create({
    model: 'claude-opus-5',
    max_tokens: 16000,
    messages: [{ role: 'user', content: prompt }],
  })

  return {
    text: response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join(''),
  }
})
```

For streaming to the browser use `claude.messages.stream(...)` and return the `.toReadableStream()` result from the handler.

### Path: .env.local
Only selected providers.
```dotenv
# AI
NUXT_OPENAI_API_KEY="your_openai_api_key"
NUXT_XAI_API_KEY="your_xai_api_key"
NUXT_GEMINI_API_KEY="your_gemini_api_key"
NUXT_ANTHROPIC_API_KEY="your_anthropic_api_key"
```

### Path: .env.production
Same keys as `.env.local`.

## Packages

### Path: terminal command
```bash
npm install openai            # if openai, xai or gemini selected
npm install @anthropic-ai/sdk # if claude selected
```
