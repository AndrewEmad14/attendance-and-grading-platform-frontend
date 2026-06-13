<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

import MyCohortList from '../components/MyCohortList.vue'
import LabGroupBoard from '../components/LabGroupBoard.vue'
import LabGroupFormModal from '../components/LabGroupFormModal.vue'
import BusinessSessionPanel from '../components/BusinessSessionPanel.vue'
import BusinessSessionFormModal from '../components/BusinessSessionFormModal.vue'

import { useMyCohorts } from '../composables/useMyCohorts.ts'
import { useLabGroupManagement } from '../composables/useLabGroupManagement.ts'
import { useBusinessSessions } from '../composables/useBusinessSessions.ts'

import type { LabGroup, BusinessSession } from '../types.ts'

/* ---- composable state ---- */
const myCohorts = useMyCohorts()
const labGroups = useLabGroupManagement()
const sessions = useBusinessSessions()

const selectedCohortId = ref<number | null>(null)
const selectedCohort = computed(
  () => myCohorts.cohorts.value.find((c) => c.id === selectedCohortId.value) ?? null,
)

onMounted(myCohorts.load)

function selectCohort(cohortId: number) {
  selectedCohortId.value = cohortId
  // Load both management surfaces for the chosen cohort.
  labGroups.loadMatrix(cohortId)
  sessions.load(cohortId)
}

/* ---- lab group modal ---- */
const labGroupModalVisible = ref(false)
const savingLabGroup = ref(false)

function openCreateLabGroup() {
  if (selectedCohortId.value === null) return
  labGroupModalVisible.value = true
}

async function submitLabGroup(payload: { name: string }) {
  if (selectedCohortId.value === null) return
  savingLabGroup.value = true
  await labGroups.addGroup(selectedCohortId.value, payload)
  savingLabGroup.value = false
  // useLabGroupManagement surfaces failures via its own error ref; close on completion.
  labGroupModalVisible.value = false
}

function deleteLabGroup(group: LabGroup) {
  if (selectedCohortId.value === null) return
  labGroups.removeGroup(selectedCohortId.value, group.id)
}

function assignStudent(payload: { labGroupId: number; studentId: number }) {
  if (selectedCohortId.value === null) return
  labGroups.assignStudent(selectedCohortId.value, payload.labGroupId, payload.studentId)
}

function dropStudent(payload: { labGroupId: number; studentId: number }) {
  if (selectedCohortId.value === null) return
  labGroups.dropStudent(selectedCohortId.value, payload.labGroupId, payload.studentId)
}

/* ---- business session modal ---- */
const sessionModalVisible = ref(false)
const savingSession = ref(false)

function openCreateSession() {
  if (selectedCohortId.value === null) return
  sessionModalVisible.value = true
}

async function submitSession(payload: { name: string }) {
  savingSession.value = true
  const ok = await sessions.create(payload)
  savingSession.value = false
  if (ok) sessionModalVisible.value = false
}

function attachSession(session: BusinessSession) {
  sessions.attach(session)
}

function detachSession(session: BusinessSession) {
  sessions.detach(session)
}
</script>

<template>
  <div class="space-y-6">
    <MyCohortList
      :cohorts="myCohorts.cohorts.value"
      :loading="myCohorts.loading.value"
      :selected-cohort-id="selectedCohortId"
      @select="selectCohort"
    />

    <template v-if="selectedCohort">
      <LabGroupBoard
        :lab-groups="labGroups.labGroups.value"
        :unassigned-students="labGroups.unassignedStudents.value"
        :loading="labGroups.isLoading.value"
        @create-group="openCreateLabGroup"
        @delete-group="deleteLabGroup"
        @assign="assignStudent"
        @drop="dropStudent"
      />

      <BusinessSessionPanel
        :attached="sessions.attached.value"
        :available="sessions.available.value"
        :loading="sessions.loading.value"
        :mutating-session-id="sessions.mutatingSessionId.value"
        @create-session="openCreateSession"
        @attach="attachSession"
        @detach="detachSession"
      />
    </template>

    <LabGroupFormModal
      :visible="labGroupModalVisible"
      :saving="savingLabGroup"
      @update:visible="labGroupModalVisible = $event"
      @submit="submitLabGroup"
    />

    <BusinessSessionFormModal
      :visible="sessionModalVisible"
      :saving="savingSession"
      @update:visible="sessionModalVisible = $event"
      @submit="submitSession"
    />
  </div>
</template>
