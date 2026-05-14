import { beforeEach, describe, expect, it, vi } from 'vitest'

const getGtagCalls = () => window.dataLayer?.map((entry) => Array.from(entry as IArguments)) ?? []

describe('analytics consent mode', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.unstubAllEnvs()
    vi.stubEnv('PROD', true)
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST123')
    localStorage.clear()
    document.head.innerHTML = ''
    delete window.dataLayer
    delete window.gtag
  })

  it('initializes Google consent mode as denied before analytics consent is granted', async () => {
    const { initializeAnalytics } = await import('../../src/services/analytics')

    initializeAnalytics()

    const calls = getGtagCalls()
    expect(calls).toContainEqual([
      'consent',
      'default',
      {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        wait_for_update: 500,
      },
    ])
    expect(calls).toContainEqual(['config', 'G-TEST123', { send_page_view: false }])
    expect(calls.some(([command, eventName]) => command === 'event' && eventName === 'page_view')).toBe(false)
  })

  it('updates analytics consent and starts tracking only after opt-in', async () => {
    const { initializeAnalytics, setAnalyticsConsent } = await import('../../src/services/analytics')

    initializeAnalytics()
    setAnalyticsConsent('granted')

    const calls = getGtagCalls()
    expect(calls).toContainEqual([
      'consent',
      'update',
      {
        analytics_storage: 'granted',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      },
    ])
    expect(calls.some(([command, eventName]) => command === 'event' && eventName === 'page_view')).toBe(true)
    expect(calls.some(([command, eventName]) => command === 'event' && eventName === 'analytics_ready')).toBe(true)
  })
})
