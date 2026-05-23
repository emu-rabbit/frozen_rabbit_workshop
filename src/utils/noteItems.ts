import type { NoteItem } from '../types/note'

export const isValidItemId = (id: unknown): id is number => {
  return typeof id === 'number' && Number.isInteger(id) && id > 0
}

export const normalizeItemId = (id: unknown): number | null => {
  if (isValidItemId(id)) return id

  if (typeof id === 'string' && id.trim() !== '') {
    const parsed = Number(id)
    if (isValidItemId(parsed)) return parsed
  }

  return null
}

export const normalizeQuantity = (quantity: unknown): number => {
  const parsed = Number(quantity)
  if (!Number.isFinite(parsed) || parsed <= 0) return 1
  return Math.max(1, Math.floor(parsed))
}

export const sanitizeNoteItems = (items: unknown): NoteItem[] => {
  if (!Array.isArray(items)) return []

  return items.flatMap((item) => {
    const id = normalizeItemId((item as Partial<NoteItem> | null | undefined)?.id)
    if (id === null) return []

    return [{
      id,
      quantity: normalizeQuantity((item as Partial<NoteItem>).quantity)
    }]
  })
}
