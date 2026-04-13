import { reactive } from 'vue'
import type { MockItem } from '../services/dictionary'

interface SearchRow {
  id: string
  query: string
  selectedItem: MockItem | null
  quantity: number
  suggestions: MockItem[]
  searching: boolean
  searchedEmpty: boolean
}

interface NewNoteDraft {
  noteTitle: string
  shouldFavorite: boolean
  searchRows: SearchRow[]
}

interface EditorDraft {
  isEditing: boolean
  noteTitle: string
  shouldFavorite: boolean
  searchRows: SearchRow[]
  rawJson: string
}

const createInitialNewNoteDraft = (): NewNoteDraft => ({
  noteTitle: '',
  shouldFavorite: false,
  searchRows: [{
    id: crypto.randomUUID(),
    query: '',
    quantity: 1,
    selectedItem: null,
    suggestions: [],
    searching: false,
    searchedEmpty: false
  }]
})

const createInitialEditorDraft = (): EditorDraft => ({
  isEditing: false,
  noteTitle: '',
  shouldFavorite: false,
  searchRows: [],
  rawJson: ''
})

// Global RAM-based state (Persists as long as the App is mounted)
const newNoteDraft = reactive<NewNoteDraft>(createInitialNewNoteDraft())
const editorDraft = reactive<EditorDraft>(createInitialEditorDraft())

export function useDrafts() {
  const resetNewNoteDraft = () => {
    Object.assign(newNoteDraft, createInitialNewNoteDraft())
  }

  const resetEditorDraft = () => {
    Object.assign(editorDraft, createInitialEditorDraft())
  }

  return {
    newNoteDraft,
    editorDraft,
    resetNewNoteDraft,
    resetEditorDraft
  }
}
