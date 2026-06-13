<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { useAuthStore } from '@/stores/auth'

import { useGradingStore } from '@/stores/grading'
import { getStudentSubmissions } from '@/modules/submission/services/submissionService'
import type { Course, CourseDeliverable, Submission } from '@/modules/grading/types'

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

// PrimeVue selection is row-object based; mirror it to the id.
const selectedCourseRow = computed<Course | null>({
  get: () => selectedCourse.value,
  set: (row) => {
    selectedCourseId.value = row?.id ?? null
  },
})

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

/** Display status. "missing" is the absence of a submission row (read-time diff). */
type RowStatus = 'missing' | 'completed' | 'late' | 'graded' | 'overridden'
function rowStatus(d: CourseDeliverable): RowStatus {
  const sub = getSubmission(d.id)
  return sub ? sub.status : 'missing'
}

// Timeline node + badge styling per status.
const STATUS_META: Record<RowStatus, { label: string; node: string; badge: string }> = {
  missing: {
    label: 'Not submitted',
    node: 'border-surface-300 bg-white',
    badge: 'bg-surface-100 border-surface-200 text-surface-500',
  },
  completed: {
    label: 'Submitted',
    node: 'border-primary bg-white',
    badge: 'bg-primary/10 border-primary/20 text-primary',
  },
  late: {
    label: 'Submitted late',
    node: 'border-warning bg-white',
    badge: 'bg-warning/10 border-warning/20 text-surface-800',
  },
  graded: {
    label: 'Graded',
    node: 'border-success bg-white',
    badge: 'bg-success/10 border-success/20 text-success',
  },
  overridden: {
    label: 'Override applied',
    node: 'border-danger bg-white',
    badge: 'bg-danger/10 border-danger/20 text-danger',
  },
}

function statusMeta(d: CourseDeliverable) {
  return STATUS_META[rowStatus(d)]
}

function canSubmit(d: CourseDeliverable): boolean {
  // Create-only model: a submit action only exists while no row exists.
  return !getSubmission(d.id)
}

function scoreDisplay(d: CourseDeliverable): string {
  const sub = getSubmission(d.id)
  // Only show a score once an instructor/admin has graded it.
  // graded_by is the authoritative gate — a null score isn't enough.
  if (!sub || sub.graded_by == null) return '—'
  return `${sub.normalized_score} / ${d.max_score}`
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
  <div class="card bg-white border border-surface-200 shadow-xs w-full overflow-hidden">
    <!-- Header band -->
    <div
      class="p-4 bg-surface-50 border-b border-surface-200 flex flex-wrap justify-between items-center gap-2"
    >
      <div>
        <h3 class="font-bold text-surface-900 text-sm">My Deliverables</h3>
        <p class="text-xs text-surface-500">
          Target Role Focus: Student Portal (Submission Status &amp; Late-Adjusted Scores)
        </p>
      </div>
      <span
        class="text-[10px] font-mono bg-success/10 text-success border border-success/20 px-2 py-0.5 rounded"
      >
        Student Consumption Blueprint
      </span>
    </div>

    <div class="p-6 space-y-6">
      <div v-if="error" class="alert alert-error text-sm py-2">{{ error }}</div>

      <div v-if="loading" class="flex items-center gap-2 text-sm text-surface-500">
        <span class="loading loading-spinner loading-sm"></span> Loading…
      </div>

      <template v-else>
        <!-- Course picker: selectable DataTable -->
        <div class="space-y-2">
          <h4 class="text-xs font-bold uppercase tracking-wider text-surface-500 px-1">
            Enrolled Courses
          </h4>
          <div class="w-full overflow-x-auto border border-surface-200 rounded-lg">
            <DataTable
              v-model:selection="selectedCourseRow"
              :value="courses"
              selectionMode="single"
              dataKey="id"
              class="text-xs min-w-130"
              responsiveLayout="scroll"
            >
              <template #empty>
                <div class="text-center text-surface-400 py-6 text-sm">
                  No courses found for your cohort.
                </div>
              </template>

              <Column field="name" header="Course" class="font-medium text-surface-800"></Column>
              <Column header="Deliverables">
                <template #body="{ data }">
                  <span class="font-mono text-surface-600">
                    {{ data.deliverables?.length ?? 0 }}
                  </span>
                </template>
              </Column>
              <Column header="Submitted">
                <template #body="{ data }">
                  <span class="font-mono text-surface-600">
                    {{
                      (data.deliverables ?? []).filter((d: CourseDeliverable) =>
                        getSubmission(d.id),
                      ).length
                    }}
                    / {{ data.deliverables?.length ?? 0 }}
                  </span>
                </template>
              </Column>
            </DataTable>
          </div>
        </div>

        <!-- Deliverables timeline for the selected course -->
        <div v-if="selectedCourse" class="space-y-4">
          <div class="flex items-center justify-between px-1">
            <h4 class="text-xs font-bold uppercase tracking-wider text-surface-500">
              {{ selectedCourse.name }} — Deliverable Timeline
            </h4>
          </div>

          <div
            v-if="!selectedCourse.deliverables?.length"
            class="p-6 border border-dashed border-surface-200 rounded-xl bg-surface-50/40 text-center text-xs text-surface-400"
          >
            No deliverables in this course yet.
          </div>

          <div v-else class="relative border-l-2 border-surface-200 ml-4 pl-6 space-y-6">
            <div v-for="d in selectedCourse.deliverables" :key="d.id" class="relative">
              <!-- Timeline node, colored by status -->
              <span
                class="absolute -left-7.75 top-1.5 border-2 w-4 h-4 rounded-full flex items-center justify-center shadow-2xs z-10"
                :class="statusMeta(d).node"
              ></span>

              <div
                class="p-4 border border-surface-200 rounded-lg bg-surface-50/40 hover:bg-surface-50 transition-colors duration-150 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              >
                <div class="space-y-1 min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="badge border text-[10px] font-medium" :class="statusMeta(d).badge">
                      {{ statusMeta(d).label }}
                    </span>
                    <span class="text-[11px] text-surface-400 font-medium capitalize">
                      {{ d.type }}
                    </span>
                  </div>
                  <h5
                    class="text-sm font-bold text-surface-900 tracking-tight truncate"
                    :title="d.name"
                  >
                    {{ d.name }}
                  </h5>
                  <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-surface-500">
                    <span class="flex items-center gap-1">
                      <i class="pi pi-calendar text-[11px]"></i>
                      Due: {{ d.due_date ?? 'No deadline' }}
                    </span>
                    <span class="flex items-center gap-1">
                      <i class="pi pi-star text-[11px]"></i>
                      Score: <span class="font-mono text-surface-700">{{ scoreDisplay(d) }}</span>
                    </span>
                  </div>
                </div>

                <div class="shrink-0 self-start sm:self-center">
                  <button
                    v-if="canSubmit(d)"
                    class="btn btn-sm btn-primary text-white normal-case font-medium flex items-center gap-1.5 cursor-pointer"
                    @click="openSubmit(d)"
                  >
                    <i class="pi pi-upload text-[10px]"></i> Submit
                  </button>
                  <span
                    v-else
                    class="badge border border-surface-200 bg-white text-surface-600 text-xs py-2 px-3 font-medium flex items-center gap-1.5"
                  >
                    <i class="pi pi-check text-[10px] text-success"></i> Submitted
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Submit modal (create-only; no resubmission) -->
    <SubmitDeliverableModal
      v-if="modalDeliverable"
      v-model:visible="modalOpen"
      :deliverable="modalDeliverable"
      @submitted="onSubmitted"
    />
  </div>
</template>
