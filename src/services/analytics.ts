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

type AnalyticsThemeContext = {
  app_theme_mode?: 'light' | 'dark'
}

type AnalyticsMarketSettingsContext = {
  app_market_region?: string
  app_market_data_center?: string
  app_market_cost_strategy?: string
}

let languageContext: AnalyticsLanguageContext = {}
let themeContext: AnalyticsThemeContext = {}
let marketSettingsContext: AnalyticsMarketSettingsContext = {}

export type AnalyticsConsent = 'granted' | 'denied'
export type WorkbenchNoteSource = 'created' | 'history' | 'favorites' | 'recommended'

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
    window.gtag?.('set', 'user_properties', getUserProperties())
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

  window.gtag('set', 'user_properties', getUserProperties())
  window.gtag('event', 'language_context_updated', {
    send_to: MEASUREMENT_ID,
    ...languageContext,
  })
}

export const setAnalyticsThemeMode = (isDarkMode: boolean) => {
  themeContext = {
    app_theme_mode: isDarkMode ? 'dark' : 'light',
  }

  if (!isAnalyticsAvailable() || getAnalyticsConsent() !== 'granted' || !window.gtag) return

  window.gtag('set', 'user_properties', getUserProperties())
  window.gtag('event', 'theme_context_updated', {
    send_to: MEASUREMENT_ID,
    ...themeContext,
  })
}

export const setAnalyticsMarketSettings = (context: {
  marketRegion: string
  marketDataCenter: string
  marketCostStrategy: string
}) => {
  marketSettingsContext = {
    app_market_region: context.marketRegion,
    app_market_data_center: context.marketDataCenter,
    app_market_cost_strategy: context.marketCostStrategy,
  }

  if (!isAnalyticsAvailable() || getAnalyticsConsent() !== 'granted' || !window.gtag) return

  window.gtag('set', 'user_properties', getUserProperties())
  window.gtag('event', 'market_settings_context_updated', {
    send_to: MEASUREMENT_ID,
    ...marketSettingsContext,
  })
}

const getUserProperties = () => ({
  ...languageContext,
  ...themeContext,
  ...marketSettingsContext,
})

const getCommonEventParams = () => ({
  ...getUserProperties(),
})

export const getWorkbenchItemCountBucket = (itemCount: number) => {
  if (itemCount <= 1) return '1'
  if (itemCount <= 3) return '2~3'
  if (itemCount <= 5) return '4~5'
  if (itemCount <= 10) return '6~10'
  if (itemCount <= 20) return '10~20'
  return '20+'
}

export const trackWorkbenchNoteOpened = (context: {
  noteSource: WorkbenchNoteSource
  itemCount: number
}) => {
  if (!isAnalyticsAvailable() || getAnalyticsConsent() !== 'granted' || !window.gtag) return

  window.gtag('event', 'workbench_note_opened', {
    send_to: MEASUREMENT_ID,
    ...getCommonEventParams(),
    note_source: context.noteSource,
    item_count: context.itemCount,
    workbench_item_count_bucket: getWorkbenchItemCountBucket(context.itemCount),
  })
}

export const trackRecommendedNoteOpened = (context: {
  noteNameTw: string
  itemCount: number
}) => {
  if (!isAnalyticsAvailable() || getAnalyticsConsent() !== 'granted' || !window.gtag) return

  window.gtag('event', 'recommended_note_opened', {
    send_to: MEASUREMENT_ID,
    ...getCommonEventParams(),
    recommended_note_name_tw: context.noteNameTw,
    item_count: context.itemCount,
    workbench_item_count_bucket: getWorkbenchItemCountBucket(context.itemCount),
  })
}

export const trackTodoListGenerated = () => {
  if (!isAnalyticsAvailable() || getAnalyticsConsent() !== 'granted' || !window.gtag) return

  window.gtag('event', 'todo_list_generated', {
    send_to: MEASUREMENT_ID,
    ...getCommonEventParams(),
  })
}

export const trackTodoListExported = (context: {
  includeMarket: boolean
  todoItemCount: number
}) => {
  if (!isAnalyticsAvailable() || getAnalyticsConsent() !== 'granted' || !window.gtag) return

  window.gtag('event', 'todo_list_exported', {
    send_to: MEASUREMENT_ID,
    ...getCommonEventParams(),
    include_market: context.includeMarket,
    todo_item_count: context.todoItemCount,
  })
}

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
    window.gtag('set', 'user_properties', getUserProperties())
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
