# SEO Feature

## Condition
Apply only when `@nuxtjs/seo` is selected.

## File Updates

### Path: nuxt.config.ts
```ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/seo'],
  runtimeConfig: {
    public: {
      siteUrl: '',
      siteName: '',
    },
  },
  ogImage: {
    zeroRuntime: true,
  },
  sitemap: {
    zeroRuntime: true
  },
})
```

### Path: .env.local
```dotenv
NUXT_SITE_URL="<siteUrl>"
NUXT_SITE_NAME="<siteName>"
```

### Path: .env.production
```dotenv
NUXT_SITE_URL="<siteUrl>"
NUXT_SITE_NAME="<siteName>"
```

## Packages

### Path: terminal command
```bash
npm install @nuxtjs/seo
```
