---
name: nuxt-ultra-init
description: Create a Nuxt 4 project with `create nuxt` and turn it into an opinionated full-stack app through a guided setup: Nuxt UI, ESLint, Supabase or PostgREST, auth (Supabase or nuxt-auth-utils), dashboards, i18n, SEO, zod, AI clients, Cloudflare R2 and deployment. Use when the user runs /nuxt-ultra-init, says "Init Nuxt Ultra", or asks to add one of these features to an existing Nuxt project.
---

# Nuxt Ultra Init

Creates a new Nuxt 4 project with `create nuxt` and turns it into an opinionated full-stack app, or adds features to an existing Nuxt 4 project. The **Create** step scaffolds the project, the **Baseline** step normalises it, then each selected feature is applied from its reference file.

## Start Command

The skill is installed once, globally, and run from the folder where the project should be created:

```bash
npx skills add Kiansa/nuxt-ultra -g
```

```text
/nuxt-ultra-init
```

"Init Nuxt Ultra" triggers the same flow.

## Interaction Contract

Always follow this sequence:

1. Detect the mode. If the current directory has a `package.json` with a `nuxt` dependency, this is an **existing project**: skip the **Create** step and the `projectName` and `gitInit` questions. Otherwise this is a **new project**.
2. Ask the setup questions below. Do not create or edit files yet.
3. Resolve dependencies (see **Feature Dependencies**) and summarize the final selection.
4. New project only: run the **Create** step. Everything after this happens inside `<projectName>/`.
5. Apply the **Baseline** steps, then the reference file for each selected feature, in the **Apply Order**.
6. Write `nuxt.config.ts` once, merging every feature's additions.
7. Install packages with the chosen package manager.
8. Verify (see **Verification**) and report all created/updated files and commands run.

## Questions

Ask these in order. Skip a conditional question if its condition is not met.

**General**

- `projectName` (new project only): directory and package name, kebab-case, e.g. `my-app`
- `packageManager`: `npm`, `pnpm`, `yarn`, `bun`
- `gitInit` (new project only): initialise a git repository, default yes
- `repoName`: app name for titles (default: `projectName`, or the `name` in `package.json` for an existing project)
- `devPort`: default `3000`

**Features** (multi-select, each group is optional)

| Group | Options | Notes |
|---|---|---|
| UI | `@nuxt/ui`, `shadcn/nuxt` | `shadcn/nuxt` not yet implemented |
| Linter | `@nuxt/eslint`, `oxlint`, `prettier` | only `@nuxt/eslint` implemented |
| DB | `@nuxtjs/supabase`, `nuxt-postgrest` | pick one |
| Auth | `@nuxtjs/supabase`, `nuxt-auth-utils` | pick one |
| Dashboard | `user`, `admin` | either or both |
| i18n | `@nuxtjs/i18n` | |
| SEO | `@nuxtjs/seo` | |
| Validation | `zod` | others (`yup`, `valibot`, ...) not yet implemented |
| AI | `openai`, `xai`, `gemini`, `claude` | multi-select |
| Storage | `cloudflare-r2` | |
| Deployment | `cloudflare`, `node`, `vercel`, other | always ask |

**Conditional**

- If `@nuxtjs/i18n`: `i18nMode` (`files` or `remote`), `defaultLocale`, `locales` (list of codes, e.g. `en, fa`)
- If `@nuxtjs/seo`: `siteUrl`, `siteName`, `siteDescription`
- If Auth is `nuxt-auth-utils`: `oauthProviders` (multi-select from `github`, `google`, or none) and `emailProvider` (`resend` or `none`; `none` skips OTP confirmation and password reset)
- If Auth is `@nuxtjs/supabase`: `oauthProviders` (multi-select from `github`, `google`, or none)
- If Dashboard: `dashboardRoute` (default `dashboard`, giving `/dashboard`; answer `/` for an app with no public home page where the dashboard is the root)
- If Deployment is `cloudflare`: `cloudflareWorkerName`

If an option is marked not implemented, tell the user and skip it.

## Feature Dependencies

Resolve these before summarizing. Add the dependency automatically and tell the user why.

| Selected | Requires |
|---|---|
| Auth (either) | UI `@nuxt/ui`, Validation `zod` |
| Auth `@nuxtjs/supabase` | DB `@nuxtjs/supabase` |
| Auth `nuxt-auth-utils` | a DB (`@nuxtjs/supabase` or `nuxt-postgrest`) for the users table |
| Dashboard | UI `@nuxt/ui`, Auth (either) |
| i18n `remote` mode | a DB |
| Storage `cloudflare-r2` | nothing (works on any host via S3 API) |
| `dashboardRoute` = `/` | Dashboard `user` (the dashboard replaces the public home page) |

