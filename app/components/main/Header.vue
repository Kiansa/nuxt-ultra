<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Docs',
    to: '#',
    active: route.path.startsWith('/docs/getting-started'),
  },
  {
    label: 'Components',
    to: '#',
    active: route.path.startsWith('/docs/components'),
  },
  {
    label: 'Figma',
    to: 'https://go.nuxt.com/figma-ui',
    target: '_blank',
  },
  {
    label: 'Releases',
    to: 'https://github.com/nuxt/ui/releases',
    target: '_blank',
  },
])
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
