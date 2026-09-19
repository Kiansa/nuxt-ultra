# Dashboard Feature

## Condition
Apply when Dashboard `user` and/or `admin` is selected. Requires UI `@nuxt/ui` and an Auth feature (added automatically). Uses the `useAuth()` composable created by the auth feature.

`dashboardRoute` is the answer to the dashboard route question (default `dashboard`). Below, `<dashboardRoute>` is that value and `<DashboardDir>` is the folder under `app/pages/(protected)/`.

- `dashboardRoute` = `dashboard` (or any other name): the dashboard lives at `/<dashboardRoute>` with layout `dashboard`; `/` stays the public home page from the UI feature.
- `dashboardRoute` = `/`: the app has no public home. The dashboard is `app/pages/(protected)/index.vue`, the dashboard layout becomes `app/layouts/default.vue`, and the UI feature's home page, header and footer are **not** created. Also set `nitro.prerender` to `{ crawlLinks: false, routes: [] }` because there is nothing public to prerender. Redirects after login already go to `/`.

Protection:
- Auth `nuxt-auth-utils`: everything under `app/pages/(protected)/` is protected by the global middleware. No per-page config.
- Auth `@nuxtjs/supabase`: add `/<dashboardRoute>(/*)?` and `/admin(/*)?` to `redirectOptions.include` (or `/(.*)?` with `exclude: ['/login', '/confirm']` when `dashboardRoute` is `/`). The `(protected)` folder is still used for consistency.

## Shared components (create once)

### Path: app/composables/useTheme.ts
Primary/neutral picker persisted in localStorage, plus color mode. Used by the user menu.
```ts
import colors from 'tailwindcss/colors'

const NEUTRALS = ['slate', 'gray', 'zinc', 'neutral', 'stone']
const EXCLUDED = ['inherit', 'current', 'transparent', 'black', 'white', ...NEUTRALS]

export function useTheme() {
  const appConfig = useAppConfig()
  const colorMode = useColorMode()

  const primaryColors = Object.keys(colors).filter(c => !EXCLUDED.includes(c))
  const neutralColors = NEUTRALS

  function setPrimary(color: string) {
    appConfig.ui.colors.primary = color
    if (import.meta.client) localStorage.setItem('nuxt-ui-primary', color)
  }

  function setNeutral(color: string) {
    appConfig.ui.colors.neutral = color
    if (import.meta.client) localStorage.setItem('nuxt-ui-neutral', color)
  }

  /** Call once on mount (app.vue) to restore the persisted choice. */
  function syncStorage() {
    if (!import.meta.client) return
    const primary = localStorage.getItem('nuxt-ui-primary')
    const neutral = localStorage.getItem('nuxt-ui-neutral')
    if (primary) appConfig.ui.colors.primary = primary
    if (neutral) appConfig.ui.colors.neutral = neutral
  }

  const modes = [
    { value: 'light', label: 'Light', icon: 'i-lucide-sun' },
    { value: 'dark', label: 'Dark', icon: 'i-lucide-moon' },
    { value: 'system', label: 'System', icon: 'i-lucide-monitor' },
  ]

  return { primaryColors, neutralColors, setPrimary, setNeutral, syncStorage, modes, colorMode }
}
```
Add to `app/app.vue` script: `const { syncStorage } = useTheme()` and `onMounted(syncStorage)`.

### Path: app/components/dashboard/Sidebar.vue
```vue
<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

defineProps<{
  items: NavigationMenuItem[]
}>()

const open = ref(false)
</script>

<template>
  <UDashboardSidebar
    v-model:open="open"
    collapsible
    resizable
    :ui="{ footer: 'border-t border-default' }"
  >
    <template #header="{ collapsed }">
      <CommonLogo class="h-6 w-auto" />
      <span
        v-if="!collapsed"
        class="font-semibold"
      >Nuxt Ultra</span>
    </template>

    <template #default="{ collapsed }">
      <UNavigationMenu
        :collapsed="collapsed"
        :items="items"
        orientation="vertical"
        tooltip
        @select="open = false"
      />
    </template>

    <template #footer="{ collapsed }">
      <DashboardUserMenu :collapsed="collapsed" />
    </template>
  </UDashboardSidebar>
</template>
```

