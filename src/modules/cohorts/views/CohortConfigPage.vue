<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

// Structural Layout Containers
import ContentCard from '@/components/structural/ContentCard.vue'
import DashboardGrid from '@/components/structural/DashboardGrid.vue'

// Service and Global State Subsystems
import { useCohortContextStore } from '@/stores/cohortContext'
import * as cohortApi from '@/modules/cohorts/services/cohortService'
import * as scheduleApi from '@/modules/scheduling/services/schedulingService'

// Component Data Type Models
import type { Cohort, LabGroup, CohortStudent } from '@/modules/cohorts/types'
import type { Engagement, BusinessSession } from '@/modules/scheduling/types'

// Core Testing Environment Reactive States
const contextStore = useCohortContextStore()
const currentRole = ref<'branch_manager' | 'track_admin' | 'instructor' | 'student'>('track_admin')

const tracksList = ref<{ id: number; name: string }[]>([
  { id: 1, name: 'Web Development' },
  { id: 2, name: 'Mobile Applications' },
])

// API Result Arrays
const cohorts = ref<Cohort[]>([])
const labGroups = ref<LabGroup[]>([])
const poolStudents = ref<CohortStudent[]>([])
const engagements = ref<Engagement[]>([])
const businessSessions = ref<BusinessSession[]>([])

// Visual State Toggles
const selectedLabGroupId = ref<number | null>(null)
const selectedBusinessSessionId = ref<number | null>(null)
const operationalLog = ref<string[]>([])
const isWorking = ref(false)

function logOutput(action: string, payload: any) {
  const stamp = new Date().toLocaleTimeString()
  operationalLog.value.unshift(`[${stamp}] ${action} -> ${JSON.stringify(payload)}`)
}

// Cascading Network Lookup Handlers
async function handleTrackChange() {
  contextStore.setCohortId(null)
  cohorts.value = []
  labGroups.value = []
  poolStudents.value = []

  if (!contextStore.selectedTrackId) return
  isWorking.value = true
  try {
    cohorts.value = await cohortApi.getCohorts({ trackId: contextStore.selectedTrackId })
    logOutput('getCohorts Success', cohorts.value)
  } catch (err: any) {
    logOutput('getCohorts Error', err.message)
  } finally {
    isWorking.value = false
  }
}

async function handleCohortChange() {
  selectedLabGroupId.value = null
  labGroups.value = []
  poolStudents.value = []
  engagements.value = []

  if (!contextStore.selectedCohortId) return
  isWorking.value = true
  try {
    // 1. All roles (including student/instructor) are authorized to view schedule engagements
    const schedulePromise = scheduleApi.getEngagements({ cohort_id: contextStore.selectedCohortId })

    // 2. Only pull roster and pool matrix allocations if user is an admin or manager
    if (currentRole.value === 'track_admin' || currentRole.value === 'branch_manager') {
      const [groups, students, schedule] = await Promise.all([
        cohortApi.getLabGroups(contextStore.selectedCohortId, true),
        cohortApi.getCohortStudents(contextStore.selectedCohortId, true),
        schedulePromise,
      ])

      labGroups.value = groups
      poolStudents.value = students
      engagements.value = schedule
      logOutput('Cohort Context Fully Hydrated (Admin)', { groups, students, schedule })
    } else {
      // For students/instructors, safely resolve only the permitted calendar track
      const schedule = await schedulePromise

      // Instructors can technically read lab groups they are assigned to,
      // so we can optionally pull group contexts safely here if needed:
      if (currentRole.value === 'instructor') {
        labGroups.value = await cohortApi.getLabGroups(contextStore.selectedCohortId, false)
      }

      engagements.value = schedule
      logOutput(`Cohort Context Hydrated for Role: ${currentRole.value}`, { schedule })
    }
  } catch (err: any) {
    logOutput('Cohort Hydration Error', err.message)
  } finally {
    isWorking.value = false
  }
}