Auth and Dashboard pages are written with plain English strings. When i18n is also selected, apply the **i18n addendum** section at the end of the auth reference after the main blocks.

## Create (new project only)

Run with the chosen package manager, then `cd <projectName>`:

```bash
pnpm create nuxt@latest <projectName> --template minimal --packageManager pnpm --no-install
```

Translate for the other package managers (`npm create nuxt@latest <projectName> -- --template minimal ...`, `yarn create nuxt`, `bun create nuxt`) and pass the same `--packageManager` value. Add `--gitInit` when `gitInit` is yes. The flags are required: the agent's terminal is non-interactive and the CLI exits without `--template`. `--no-install` is deliberate; packages are installed once, after every feature is applied.

## Baseline (always apply)

Apply [baseline.md](references/baseline.md) first. It sets the `dev`/`build` scripts with `--dotenv`, creates `.env.example` plus `.env.local` and `.env.production`, adds `app/pages/`, `devServer.port`, the placeholder logo, MCP config, and `.npmrc` for pnpm. Features append env keys to both env files.

## Conventions the references rely on

- **Route groups.** Pages under `app/pages/(protected)/` and `app/pages/(guest)/` get `to.meta.groups` (`['protected']`, `['guest']`) from Nuxt; the folder name never appears in the URL. Auth middleware keys on these groups. Put every signed-in page under `(protected)`.
- **`useAuth()`** is the provider-neutral composable (`user`, `loggedIn`, `displayName`, `avatar`, `logout`) that both auth references create and the dashboard uses.
- **`useDb(event)`** is the server-side admin database handle both DB variants expose for auth code.
- **Server routes stay thin**: `readValidatedBody(event, schema.parse)` with schemas from `shared/utils/`, then a helper from `server/utils/`.
- **Icons** are bundled from `@iconify-json/*` packages, never fetched at runtime.

## Execution References

Load only the reference files for the user's selections.

| Feature | Reference file |
|---|---|
| `@nuxt/ui` | [feature-ui.md](references/feature-ui.md) |
| `@nuxt/eslint` | [feature-nuxt-eslint.md](references/feature-nuxt-eslint.md) |
| DB (`@nuxtjs/supabase`, `nuxt-postgrest`) | [feature-db.md](references/feature-db.md) |
| Auth `@nuxtjs/supabase` | [feature-auth-supabase.md](references/feature-auth-supabase.md) |
| Auth `nuxt-auth-utils` | [feature-auth-nuxt-auth-utils.md](references/feature-auth-nuxt-auth-utils.md) |
| Dashboard | [feature-dashboard.md](references/feature-dashboard.md) |
| `@nuxtjs/i18n` | [feature-i18n.md](references/feature-i18n.md) |
| `@nuxtjs/seo` | [feature-seo.md](references/feature-seo.md) |
| Validation | [feature-validation.md](references/feature-validation.md) |
| AI | [feature-ai.md](references/feature-ai.md) |
| Storage | [feature-storage.md](references/feature-storage.md) |
| Deployment | [feature-deployment.md](references/feature-deployment.md) |

Each reference file lists path-scoped blocks. A block headed `### Path: <file>` means create that file with the content, or patch it minimally if it already exists. A block headed `### Path: terminal command` is a command to run with the chosen package manager (translate `npm install` / `npm install -D` accordingly).

## Apply Order

UI → Linter → DB → Auth → Dashboard → i18n → SEO → Validation → AI → Storage → Deployment.

When multiple features add entries to `nuxt.config.ts` (`modules`, `runtimeConfig`, `nitro`, `css`, module config keys), collect them and write the file once. Keep `modules` in this order: `@nuxt/ui`, `@nuxt/eslint`, `@nuxtjs/supabase`, `nuxt-auth-utils`, `@nuxtjs/i18n`, `@nuxtjs/seo`. Local modules under `modules/` are auto-registered by Nuxt and must not be listed.

## Guardrails

- Preserve unrelated user changes.
- Keep runs idempotent: re-running with the same selection must not duplicate entries, scripts or env keys.
- Patch existing files minimally instead of overwriting them. The exception is `app/app.vue` and `app/pages/index.vue`, which the baseline and the UI feature own.
- Never write secrets into files. Env values are placeholders the user fills in.
- Do not hardcode package versions in `package.json`; let the package manager resolve the latest.

## Verification

After installing packages:

1. Run `npx nuxt prepare` (or the package manager equivalent) so `.nuxt/` types exist.
2. Run `npm run typecheck`. If `@nuxt/eslint` was selected, also run `npm run lint`.
3. Fix errors caused by this setup. Report anything left for the user (for example, env values they must fill in, or a database table they must create).
