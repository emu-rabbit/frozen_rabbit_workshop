import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { flushPromises, mount, VueWrapper } from '@vue/test-utils'
import App from '../src/App.vue'
import PrimeVue from 'primevue/config'
import { createI18n } from 'vue-i18n'
import twLocale from '../src/i18n/locales/tw'

// Mock the async locale loader and dictionary services
vi.mock('../src/i18n', async (importOriginal) => {
  const actual = await importOriginal<any>()
  return {
    ...actual,
    loadLocaleMessages: vi.fn().mockResolvedValue(undefined)
  }
})

vi.mock('../src/services/dictionary', () => ({
  ensureCatalogLoaded: vi.fn().mockResolvedValue([]),
  ensureWorkbenchDataLoaded: vi.fn().mockResolvedValue(undefined),
  setDictionaryLanguage: vi.fn()
}))

describe('App', () => {
  let wrapper: VueWrapper<any>

  beforeEach(() => {
    // 1. Mock HTMLElement.prototype.scrollTo for JSDOM
    HTMLElement.prototype.scrollTo = vi.fn();

    // Start on the new-note route without onboarding dialogs.
    localStorage.clear();
    localStorage.setItem('frozen-rabbit-initialized', 'true');
    localStorage.setItem('frozen-rabbit-migration-dismissed', 'true');
    window.history.replaceState(null, '', '/');

    // 3. Create a synchronous i18n instance
    const i18n = createI18n({
      legacy: false,
      locale: 'tw',
      messages: {
        tw: twLocale
      }
    })

    // 4. Mount App with proper global configuration
    wrapper = mount(App, {
      global: {
        plugins: [PrimeVue, i18n],
        stubs: {
          // Stub complex components to keep the App test focused on layout & navigation
          InputText: true,
          AutoComplete: true,
          SelectButton: true,
          NewNoteView: { template: '<div class="new-note-view">寫張新筆記</div>' },
          HistoryView: { template: '<div class="history-view">翻開舊紀錄</div>' },
          FavoritesView: true,
          RecommendedView: true,
          WorkbenchView: true,
          TodoListView: true,
          SettingsView: true,
          SponsorModal: true,
          LanguageSelectModal: true
        }
      }
    })
  })

  afterEach(() => {
    wrapper.unmount();
    localStorage.clear();
    window.history.replaceState(null, '', '/');
  });

  it('switches to the history view when the history button is clicked', async () => {
    await flushPromises();
    expect(wrapper.find('.new-note-view').exists()).toBe(true);
    // Find the history button in the sidebar using the correct i18n text
    const sidebar = wrapper.get('aside');
    const buttons = sidebar.findAll('button');
    const historyButton = buttons.find(b => b.text().includes('翻開舊筆記'));
    
    expect(historyButton).toBeDefined();
    
    // Simulate navigation click
    await historyButton!.trigger('click');
    
    // Check if the view switched to the stubbed HistoryView
    expect(wrapper.find('.history-view').exists()).toBe(true);
    expect(wrapper.text()).toContain('翻開舊紀錄');
  });

})
