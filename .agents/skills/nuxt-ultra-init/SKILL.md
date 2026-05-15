---
name: nuxt-ultra-init
description: Initialize and customize this Nuxt Ultra project with an AI-guided setup workflow using templates and feature toggles.
---

# Nuxt Ultra Init

This skill used for setting up and configuring a new Nuxt project.

## Start Command

Tell the user to start with:

```text
Init Nuxt Ultra
```

## Interaction Contract

Always follow this sequence:
1. Ask setup questions (do not edit files yet).
2. Summarize chosen answers.
3. Apply configuration and file updates from feature reference files.
4. Install required packages.
5. Report all created/updated files and commands run.

Question set:
- `packageManager` (choices: `npm`, `yarn`, `pnpm`, `bun`)
- `repoName`
- `devPort`
1. features multi-select: 
- UI : `@nuxt/ui`, `shadcn/nuxt`
- Linter: `@nuxt/eslint`, `oxlint`, `prettier`
- DB: `@nuxtjs/supabase`, `nuxt-postgrest (local module)`
- i18n: `@nuxtjs/i18n`
- SEO: `@nuxtjs/seo`
- Dashboard: `Admin dashboard`, `User dashboard`
- Auth: `nuxt-auth-utils`, `@nuxtjs/supabase` 
- AI: `openai`, `xai`, `gemini`, `claude`
- Storage: `cloudflare-r2`
- Validation: `zod`, `yup`, `joi`, `valibot`, `superstruct`, `regle` 
- deployment: `cloudflare`, `node`, `vercel` or user input for other provider
2. Conditional Questions:
- if `@nuxtjs/i18n`: choose `files` or `db` mode
- if `ai`: choose providers `openai`, `xai`, `gemini`, `claude` (multi-select)
- if deployment `cloudflare`: `cloudflareWorkerName`
- if `@nuxtjs/seo` ask for `siteUrl`, `siteName`, `siteDescription`
- if `@nuxtjs/i18n` ask for `defaultLocale` and `locales` 

## Execution References

Load only the reference files that correspond to the user's selections.

| Feature | Reference file |
|---|---|
| `@nuxt/ui` | [feature-ui.md](references/feature-ui.md) |
| `@nuxt/eslint` | [feature-nuxt-eslint.md](references/feature-nuxt-eslint.md) |
| DB (`@nuxtjs/supabase`, `nuxt-postgrest`) | [feature-db.md](references/feature-db.md) |
| Auth: `@nuxtjs/supabase` | [feature-auth-supabase.md](references/feature-auth-supabase.md) |
| Auth: `nuxt-auth-utils` | [feature-auth-nuxt-auth-utils.md](references/feature-auth-nuxt-auth-utils.md) |
| `@nuxtjs/i18n` | [feature-i18n.md](references/feature-i18n.md) |
| `@nuxtjs/seo` | [feature-seo.md](references/feature-seo.md) |
| Dashboard | [feature-dashboard.md](references/feature-dashboard.md) |
| AI | [feature-ai.md](references/feature-ai.md) |
| Storage (`cloudflare-r2`) | [feature-storage.md](references/feature-storage.md) |
| Validation | [feature-validation.md](references/feature-validation.md) |
| Deployment | [feature-deployment.md](references/feature-deployment.md) |

> **Not yet implemented** (inform the user if selected, then skip):
> `shadcn/nuxt`, `oxlint`, `prettier`

Each feature file defines conditional, path-based code blocks for create/modify actions.

When multiple features add entries to `nuxt.config.ts` (e.g. `modules`, `runtimeConfig`), merge them into a single coherent file rather than writing the file once per feature.

## Guardrails

- Preserve unrelated user changes.
- Keep runs idempotent where possible.
- If a file exists, patch it minimally instead of overwriting the full file.
