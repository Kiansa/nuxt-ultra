// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: [
    '@nuxt/ui',
    '@nuxt/eslint',
  ],

  devtools: { enabled: false },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      siteUrl: '',
      siteName: '',
    },
  },

  compatibilityDate: '2025-11-02',

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: [
        '/',
      ],
    },
  },

  eslint: {
    config: {
      stylistic: true,
    },
  },
})
