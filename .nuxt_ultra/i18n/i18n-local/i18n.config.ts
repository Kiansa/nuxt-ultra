import type { NuxtI18nOptions } from '@nuxtjs/i18n'

const i18nConfig: Partial<NuxtI18nOptions> = {
  langDir: 'locales',
  baseUrl: '%%siteUrl%%',
  locales: [
    { code: 'en', name: 'English', language: 'en-US', dir: 'ltr', file: 'en.json' },
    { code: 'fa', name: 'فارسی', language: 'fa-IR', dir: 'rtl', file: 'fa.json' },
  ],
  trailingSlash: false,
  debug: false,
  defaultLocale: '%%defaultLocale%%',
  strategy: 'prefix_except_default',
  detectBrowserLanguage: { useCookie: true, alwaysRedirect: true },
}

export default i18nConfig
