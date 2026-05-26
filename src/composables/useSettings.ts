import { useLocalStorage } from '@vueuse/core'
import {
  DEFAULT_MARKET_DATA_CENTER,
  DEFAULT_MARKET_REGION
} from '../data/marketServers'

export type Language = 'tw' | 'en' | 'ja' | 'cn'

export function useSettings() {
  const language = useLocalStorage<Language>('frozen-rabbit-lang', 'tw')
  const debugMode = useLocalStorage<boolean>('frozen-rabbit-debug-mode', false)
  const marketRegion = useLocalStorage<string>('frozen-rabbit-market-region', DEFAULT_MARKET_REGION)
  const marketDC = useLocalStorage<string>('frozen-rabbit-market-dc', DEFAULT_MARKET_DATA_CENTER)
  const marketCostStrategy = useLocalStorage<'aggressive' | 'balanced' | 'conservative'>('frozen-rabbit-market-strategy', 'balanced')
  const isDarkMode = useLocalStorage<boolean>('frozen-rabbit-dark-mode', false)
  const initialized = useLocalStorage<boolean>('frozen-rabbit-initialized', false)

  return {
    language,
    debugMode,
    marketRegion,
    marketDC,
    marketCostStrategy,
    isDarkMode,
    initialized
  }
}
