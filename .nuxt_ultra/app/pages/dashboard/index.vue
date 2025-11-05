<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
})
</script>

<template>
  <UDashboardPanel id="">
    <template #header>
      <UDashboardNavbar title="Dashboard">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      Dashboard Body
    </template>
  </UDashboardPanel>
</template>
