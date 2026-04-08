import { useLocalStorage } from '@vueuse/core'
import type { Note, NoteItem } from '../types/note'

const notes = useLocalStorage<Note[]>('frozen-rabbit-notes', [])

export function useNotes() {
  const addNote = (name: string, items: NoteItem[]) => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      name: name.trim(),
      items: items,
      createdAt: new Date()
    }
    notes.value.unshift(newNote) // Add to the top
  }

  const getNotes = () => notes.value

  const deleteNote = (id: string) => {
    notes.value = notes.value.filter(note => note.id !== id)
  }

  return {
    notes,
    addNote,
    deleteNote,
    getNotes
  }
}
