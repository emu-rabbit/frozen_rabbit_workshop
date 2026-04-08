import { useLocalStorage } from '@vueuse/core'

export type Language = 'tw' | 'en' | 'ja' | 'cn'

export function useSettings() {
  const language = useLocalStorage<Language>('frozen-rabbit-lang', 'tw')
  const debugMode = useLocalStorage<boolean>('frozen-rabbit-debug-mode', false)

  return {
    language,
    debugMode
  }
}
