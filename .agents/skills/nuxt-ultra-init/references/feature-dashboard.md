# Dashboard Feature

## Condition
- Apply only when `dashboard` is selected.
- Implement based on the UI feature selection

## File Updates if User Dashboard is selected:

### Path: app/layouts/dashboard.vue
Nuxt UI:

```vue
<script setup lang="ts">

</script>

<template>
  <UDashboardGroup unit="rem">
    <SidebarNav />

    <slot />

    <!-- <NotificationsSlideover /> -->
  </UDashboardGroup>
</template>
```

### Path: app/pages/(protected)/dashboard.vue
```vue
<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
</script>

<template>
  <NuxtPage />
</template>
```

### Path: app/pages/(protected)/dashboard/index.vue
Nuxt UI:

```vue
<script setup lang="ts">
</script>

<template>
  <UDashboardPanel id="dashboard">
    <template #header>
      <UDashboardNavbar title="Dashboard">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      
    </template>
  </UDashboardPanel>
</template>
```

## File Updates if admin Dashboard is selected:

### Path: app/layouts/admin.vue
Nuxt UI:

```vue
<script setup lang="ts">

</script>

<template>
  <UDashboardGroup unit="rem">
    <SidebarNav />

    <slot />

    <!-- <NotificationsSlideover /> -->
  </UDashboardGroup>
</template>
```

### Path: app/pages/(protected)/admin.vue
```vue
<script setup lang="ts">
definePageMeta({ layout: 'admin' })
</script>

<template>
  <NuxtPage />
</template>
```

### Path: app/pages/(protected)/admin/index.vue
Nuxt UI:

```vue
<script setup lang="ts">
</script>

<template>
  <UDashboardPanel id="admin">
    <template #header>
      <UDashboardNavbar title="Admin Dashboard">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
        </template>
      </UDashboardNavbar>
    </template>
    <template #body>
      
    </template>
  </UDashboardPanel>
</template>
```