# SEO Feature

## Condition
Apply only when `@nuxtjs/seo` is selected.

`@nuxtjs/seo` bundles `nuxt-site-config`, which reads `NUXT_SITE_URL`, `NUXT_SITE_NAME` and `NUXT_SITE_DESCRIPTION` from the environment at runtime. Use `useSiteConfig()` in app code to read them; do not duplicate them under `runtimeConfig.public`.

## File Updates

### Path: nuxt.config.ts
Add to `modules`:
```ts
'@nuxtjs/seo',
```

Add top-level:
```ts
site: {
  url: '<siteUrl>',
  name: '<siteName>',
  description: '<siteDescription>',
},

ogImage: {
  zeroRuntime: true,
},

sitemap: {
  zeroRuntime: true,
},
```

`zeroRuntime` generates OG images and the sitemap only during prerender. The base `nitro.prerender` config already crawls from `/`. If the app later needs runtime sitemap generation (for example dynamic routes not reachable by crawling), remove `sitemap.zeroRuntime`.

### Path: .env.local
```dotenv
# SEO
NUXT_SITE_URL="http://localhost:<devPort>"
NUXT_SITE_NAME="<siteName>"
NUXT_SITE_DESCRIPTION="<siteDescription>"
```

### Path: .env.production
```dotenv
# SEO
NUXT_SITE_URL="<siteUrl>"
NUXT_SITE_NAME="<siteName>"
NUXT_SITE_DESCRIPTION="<siteDescription>"
```

### Path: public/img/og.png
Tell the user that `app.vue` references `/img/og.png` as the default social image and that they should add one (1200×630).

## Packages

### Path: terminal command
```bash
npm install @nuxtjs/seo
```
