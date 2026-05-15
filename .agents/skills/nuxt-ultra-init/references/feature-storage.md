# Cloudflare R2 Feature

## Condition
Apply only when `cloudflare-r2` is selected.

## File Updates

### Path: nuxt.config.ts
```ts
export default defineNuxtConfig({
  runtimeConfig: {
    // R2
    s3Api: '',
    r2SecretAccessKey: '',
    r2AccessKeyId: '',
    r2Bucket: '',
    r2BucketPrivate: '',
    r2Domain: '',
  },
  nitro: {
    storage: {
      // public bucket
      r2: {
        driver: 's3',
        accessKeyId: process.env.NUXT_R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.NUXT_R2_SECRET_ACCESS_KEY || '',
        endpoint: process.env.NUXT_S3_API || '',
        bucket: process.env.NUXT_R2_BUCKET || '',
        region: 'auto',
      },
      // private bucket (not served directly, used in server code only)
      r2Assets: {
        driver: 's3',
        accessKeyId: process.env.NUXT_R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.NUXT_R2_SECRET_ACCESS_KEY || '',
        endpoint: process.env.NUXT_S3_API || '',
        bucket: process.env.NUXT_R2_BUCKET_PRIVATE || '',
        region: 'auto',
      },
    },
  },
})
```

### Path: server/api/upload.put.ts
```ts
export default defineEventHandler(async () => {
  return { ok: true }
})
```

### Path: .env.local
```dotenv
# R2
NUXT_S3_API="your_s3_api_endpoint"
NUXT_R2_ACCESS_KEY_ID="your_r2_access_key"
NUXT_R2_SECRET_ACCESS_KEY="your_r2_secret_key"
NUXT_R2_BUCKET="your_r2_bucket_name"
NUXT_R2_BUCKET_PRIVATE="your_r2_private_bucket_name"
NUXT_R2_DOMAIN="your_r2_domain"
```

### Path: .env.production
```dotenv
# R2
NUXT_S3_API="your_s3_api_endpoint"
NUXT_R2_ACCESS_KEY_ID="your_r2_access_key"
NUXT_R2_SECRET_ACCESS_KEY="your_r2_secret_key"
NUXT_R2_BUCKET="your_r2_bucket_name"
NUXT_R2_BUCKET_PRIVATE="your_r2_private_bucket_name"
NUXT_R2_DOMAIN="your_r2_domain"
```

## Packages

### Path: terminal command
```bash
npm install aws4fetch
```
