import { createI18n } from 'vue-i18n'

export const i18n = createI18n({
  legacy: false,
  locale: 'tw',
  fallbackLocale: 'en',
  messages: {}
})
 
const loadedLocales: string[] = []

export async function loadLocaleMessages(locale: string) {
  if (loadedLocales.includes(locale)) {
    return
  }

  try {
    const messages = await import(`./locales/${locale}.ts`)
    i18n.global.setLocaleMessage(locale, messages.default)
    loadedLocales.push(locale)
  } catch (error) {
    console.error(`Failed to load locale messages for ${locale}:`, error)
  }
}
