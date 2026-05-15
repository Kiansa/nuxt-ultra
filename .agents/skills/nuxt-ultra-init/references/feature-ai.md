# AI Feature

## Condition
Apply only when `ai` is selected.

## File Updates

### Path: server/utils/ai.ts

Generate this file with only the selected providers. Include only the destructured key and named export for each chosen provider.

```ts
import OpenAI from 'openai'

const {
  // include only selected provider keys:
  openaiApiKey,   // if openai selected
  xaiApiKey,      // if xai selected
  claudeApiKey,   // if claude selected
  geminiApiKey,   // if gemini selected
} = useRuntimeConfig()

// if openai selected:
export const gpt = new OpenAI({ apiKey: openaiApiKey, baseURL: 'https://api.openai.com/v1' })

// if xai selected:
export const grok = new OpenAI({ apiKey: xaiApiKey, baseURL: 'https://api.x.ai/v1' })

// if claude selected:
export const claude = new OpenAI({ apiKey: claudeApiKey, baseURL: 'https://api.anthropic.com/v1' })

// if gemini selected:
export const gemini = new OpenAI({ apiKey: geminiApiKey, baseURL: 'https://generativelanguage.googleapis.com/v1beta' })
```

**Rules:**
- Use `useRuntimeConfig()` not `process.env`.
- Export a named singleton per provider, not a factory function.
- Strip any providers that were not selected — both the destructured key and the export.
- Key names in `useRuntimeConfig()` are camelCase (`openaiApiKey`, `xaiApiKey`, `claudeApiKey`, `geminiApiKey`) matching the `runtimeConfig` block in `nuxt.config.ts`.

### Path: nuxt.config.ts (add to runtimeConfig)

Include only selected provider keys:

```ts
runtimeConfig: {
  openaiApiKey: '',   // if openai selected
  xaiApiKey: '',      // if xai selected
  claudeApiKey: '',   // if claude selected
  geminiApiKey: '',   // if gemini selected
}
```

## Env Keys By Provider

### Path: .env.local
```dotenv
NUXT_OPENAI_API_KEY="your_openai_api_key"
NUXT_XAI_API_KEY="your_xai_api_key"
NUXT_CLAUDE_API_KEY="your_claude_api_key"
NUXT_GEMINI_API_KEY="your_gemini_api_key"
```

### Path: .env.production
```dotenv
NUXT_OPENAI_API_KEY="your_openai_api_key"
NUXT_XAI_API_KEY="your_xai_api_key"
NUXT_CLAUDE_API_KEY="your_claude_api_key"
NUXT_GEMINI_API_KEY="your_gemini_api_key"
```

Keep only keys for selected providers.

## Packages

### Path: terminal command
```bash
npm install openai
```
