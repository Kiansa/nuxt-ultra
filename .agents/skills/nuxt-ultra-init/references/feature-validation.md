# Zod Feature

## Condition
Apply only when `zod` is selected.

## File Updates

### Path: server/utils/validation.ts
```ts
import { z } from 'zod'

export const basicFormSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
})
```

## Packages

### Path: terminal command
```bash
npm install zod
```
