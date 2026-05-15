// Dynamic locale loader for Nuxt i18n that fetches translations from an API endpoint
// Use this when translations are stored externally (database, CMS, API) rather than static files
export default defineI18nLocale((locale: string) => {
  const url = `/api/v1/locales/${locale}`
  return $fetch(url)
})