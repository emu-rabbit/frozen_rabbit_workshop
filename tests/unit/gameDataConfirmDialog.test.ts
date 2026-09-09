import { afterEach, expect, it } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import PrimeVue from 'primevue/config'
import GameDataConfirmDialog from '../../src/components/shared/GameDataConfirmDialog.vue'

let wrapper: VueWrapper

afterEach(() => { wrapper?.unmount() })

async function openDialog(busy = false) {
  wrapper = mount(GameDataConfirmDialog, {
    attachTo: document.body,
    props: {
      visible: true, title: 'Update ready', message: 'Apply downloaded data?',
      confirmLabel: 'Apply', cancelLabel: 'Later', busy,
      'onUpdate:visible': (visible: boolean) => { void wrapper.setProps({ visible }) }
    },
    global: {
      plugins: [PrimeVue, createI18n({ legacy: false, locale: 'en', messages: { en: {} } })],
      // PrimeVue binds Escape in the real transition hooks.
      stubs: { transition: false }
    }
  })
  await flushPromises()
  expect(document.querySelector('[role="dialog"]')).not.toBeNull()
}

async function dismiss(action: string) {
  if (action === 'escape') document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape' }))
  else if (action === 'mask') {
    const mask = document.querySelector('.p-dialog-mask')!
    mask.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    mask.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }))
  } else (document.querySelector('.p-dialog-header button') as HTMLButtonElement).click()
  await flushPromises()
}

it.each(['escape', 'close', 'mask'])('dismisses with %s without applying data', async action => {
  await openDialog()
  await dismiss(action)
  expect(wrapper.emitted('update:visible')).toEqual([[false]])
  expect(wrapper.emitted('confirm')).toBeUndefined()
})

it('prevents dismissal and duplicate confirmation while applying data', async () => {
  await openDialog(true)
  expect(document.querySelector('.p-dialog-header button')).toBeNull()
  for (const action of ['escape', 'mask']) await dismiss(action)
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('.p-dialog-footer button'))
  expect(buttons).toHaveLength(2)
  for (const button of buttons) {
    expect(button.disabled).toBe(true)
    button.click()
  }
  expect(wrapper.emitted('update:visible')).toBeUndefined()
  expect(wrapper.emitted('confirm')).toBeUndefined()
})
