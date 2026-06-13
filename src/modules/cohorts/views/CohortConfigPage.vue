<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

import TrackList from '../components/TrackList.vue'
import TrackFormModal from '../components/TrackFormModal.vue'
import CohortList from '../components/CohortList.vue'
import CohortFormModal from '../components/CohortFormModal.vue'
import CohortAdminModal from '../components/CohortAdminModal.vue'

import { useTracks } from '../composables/useTracks'
import { useCohorts } from '../composables/useCohorts'
import { useCohortAdmins } from '../composables/useCohortAdmins'

import type { Track, Cohort } from '../types'

/* ---- composable state ---- */
const tracksState = useTracks()
const cohortsState = useCohorts()
const adminsState = useCohortAdmins()

const selectedTrackId = ref<number | null>(null)
const selectedTrack = computed(
  () => tracksState.tracks.value.find((t) => t.id === selectedTrackId.value) ?? null,
)

onMounted(tracksState.load)

function selectTrack(trackId: number) {
  selectedTrackId.value = trackId
  cohortsState.load(trackId)
}

/* ---- track modal ---- */
const trackModalVisible = ref(false)
const trackBeingEdited = ref<Track | null>(null)
const savingTrack = ref(false)

function openCreateTrack() {
  trackBeingEdited.value = null
  trackModalVisible.value = true
}
function openEditTrack(track: Track) {
  trackBeingEdited.value = track
  trackModalVisible.value = true
}
async function submitTrack(payload: { name: string }) {
  savingTrack.value = true
  const result = trackBeingEdited.value
    ? await tracksState.update(trackBeingEdited.value.id, payload)
    : await tracksState.create(payload)
  savingTrack.value = false
  if (result) trackModalVisible.value = false // keep open on failure
}

/* ---- cohort modal ---- */
const cohortModalVisible = ref(false)
const cohortBeingEdited = ref<Cohort | null>(null)
const savingCohort = ref(false)

function openCreateCohort() {
  if (selectedTrackId.value === null) return
  cohortBeingEdited.value = null
  cohortModalVisible.value = true
}
function openEditCohort(cohort: Cohort) {
  cohortBeingEdited.value = cohort
  cohortModalVisible.value = true
}
async function submitCohort(payload: { number: number; is_active: boolean }) {
  if (selectedTrackId.value === null) return
  savingCohort.value = true
  const ok = cohortBeingEdited.value
    ? await cohortsState.update(selectedTrackId.value, cohortBeingEdited.value.id, payload)
    : await cohortsState.create(selectedTrackId.value, payload)
  savingCohort.value = false
  if (ok) cohortModalVisible.value = false
}

/* ---- admin modal ---- */
const adminModalVisible = ref(false)
function openAdminManager(cohort: Cohort) {
  adminModalVisible.value = true
  adminsState.open(cohort)
}
function closeAdminManager(value: boolean) {
  adminModalVisible.value = value
  if (!value) adminsState.reset()
}
</script>

<template>
  <div class="space-y-6">
    <TrackList
      :tracks="tracksState.tracks.value"
      :loading="tracksState.loading.value"
      :selected-track-id="selectedTrackId"
      @select="selectTrack"
      @create="openCreateTrack"
      @edit="openEditTrack"
    />

    <CohortList
      v-if="selectedTrack"
      :track="selectedTrack"
      :cohorts="cohortsState.cohorts.value"
      :loading="cohortsState.loading.value"
      :toggling-id="cohortsState.togglingId.value"
      @create="openCreateCohort"
      @edit="openEditCohort"
      @toggle-status="cohortsState.toggleStatus"
      @manage-admins="openAdminManager"
    />

    <TrackFormModal
      :visible="trackModalVisible"
      :track="trackBeingEdited"
      :saving="savingTrack"
      @update:visible="trackModalVisible = $event"
      @submit="submitTrack"
    />

    <CohortFormModal
      :visible="cohortModalVisible"
      :cohort="cohortBeingEdited"
      :saving="savingCohort"
      @update:visible="cohortModalVisible = $event"
      @submit="submitCohort"
    />

    <CohortAdminModal
      :visible="adminModalVisible"
      :cohort="adminsState.cohort.value"
      :loading="adminsState.loading.value"
      :assigned="adminsState.assigned.value"
      :available="adminsState.available.value"
      :mutating-staff-id="adminsState.mutatingStaffId.value"
      @update:visible="closeAdminManager"
      @assign="adminsState.assign"
      @unassign="adminsState.unassign"
    />
  </div>
</template>
