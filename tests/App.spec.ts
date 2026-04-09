import { describe, it, expect, beforeEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import App from '../src/App.vue'
import PrimeVue from 'primevue/config'
import { i18n } from '../src/i18n'

describe('App', () => {
  let wrapper: VueWrapper<any>

  beforeEach(() => {
    wrapper = mount(App, {
      global: {
        plugins: [PrimeVue, i18n],
        stubs: {
          InputText: true,
          AutoComplete: true,
          SelectButton: true,
          // We can stub the child views or let them render if they are simple enough
          NewNoteView: false,
          HistoryView: false,
          FavoritesView: true,
          RecommendedView: true,
          WorkbenchView: true,
          SettingsView: true
        }
      }
    })
  })

  it('renders the sidebar correctly', () => {
    expect(wrapper.get('aside').text()).toContain('冷凍兔肉的工坊')
    expect(wrapper.get('aside').text()).toContain('寫張新筆記')
    expect(wrapper.get('aside').text()).toContain('翻開舊紀錄')
  })

  it('defaults to "new note" view', () => {
    expect(wrapper.text()).toContain('寫張新筆記')
    expect(wrapper.text()).toContain('輸入筆記名稱與欲追蹤的物品以建立配方清單')
  })

  it('switches to history view when history button is clicked', async () => {
    // Find the history button in the sidebar
    const historyButton = wrapper.findAll('aside button').find(b => b.text().includes('翻開舊紀錄'))
    expect(historyButton).toBeDefined()
    
    // Click the history button
    await historyButton!.trigger('click')
    
    // Check if the view switched
    expect(wrapper.text()).toContain('翻開舊紀錄')
    expect(wrapper.text()).toContain('這裡記錄了你所有的歷史製作清單')
  })
})
