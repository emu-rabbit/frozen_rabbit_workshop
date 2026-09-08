import { normalizeItemId } from '../utils/noteItems'
import { DEFAULT_MARKET_DATA_CENTER, DEFAULT_MARKET_REGION } from '../data/marketServers'

export const GLEANER_URL = 'https://emu-rabbit.github.io/gleaner/'
export const MIGRATION_DISMISSED_KEY = 'frozen-rabbit-migration-dismissed'
export const MAX_BACKUP_BYTES = 10 * 1024 * 1024
const prefix = 'frozen-rabbit-'
const collections = ['notes', 'favorites-data']
const settings = ['lang', 'market-region', 'market-dc', 'market-strategy', 'dark-mode']
const keys = [...collections, ...settings].map(key => prefix + key)
// Match the values persisted by useSettings on a fresh visit.
const defaultSettings: Record<string, string> = {
  [prefix + 'lang']: 'tw',
  [prefix + 'market-region']: DEFAULT_MARKET_REGION,
  [prefix + 'market-dc']: DEFAULT_MARKET_DATA_CENTER,
  [prefix + 'market-strategy']: 'balanced',
  [prefix + 'dark-mode']: 'false'
}
type RecordValue = Record<string, unknown>
export type BackupData = Record<string, string>
export type ConflictPolicy = 'keep' | 'backup'
export class MigrationError extends Error {
  code: string
  detail: string
  constructor(code: string, detail = '') {
    super(code)
    this.code = code
    this.detail = detail
  }
}
const object = (value: unknown): value is RecordValue => !!value && typeof value === 'object' && !Array.isArray(value)
const fail = (detail: string): never => { throw new MigrationError('invalid', detail) }

function parseCollection(raw: string, key: string): RecordValue[] {
  let value: unknown
  try { value = JSON.parse(raw) } catch { return fail(key) }
  if (!Array.isArray(value)) return fail(key)
  const ids = new Set<string>()
  return value.map((note, index) => {
    const at = `${key}[${index + 1}]`
    if (!object(note) || typeof note.id !== 'string' || !note.id.trim() || ids.has(note.id)) return fail(at)
    ids.add(note.id)
    const validName = typeof note.name === 'string' || (object(note.name) &&
      ['tw', 'cn', 'en', 'ja'].every(lang => typeof (note.name as RecordValue)[lang] === 'string'))
    if (!validName || !Array.isArray(note.items) || typeof note.createdAt !== 'string' || !Number.isFinite(Date.parse(note.createdAt))) return fail(at)
    const items = note.items.map(item => {
      if (!object(item)) return fail(at)
      const id = normalizeItemId(item.id)
      const quantity = typeof item.quantity === 'string' && item.quantity.trim() ? Number(item.quantity) : item.quantity
      if (id === null || typeof quantity !== 'number' || !Number.isSafeInteger(quantity) || quantity <= 0) return fail(at)
      return { ...item, id, quantity }
    })
    return { ...note, items }
  })
}

export function parseBackup(text: string): BackupData {
  if (new Blob([text]).size > MAX_BACKUP_BYTES) throw new MigrationError('tooLarge')
  let envelope: unknown
  try { envelope = JSON.parse(text.replace(/^\uFEFF/, '')) } catch { throw new MigrationError('invalid') }
  if (!object(envelope) || envelope.format !== 'frozen-rabbit-workshop-backup' || envelope.version !== 1) throw new MigrationError('format')
  if (!object(envelope.data) || !Object.keys(envelope.data).length) throw new MigrationError('invalid')
  const data: BackupData = {}
  for (const [key, raw] of Object.entries(envelope.data)) {
    if (!keys.includes(key) || typeof raw !== 'string') return fail(key)
    const suffix = key.slice(prefix.length)
    if (collections.includes(suffix)) data[key] = JSON.stringify(parseCollection(raw, key))
    else {
      const valid = suffix === 'lang' ? ['tw', 'cn', 'en', 'ja'].includes(raw)
        : suffix === 'dark-mode' ? ['true', 'false'].includes(raw)
        : suffix === 'market-strategy' ? ['aggressive', 'balanced', 'conservative'].includes(raw)
        : raw.trim().length > 0 && raw.length <= 100
      if (!valid) return fail(key)
      data[key] = raw
    }
  }
  return data
}

export function prepareImport(data: BackupData, storage: Storage, policy: ConflictPolicy) {
  const before: Record<string, string | null> = {}
  const writes: BackupData = {}
  const counts = { notes: 0, favorites: 0, settings: 0, conflicts: 0 }
  let historyTrimmed = false
  for (const [key, raw] of Object.entries(data)) {
    const existing = storage.getItem(key)
    before[key] = existing
    if (collections.some(suffix => key === prefix + suffix)) {
      const incoming = parseCollection(raw, key)
      const current = existing === null ? [] : parseCollection(existing, key)
      counts[key === prefix + 'notes' ? 'notes' : 'favorites'] = incoming.length
      const merged = new Map(current.map(note => [note.id, note]))
      for (const note of incoming) {
        if (merged.has(note.id)) {
          if (JSON.stringify(merged.get(note.id)) !== JSON.stringify(note)) counts.conflicts++
          if (policy === 'keep') continue
        }
        merged.set(note.id, note)
      }
      let entries = [...merged.values()]
      if (key === prefix + 'notes') {
        historyTrimmed = entries.length > 20
        entries = entries
          .sort((a, b) => Date.parse(b.createdAt as string) - Date.parse(a.createdAt as string))
          .slice(0, 20)
      }
      writes[key] = JSON.stringify(entries)
    } else {
      counts.settings++
      const hasCurrentValue = existing !== null && existing !== defaultSettings[key]
      if (hasCurrentValue && existing !== raw) counts.conflicts++
      writes[key] = policy === 'keep' && hasCurrentValue ? existing : raw
    }
  }
  // Imported settings complete onboarding; privacy consent remains independent.
  const initialized = prefix + 'initialized'
  before[initialized] = storage.getItem(initialized)
  writes[initialized] = 'true'
  before[MIGRATION_DISMISSED_KEY] = storage.getItem(MIGRATION_DISMISSED_KEY)
  writes[MIGRATION_DISMISSED_KEY] = 'true'
  return { before, writes, counts, historyTrimmed }
}

export function commitImport(plan: ReturnType<typeof prepareImport>, storage: Storage) {
  for (const [key, raw] of Object.entries(plan.before)) {
    const current = storage.getItem(key)
    // The reminder checkbox can change while the import preview is open.
    if (key === MIGRATION_DISMISSED_KEY) plan.before[key] = current
    else if (current !== raw) throw new MigrationError('changed')
  }
  const written: string[] = []
  try {
    for (const [key, raw] of Object.entries(plan.writes)) {
      storage.setItem(key, raw)
      written.push(key)
    }
  } catch {
    let rollbackFailed = false
    for (const key of written.reverse()) {
      try {
        const raw = plan.before[key]
        if (raw === null) storage.removeItem(key)
        else storage.setItem(key, raw!)
      } catch { rollbackFailed = true }
    }
    throw new MigrationError(rollbackFailed ? 'rollback' : 'storage')
  }
}