### Path: app/components/dashboard/UserMenu.vue
```vue
<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
  collapsed?: boolean
}>()

const appConfig = useAppConfig()
const { displayName, avatar, logout } = useAuth()
const { primaryColors, neutralColors, setPrimary, setNeutral, modes, colorMode } = useTheme()

const items = computed<DropdownMenuItem[][]>(() => [
  [{
    type: 'label',
    label: displayName.value,
    avatar: { src: avatar.value, alt: displayName.value, icon: 'i-lucide-user' },
  }],
  [{
    label: 'Theme',
    icon: 'i-lucide-palette',
    children: [
      {
        label: 'Primary',
        slot: 'chip',
        chip: appConfig.ui.colors.primary,
        content: { align: 'center', collisionPadding: 16 },
        children: primaryColors.map(color => ({
          label: color,
          chip: color,
          slot: 'chip',
          type: 'checkbox',
          checked: appConfig.ui.colors.primary === color,
          onSelect: (e: Event) => {
            e.preventDefault()
            setPrimary(color)
          },
        })),
      },
      {
        label: 'Neutral',
        slot: 'chip',
        chip: appConfig.ui.colors.neutral,
        content: { align: 'end', collisionPadding: 16 },
        children: neutralColors.map(color => ({
          label: color,
          chip: color,
          slot: 'chip',
          type: 'checkbox',
          checked: appConfig.ui.colors.neutral === color,
          onSelect: (e: Event) => {
            e.preventDefault()
            setNeutral(color)
          },
        })),
      },
    ],
  }, {
    label: 'Appearance',
    icon: 'i-lucide-sun-moon',
    children: modes.map(mode => ({
      label: mode.label,
      icon: mode.icon,
      type: 'checkbox',
      checked: colorMode.preference === mode.value,
      onSelect: (e: Event) => {
        e.preventDefault()
        colorMode.preference = mode.value
      },
    })),
  }],
  [{
    label: 'Log out',
    icon: 'i-lucide-log-out',
    onSelect: () => logout(),
  }],
])
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      :label="collapsed ? undefined : displayName"
      :avatar="{ src: avatar, alt: displayName, icon: 'i-lucide-user' }"
      :trailing-icon="collapsed ? undefined : 'i-lucide-chevrons-up-down'"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :ui="{ trailingIcon: 'text-dimmed' }"
    />

    <template #chip-leading="{ item }">
      <span
        class="inline-flex size-5 items-center justify-center"
      >
        <span
          class="size-2 rounded-full ring ring-bg bg-(--chip-light) dark:bg-(--chip-dark)"
          :style="{
            '--chip-light': `var(--color-${(item as any).chip}-500)`,
            '--chip-dark': `var(--color-${(item as any).chip}-400)`,
          }"
        />
      </span>
    </template>
  </UDropdownMenu>
</template>
```

### Path: app/components/dashboard/Header.vue
Page header used inside `UDashboardPanel`'s `#header` slot.
```vue
<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <UDashboardNavbar
    :title="title"
    :ui="{ right: 'gap-2' }"
  >
    <template #leading>
      <UDashboardSidebarCollapse />
    </template>

    <template #right>
      <slot name="right" />
      <CommonColorModeButton />
    </template>
  </UDashboardNavbar>
</template>
```

### Path: app/components/dashboard/Panel.vue
Wraps the repetitive panel + header boilerplate so every page is a few lines.
```vue
<script setup lang="ts">
defineProps<{
  id: string
  title: string
}>()
</script>

<template>
  <UDashboardPanel :id="id">
    <template #header>
      <DashboardHeader :title="title">
        <template #right>
          <slot name="actions" />
        </template>
      </DashboardHeader>
    </template>

    <template #body>
      <slot />
    </template>
  </UDashboardPanel>
</template>
```

