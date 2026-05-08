const CONSENT_KEY = 'frozen-rabbit-analytics-consent'
const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID
const SCRIPT_ID = 'frozen-rabbit-google-analytics'
const GA_ORIGIN = window.location.origin

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

export const trackPageView = (pagePath = window.location.pathname + window.location.hash) => {
  if (!isAnalyticsAvailable() || getAnalyticsConsent() !== 'granted' || !window.gtag) return

  window.gtag('event', 'page_view', {
    page_title: document.title,
    page_location: `${GA_ORIGIN}${pagePath}`,
    page_path: pagePath,
  })
}

const loadGoogleAnalytics = () => {
  if (!isAnalyticsAvailable() || window.gtag) return

  window.dataLayer = window.dataLayer || []
  window.gtag = (...args: unknown[]) => {
    window.dataLayer?.push(args)
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
  }, { once: true })
  document.head.appendChild(script)
}
