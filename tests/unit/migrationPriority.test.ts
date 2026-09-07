import { expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import GameDataStatus from '../../src/components/shared/GameDataStatus.vue'
import { updateDismissed } from '../../src/services/gameData'

vi.mock('../../src/services/gameData', async () => {
  const { ref } = await import('vue')
  return {
    dataError: ref(null), pendingDataManifest: ref({ version: 'new' }), updateDismissed: ref(false),
    loadCoreData: vi.fn(), checkForDataUpdate: vi.fn(), activateDataUpdate: vi.fn()
  }
})

it('defers a pending game-data update until the migration notice closes', async () => {
  const wrapper = mount(GameDataStatus, {
    props: { paused: true },
    global: {
      plugins: [createI18n({ legacy: false, missingWarn: false, fallbackWarn: false })],
      stubs: { GameDataConfirmDialog: { props: ['visible'], template: '<div v-if="visible" role="dialog" />' } }
    }
  })
  expect(wrapper.find('[role=dialog]').exists()).toBe(false)
  expect(updateDismissed.value).toBe(false)
  await wrapper.setProps({ paused: false })
  expect(wrapper.find('[role=dialog]').exists()).toBe(true)
  wrapper.unmount()
})
