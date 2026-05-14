const CONSENT_KEY = 'frozen-rabbit-analytics-consent'
const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID
const SCRIPT_ID = 'frozen-rabbit-google-analytics'
const GA_ORIGIN = window.location.origin
let hasTrackedAnalyticsReady = false
let hasDeniedAnalyticsThisSession = false
let hasConfiguredGoogleAnalytics = false

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
  if (stored === 'granted') return 'granted'

  if (stored === 'denied') {
    window.localStorage.removeItem(CONSENT_KEY)
  }

  return hasDeniedAnalyticsThisSession ? 'denied' : null
}

export const setAnalyticsConsent = (consent: AnalyticsConsent) => {
  loadGoogleAnalytics()

  if (consent === 'granted') {
    hasDeniedAnalyticsThisSession = false
    window.localStorage.setItem(CONSENT_KEY, consent)
    updateGoogleConsent('granted')
    window.gtag?.('set', 'user_properties', languageContext)
    trackPageView()
    trackAnalyticsReady()
    return
  }

  hasDeniedAnalyticsThisSession = true
  window.localStorage.removeItem(CONSENT_KEY)
  updateGoogleConsent('denied')
}

export const initializeAnalytics = () => {
  loadGoogleAnalytics()

  if (getAnalyticsConsent() === 'granted') {
    updateGoogleConsent('granted')
    trackPageView()
    trackAnalyticsReady()
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
  if (!isAnalyticsAvailable()) return

  window.dataLayer = window.dataLayer || []
  if (!window.gtag) {
    window.gtag = function gtag() {
      window.dataLayer?.push(arguments)
    }
  }

  if (!hasConfiguredGoogleAnalytics) {
    hasConfiguredGoogleAnalytics = true
    window.gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      wait_for_update: 500,
    })
    window.gtag('js', new Date())
    window.gtag('config', MEASUREMENT_ID, {
      send_page_view: false,
    })
    window.gtag('set', 'user_properties', languageContext)
  }

  if (document.getElementById(SCRIPT_ID)) {
    return
  }

  const script = document.createElement('script')
  script.id = SCRIPT_ID
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
  script.addEventListener('load', () => {
    if (getAnalyticsConsent() !== 'granted') return

    trackPageView()
    trackAnalyticsReady()
  }, { once: true })
  document.head.appendChild(script)
}

const updateGoogleConsent = (analyticsConsent: AnalyticsConsent) => {
  if (!isAnalyticsAvailable() || !window.gtag) return

  window.gtag('consent', 'update', {
    analytics_storage: analyticsConsent,
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  })
}
