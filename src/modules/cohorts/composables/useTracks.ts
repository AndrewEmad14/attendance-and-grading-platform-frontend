import { ref } from 'vue'
import { getTracks, createTrack, updateTrack } from '../services/cohortService'
import type { Track, StoreTrackPayload, UpdateTrackPayload } from '../types'
import { useCohortToast } from './useCohortToast'

/**
 * Owns the branch track registry: list state, loading flag, and CRUD.
 * Errors are surfaced as toasts and re-thrown so callers can keep a modal open
 * on failure if they choose.
 */
export function useTracks() {
  const toast = useCohortToast()

  const tracks = ref<Track[]>([])
  const loading = ref(false)

  async function load() {
    loading.value = true
    try {
      tracks.value = await getTracks()
    } catch (err) {
      toast.failure('Track load failed', err)
    } finally {
      loading.value = false
    }
  }

  async function create(payload: StoreTrackPayload): Promise<Track | null> {
    try {
      const created = await createTrack(payload)
      tracks.value.push(created)
      toast.success('Track created', created.name)
      return created
    } catch (err) {
      toast.failure('Track create failed', err)
      return null
    }
  }

  async function update(trackId: number, payload: UpdateTrackPayload): Promise<Track | null> {
    try {
      const updated = await updateTrack(trackId, payload)
      const idx = tracks.value.findIndex((t) => t.id === updated.id)
      if (idx !== -1) tracks.value[idx] = updated
      toast.success('Track updated', updated.name)
      return updated
    } catch (err) {
      toast.failure('Track update failed', err)
      return null
    }
  }

  return { tracks, loading, load, create, update }
}
