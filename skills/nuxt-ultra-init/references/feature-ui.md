# Nuxt UI Feature

## Condition
Apply only when `@nuxt/ui` is selected.

After the baseline the app is `app/app.vue` and `app/pages/index.vue` (rendering `<NuxtWelcome>`). This feature overwrites both and creates the layout and components below.

If Dashboard is selected with `dashboardRoute` = `/`, skip the **public shell** files (`app/layouts/default.vue`, `app/pages/index.vue`, `MainHeader`, `MainFooter`); the dashboard feature provides the default layout and index page instead. Delete the base `app/pages/index.vue`.

## File Updates

### Path: nuxt.config.ts
Add to `modules`:
```ts
'@nuxt/ui',
```

Add top-level:
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
Replace the file. `UApp` is required by Nuxt UI for toasts, tooltips and overlays.

```vue
<script setup lang="ts">
const colorMode = useColorMode()
const route = useRoute()
const themeColor = computed(() => (colorMode.value === 'dark' ? '#18181B' : 'white'))

useHead({
  htmlAttrs: { lang: 'en' },
  meta: [
    { key: 'theme-color', name: 'theme-color', content: themeColor },
  ],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
})

const title = computed(() => (route.meta.title as string | undefined) ?? '')
const description = computed(() => (route.meta.description as string | undefined) ?? '')

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: 'website',
  ogImage: '/img/og.png',
  twitterCard: 'summary_large_image',
  twitterTitle: title,
  twitterDescription: description,
})
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator color="repeating-linear-gradient(to right, var(--ui-color-primary-400) 0%, var(--ui-color-primary-600) 50%, var(--ui-color-primary-800) 100%)" />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
```

### Path: app/layouts/default.vue (public shell)
```vue
<template>
  <div>
    <MainHeader />

    <UMain>
      <slot />
    </UMain>

    <MainFooter />
  </div>
</template>
```

### Path: app/pages/index.vue (public shell)
```vue
<template>
  <UPage>
    <UPageHero
      title="Nuxt Ultra"
      description="Your opinionated Nuxt starter. Edit app/pages/index.vue to get going."
      class="min-h-[calc(100vh-150px)] flex items-center justify-center"
    />
  </UPage>
</template>
```

### Path: app/components/main/Header.vue (public shell)
```vue
<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const items: NavigationMenuItem[] = [
  { label: 'Home', to: '/' },
  { label: 'Nuxt Docs', to: 'https://nuxt.com/docs', target: '_blank' },
]
</script>

<template>
  <UHeader
    mode="slideover"
    :ui="{ body: 'h-full' }"
  >
    <template #title>
      <CommonLogo class="h-6 w-auto" />
    </template>

    <UNavigationMenu :items="items" />

    <template #right>
      <CommonColorModeButton class="flex" />
    </template>

    <template #body>
      <UNavigationMenu
        :items="items"
        orientation="vertical"
        class="-mx-2.5"
      />
    </template>
  </UHeader>
</template>
```

### Path: app/components/main/Footer.vue (public shell)
```vue
<template>
  <USeparator
    :avatar="{
      src: '/img/logo.svg',
      size: '3xl',
      class: 'p-2',
    }"
    class="h-px"
  />

  <UFooter>
    <template #left>
      <p class="text-muted text-sm">
        Copyright © {{ new Date().getFullYear() }}
      </p>
    </template>

    <template #right>
      <UButton
        icon="i-simple-icons-github"
        color="neutral"
        variant="ghost"
        to="https://github.com/nuxt/nuxt"
        target="_blank"
        aria-label="GitHub"
      />
    </template>
  </UFooter>
</template>
```

### Path: app/components/common/Logo.vue
```vue
<script setup lang="ts">
defineProps<{
  to?: string
}>()
</script>

<template>
  <NuxtLink
    :to="to ?? '/'"
    class="flex items-center"
    aria-label="Home"
  >
    <img
      src="/img/logo.svg"
      alt="Nuxt Ultra"
      class="h-8 w-8"
      width="32"
      height="32"
    >
  </NuxtLink>
</template>
```

