import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCohortContextStore = defineStore('cohortContext', () => {
  const selectedCohortId = ref<number | null>(null)
  const selectedTrackId = ref<number | null>(null)

  function setCohortId(id: number | null) {
    selectedCohortId.value = id
  }

  function setTrackId(id: number | null) {
    selectedTrackId.value = id
  }

  function clearContext() {
    selectedCohortId.value = null
    selectedTrackId.value = null
  }

  return {
    selectedCohortId,
    selectedTrackId,
    setCohortId,
    setTrackId,
    clearContext
  }
})