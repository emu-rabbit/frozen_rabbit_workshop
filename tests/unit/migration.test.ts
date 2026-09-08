import { describe, it, expect } from 'vitest'
import { useSettings } from '../../src/composables/useSettings'
import { parseBackup, prepareImport, commitImport, MigrationError, MIGRATION_DISMISSED_KEY } from '../../src/services/migration'

const key = 'frozen-rabbit-notes'
const note = (id = 'one', name = 'Old') => ({ id, name, items: [{ id: -10000, quantity: 2 }], createdAt: '2026-09-07T00:00:00.000Z' })
const backup = (data: Record<string, unknown>, extra = {}) => JSON.stringify({ format: 'frozen-rabbit-workshop-backup', version: 1, data, ...extra })
function storage(initial: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(initial))
  return { getItem: key => map.get(key) ?? null, setItem: (key, value) => { map.set(key, value) }, removeItem: key => { map.delete(key) }, clear: () => map.clear(), key: index => [...map.keys()][index] ?? null, get length() { return map.size } }
}

describe('Gleaner Workshop v1 import', () => {
  it.each(['keep', 'backup'] as const)('replaces actual startup defaults without conflicts under %s', policy => {
    localStorage.clear()
    useSettings()
    const data = parseBackup(backup({
      'frozen-rabbit-notes': JSON.stringify([note()]),
      'frozen-rabbit-favorites-data': JSON.stringify([note()]),
      'frozen-rabbit-lang': 'en',
      'frozen-rabbit-market-region': 'Japan',
      'frozen-rabbit-market-dc': 'Mana',
      'frozen-rabbit-market-strategy': 'aggressive',
      'frozen-rabbit-dark-mode': 'true'
    }))
    try {
      const plan = prepareImport(data, localStorage, policy)
      expect(plan.counts).toEqual({ notes: 1, favorites: 1, settings: 5, conflicts: 0 })
      commitImport(plan, localStorage)
      for (const [key, raw] of Object.entries(data)) expect(localStorage.getItem(key)).toBe(raw)
    } finally { localStorage.clear() }
  })
  it.each(['keep', 'backup'] as const)('still treats non-default settings as conflicts under %s', policy => {
    const current = {
      'frozen-rabbit-lang': 'ja',
      'frozen-rabbit-market-region': 'Europe',
      'frozen-rabbit-market-dc': 'Light',
      'frozen-rabbit-market-strategy': 'conservative',
      'frozen-rabbit-dark-mode': 'true'
    }
    const data = parseBackup(backup({
      'frozen-rabbit-lang': 'en',
      'frozen-rabbit-market-region': 'Japan',
      'frozen-rabbit-market-dc': 'Mana',
      'frozen-rabbit-market-strategy': 'aggressive',
      'frozen-rabbit-dark-mode': 'false'
    }))
    const store = storage(current)
    const plan = prepareImport(data, store, policy)
    expect(plan.counts.conflicts).toBe(5)
    commitImport(plan, store)
    for (const [key, raw] of Object.entries(policy === 'keep' ? current : data)) expect(store.getItem(key)).toBe(raw)
    expect(prepareImport(data, storage(data), 'keep').counts.conflicts).toBe(0)
  })
  it('reads raw serializers and normalizes historical string item IDs without dropping fields', () => {
    const old = { ...note(), extra: 'preserved', items: [{ id: '-10000', quantity: '2' }] }
    const data = parseBackup(backup({ [key]: JSON.stringify([old]), 'frozen-rabbit-lang': 'en', 'frozen-rabbit-dark-mode': 'false' }))
    expect(JSON.parse(data[key]!)[0]).toEqual({ ...old, items: [{ id: -10000, quantity: 2 }] })
    expect(data['frozen-rabbit-lang']).toBe('en')
  })
  it.each([
    backup({}, { version: 2 }), backup({}, { format: 'frozen-rabbit-tome-backup' }),
    backup({ 'frozen-rabbit-analytics-consent': 'granted' }), backup({ [key]: [] }),
    backup({ [key]: JSON.stringify([note(), note()]) }), backup({ [key]: '{broken' }),
    backup({ [key]: JSON.stringify([{ ...note(), items: [{ id: 0, quantity: 1 }] }]) }),
    backup({ 'frozen-rabbit-dark-mode': 'yes' }), backup({ 'frozen-rabbit-lang': 'xx' }),
    backup({ [key]: JSON.stringify([{ ...note(), createdAt: 'invalid' }]) }),
  ])('rejects an invalid file as a whole', text => expect(() => parseBackup(text)).toThrow(MigrationError))
  it('rejects oversized files', () => expect(() => parseBackup(' '.repeat(10 * 1024 * 1024 + 1))).toThrow('tooLarge'))
  it('merges by ID, previews conflicts, preserves unrelated notes and remains idempotent', () => {
    const store = storage({ [key]: JSON.stringify([note('one', 'New'), note('two')]) })
    const data = parseBackup(backup({ [key]: JSON.stringify([note(), note('three')]) }))
    const keep = prepareImport(data, store, 'keep')
    expect(keep.counts).toEqual({ notes: 2, favorites: 0, settings: 0, conflicts: 1 })
    commitImport(keep, store)
    expect(JSON.parse(store.getItem(key)!)).toEqual([note('one', 'New'), note('two'), note('three')])
    commitImport(prepareImport(data, store, 'backup'), store)
    commitImport(prepareImport(data, store, 'backup'), store)
    expect(JSON.parse(store.getItem(key)!)).toEqual([note(), note('two'), note('three')])
    expect(store.getItem('frozen-rabbit-initialized')).toBe('true')
    expect(store.getItem(MIGRATION_DISMISSED_KEY)).toBe('true')
  })
  it('supports settings only and empty arrays without clearing existing collections or consent', () => {
    const store = storage({ [key]: JSON.stringify([note()]), 'consent': 'denied' })
    commitImport(prepareImport(parseBackup(backup({ [key]: '[]', 'frozen-rabbit-lang': 'ja' })), store, 'backup'), store)
    expect(JSON.parse(store.getItem(key)!)).toEqual([note()])
    expect(store.getItem('frozen-rabbit-lang')).toBe('ja')
    expect(store.getItem('consent')).toBe('denied')
  })
  it.each(['keep', 'backup'] as const)('keeps the newest 20 merged history notes with %s conflicts', policy => {
    const dated = (i: number) => ({ ...note(String(i)), createdAt: new Date(Date.UTC(2026, 0, i + 1)).toISOString() })
    const current = Array.from({ length: 15 }, (_, i) => dated(i + 15))
    const incoming = Array.from({ length: 20 }, (_, i) => dated(i)).reverse()
    const store = storage({ [key]: JSON.stringify(current) })
    const data = parseBackup(backup({ [key]: JSON.stringify(incoming) }))
    const plan = prepareImport(data, store, policy)
    expect(plan.historyTrimmed).toBe(true)
    commitImport(plan, store)
    const expected = Array.from({ length: 20 }, (_, i) => dated(29 - i))
    expect(JSON.parse(store.getItem(key)!)).toEqual(expected)
    commitImport(prepareImport(data, store, policy), store)
    expect(JSON.parse(store.getItem(key)!)).toEqual(expected)
  })
  it('sorts short history by actual time, including timezone offsets', () => {
    const older = { ...note('older'), createdAt: '2026-09-07T09:00:00+09:00' }
    const newer = { ...note('newer'), createdAt: '2026-09-07T01:00:00Z' }
    const store = storage()
    const plan = prepareImport(parseBackup(backup({ [key]: JSON.stringify([older, newer]) })), store, 'keep')
    expect(plan.historyTrimmed).toBe(false)
    commitImport(plan, store)
    expect(JSON.parse(store.getItem(key)!)).toEqual([newer, older])
  })
  it('does not truncate or reorder favorites', () => {
    const favoritesKey = 'frozen-rabbit-favorites-data'
    const favorites = Array.from({ length: 100 }, (_, i) => note(String(i)))
    const store = storage()
    commitImport(prepareImport(parseBackup(backup({ [favoritesKey]: JSON.stringify(favorites) })), store, 'backup'), store)
    expect(JSON.parse(store.getItem(favoritesKey)!)).toEqual(favorites)
  })
  it('refuses stale previews and corrupt current collections', () => {
    const store = storage()
    const data = parseBackup(backup({ [key]: '[]' }))
    const plan = prepareImport(data, store, 'keep')
    store.setItem(key, 'invalid')
    expect(() => commitImport(plan, store)).toThrow('changed')
    expect(() => prepareImport(data, store, 'keep')).toThrow('invalid')
  })
  it('replaces defaults while retaining modified settings, and rejects edits after preview', () => {
    const store = storage({ 'frozen-rabbit-lang': 'tw', 'frozen-rabbit-market-strategy': 'conservative' })
    const data = parseBackup(backup({ 'frozen-rabbit-lang': 'en', 'frozen-rabbit-market-strategy': 'aggressive' }))
    const plan = prepareImport(data, store, 'keep')
    expect(plan.counts.conflicts).toBe(1)
    expect(plan.writes['frozen-rabbit-lang']).toBe('en')
    expect(plan.writes['frozen-rabbit-market-strategy']).toBe('conservative')
    store.setItem('frozen-rabbit-lang', 'ja')
    expect(() => commitImport(plan, store)).toThrow('changed')
    expect(store.getItem('frozen-rabbit-lang')).toBe('ja')
    expect(store.getItem(MIGRATION_DISMISSED_KEY)).toBeNull()
  })
  it('rolls back all completed writes when quota fails', () => {
    const store = storage({ [key]: JSON.stringify([note('existing')]) })
    const before = store.getItem(key)
    const plan = prepareImport(parseBackup(backup({ [key]: JSON.stringify([note()]), 'frozen-rabbit-lang': 'en' })), store, 'backup')
    const write = store.setItem
    store.setItem = (key, value) => { if (key === 'frozen-rabbit-lang') throw Error('quota'); write(key, value) }
    expect(() => commitImport(plan, store)).toThrow('storage')
    expect(store.getItem(key)).toBe(before)
    expect(store.getItem('frozen-rabbit-initialized')).toBeNull()
  })
  it('reports rollback failure honestly', () => {
    const store = storage()
    const plan = prepareImport(parseBackup(backup({ [key]: '[]' })), store, 'backup')
    const write = store.setItem
    store.setItem = (key, value) => { if (key === 'frozen-rabbit-initialized') throw Error('blocked'); write(key, value) }
    store.removeItem = () => { throw Error('blocked') }
    expect(() => commitImport(plan, store)).toThrow('rollback')
  })
  it('allows changing the reminder preference after preview', () => {
    const store = storage()
    const plan = prepareImport(parseBackup(backup({ [key]: '[]' })), store, 'backup')
    store.setItem(MIGRATION_DISMISSED_KEY, 'true')
    expect(() => commitImport(plan, store)).not.toThrow()
  })
})