// Functional Testing Actions
async function executeCreateCohort() {
  if (!contextStore.selectedTrackId) return
  isWorking.value = true
  try {
    const nextNumber = cohorts.value.length + 1
    const freshCohort = await cohortApi.createCohort(contextStore.selectedTrackId, {
      number: nextNumber,
      is_active: true,
    })
    logOutput('createCohort Success', freshCohort)
    await handleTrackChange()
  } catch (err: any) {
    logOutput('createCohort Error', err.message)
  } finally {
    isWorking.value = false
  }
}

async function executeCreateLabGroup() {
  if (!contextStore.selectedCohortId) return
  isWorking.value = true
  try {
    const nextName = `Lab Group ${String.fromCharCode(65 + labGroups.value.length)}`
    const freshGroup = await cohortApi.createLabGroup(contextStore.selectedCohortId, {
      name: nextName,
    })
    logOutput('createLabGroup Success', freshGroup)
    await handleCohortChange()
  } catch (err: any) {
    logOutput('createLabGroup Error', err.message)
  } finally {
    isWorking.value = false
  }
}

async function executeAssignStudent(studentId: number) {
  if (!selectedLabGroupId.value || !contextStore.selectedCohortId) return
  isWorking.value = true
  try {
    await cohortApi.attachStudentToGroup(selectedLabGroupId.value, studentId)
    logOutput('attachStudentToGroup Success', { studentId, groupId: selectedLabGroupId.value })
    await handleCohortChange()
  } catch (err: any) {
    logOutput('attachStudentToGroup Error', err.message)
  } finally {
    isWorking.value = false
  }
}

async function executeReleaseStudent(groupId: number, studentId: number) {
  if (!contextStore.selectedCohortId) return
  isWorking.value = true
  try {
    await cohortApi.detachStudentFromGroup(groupId, studentId)
    logOutput('detachStudentFromGroup Success', { studentId, groupId })
    await handleCohortChange()
  } catch (err: any) {
    logOutput('detachStudentFromGroup Error', err.message)
  } finally {
    isWorking.value = false
  }
}

async function executeBookEngagement() {
  if (!contextStore.selectedCohortId) return
  isWorking.value = true
  try {
    const payload = {
      type: 'lecture' as const,
      engageable_type: 'App\\Models\\Course' as const,
      engageable_id: 1,
      staff_id: 2,
      starts_at: '2026-06-15 09:00:00',
      ends_at: '2026-06-15 12:00:00',
      scheduled_hours: 3,
    }
    const res = await scheduleApi.createEngagement(payload)
    logOutput('createEngagement Success', res)
    await handleCohortChange()
  } catch (err: any) {
    logOutput('createEngagement Error', err.message)
  } finally {
    isWorking.value = false
  }
}

async function executeEnrollBusinessSession() {
  if (!selectedBusinessSessionId.value || !contextStore.selectedCohortId) return
  isWorking.value = true
  try {
    await scheduleApi.enrollCohortInBusinessSession(
      selectedBusinessSessionId.value,
      contextStore.selectedCohortId,
    )
    logOutput('enrollCohortInBusinessSession Success', {
      sessionId: selectedBusinessSessionId.value,
      cohortId: contextStore.selectedCohortId,
    })
    await handleCohortChange()
  } catch (err: any) {
    logOutput('enrollCohortInBusinessSession Error', err.message)
  } finally {
    isWorking.value = false
  }
}

async function loadGlobalBusinessSessions() {
  try {
    businessSessions.value = await scheduleApi.getBusinessSessions()
    logOutput('getBusinessSessions Success', businessSessions.value)
  } catch (err: any) {
    logOutput('getBusinessSessions Error', err.message)
  }
}

watch(
  () => currentRole.value,
  () => {
    logOutput('Identity Switched', { activeRole: currentRole.value })
  },
)

onMounted(() => {
  loadGlobalBusinessSessions()
})
</script>