## User dashboard

### Path: app/layouts/dashboard.vue
When `dashboardRoute` is `/`, write this file as `app/layouts/default.vue` instead and set every dashboard page's layout to `default` (or omit `layout`).
```vue
<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const items: NavigationMenuItem[] = [
  { label: 'Overview', icon: 'i-lucide-layout-dashboard', to: '/<dashboardRoute>' },
  { label: 'Settings', icon: 'i-lucide-settings', to: '/<dashboardRoute>/settings' },
]
</script>

<template>
  <UDashboardGroup unit="rem">
    <DashboardSidebar :items="items" />

    <slot />
  </UDashboardGroup>
</template>
```
With `dashboardRoute` = `/`, the links are `/` and `/settings`.

### Path: app/pages/(protected)/<DashboardDir>/index.vue
With `dashboardRoute` = `/` this is `app/pages/(protected)/index.vue`.
```vue
<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const { displayName } = useAuth()
</script>

<template>
  <DashboardPanel
    id="overview"
    title="Overview"
  >
    <p class="text-muted">
      Welcome back, {{ displayName }}.
    </p>
  </DashboardPanel>
</template>
```

### Path: app/pages/(protected)/<DashboardDir>/settings.vue
With `dashboardRoute` = `/` this is `app/pages/(protected)/settings.vue`.
```vue
<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
</script>

<template>
  <DashboardPanel
    id="settings"
    title="Settings"
  >
    <p class="text-muted">
      Account settings go here.
    </p>
  </DashboardPanel>
</template>
```

## Admin dashboard

Always at `/admin`, layout `admin`. Same shape as the user dashboard.

### Path: app/layouts/admin.vue
```vue
<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const items: NavigationMenuItem[] = [
  { label: 'Overview', icon: 'i-lucide-shield', to: '/admin' },
  { label: 'Users', icon: 'i-lucide-users', to: '/admin/users' },
]
</script>

<template>
  <UDashboardGroup unit="rem">
    <DashboardSidebar :items="items" />

    <slot />
  </UDashboardGroup>
</template>
```

### Path: app/pages/(protected)/admin/index.vue
```vue
<script setup lang="ts">
definePageMeta({ layout: 'admin' })
</script>

<template>
  <DashboardPanel
    id="admin"
    title="Admin"
  >
    <p class="text-muted">
      Admin overview.
    </p>
  </DashboardPanel>
</template>
```

### Path: app/pages/(protected)/admin/users.vue
```vue
<script setup lang="ts">
definePageMeta({ layout: 'admin' })
</script>

<template>
  <DashboardPanel
    id="admin-users"
    title="Users"
  >
    <p class="text-muted">
      User management goes here.
    </p>
  </DashboardPanel>
</template>
```

## Packages

### Path: terminal command
`useTheme` imports the Tailwind palette:
```bash
npm install tailwindcss
```

## Tell the user
Admin routes are only protected by login, not by role. Add a `role` column to `users`, put it in the session, and check it in the middleware (or in RLS) before shipping.

## i18n addendum
Apply only when `@nuxtjs/i18n` is also selected.

1. Wrap every `to` in the layouts with `useLocalePath()` and move labels to locale files under a `dashboard` key.
2. In `DashboardSidebar` open the mobile menu from the reading side: `:menu="{ side: $i18n.localeProperties.dir === 'rtl' ? 'right' : 'left' }"`.
3. Add to `app/app.config.ts` so the collapse chevron flips in RTL:
   ```ts
   dashboardSidebarCollapse: { base: 'rtl:rotate-180' },
   ```
4. Add `<CommonLocaleSwitch />` next to `<CommonColorModeButton />` in `DashboardHeader`.
