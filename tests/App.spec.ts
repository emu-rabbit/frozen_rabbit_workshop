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
          SelectButton: true
        }
      }
    })
  })

  it('renders the sidebar correctly', () => {
    expect(wrapper.text()).toContain('冷凍兔肉的工坊')
    expect(wrapper.text()).toContain('新筆記')
    expect(wrapper.text()).toContain('歷史筆記')
  })

  it('defaults to "new note" view', () => {
    expect(wrapper.text()).toContain('建立新筆記')
    expect(wrapper.text()).toContain('輸入筆記名稱與欲追蹤的物品以建立配方清單')
  })

  it('switches to history view when history button is clicked', async () => {
    // Find the history button
    const historyButton = wrapper.findAll('button').find(b => b.text().includes('歷史筆記'))
    expect(historyButton).toBeDefined()
    
    // Click the history button
    await historyButton!.trigger('click')
    
    // Check if the view switched
    expect(wrapper.text()).toContain('歷史筆記')
    expect(wrapper.text()).toContain('檢視之前的製作試算紀錄')
  })
})
