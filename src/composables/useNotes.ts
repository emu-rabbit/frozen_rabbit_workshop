import { useLocalStorage } from '@vueuse/core'
import type { Note, NoteItem } from '../types/note'
import { computed } from 'vue'

const NOTES_KEY = 'frozen-rabbit-notes'
const FAVORITES_KEY = 'frozen-rabbit-favorites'

const notes = useLocalStorage<Note[]>(NOTES_KEY, [])
const favoriteIds = useLocalStorage<string[]>(FAVORITES_KEY, [])

export function useNotes() {
  /**
   * Generates the next sequential history ID in history_XXXXX format.
   * Scans existing notes to find the current maximum number.
   */
  const generateNextHistoryId = () => {
    let maxNum = 0
    const pattern = /^history_(\d{5})$/

    notes.value.forEach(note => {
      const match = note.id.match(pattern)
      if (match) {
        const num = parseInt(match[1], 10)
        if (num > maxNum) maxNum = num
      }
    })

    const nextNum = maxNum + 1
    return `history_${String(nextNum).padStart(5, '0')}`
  }

  const addNote = (name: string, items: NoteItem[], shouldFavorite: boolean = false) => {
    const id = generateNextHistoryId()
    const newNote: Note = {
      id,
      name: name.trim(),
      items: items,
      createdAt: new Date()
    }
    notes.value.unshift(newNote) // Add to the top
    
    if (shouldFavorite) {
      favoriteIds.value.unshift(id) // Add to the top of favorites too
    }
  }

  const getNotes = () => notes.value

  const deleteNote = (id: string) => {
    notes.value = notes.value.filter(note => note.id !== id)
  }

  const toggleFavorite = (id: string) => {
    if (favoriteIds.value.includes(id)) {
      favoriteIds.value = favoriteIds.value.filter(favId => favId !== id)
    } else {
      favoriteIds.value.push(id)
    }
  }

  const isFavorite = (id: string) => favoriteIds.value.includes(id)

  const favoritesCount = computed(() => favoriteIds.value.length)

  const favoriteNotes = computed(() => {
    // Maintain order according to favoriteIds
    return favoriteIds.value.map(id => {
      const note = notes.value.find(n => n.id === id) || null
      return { id, note }
    })
  })

  const updateFavoriteOrder = (newIds: string[]) => {
    favoriteIds.value = newIds
  }

  return {
    notes,
    favoriteIds,
    favoritesCount,
    favoriteNotes,
    addNote,
    deleteNote,
    getNotes,
    toggleFavorite,
    isFavorite,
    updateFavoriteOrder
  }
}
