# Deployment Feature

## Condition
Always ask the deployment target and apply exactly one branch.

## Deployment: cloudflare

Targets Cloudflare Workers with static assets. Nitro writes `.output/server/wrangler.json` from the config below at build time (`deployConfig: true`).

### Path: nuxt.config.ts
Add inside `nitro`:
```ts
preset: 'cloudflare-module',
cloudflare: {
  deployConfig: true,
  nodeCompat: true,
  wrangler: {
    name: '<cloudflareWorkerName>',
    main: './.output/server/index.mjs',
    compatibility_date: '<today, YYYY-MM-DD>',
    assets: {
      binding: 'ASSETS',
      directory: './.output/public/',
      html_handling: 'drop-trailing-slash',
    },
    observability: {
      enabled: true,
    },
    // Custom domain: uncomment and set `workers_dev: false`.
    // routes: [
    //   { pattern: '<domain>', zone_name: '<zone_name>', custom_domain: true },
    // ],
    // workers_dev: false,
  },
},
```

### Path: package.json
Add scripts:
```json
{
  "scripts": {
    "deploy": "npm run build && wrangler deploy",
    "secrets": "node scripts/push-secrets.mjs"
  }
}
```

### Path: scripts/push-secrets.mjs
Pushes `.env.production` to the Worker in one `wrangler secret bulk` call. Cross-platform.
```js
// Usage: npm run secrets            (reads .env.production)
//        npm run secrets -- .env.staging
import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

function resolveWorkerName() {
  if (existsSync('.output/server/wrangler.json')) {
    const config = JSON.parse(readFileSync('.output/server/wrangler.json', 'utf8'))
    if (config.name) return config.name
  }
  const match = readFileSync('nuxt.config.ts', 'utf8').match(/wrangler:\s*{[^}]*name:\s*['"]([^'"]+)['"]/s)
  if (match) return match[1]
  throw new Error('Could not resolve the Worker name. Run `npm run build` first.')
}

const workerName = resolveWorkerName()
const envPath = process.argv[2] || '.env.production'
const secrets = {}

for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eq = trimmed.indexOf('=')
  if (eq === -1) continue
  const key = trimmed.slice(0, eq).trim()
  let value = trimmed.slice(eq + 1).trim()
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\''))) {
    value = value.slice(1, -1)
  }
  // NUXT_PUBLIC_* are inlined at build time and are not secrets.
  if (!key || !value || key.startsWith('NUXT_PUBLIC_')) continue
  secrets[key] = value
}

console.log(`Pushing ${Object.keys(secrets).length} secrets to "${workerName}"…`)

const result = spawnSync('npx', ['wrangler', 'secret', 'bulk', '--name', workerName], {
  input: JSON.stringify(secrets),
  stdio: ['pipe', 'inherit', 'inherit'],
  shell: process.platform === 'win32',
})

if (result.status !== 0) process.exit(result.status ?? 1)
```

### Path: terminal command
```bash
npm install -D wrangler
```

Tell the user:
- `NUXT_PUBLIC_*` values are baked in at build time. Private keys must be pushed with `npm run secrets` after the first `wrangler deploy` creates the Worker.
- Scheduled jobs: add `nitro.experimental.tasks: true`, `nitro.scheduledTasks: { '*/5 * * * *': ['my-task'] }`, and mirror each cron in `wrangler.triggers.crons`; tasks live in `server/tasks/<name>.ts`.

## Deployment: node

Nitro's default `node-server` preset. No config changes. `npm run build` produces `.output/`; start with `node .output/server/index.mjs`. The README covers traditional hosts (Plesk, cPanel).

## Deployment: vercel

Zero-config. No changes. Vercel detects Nuxt and uses the `vercel` preset automatically. Set the same env keys as `.env.production` in the Vercel project settings.

## Deployment: other

No changes. Point the user to https://nuxt.com/deploy for the provider's preset.
