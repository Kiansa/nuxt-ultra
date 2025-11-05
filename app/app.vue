<script setup lang="ts">
import * as locales from '@nuxt/ui/locale'

const config = useRuntimeConfig()
const colorMode = useColorMode()
const route = useRoute()
const color = computed(() => (colorMode.value === 'dark' ? '#18181B' : 'white'))

// #region Cookie Consent Toast
// const toast = useToast()

// onMounted(async () => {
//   const cookie = useCookie('cookie-consent')
//   if (cookie.value === 'accepted') {
//     return
//   }

//   toast.add({
//     title: 'We use first-party cookies to enhance your experience on our website.',
//     duration: 0,
//     close: false,
//     actions: [
//       {
//         label: 'Accept',
//         color: 'neutral',
//         variant: 'outline',
//         onClick: () => {
//           cookie.value = 'accepted'
//         },
//       },
//       {
//         label: 'Opt out',
//         color: 'neutral',
//         variant: 'ghost',
//       },
//     ],
//   })
// })
// #endregion
useHead({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: color },
  ],
  link: [{ rel: 'icon', href: '/favicon.ico' }],
  htmlAttrs: {
    lang: 'en',
  },
})
const title = computed(() => (route.meta.title as string) || '')
const description = computed(() => (route.meta.description as string) || '')
useSeoMeta({
  title,
  description,
  ogTitle: title.value,
  ogDescription: description.value,
  ogImage: '/img/og.png',
  twitterImage: '/img/og.png',
  twitterCard: 'summary_large_image',
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
