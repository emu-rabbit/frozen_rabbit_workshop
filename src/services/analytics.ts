const CONSENT_KEY = 'frozen-rabbit-analytics-consent'
const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID
const SCRIPT_ID = 'frozen-rabbit-google-analytics'
const GA_ORIGIN = window.location.origin
let hasTrackedAnalyticsReady = false

type AnalyticsLanguageContext = {
  app_language?: string
  browser_language?: string
  browser_languages?: string
}

let languageContext: AnalyticsLanguageContext = {}

export type AnalyticsConsent = 'granted' | 'denied'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export const isAnalyticsAvailable = () => Boolean(import.meta.env.PROD && MEASUREMENT_ID)

export const getAnalyticsConsent = (): AnalyticsConsent | null => {
  const stored = window.localStorage.getItem(CONSENT_KEY)
  return stored === 'granted' || stored === 'denied' ? stored : null
}

export const setAnalyticsConsent = (consent: AnalyticsConsent) => {
  window.localStorage.setItem(CONSENT_KEY, consent)

  if (consent === 'granted') {
    loadGoogleAnalytics()
  }
}

export const initializeAnalytics = () => {
  if (getAnalyticsConsent() === 'granted') {
    loadGoogleAnalytics()
  }
}

export const setAnalyticsLanguage = (appLanguage: string) => {
  languageContext = {
    app_language: appLanguage,
    browser_language: window.navigator.language,
    browser_languages: window.navigator.languages?.join(',') || window.navigator.language,
  }

  if (!isAnalyticsAvailable() || getAnalyticsConsent() !== 'granted' || !window.gtag) return

  window.gtag('set', 'user_properties', languageContext)
  window.gtag('event', 'language_context_updated', {
    send_to: MEASUREMENT_ID,
    ...languageContext,
  })
}

const getCommonEventParams = () => ({
  ...languageContext,
})

export const trackPageView = (pagePath = window.location.pathname + window.location.hash) => {
  if (!isAnalyticsAvailable() || getAnalyticsConsent() !== 'granted' || !window.gtag) return

  window.gtag('event', 'page_view', {
    send_to: MEASUREMENT_ID,
    ...getCommonEventParams(),
    page_title: document.title,
    page_location: `${GA_ORIGIN}${pagePath}`,
    page_path: pagePath,
  })
}

export const trackAnalyticsReady = () => {
  if (!isAnalyticsAvailable() || getAnalyticsConsent() !== 'granted' || !window.gtag || hasTrackedAnalyticsReady) return

  hasTrackedAnalyticsReady = true
  window.gtag('event', 'analytics_ready', {
    send_to: MEASUREMENT_ID,
    ...getCommonEventParams(),
    page_title: document.title,
    page_location: window.location.href,
    page_path: window.location.pathname + window.location.hash,
  })
}

export const trackRouteChange = (routeName: string) => {
  if (!isAnalyticsAvailable() || getAnalyticsConsent() !== 'granted' || !window.gtag) return

  const pagePath = `${window.location.pathname}#${routeName}`
  trackPageView(pagePath)
  window.gtag('event', 'route_change', {
    send_to: MEASUREMENT_ID,
    ...getCommonEventParams(),
    route_name: routeName,
    page_title: document.title,
    page_location: `${GA_ORIGIN}${pagePath}`,
    page_path: pagePath,
  })
}

const loadGoogleAnalytics = () => {
  if (!isAnalyticsAvailable() || window.gtag) return

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    window.dataLayer?.push(arguments)
  }

  window.gtag('js', new Date())
  window.gtag('consent', 'default', {
    analytics_storage: 'granted',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  })
  window.gtag('config', MEASUREMENT_ID, {
    send_page_view: false,
  })
  window.gtag('set', 'user_properties', languageContext)

  if (document.getElementById(SCRIPT_ID)) {
    trackPageView()
    return
  }

  const script = document.createElement('script')
  script.id = SCRIPT_ID
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
  script.addEventListener('load', () => {
    trackPageView()
    trackAnalyticsReady()
  }, { once: true })
  document.head.appendChild(script)
}
