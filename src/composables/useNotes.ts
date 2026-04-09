import { useLocalStorage } from '@vueuse/core'
import type { Note, NoteItem } from '../types/note'
import { computed } from 'vue'

import recommendedNotesData from '../data/recommended.json'

const NOTES_KEY = 'frozen-rabbit-notes'
const FAVORITES_STORE_KEY = 'frozen-rabbit-favorites-data'

const notes = useLocalStorage<Note[]>(NOTES_KEY, [])
// Using deep copies instead of IDs. Migrates old users implicitly (starts empty if format changes or just starts empty for new key)
const favoriteNotesStore = useLocalStorage<Note[]>(FAVORITES_STORE_KEY, [])
const recommendedNotes = recommendedNotesData as Note[]

export function useNotes() {
  const addNote = (name: string, items: NoteItem[], shouldFavorite: boolean = false) => {
    const id = crypto.randomUUID()
    const newNote: Note = {
      id,
      name: name.trim(),
      items: items,
      createdAt: new Date()
    }
    
    // Add to history and enforce 20 item limit
    notes.value.unshift(newNote)
    if (notes.value.length > 20) {
      notes.value = notes.value.slice(0, 20)
    }
    
    if (shouldFavorite) {
      // Deep copy to favorites
      favoriteNotesStore.value.unshift(JSON.parse(JSON.stringify(newNote)))
    }
  }

  const getNotes = () => notes.value

  const toggleFavorite = (noteOrId: Note | { id: string }) => {
    if (isFavorite(noteOrId.id)) {
      favoriteNotesStore.value = favoriteNotesStore.value.filter(n => n.id !== noteOrId.id)
    } else {
      // Must be a full Note to add
      if ('name' in noteOrId) {
        favoriteNotesStore.value.unshift(JSON.parse(JSON.stringify(noteOrId)))
      }
    }
  }

  const isFavorite = (id: string) => favoriteNotesStore.value.some(n => n.id === id)

  const favoritesCount = computed(() => favoriteNotesStore.value.length)
  const recommendedCount = computed(() => recommendedNotes.length)

  const favoriteNotes = computed(() => {
    // Map favoriteNotesStore to the shape { id, note } expected by UI
    return favoriteNotesStore.value.map(note => ({ id: note.id, note }))
  })

  // Allows drag-and-drop to reorder
  const updateFavoriteOrder = (newOrder: string[]) => {
    // Reorder our deep-copied store based on the array of IDs
    const currentList = [...favoriteNotesStore.value]
    const reordered: Note[] = []
    
    newOrder.forEach(id => {
      const found = currentList.find(n => n.id === id)
      if (found) reordered.push(found)
    })
    
    favoriteNotesStore.value = reordered
  }

  return {
    notes,
    recommendedNotes,
    favoriteNotesStore,
    favoritesCount,
    recommendedCount,
    favoriteNotes,
    addNote,
    getNotes,
    toggleFavorite,
    isFavorite,
    updateFavoriteOrder
  }
}
