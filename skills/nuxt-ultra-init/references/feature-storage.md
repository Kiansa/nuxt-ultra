# Cloudflare R2 Storage Feature

## Condition
Apply only when `cloudflare-r2` is selected. Works on any host because it uses the S3-compatible API through unstorage's `s3` driver.

Two mounts: `r2` (public bucket, served through `r2Domain`) and `r2Assets` (private bucket, only reachable through server routes).

## File Updates

### Path: nuxt.config.ts
Add to `runtimeConfig` (private):
```ts
r2Domain: '', // public URL of the public bucket, e.g. https://cdn.example.com
```

Add inside `nitro`:
```ts
storage: {
  r2: {
    driver: 's3',
    accessKeyId: process.env.NUXT_R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.NUXT_R2_SECRET_ACCESS_KEY || '',
    endpoint: process.env.NUXT_S3_API || '',
    bucket: process.env.NUXT_R2_BUCKET || '',
    region: 'auto',
  },
  r2Assets: {
    driver: 's3',
    accessKeyId: process.env.NUXT_R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.NUXT_R2_SECRET_ACCESS_KEY || '',
    endpoint: process.env.NUXT_S3_API || '',
    bucket: process.env.NUXT_R2_BUCKET_PRIVATE || '',
    region: 'auto',
  },
},
```

Storage mounts are resolved at build time from `process.env`, so the values must be in the env file passed to the command. That is why the scripts below pass `--dotenv`.

### Path: package.json
Patch the `typecheck` script so `nuxt.config.ts` sees the env at type-generation time:
```json
{
  "scripts": {
    "typecheck": "nuxt typecheck --dotenv .env.local"
  }
}
```

### Path: server/utils/storage.ts
```ts
import type { Storage } from 'unstorage'

/**
 * The s3 driver has no request timeout and R2 occasionally hangs a connection,
 * which would leave the handler suspended forever. Always answer within `ms`.
 */
export function putWithTimeout(storage: Storage, key: string, body: Uint8Array, ms = 30_000) {
  return Promise.race([
    storage.setItemRaw(key, body),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`R2 upload timed out after ${ms / 1000}s`)), ms)),
  ])
}

export async function readUploadedFile(event: Parameters<typeof readFormData>[0]) {
  const form = await readFormData(event)
  const file = form.get('file')
  if (!(file instanceof File) || !file.size) {
    throw createError({ statusCode: 400, message: 'No file provided' })
  }
  // UUID prefix so same-named uploads never overwrite each other.
  const key = `${crypto.randomUUID()}-${file.name}`
  return { file, key, body: new Uint8Array(await file.arrayBuffer()) }
}
```

### Path: server/api/upload/index.put.ts
Public bucket. Returns a URL that can be embedded directly.
```ts
export default defineEventHandler(async (event) => {
  const { r2Domain } = useRuntimeConfig(event)
  const { key, body } = await readUploadedFile(event)

  try {
    await putWithTimeout(useStorage('r2'), key, body)
  }
  catch (error) {
    console.error('[upload] failed', error)
    throw createError({ statusCode: 500, message: 'File upload failed' })
  }

  return { key, url: r2Domain ? `${r2Domain}/${key}` : null }
})
```

### Path: server/api/upload/assets.put.ts
Private bucket, scoped per user. Requires auth. Serve files back through a server route that checks ownership.
```ts
export default defineEventHandler(async (event) => {
  // Auth `nuxt-auth-utils`:
  const { user } = await requireUserSession(event)
  const ownerId = user.id
  // Auth `@nuxtjs/supabase` instead:
  // const user = await serverSupabaseUser(event)
  // if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })
  // const ownerId = user.id

  const { key: fileKey, body } = await readUploadedFile(event)
  const key = `users/${ownerId}/${fileKey}`

  try {
    await putWithTimeout(useStorage('r2Assets'), key, body)
  }
  catch (error) {
    console.error('[upload] failed', error)
    throw createError({ statusCode: 500, message: 'File upload failed' })
  }

  return { key }
})
```
If no Auth feature is selected, create only `upload/index.put.ts`.

### Path: .env.local
```dotenv
# Cloudflare R2
NUXT_S3_API="https://<account_id>.r2.cloudflarestorage.com"
NUXT_R2_ACCESS_KEY_ID="your_r2_access_key"
NUXT_R2_SECRET_ACCESS_KEY="your_r2_secret_key"
NUXT_R2_BUCKET="your_public_bucket"
NUXT_R2_BUCKET_PRIVATE="your_private_bucket"
NUXT_R2_DOMAIN="https://cdn.example.com"
```

### Path: .env.production
Same keys as `.env.local`.

## Packages

### Path: terminal command
```bash
npm install aws4fetch
```