### Path: app/components/common/ColorModeButton.vue
Theme toggle with a circular View Transition reveal. Falls back to an instant switch where the API is unavailable.

```vue
<script setup lang="ts">
const colorMode = useColorMode()

const nextTheme = computed(() => (colorMode.value === 'dark' ? 'light' : 'dark'))

function switchTheme() {
  colorMode.preference = nextTheme.value
}

function startViewTransition(event: MouseEvent) {
  if (!document.startViewTransition) {
    switchTheme()
    return
  }

  const x = event.clientX
  const y = event.clientY
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  )

  const transition = document.startViewTransition(() => {
    switchTheme()
  })

  transition.ready.then(() => {
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 600,
        easing: 'cubic-bezier(.76,.32,.29,.99)',
        pseudoElement: '::view-transition-new(root)',
      },
    )
  })
}
</script>

<template>
  <ClientOnly>
    <UButton
      :aria-label="`Switch to ${nextTheme} mode`"
      :icon="`i-lucide-${nextTheme === 'dark' ? 'sun' : 'moon'}`"
      color="neutral"
      variant="ghost"
      size="sm"
      class="rounded-full"
      @click="startViewTransition"
    />
    <template #fallback>
      <div class="size-4" />
    </template>
  </ClientOnly>
</template>

<style>
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}

::view-transition-new(root) {
  z-index: 9999;
}

::view-transition-old(root) {
  z-index: 1;
}
</style>
```

### Path: .vscode/settings.json
Merge in:
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
  ]
}
```

## Packages

### Path: terminal command
```bash
npm install @nuxt/ui
npm install -D @iconify-json/lucide @iconify-json/simple-icons
```

Nuxt UI v4 bundles Tailwind CSS v4; no separate install is needed. With pnpm, add `shamefully-hoist=true` to `.npmrc`.

Install every icon collection the app uses as an `@iconify-json/*` dev dependency. Without the local collection, Nuxt Icon fetches icons from the Iconify API at request time, which fails on edge runtimes such as Cloudflare Workers and slows SSR everywhere else. `lucide` is the default set; `simple-icons` covers the OAuth buttons.

## i18n addendum
Apply only when `@nuxtjs/i18n` is also selected. Update `app/app.vue`:

```vue
<script setup lang="ts">
import * as locales from '@nuxt/ui/locale'

const colorMode = useColorMode()
const route = useRoute()
const { locale, locales: availableLocales } = useI18n()
const head = useLocaleHead()
const themeColor = computed(() => (colorMode.value === 'dark' ? '#18181B' : 'white'))

const current = computed(() => availableLocales.value.find(l => l.code === locale.value))
const dir = computed(() => current.value?.dir ?? 'ltr')
const lang = computed(() => current.value?.language ?? locale.value)
// `font-rtl` is defined in main.css when an RTL locale is selected (see the i18n feature).
const rootClass = computed(() => (dir.value === 'rtl' ? 'font-rtl' : 'font-sans'))

useHead(() => ({
  htmlAttrs: { lang: lang.value, dir: dir.value, class: rootClass.value },
  link: [
    ...(head.value.link || []),
    { rel: 'icon', href: '/favicon.ico' },
  ],
  meta: [
    ...(head.value.meta || []),
    { key: 'theme-color', name: 'theme-color', content: themeColor.value },
  ],
}))

const title = computed(() => (route.meta.title as string | undefined) ?? '')
const description = computed(() => (route.meta.description as string | undefined) ?? '')

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: 'website',
  ogImage: '/img/og.png',
  twitterCard: 'summary_large_image',
  twitterTitle: title,
  twitterDescription: description,
})

const uiLocale = computed(() => {
  const key = locale.value.replace('-', '_') as keyof typeof locales
  return locales[key] ?? locales.en
})
</script>

<template>
  <UApp :locale="uiLocale">
    <NuxtLoadingIndicator />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
```

Also add `<CommonLocaleSwitch />` next to `<CommonColorModeButton />` in `app/components/main/Header.vue` (the component is created by the i18n feature).
