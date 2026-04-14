import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import App from '../src/App.vue'
import PrimeVue from 'primevue/config'
import { createI18n } from 'vue-i18n'
import twLocale from '../src/i18n/locales/tw'

describe('App', () => {
  let wrapper: VueWrapper<any>

  beforeEach(() => {
    // 1. Mock HTMLElement.prototype.scrollTo for JSDOM
    HTMLElement.prototype.scrollTo = vi.fn();

    // 2. Mock localStorage to bypass WelcomeModal
    const localStorageMock = (function() {
      let store: Record<string, string> = {};
      return {
        getItem: (key: string) => store[key] || (key === 'has_visited' ? 'true' : null),
        setItem: (key: string, value: string) => { store[key] = value.toString(); },
        clear: () => { store = {}; }
      };
    })();
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

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

  it('renders the sidebar correctly with all nav items', () => {
    const sidebar = wrapper.get('aside');
    expect(sidebar.text()).toContain('冷凍兔肉的工坊');
    expect(sidebar.text()).toContain('寫張新筆記');
    expect(sidebar.text()).toContain('翻開舊筆記'); // Correct terminology from tw.ts
    expect(sidebar.text()).toContain('兔肉私心筆記');
  });

  it('defaults to the "New Note" view', () => {
    // Check if the home view content is present
    expect(wrapper.find('.new-note-view').exists()).toBe(true);
    expect(wrapper.text()).toContain('寫張新筆記');
  });

  it('switches to the history view when the history button is clicked', async () => {
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

  it('maintains a structured layout with sidebar and main containers', () => {
    expect(wrapper.find('aside').exists()).toBe(true);
    expect(wrapper.find('main').exists()).toBe(true);
  });
})
