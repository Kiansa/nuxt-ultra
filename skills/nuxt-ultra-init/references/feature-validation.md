# Validation Feature

## Condition
Apply only when `zod` is selected. Other libraries are not yet implemented.

Schemas live in `shared/` so both the app (Nuxt UI forms accept any Standard Schema) and the server (`readValidatedBody`) use the same definitions.

## File Updates

### Path: shared/utils/schemas.ts
```ts
import { z } from 'zod'

export const emailSchema = z.email('Enter a valid email address')
export const passwordSchema = z.string().min(8, 'Must be at least 8 characters')

export const contactSchema = z.object({
  name: z.string().min(2, 'Name is too short'),
  email: emailSchema,
  message: z.string().min(10, 'Message is too short'),
})

export type ContactInput = z.output<typeof contactSchema>
```

Server usage example (do not create unless asked):
```ts
export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, contactSchema.parse)
  return { ok: true, body }
})
```

## Packages

### Path: terminal command
```bash
npm install zod
```
