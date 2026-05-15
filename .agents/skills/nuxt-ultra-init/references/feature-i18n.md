# i18n Feature

## Condition
Apply only when `@nuxtjs/i18n` is selected.

## Shared Updates

### Path: nuxt.config.ts
```ts
import i18nConfig from './i18n/i18n.config'

export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],
  i18n: i18nConfig,
})
```

### Path: app/components/LocaleSwitch.vue
```vue
<script setup lang="ts">
const { locale } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const selectedLocale = ref(siteLocales.find(item => item.value === locale.value))

async function changeLocale() {
  await navigateTo(switchLocalePath(selectedLocale.value!.value as typeof locale.value))
  reloadNuxtApp() // temporary fix due to nuxt ui bug for navigationMenu and footerColumns not updating
}
</script>

<template>
  <div>
    <ClientOnly>
      <USelectMenu
        v-model="selectedLocale"
        :icon="selectedLocale?.icon"
        :items="siteLocales"
        :ui="{ content: 'w-max' }"
        :content="{
          align: 'end',
          side: 'bottom',
        }"
        @change="changeLocale"
      >
        <template #leading="{ ui }">
          <UIcon
            name="i-hugeicons-language-square"
            :class="ui.leadingIcon()"
          />
        </template>
        <template #default="{ modelValue }">
          <UIcon
            v-if="modelValue"
            :name="modelValue.icon"
            class="size-5"
          />
          <UIcon
            v-else
            name="i-twemoji-globe-showing-americas"
            class="size-5"
          />
        </template>
      </USelectMenu>
    </ClientOnly>
  </div>
</template>
```

## Mode: files

### Path: i18n/i18n.config.ts
```ts
import type { NuxtI18nOptions, Strategies } from '@nuxtjs/i18n'

export const i18nConfig: Partial<NuxtI18nOptions> = {
  langDir: 'locales',
  baseUrl: '<siteUrl>',
  locales: [
    {
      code: 'fa',
      name: 'پارسی',
      language: 'fa-IR',
      file: 'fa.json',
      dir: 'rtl',
    },
    {
      code: 'en',
      name: 'English',
      language: 'en-US',
      file: 'en.json',
      dir: 'ltr',
    },
  ],
  trailingSlash: false,
  debug: false,
  defaultLocale: '<defaultLocale>',
  strategy: 'prefix_except_default' as Strategies, // Cast strategy to Strategies
  detectBrowserLanguage: { useCookie: true, alwaysRedirect: true },
}

export default i18nConfig
```

### Path: i18n/locales/en.json
```json
{
  "welcome": "Welcome"
}
```

### Path: i18n/locales/fa.json
```json
{
  "welcome": "خوش آمدید"
}
```

## Mode: remote

### Path: i18n/i18n.config.ts
```ts
import type { NuxtI18nOptions, Strategies } from '@nuxtjs/i18n'

export const i18nConfig: Partial<NuxtI18nOptions> = {
  langDir: 'locales',
  baseUrl: '<siteUrl>',
  locales: [
    {
      code: 'fa',
      name: 'پارسی',
      language: 'fa-IR',
      file: 'fa.json',
      dir: 'rtl',
      file: { path: 'language.ts', cache: false } }
    },
    {
      code: 'en',
      name: 'English',
      language: 'en-US',
      file: 'en.json',
      dir: 'ltr',
      file: { path: 'language.ts', cache: false } }
    },
  ],
  trailingSlash: false,
  debug: false,
  defaultLocale: '<defaultLocale>',
  strategy: 'prefix_except_default' as Strategies, // Cast strategy to Strategies
  detectBrowserLanguage: { useCookie: true, alwaysRedirect: true },
}

export default i18nConfig
```

### Path: i18n/locales/language.ts
```ts
// Dynamic locale loader for Nuxt i18n that fetches translations from an API endpoint
// Use this when translations are stored externally (database, CMS, API) rather than static files
export default defineI18nLocale((locale: string) => {
  const url = `/api/locales/${locale}`
  return $fetch(url)
})
```

### Path: server/api/locales/[locale].get.ts
if db is supabase:
```ts
import { serverSupabaseServiceRole } from '#supabase/server'

export default eventHandler(async (event) => {
  const locale = getRouterParam(event, 'locale')
  const supabase = serverSupabaseServiceRole(event)
  const { data, error } = await supabase.from('translations').select(`id, ${locale}`)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  const messages = data.reduce((acc, item) => {
    acc[item.id] = item[locale]
    return acc
  }, {} as Record<string, any>)

  console.log('messages', messages)
  return messages
})
```

if db is nuxt-postgrest:
```ts
export default eventHandler(async (event) => {
  const locale = getRouterParam(event, 'locale')
  const { data, error } = await db.from('translations').select(`id, ${locale}`)

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message,
    })
  }

  const messages = data.reduce((acc, item) => {
    acc[item.id] = item[locale]
    return acc
  }, {} as Record<string, any>)

  console.log('messages', messages)
  return messages
})
```

## Packages

### Path: terminal command
```bash
npm install @nuxtjs/i18n
```
