<script setup lang="ts">
defineProps<{
  collapsed?: boolean
  to?: string
}>()
</script>

<template>
  <NuxtLink
    :to="to ?? `/`"
    class="flex items-center"
  >
    <img
      src="/img/logo.svg"
      alt="Nuxt Ultra Logo"
      class="h-8 w-8 text-primary"
    /> 
  </NuxtLink>
</template>
