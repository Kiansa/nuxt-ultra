<script setup lang="ts">
</script>

<template>
  <div class="relative flex min-h-screen items-center justify-center">
    <div
      class="absolute left-1/2 size-40 -translate-x-1/2 -translate-y-80 transform rounded-full blur-[250px] sm:size-50 dark:bg-(--ui-primary)"
    />
    <StarsBg />
    <CommonLogo class="absolute top-8 left-8 rounded-full" />
    <UColorModeButton
      class="absolute top-8 right-8"
      variant="link"
      size="xl"
      color="neutral"
    />

    <UPageCard variant="subtle">
      <slot />
    </UPageCard>
  </div>
</template>
