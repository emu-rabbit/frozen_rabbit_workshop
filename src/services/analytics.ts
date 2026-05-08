const CONSENT_KEY = 'frozen-rabbit-analytics-consent'
const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID

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
  window.gtag('config', MEASUREMENT_ID)

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
  document.head.appendChild(script)
}
