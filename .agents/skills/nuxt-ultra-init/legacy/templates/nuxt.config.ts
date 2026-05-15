// @ts-nocheck
%%i18nImport%%
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: [
    '@nuxt/ui',
    %%i18nModule%%
    %%supabaseModule%%
    %%seoModule%%
    '@nuxt/eslint',
  ],

  devtools: { enabled: false },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      siteUrl: '%%siteUrl%%',
      siteName: '%%siteName%%',
    },
    %%R2%%
  },

  %%i18nConfig%%

  compatibilityDate: '2025-11-02',

  nitro: {
    prerender: {
      crawlLinks: true,
      routes: [
        '/',
      ],
    },
    %%storageConfig%%
    %%cloudflareConfig%%
  },

  eslint: {
    config: {
      stylistic: true,
    },
  },
  
  %%supabaseConfig%%

  %%ogImage%%
})
