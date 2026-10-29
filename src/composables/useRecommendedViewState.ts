import { ref } from 'vue'
import { emptyRecommendedFilters } from '../data/recommended/filters'

// Keep applied conditions across view remounts, only for this app runtime.
const searchQuery = ref('')
const filters = ref(emptyRecommendedFilters())

export function useRecommendedViewState() {
  return { searchQuery, filters }
}