<template>
  <div class="p-2">
    <div class="border p-2 mb-2 flex items-center gap-4">
      <div>
        <label class="text-xs font-bold mr-2">Simulate System Role Context:</label>
        <select v-model="currentRole" class="select select-bordered select-xs">
          <option value="branch_manager">Branch Manager</option>
          <option value="track_admin">Track Admin</option>
          <option value="instructor">Instructor</option>
          <option value="student">Student</option>
        </select>
      </div>
      <div v-if="isWorking" class="text-xs font-medium animate-pulse">
        Processing Network Layer Request...
      </div>
    </div>

    <DashboardGrid variant="main-with-sidebar">
      <ContentCard title="Endpoint Hierarchy Cascade Selector">
        <div class="space-y-4">
          <div>
            <label class="block text-xs font-bold mb-1">1. Select Track Context</label>
            <select
              v-model="contextStore.selectedTrackId"
              @change="handleTrackChange"
              class="select select-bordered w-full select-sm"
            >
              <option :value="null">-- Choose Track --</option>
              <option v-for="t in tracksList" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold mb-1">2. Select Target Cohort</label>
            <select
              v-model="contextStore.selectedCohortId"
              @change="handleCohortChange"
              :disabled="cohorts.length === 0"
              class="select select-bordered w-full select-sm"
            >
              <option :value="null">-- Choose Cohort --</option>
              <option v-for="c in cohorts" :key="c.id" :value="c.id">
                Cohort Intake #{{ c.number }} (Active Status: {{ c.is_active }})
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold mb-1">3. Select Destination Lab Group</label>
            <select
              v-model="selectedLabGroupId"
              :disabled="labGroups.length === 0"
              class="select select-bordered w-full select-sm"
            >
              <option :value="null">-- Choose Target Group --</option>
              <option v-for="g in labGroups" :key="g.id" :value="g.id">{{ g.name }}</option>
            </select>
          </div>
        </div>
      </ContentCard>

      <ContentCard :isMainCanvas="true" title="Authorized Functional Action Execution Matrix">
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-4 border-r pr-4">
            <h3 class="text-xs font-bold uppercase tracking-wider text-gray-500">
              Write / Mutate Requests
            </h3>

            <div v-if="currentRole === 'branch_manager'" class="border p-2 space-y-2">
              <span class="text-xs block font-semibold text-gray-500"
                >[Role Block: Branch Manager]</span
              >
              <button
                @click="executeCreateCohort"
                :disabled="!contextStore.selectedTrackId"
                class="btn btn-outline btn-xs w-full text-gray-500"
              >
                POST /tracks/{{ contextStore.selectedTrackId || '?' }}/cohorts (Create Cohort)
              </button>
            </div>

            <div
              v-if="currentRole === 'track_admin' || currentRole === 'branch_manager'"
              class="border p-2 space-y-2"
            >
              <span class="text-xs block font-semibold text-gray-500"
                >[Role Block: Track Admin]</span
              >

              <button
                @click="executeCreateLabGroup"
                :disabled="!contextStore.selectedCohortId"
                class="btn btn-outline btn-xs w-full text-gray-500"
              >
                POST /cohorts/{{ contextStore.selectedCohortId || '?' }}/lab-groups (Create Lab
                Group)
              </button>

              <button
                @click="executeBookEngagement"
                :disabled="!contextStore.selectedCohortId"
                class="btn btn-outline btn-xs w-full text-gray-500"
              >
                POST /engagements (Book Mock Lecture)
              </button>

              <div class="border p-1 space-y-1">
                <label class="block text-xs">Global Cross-Track Business Sessions</label>
                <select
                  v-model="selectedBusinessSessionId"
                  class="select select-bordered select-xs w-full"
                >
                  <option :value="null">-- Select Global Event --</option>
                  <option v-for="bs in businessSessions" :key="bs.id" :value="bs.id">
                    {{ bs.name }}
                  </option>
                </select>
                <button
                  @click="executeEnrollBusinessSession"
                  :disabled="!selectedBusinessSessionId || !contextStore.selectedCohortId"
                  class="btn btn-outline btn-xs w-full mt-1 text-gray-500"
                >
                  POST /business-sessions/{{ selectedBusinessSessionId || '?' }}/cohorts
                </button>
              </div>
            </div>

            <div v-else class="text-xs text-gray-400 italic">
              Simulated identity "{{ currentRole }}" holds no write access scopes for allocation
              modifications on this domain.
            </div>
          </div>

          <div class="space-y-4">
            <h3 class="text-xs font-bold uppercase tracking-wider text-gray-500">
              Read Registers & Real-time Allocation Matrix
            </h3>

            <div>
              <h4 class="text-xs font-semibold mb-1 text-gray-500">
                Unassigned Cohort Pool (Students Count: {{ poolStudents.length }})
              </h4>
              <ul class="border max-h-32 overflow-y-auto p-1 text-xs space-y-1">
                <li v-if="poolStudents.length === 0" class="text-gray-400 italic">
                  No unassigned pool entries parsed.
                </li>
                <li
                  v-for="s in poolStudents"
                  :key="s.student_profile_id"
                  class="flex justify-between items-center border-b pb-1"
                >
                  <span>{{ s.name }} ({{ s.email }})</span>
                  <button
                    @click="executeAssignStudent(s.student_profile_id)"
                    :disabled="!selectedLabGroupId || currentRole !== 'track_admin'"
                    class="btn btn-xs py-0 h-4 min-h-0 text-[10px]"
                  >
                    Assign to [ID: {{ selectedLabGroupId || '?' }}]
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 class="text-xs font-semibold mb-1 text-gray-500">
                Active Lab Sub-Divisions & Nested Rosters
              </h4>
              <div class="border max-h-40 overflow-y-auto p-1 text-xs space-y-2">
                <div v-if="labGroups.length === 0" class="text-gray-400 italic">
                  No laboratory tracking matrix entities initialized.
                </div>
                <div v-for="g in labGroups" :key="g.id" class="border p-1 bg-gray-50">
                  <div class="font-bold border-b pb-0.5 mb-1 text-gray-500">
                    {{ g.name }} (Students: {{ g.student_count ?? g.students?.length ?? 0 }})
                  </div>
                  <ul class="space-y-0.5">
                    <li
                      v-for="member in g.students"
                      :key="member.student_profile_id"
                      class="flex justify-between items-center bg-white p-0.5 pl-1"
                    >
                      <span class="text-gray-500">{{ member.name }}</span>
                      <button
                        @click="executeReleaseStudent(g.id, member.student_profile_id)"
                        :disabled="currentRole !== 'track_admin'"
                        class="text-red-500 font-bold hover:underline ml-2"
                      >
                        [Drop]
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h4 class="text-xs font-semibold mb-1 text-gray-500">
                Active Timeline Booking References (Count: {{ engagements.length }})
              </h4>
              <ul class="border max-h-32 overflow-y-auto p-1 text-xs font-mono space-y-1">
                <li v-if="engagements.length === 0" class="text-gray-400 italic">
                  No parsed scheduling tracks match criteria.
                </li>
                <li v-for="e in engagements" :key="e.id" class="border-b pb-0.5 text-gray-500">
                  {{ e.starts_at.substring(11, 16) }} - {{ e.ends_at.substring(11, 16) }} |
                  {{ e.display_title }} ({{ e.display_context }})
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div class="mt-4 border-t pt-2">
          <h3 class="text-xs font-bold mb-1 uppercase text-gray-500">
            Live Component Server Response Monitor
          </h3>
          <div
            class="bg-black text-green-400 font-mono text-[11px] p-2 rounded max-h-40 overflow-y-auto space-y-0.5"
          >
            <div v-if="operationalLog.length === 0" class="text-gray-600 italic">
              Awaiting integration requests to pipeline tracking channels...
            </div>
            <div
              v-for="(entry, index) in operationalLog"
              :key="index"
              class="whitespace-pre-wrap leading-tight border-b border-gray-900 pb-0.5"
            >
              {{ entry }}
            </div>
          </div>
        </div>
      </ContentCard>
    </DashboardGrid>
  </div>
</template>
