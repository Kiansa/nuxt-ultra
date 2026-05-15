# Nuxt UI Feature

## Condition
Apply only when `@nuxt/ui` is selected.

## File Updates

### Path: .vscode/settings.json
add the following:
```json
{
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "editor.quickSuggestions": {
    "strings": "on"
  },
  "tailwindCSS.classAttributes": ["class", "ui"],
  "tailwindCSS.classFunctions": ["defineAppConfig"],
  "tailwindCSS.experimental.classRegex": [
    ["ui:\\s*{([^)]*)\\s*}", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ],
}

```

### Path: nuxt.config.ts
Add to `modules`:
```ts
'@nuxt/ui',
```

Add to `css`:
```ts
css: ['~/assets/css/main.css'],
```

### Path: app/assets/css/main.css
```css
@import "tailwindcss";
@import "@nuxt/ui";

@theme static {
  --font-sans: 'Noto Sans', sans-serif;
}

:root {
  scroll-behavior: smooth;
}
```

### Path: app/app.config.ts
```ts
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'purple',
      neutral: 'zinc',
    },
  },
})
```

### Path: app/app.vue
Wrap the root template in `<UApp>`:

```vue
<script setup lang="ts">
const colorMode = useColorMode()
const route = useRoute()
const color = computed(() => (colorMode.value === 'dark' ? '#18181B' : 'white'))

useHead({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: color.value },
  ],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: { lang: 'en' },
})

const title = computed(() => (route.meta.title as string) || '')
const description = computed(() => (route.meta.description as string) || '')

useSeoMeta({
  title: () => title.value,
  description: () => description.value,
  ogTitle: () => title.value,
  ogDescription: () => description.value,
  ogType: 'website',
  ogImage: '/img/og.png',
  ogLocale: () => locale.value,
  ogLocaleAlternate: () => localeCodes.value,
  twitterCard: 'summary_large_image',
  twitterTitle: () => title.value,
  twitterDescription: () => description.value,
})
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
```

If i18n feature is selected, also import locales  and add to template:

```vue
<script setup lang="ts">
import * as locales from '@nuxt/ui/locale'

const colorMode = useColorMode()
const route = useRoute()
const color = computed(() => (colorMode.value === 'dark' ? '#18181B' : 'white'))

// I18n and SEO
const { t, locale, localeCodes } = useI18n()
const head = useLocaleHead()
const title = computed(() => t((route.meta.title as string) ?? 'seo_title'))
const description = computed(() => t((route.meta.description as string) ?? 'seo_description'))
const lang = computed(() => locale.value === 'fa' ? 'fa-IR' : locale.value)
const dir = computed(() => locale.value === 'fa' ? 'rtl' : 'ltr')
const rootClass = computed(() => (locale.value === 'fa' ? 'smooth-scroll font-vazir' : 'smooth-scroll font-sans'))

useHead(() => ({
  htmlAttrs: {
    lang,
    dir,
    class: rootClass,
  },
  link: [
    ...(head.value.link || []),
    { rel: 'shortcut icon', href: '/favicon.ico' },
    { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
    { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
    { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
    { rel: 'mask-icon', href: '/safari-pinned-tab.svg', color: color.value },
    { rel: 'manifest', href: '/site.webmanifest', crossorigin: 'use-credentials' },
  ],
  meta: [...(head.value.meta || []),
    { name: 'apple-mobile-web-app-title', content: 'Salut' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'msapplication-TileColor', content: color.value },
    { name: 'theme-color', content: color.value },
  ],
}))

useSeoMeta({
  title: () => title.value,
  description: () => description.value,
  ogTitle: () => title.value,
  ogDescription: () => description.value,
  ogType: 'website',
  ogImage: '/img/og.png',
  ogLocale: () => locale.value,
  ogLocaleAlternate: () => localeCodes.value,
  twitterCard: 'summary_large_image',
  twitterTitle: () => title.value,
  twitterDescription: () => description.value,
})
</script>

<template>
  <UApp
    :locale="locale === 'fa' ? locales.fa_ir : locales[locale]"
  >
    <NuxtLoadingIndicator />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
```

## Packages

### Path: terminal command
```bash
npm install @nuxt/ui tailwindcss
```
