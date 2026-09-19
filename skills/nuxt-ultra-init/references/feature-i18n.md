# i18n Feature

## Condition
Apply only when `@nuxtjs/i18n` is selected.

Module options live in `nuxt.config.ts`. The file `i18n/i18n.config.ts` is the **vue-i18n runtime config** the module loads automatically; it must not contain module options.

## Locale table
Build the `locales` array from the user's `locales` answer using this table. Ask for any code not listed.

| code | language | name | dir |
|---|---|---|---|
| en | en-US | English | ltr |
| de | de-DE | Deutsch | ltr |
| fr | fr-FR | Français | ltr |
| es | es-ES | Español | ltr |
| it | it-IT | Italiano | ltr |
| pt | pt-BR | Português | ltr |
| nl | nl-NL | Nederlands | ltr |
| sv | sv-SE | Svenska | ltr |
| tr | tr-TR | Türkçe | ltr |
| ru | ru-RU | Русский | ltr |
| ja | ja-JP | 日本語 | ltr |
| zh | zh-CN | 简体中文 | ltr |
| fa | fa-IR | فارسی | rtl |
| ar | ar-SA | العربية | rtl |
| he | he-IL | עברית | rtl |

## Shared Updates

### Path: nuxt.config.ts
Add to `modules`:
```ts
'@nuxtjs/i18n',
```

Add top-level. Include `baseUrl` only when `siteUrl` is known (SEO feature).
```ts
i18n: {
  baseUrl: '<siteUrl>',
  defaultLocale: '<defaultLocale>',
  strategy: 'prefix_except_default',
  locales: [
    // one entry per selected locale, `file` differs per mode (see below)
    { code: 'en', language: 'en-US', name: 'English', dir: 'ltr', file: 'en.json' },
  ],
  // Off by default: browser-language redirects surprise users who share links. Enable with
  // `{ useCookie: true, cookieKey: 'i18n_redirected', redirectOn: 'root' }` if wanted.
  detectBrowserLanguage: false,
},
```

### Path: .vscode/settings.json
Merge in (for the i18n Ally extension):
```json
{
  "i18n-ally.localesPaths": ["i18n/locales"],
  "i18n-ally.keystyle": "nested",
  "i18n-ally.extract.autoDetect": false
}
```

### Path: i18n/i18n.config.ts
```ts
export default defineI18nConfig(() => ({
  legacy: false,
  fallbackLocale: '<defaultLocale>',
}))
```

### Path: app/components/common/LocaleSwitch.vue
With `@nuxt/ui`:
```vue
<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()

const items = computed(() => locales.value.map(l => ({
  label: l.name ?? l.code,
  value: l.code,
})))
</script>

<template>
  <USelectMenu
    :model-value="locale"
    :items="items"
    value-key="value"
    icon="i-lucide-languages"
    :search-input="false"
    :ui="{ content: 'w-max' }"
    :content="{ align: 'end' }"
    @update:model-value="setLocale($event)"
  />
</template>
```

Without `@nuxt/ui`:
```vue
<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()
</script>

<template>
  <select
    :value="locale"
    @change="setLocale(($event.target as HTMLSelectElement).value as typeof locale)"
  >
    <option
      v-for="l in locales"
      :key="l.code"
      :value="l.code"
    >
      {{ l.name ?? l.code }}
    </option>
  </select>
</template>
```

Add `<CommonLocaleSwitch />` to the header next to the color mode button.

## Mode: files

`file` on each locale entry is `'<code>.json'`. Create one JSON file per locale with the same keys. Example for `en`:

### Path: i18n/locales/en.json
```json
{
  "welcome": "Welcome",
  "nav": {
    "home": "Home"
  }
}
```

Translate the values for each other locale (for example `fa`: `"welcome": "خوش آمدید"`, `"nav": { "home": "خانه" }`).

## Mode: remote

Translations come from a `translations` table with one row per key and one column per locale. `file` on each locale entry is:
```ts
file: { path: 'remote.ts', cache: false },
```

### Path: i18n/locales/remote.ts
```ts
export default defineI18nLocale(async (locale) => {
  return await $fetch<Record<string, string>>(`/api/locales/${locale}`)
})
```

