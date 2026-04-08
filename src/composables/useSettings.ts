import { useLocalStorage } from '@vueuse/core'

export type Language = 'tw' | 'en' | 'ja' | 'zh'

export function useSettings() {
  const language = useLocalStorage<Language>('frozen-rabbit-lang', 'tw')

  return {
    language
  }
}
