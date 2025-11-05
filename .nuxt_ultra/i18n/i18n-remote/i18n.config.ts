import type { NuxtI18nOptions, Strategies } from '@nuxtjs/i18n'

const i18nConfig: Partial<NuxtI18nOptions> = {
  langDir: 'locales',
  baseUrl: '%%siteUrl%%',
  locales: [
    { code: 'en', name: 'English', language: 'en-US', dir: 'ltr', file: { path: 'language.ts', cache: false } },
    { code: 'fa', name: 'فارسی', language: 'fa-IR', dir: 'rtl', file: { path: 'language.ts', cache: false } },
  ],
  trailingSlash: false,
  debug: false,
  defaultLocale: '%%defaultLocale%%',
  strategy: 'prefix_except_default' as Strategies,
  detectBrowserLanguage: { useCookie: true, alwaysRedirect: true },
}

export default i18nConfig