### Path: SQL (tell the user to run it)
One column per locale code.
```sql
create table if not exists public.translations (
  id text primary key,
  en text,
  fa text
);
```

### Path: server/api/locales/[locale].get.ts
**DB is `@nuxtjs/supabase`:**
```ts
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '#shared/types/database.types'

const allowed = new Set(['en', 'fa']) // keep in sync with nuxt.config locales

export default defineEventHandler(async (event) => {
  const locale = getRouterParam(event, 'locale') ?? ''
  if (!allowed.has(locale)) {
    throw createError({ statusCode: 404, message: `Unknown locale ${locale}` })
  }

  const db = serverSupabaseServiceRole<Database>(event)
  const { data, error } = await db.from('translations').select(`id, ${locale}`)
  if (error) throw createError({ statusCode: 500, message: error.message })

  return Object.fromEntries(
    (data as Array<Record<string, string | null>>).map(row => [row.id, row[locale] ?? row.id]),
  )
})
```

**DB is `nuxt-postgrest`:**
```ts
const allowed = new Set(['en', 'fa']) // keep in sync with nuxt.config locales

export default defineEventHandler(async (event) => {
  const locale = getRouterParam(event, 'locale') ?? ''
  if (!allowed.has(locale)) {
    throw createError({ statusCode: 404, message: `Unknown locale ${locale}` })
  }

  const db = usePostgrestAdmin()
  const { data, error } = await db.from('translations').select(`id, ${locale}`)
  if (error) throw createError({ statusCode: 500, message: error.message })

  return Object.fromEntries(
    (data as Array<Record<string, string | null>>).map(row => [row.id, row[locale] ?? row.id]),
  )
})
```

## RTL locales

Apply when any selected locale has `dir: 'rtl'` and `@nuxt/ui` is selected. The UI feature's i18n addendum sets `class="font-rtl"` on `<html>` for RTL locales.

### Path: app/assets/css/main.css
Append. For Persian (`fa`) use Vazirmatn; for Arabic use a font such as IBM Plex Sans Arabic. Tell the user to download the variable `.woff2` into `public/fonts/`.
```css
@theme static {
  --font-rtl: 'Vazirmatn', sans-serif;
}

@font-face {
  font-family: 'Vazirmatn';
  src: url('/fonts/Vazirmatn[wght].woff2') format('woff2-variations');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}
```

## Validation addendum

Apply when `zod` is selected. Translates zod's built-in messages and lets schemas use translation keys as messages.

### Path: app/composables/useTranslatedSchema.ts
```ts
import { z } from 'zod'
import * as zodLocales from 'zod/locales'
import type { StandardSchemaV1 } from '@standard-schema/spec'

/**
 * Wrap a zod schema for `UForm :schema` so that
 * 1. zod's built-in messages follow the active locale, and
 * 2. custom messages that are translation keys (e.g. `.min(1, 'validation.required')`) are translated.
 */
export function useTranslatedSchema<S extends StandardSchemaV1>(schema: S): S {
  const { t, te, locale } = useI18n()

  watch(locale, (code) => {
    const loader = (zodLocales as Record<string, () => ReturnType<typeof zodLocales.en>>)[code]
    z.config(loader ? loader() : zodLocales.en())
  }, { immediate: true })

  const translate = (result: StandardSchemaV1.Result<unknown>) => {
    if (!('issues' in result) || !result.issues) return result
    return {
      issues: result.issues.map(issue => ({
        ...issue,
        message: te(issue.message) ? String(t(issue.message)) : issue.message,
      })),
    }
  }

  return {
    ...schema,
    '~standard': {
      ...schema['~standard'],
      validate(value: unknown) {
        const result = schema['~standard'].validate(value)
        return result instanceof Promise ? result.then(translate) : translate(result)
      },
    },
  } as S
}
```
Usage: `<UForm :schema="useTranslatedSchema(contactSchema)">`.

### Path: terminal command
```bash
npm install -D @standard-schema/spec
```

## Packages

### Path: terminal command
```bash
npm install @nuxtjs/i18n
```
