# Deployment Feature

## Condition
Always ask deployment target and apply one branch.

## Deployment: cloudflare

### Path: nuxt.config.ts
```ts
export default defineNuxtConfig({
  nitro: {
    preset: 'cloudflare-module',
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
      wrangler: {
        name: '<cloudflareWorkerName>',
        main: './.output/server/index.mjs',
        compatibility_date: '2026-01-17',
        assets: {
          binding: 'ASSETS',
          directory: './.output/public/',
          html_handling: 'drop-trailing-slash',
        },
        //routes: [
        //  {
        //    pattern: '<domain>',
        //    zone_name: '<zone_name>',
        //    custom_domain: true,
        //  },
        //],
        //workers_dev: false, // set to false when using custom domain
        observability: {
          enabled: true,
        },
      },
    },
  },
})
```

### Path: package.json
```json
{
  "scripts": {
    "deploy": "wrangler deploy",
    "secrets": "grep -v '^#' .env.production | while IFS='=' read -r k v; do [[ -n \"$k\" ]] && wrangler secret put \"$k\" --env production <<< \"$v\"; done"
  }
}
```

### Path: terminal command
```bash
npm install -D wrangler
```

## Deployment: node

No deployment-specific file changes are required.