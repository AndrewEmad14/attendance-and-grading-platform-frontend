<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useGradingStore } from '@/stores/grading'
import { getStudentSubmissions } from '@/modules/submission/services/submissionService'
import type { Course, CourseDeliverable, Submission } from '@/modules/grading/types'

import ContentCard from '@/components/structural/ContentCard.vue'
import SubmitDeliverableModal from '@/modules/submission/components/SubmitDeliverableModal.vue'

const auth = useAuthStore()
const grading = useGradingStore()

// TODO: confirm field from POST /auth/me — same gap the gradebook has today.
const studentCohortId = computed(() => auth.currentUser?.student_profile?.cohort_id ?? null)
const studentId = computed(() => auth.currentUser?.student_profile?.id ?? null)

const courses = computed<Course[]>(() => grading.courses)
const selectedCourseId = ref<number | null>(null)
const selectedCourse = computed<Course | null>(
  () => courses.value.find((c) => c.id === selectedCourseId.value) ?? null,
)

// Student's own submissions, flat. Indexed by deliverable_id for O(1) lookup.
const submissions = ref<Submission[]>([])
const submissionByDeliverable = computed<Record<number, Submission>>(() => {
  const map: Record<number, Submission> = {}
  for (const s of submissions.value) map[s.deliverable_id] = s
  return map
})

const loading = ref(false)
const error = ref('')

const modalOpen = ref(false)
const modalDeliverable = ref<CourseDeliverable | null>(null)

function getSubmission(deliverableId: number): Submission | undefined {
  return submissionByDeliverable.value[deliverableId]
}

/** Display status. "missing" is the absence of a submission row. */
function rowStatus(d: CourseDeliverable): 'missing' | 'completed' | 'late' {
  const sub = getSubmission(d.id)
  return sub ? sub.status : 'missing'
}

function openSubmit(d: CourseDeliverable) {
  modalDeliverable.value = d
  modalOpen.value = true
}

async function loadSubmissions() {
  if (!studentId.value) return
  submissions.value = await getStudentSubmissions(studentId.value)
}

async function loadAll() {
  loading.value = true
  error.value = ''
  try {
    if (!studentCohortId.value) {
      error.value = 'No cohort found for your account.'
      return
    }
    await Promise.all([grading.loadCourses(studentCohortId.value), loadSubmissions()])
    if (!selectedCourseId.value && courses.value.length) {
      selectedCourseId.value = courses.value[0]!.id
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to load deliverables.'
  } finally {
    loading.value = false
  }
}

// After a submit, refresh submissions so the row flips from "Not submitted"
// to its real status. Single source of truth, cheap round-trip.
async function onSubmitted() {
  modalOpen.value = false
  modalDeliverable.value = null
  try {
    await loadSubmissions()
  } catch (err: any) {
    error.value = err.message || 'Submitted, but failed to refresh.'
  }
}

onMounted(loadAll)
</script>

<template>
  <div class="flex flex-col gap-4 max-w-5xl mx-auto">
    <h1 class="text-xl font-bold text-surface-900">My Deliverables</h1>

    <div v-if="error" class="alert alert-error text-sm py-2">{{ error }}</div>

    <div v-if="loading" class="flex items-center gap-2 text-sm text-surface-500">
      <span class="loading loading-spinner loading-sm"></span> Loading…
    </div>

    <template v-else>
      <!-- Course picker -->
      <ContentCard title="Courses">
        <div v-if="!courses.length" class="text-sm text-surface-400 py-4 text-center">
          No courses found for your cohort.
        </div>
        <div v-else class="flex flex-wrap gap-2">
          <button
            v-for="c in courses"
            :key="c.id"
            @click="selectedCourseId = c.id"
            class="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
            :class="
              selectedCourseId === c.id
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-surface-600 border-surface-200 hover:border-primary-300'
            "
          >
            {{ c.name }}
          </button>
        </div>
      </ContentCard>

      <!-- Deliverables for the selected course -->
      <ContentCard
        v-if="selectedCourse"
        :title="selectedCourse.name"
        subtitle="Your deliverables and submission status"
        isTableContainer
      >
        <table class="table table-sm w-full">
          <thead>
            <tr class="bg-surface-50 text-left">
              <th>Deliverable</th>
              <th class="text-center">Type</th>
              <th class="text-center">Due</th>
              <th class="text-center">Status</th>
              <th class="text-right">Score</th>
              <th class="text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            <DeliverableRow
              v-for="d in selectedCourse.deliverables"
              :key="d.id"
              :deliverable="d"
              :submission="getSubmission(d.id)"
              :status="rowStatus(d)"
              @submit="openSubmit(d)"
            />
            <tr v-if="!selectedCourse.deliverables.length">
              <td colspan="6" class="text-center text-surface-400 py-6 text-sm">
                No deliverables in this course yet.
              </td>
            </tr>
          </tbody>
        </table>
      </ContentCard>
    </template>

    <!-- Submit modal (create-only; no resubmission) -->
    <SubmitDeliverableModal
      v-if="modalDeliverable"
      v-model:visible="modalOpen"
      :deliverable="modalDeliverable"
      @submitted="onSubmitted"
    />
  </div>
</template>
