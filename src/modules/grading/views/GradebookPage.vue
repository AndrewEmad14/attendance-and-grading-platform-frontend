<script setup lang="ts">
import { ref, computed, watchEffect, onMounted } from 'vue'
import { useGradingStore } from '@/stores/grading'
import { useAuthStore } from '@/stores/auth'
//if you want to use the real auth store, uncomment the following line and comment out the above line
//import { useAuthStore } from '@/stores/auth-real'
import GradeOverrideModal from '@/modules/grading/components/GradeOverrideModal.vue'
import ContentCard from '@/components/structural/ContentCard.vue'
import DashboardGrid from '@/components/structural/DashboardGrid.vue'
import StatCard from '@/components/structural/StatCard.vue'
import type { Submission, CourseDeliverable, Course } from '@/modules/grading/types'
import { api } from '@/utils/api'

const gradingStore = useGradingStore()
const auth = useAuthStore()

const selectedCohortId = ref<number | null>(null)
const selectedCourseId = ref<number | null>(null)
const groupFilter = ref('all')
const searchQuery = ref('')
const overrideVisible = ref(false)
const overrideTarget = ref<{
  submission: Submission
  deliverable: CourseDeliverable
  studentName: string
} | null>(null)
const localScores = ref<Record<string | number, number | null>>({})

// Dynamically compute managed cohorts for the admin
const cohortOptions = computed(() => {
  if (auth.hasRole(['track_admin', 'branch_manager'])) {
    const managed = auth.currentUser?.staff_profile?.managed_cohorts ?? []
    return managed.map((c: any) => ({
      id: c.cohort_id,
      label: `Cohort ${c.cohort?.number} (${c.cohort?.track?.name ?? 'Unknown Track'})`,
    }))
  }
  return []
})

const selectedCourse = computed(
  () => gradingStore.courses.find((c) => c.id === selectedCourseId.value) ?? null,
)

const deliverables = computed(() => selectedCourse.value?.deliverables ?? [])

const allStudents = computed<{ id: number; name: string; labGroup: string }[]>(() => {
  return gradingStore.students.map((s: any) => ({
    id: s.user_id, // student_id is user_id for submission lookups
    name: s.name,
    labGroup: s.lab_group?.name || (s.lab_group_id ? `Lab Group ${s.lab_group_id}` : 'Unassigned'),
  }))
})

const groupNames = computed(() => [...new Set(allStudents.value.map((s) => s.labGroup))])

const visibleStudents = computed(() => {
  let list = allStudents.value
  if (groupFilter.value !== 'all') list = list.filter((s) => s.labGroup === groupFilter.value)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter((s) => s.name.toLowerCase().includes(q))
  }
  return list
})

const studentsByGroup = computed(() => {
  const groups = new Map<string, typeof visibleStudents.value>()
  visibleStudents.value.forEach((s) => {
    if (!groups.has(s.labGroup)) groups.set(s.labGroup, [])
    groups.get(s.labGroup)!.push(s)
  })
  return groups
})

function getSub(studentId: number, deliverableId: number): Submission | undefined {
  return gradingStore.submissions[deliverableId]?.find((s) => s.student_id === studentId)
}

function effectiveScore(sub: Submission): number | null {
  return sub.override_score ?? sub.raw_score
}

function isLow(score: number, maxScore: number): boolean {
  return maxScore > 0 && score / maxScore < 0.6
}

function rowTotal(studentId: number): string {
  const total = deliverables.value.reduce((sum, d) => {
    const sub = getSub(studentId, d.id)
    if (!sub) return sum
    const eff = effectiveScore(sub)
    if (eff === null || d.max_score === 0) return sum
    return sum + (eff / d.max_score) * d.course_weight
  }, 0)
  return total.toFixed(1)
}

async function onCohortChange(e: Event) {
  const id = Number((e.target as HTMLSelectElement).value)
  if (!id) return
  selectedCohortId.value = id
  selectedCourseId.value = null
  await Promise.all([gradingStore.loadCourses(id), gradingStore.loadCohortStudents(id)])
}

async function onCourseChange(e: Event) {
  const id = Number((e.target as HTMLSelectElement).value)
  if (!id) return
  selectedCourseId.value = id
  const course = gradingStore.courses.find((c) => c.id === id)
  if (course) {
    await Promise.all(course.deliverables.map((d) => gradingStore.loadSubmissions(d.id)))
  }
}

async function saveGrade(sub: Submission, deliverableId: number) {
  const score = localScores.value[sub.id]
  if (score == null) return
  await gradingStore.saveGrade(sub.id, score, deliverableId)
  delete localScores.value[sub.id]
}

async function downloadSub(sub: Submission) {
  try {
    if (sub.submission_type === 'link') {
      const res = await api.get<{ data: { url: string } }>(`/submissions/${sub.id}/download`)
      if (res.data?.url) {
        window.open(res.data.url, '_blank')
      } else {
        alert('No link available for this submission.')
      }
    } else {
      const blob = await api.getBlob(`/submissions/${sub.id}/download`)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      // Provide a generic fallback name if the file name isn't returned in headers
      link.setAttribute('download', `submission_${sub.id}`)
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)
      window.URL.revokeObjectURL(url)
    }
  } catch (e: any) {
    console.error(e)
    alert('Failed to download submission.')
  }
}

function openOverride(sub: Submission, d: CourseDeliverable, studentName: string) {
  overrideTarget.value = { submission: sub, deliverable: d, studentName }
  overrideVisible.value = true
}

async function onOverrideSuccess() {
  // Refresh all deliverables for the selected course
  if (selectedCourseId.value) {
    const course = gradingStore.courses.find((c) => c.id === selectedCourseId.value)
    if (course)
      await Promise.all(course.deliverables.map((d) => gradingStore.loadSubmissions(d.id)))
  }
  overrideVisible.value = false
  overrideTarget.value = null
}


// Instructor state
const instrCohorts = ref<any[]>([])
const instrCohortId = ref<number | null>(null)
const instrLabGroupId = computed(() => (auth.currentUser as any)?.labGroupId ?? null)

const instrDeliverableId = ref<number | null>(null)
const instrSearch = ref('')

// Fetch the instructor's accessible cohorts and auto-select the first one
watchEffect(async () => {
  if (auth.hasRole('instructor') && !instrCohorts.value.length) {
    try {
      const res = await api.get<{ data: any[] }>('/cohorts')
      if (res.data && res.data.length > 0) {
        instrCohorts.value = res.data
        if (!instrCohortId.value) {
          instrCohortId.value = res.data[0].id
        }
      }
    } catch (e) {
      console.error('Failed to load instructor cohorts', e)
    }
  }
})

// Load courses + lab group analytics reactively when IDs become available.
watchEffect(() => {
  if (auth.hasRole('instructor') && instrCohortId.value) {
    gradingStore.loadCourses(instrCohortId.value)
    if (instrLabGroupId.value) {
      gradingStore.loadLabGroupAnalytics(instrLabGroupId.value)
    }
  }
})

// Currently selected deliverable object
const instrSelectedDeliverable = computed(
  () =>
    gradingStore.courses
      .flatMap((c) => c.deliverables ?? [])
      .find((d) => d.id === instrDeliverableId.value) ?? null,
)

// Submissions for selected deliverable
// Backend SubmissionPolicy already scopes these to instructor's lab group
const instrSubmissions = computed(() =>
  instrDeliverableId.value ? (gradingStore.submissions[instrDeliverableId.value] ?? []) : [],
)

// Filtered by search
const instrSubmissionsFiltered = computed(() => {
  if (!instrSearch.value.trim()) return instrSubmissions.value

  const q = instrSearch.value.toLowerCase()
  return instrSubmissions.value.filter((s) => {
    return s.student?.name.toLowerCase().includes(q)
  })
})

// Grade distribution histogram buckets from lab group analytics
const instrDistBuckets = computed(() => {
  const dist = (gradingStore.analytics as any)?.grade_distribution
  if (!dist) return []
  const buckets = [
    { label: '0–59', key: '0_59', color: 'bg-red-300' },
    { label: '60–69', key: '60_69', color: 'bg-yellow-200' },
    { label: '70–79', key: '70_79', color: 'bg-blue-200' },
    { label: '80–89', key: '80_89', color: 'bg-green-300' },
    { label: '90–100', key: '90_100', color: 'bg-green-500' },
  ]
  const maxCount = Math.max(...buckets.map((b) => dist[b.key] ?? 0), 1)
  return buckets.map((b) => ({
    ...b,
    count: dist[b.key] ?? 0,
    heightPx: Math.max(Math.round(((dist[b.key] ?? 0) / maxCount) * 64), 4),
  }))
})

function onInstrDeliverableChange(id: number) {
  instrDeliverableId.value = id || null
  if (id) gradingStore.loadSubmissions(id)
}

// Reuses localScores from Track Admin — keyed by submission.id, no conflict
function instrSaveGrade(sub: Submission) {
  const score = localScores.value[sub.id]
  if (score === undefined || score === null) return
  gradingStore.saveGrade(sub.id, score, instrDeliverableId.value!)
}

const studentCohortId = computed(() => auth.currentUser?.student_profile?.cohort_id ?? 1)

const studentLoading = ref(false)
const studentSelectedCourseId = ref<number | 'all'>('all')

const studentDisplayedCourses = computed(() => {
  if (studentSelectedCourseId.value === 'all') {
    return gradingStore.courses
  }
  return gradingStore.courses.filter(c => c.id === studentSelectedCourseId.value)
})

if (auth.hasRole('student')) {
  onMounted(async () => {
    studentLoading.value = true
    await gradingStore.loadCourses(studentCohortId.value)
    
    // Instead of loading all deliverables (which throws 403 for students),
    // we fetch the student's personal tracker data all at once.
    const studentId = auth.currentUser?.student_profile?.id
    if (studentId) {
      await gradingStore.loadStudentSubmissions(studentId)
    }

    studentLoading.value = false
  })
}

function studentSub(deliverableId: number): Submission | undefined {
  const subs = gradingStore.submissions[deliverableId]
  if (!subs) return undefined
  const studentId = auth.currentUser?.student_profile?.id
  return subs.find((s) => s.student_id === studentId) ?? subs[0]
}

function componentScore(sub: Submission | undefined, d: CourseDeliverable): number {
  if (!sub) return 0
  // Cap at max_score to prevent over-100% individual components if override was too high
  const eff = Math.min(sub.override_score ?? sub.raw_score ?? 0, d.max_score)
  if (d.max_score === 0) return 0
  return (eff / d.max_score) * d.course_weight
}

function courseTotal(course: Course): number {
  const deliverables = course.deliverables ?? []
  if (deliverables.length === 0) return 0
  
  const totalWeight = deliverables.reduce((sum, d) => sum + d.course_weight, 0)
  if (totalWeight === 0) return 0
  
  const weightedScore = deliverables.reduce((sum, d) => {
    return sum + componentScore(studentSub(d.id), d)
  }, 0)
  
  // Normalize the score relative to the actual total weight, capping at 100%
  return Math.min((weightedScore / totalWeight) * 100, 100)
}

const overallCoursesTotal = computed(() => {
  if (gradingStore.courses.length === 0) return 0
  const coursesSum = gradingStore.courses.reduce((sum, c) => sum + courseTotal(c), 0)
  
  // Grand Total = Attendance Ledger (out of 250) + Sum of Course Scores (each out of 100)
  const maxPossible = 250 + (gradingStore.courses.length * 100)
  if (maxPossible === 0) return 0
  
  return ((attendanceBalance + coursesSum) / maxPossible) * 100
})
const isAtRisk = computed(() => gradingStore.courses.some((c) => courseTotal(c) < 60))
</script>

<template>
  <div
    v-if="auth.hasRole('track_admin')"
    class="flex flex-col h-full overflow-hidden bg-surface-50"
  >
    <!-- Top Action Bar -->
    <header
      class="bg-white px-6 py-4 border-b border-surface-200 flex items-center justify-between shrink-0"
    >
      <div class="flex items-center gap-4">
        <h2 class="text-2xl font-bold text-surface-900 tracking-tight">Gradebook Overview</h2>
        <span
          class="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider border border-blue-200"
          >Track Admin</span
        >
      </div>
      <div class="flex items-center gap-3">
        <div class="relative">
          <i
            class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 text-sm"
          ></i>
          <input
            v-model="searchQuery"
            class="pl-9 pr-3 py-2 border border-surface-300 rounded text-sm text-surface-900 bg-surface-50 focus:border-primary-500 focus:ring-1 focus:ring-primary-200 outline-none w-64 transition-all"
            placeholder="Search student..."
            type="text"
          />
        </div>
      </div>
    </header>

    <!-- High Density Data Table Area -->
    <div class="flex-1 p-6 overflow-hidden flex flex-col bg-surface-50">
      <!-- Table Controls -->
      <div class="mb-4 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <select
            class="border border-surface-300 rounded px-3 py-1.5 text-sm text-surface-900 bg-white focus:outline-none focus:border-primary-500 shadow-sm"
            @change="onCohortChange"
          >
            <option value="">Select Cohort…</option>
            <option v-for="c in cohortOptions" :key="c.id" :value="c.id">{{ c.label }}</option>
          </select>

          <!-- Always rendered — disabled until cohort is selected -->
          <select
            class="border border-surface-300 rounded px-3 py-1.5 text-sm text-surface-900 bg-white focus:outline-none focus:border-primary-500 shadow-sm disabled:opacity-50"
            :disabled="!gradingStore.courses.length"
            @change="onCourseChange"
          >
            <option value="">
              {{ gradingStore.courses.length ? 'Select Course…' : 'Select cohort first' }}
            </option>
            <option v-for="course in gradingStore.courses" :key="course.id" :value="course.id">
              {{ course.name }}
            </option>
          </select>

          <select
            v-if="groupNames.length > 1"
            v-model="groupFilter"
            class="border border-surface-300 rounded px-3 py-1.5 text-sm text-surface-900 bg-white focus:outline-none focus:border-primary-500 shadow-sm"
          >
            <option value="all">All Groups</option>
            <option v-for="g in groupNames" :key="g" :value="g">{{ g }}</option>
          </select>
        </div>
      </div>

      <!-- Error -->
      <div v-if="gradingStore.error" class="alert alert-error text-sm py-2 mb-4">
        {{ gradingStore.error }}
      </div>

      <!-- Loading -->
      <div
        v-if="gradingStore.loading"
        class="flex items-center justify-center flex-1 text-sm text-surface-500"
      >
        <span class="loading loading-spinner loading-md mr-2"></span> Loading gradebook data…
      </div>

      <!-- Empty prompt -->
      <div
        v-else-if="!selectedCourseId"
        class="flex-1 flex flex-col items-center justify-center text-sm text-surface-400 border-2 border-dashed border-surface-200 rounded-xl bg-white/50"
      >
        <i class="pi pi-table text-4xl mb-3 text-surface-300"></i>
        <span>Select a cohort and course to load the gradebook.</span>
      </div>

      <!-- Scrollable Table Container -->
      <div
        v-else
        class="bg-white border border-surface-300 rounded-lg flex-1 overflow-auto dense-table-container shadow-sm"
      >
        <table class="w-full text-left border-collapse whitespace-nowrap">
          <thead class="sticky top-0 bg-surface-50 z-10 shadow-[0_1px_0_#cbd5e1]">
            <tr>
              <th
                class="px-4 py-3 text-xs font-bold text-surface-900 border-r border-surface-300 w-64 uppercase tracking-wider"
              >
                Student Identifier
              </th>

              <th
                v-for="d in deliverables"
                :key="d.id"
                class="px-3 py-2 border-r border-surface-300 text-center bg-white min-w-[120px]"
              >
                <div class="text-xs font-bold text-surface-900 truncate">{{ d.name }}</div>
                <div class="text-[10px] text-surface-500 font-normal mt-0.5 capitalize">
                  {{ d.type }} · /{{ d.max_score }}
                </div>
              </th>

              <th
                class="px-4 py-3 text-xs font-bold text-primary-700 text-right w-32 bg-blue-50 border-l border-surface-300 uppercase tracking-wider shadow-[-4px_0_12px_rgba(0,0,0,0.02)] sticky right-0"
              >
                Course Total
                <div class="text-[9px] text-primary-600/70 font-normal mt-0.5 normal-case">
                  Out of 100%
                </div>
              </th>
            </tr>
          </thead>

          <tbody class="bg-white">
            <template v-for="[groupName, students] in studentsByGroup" :key="groupName">
              <!-- Group Separator -->
              <tr class="bg-surface-100 border-y border-surface-300">
                <td
                  :colspan="deliverables.length + 2"
                  class="px-4 py-2 text-xs font-bold text-surface-700 sticky left-0 bg-surface-100 shadow-[1px_0_0_#cbd5e1]"
                >
                  {{ groupName }}
                </td>
              </tr>

              <!-- Data Rows -->
              <tr
                v-for="student in students"
                :key="student.id"
                class="hover:border hover:border-primary-400 hover:-outline-offset-1 border-b border-surface-200 h-10 group"
              >
                <td
                  class="px-4 py-1.5 text-sm text-surface-900 border-r border-surface-300 group-hover:border-transparent sticky left-0 bg-white group-hover:bg-blue-50/50 shadow-[1px_0_0_#cbd5e1]"
                >
                  <RouterLink
                    :to="{ name: 'StudentTags', params: { studentId: student.id } }"
                    class="text-primary-700 hover:underline font-medium"
                  >
                    {{ student.name }}
                  </RouterLink>
                </td>

                <td
                  v-for="d in deliverables"
                  :key="d.id"
                  class="px-3 py-1.5 text-right border-r border-surface-300 group-hover:border-transparent font-mono text-sm"
                >
                  <!-- No submission -->
                  <span
                    v-if="!getSub(student.id, d.id)"
                    class="text-surface-300 flex items-center justify-end gap-1"
                  >
                    <span :class="{ hidden: d.type !== 'lab' }">—</span>
                  </span>

                  <!-- Ungraded -->
                  <span
                    v-else-if="
                      !getSub(student.id, d.id)!.graded_by &&
                      getSub(student.id, d.id)!.override_score === null
                    "
                    class="flex items-center justify-end gap-1"
                  >
                    <template v-if="d.type !== 'lab'">
                      <button
                        class="text-primary-600 hover:text-primary-800 mr-2 flex items-center justify-center p-1 rounded hover:bg-primary-50 transition-colors"
                        title="View Submission"
                        @click="downloadSub(getSub(student.id, d.id)!)"
                      >
                        <i class="pi pi-external-link text-[12px]"></i>
                      </button>
                      <input
                        v-model.number="localScores[getSub(student.id, d.id)!.id]"
                        type="number"
                        min="0"
                        :max="d.max_score"
                        placeholder="–"
                        class="w-14 text-right border-b border-surface-400 bg-transparent focus:border-primary-500 focus:outline-none px-1 py-0.5 text-sm font-mono text-surface-900"
                        @keydown.enter="saveGrade(getSub(student.id, d.id)!, d.id)"
                      />
                      <button
                        class="inline-flex items-center justify-center text-primary-500 hover:bg-primary-50 hover:text-primary-700 rounded p-1 transition-colors"
                        title="Save"
                        @click="saveGrade(getSub(student.id, d.id)!, d.id)"
                      >
                        <i class="pi pi-check text-[14px]"></i>
                      </button>
                    </template>
                    <template v-else>
                      <span
                        class="text-amber-500 italic text-[11px] tracking-tight mr-1"
                        title="Waiting for instructor to grade"
                        >Pending</span
                      >
                    </template>
                  </span>

                  <!-- Overridden -->
                  <span
                    v-else-if="getSub(student.id, d.id)!.override_score !== null"
                    class="flex items-center justify-end gap-1"
                  >
                    <template v-if="d.type !== 'lab'">
                      <button
                        class="text-primary-600 hover:text-primary-800 mr-2 flex items-center justify-center p-1 rounded hover:bg-primary-50 transition-colors"
                        title="View Submission"
                        @click="downloadSub(getSub(student.id, d.id)!)"
                      >
                        <i class="pi pi-external-link text-[12px]"></i>
                      </button>
                    </template>
                    <i class="pi pi-bolt text-amber-500 text-[12px]" title="Manual Override"></i>
                    <span class="font-bold text-blue-700 ml-1">{{
                      getSub(student.id, d.id)!.override_score
                    }}</span>
                    <button
                      class="inline-flex items-center justify-center text-primary-500 hover:bg-primary-50 hover:text-primary-700 rounded p-1 transition-colors ml-1"
                      title="Edit Override"
                      @click="openOverride(getSub(student.id, d.id)!, d, student.name)"
                    >
                      <i class="pi pi-pencil text-[12px]"></i>
                    </button>
                  </span>

                  <!-- Graded (Normal) -->
                  <span v-else class="flex items-center justify-end gap-1 group/grade">
                    <template v-if="d.type !== 'lab'">
                      <button
                        class="text-primary-600 hover:text-primary-800 mr-2 flex items-center justify-center p-1 rounded hover:bg-primary-50 transition-colors"
                        title="View Submission"
                        @click="downloadSub(getSub(student.id, d.id)!)"
                      >
                        <i class="pi pi-external-link text-[12px]"></i>
                      </button>
                    </template>
                    <span
                      class="text-surface-900"
                      :class="
                        isLow(getSub(student.id, d.id)!.raw_score!, d.max_score)
                          ? 'text-red-600 font-bold'
                          : ''
                      "
                    >
                      {{ getSub(student.id, d.id)!.raw_score }}
                    </span>
                    <button
                      class="inline-flex items-center justify-center text-primary-500 hover:bg-primary-50 hover:text-primary-700 rounded p-1 transition-colors ml-1"
                      title="Override Grade"
                      @click="openOverride(getSub(student.id, d.id)!, d, student.name)"
                    >
                      <i class="pi pi-pencil text-[12px]"></i>
                    </button>
                  </span>
                </td>

                <td
                  class="px-4 py-1.5 font-bold text-right text-surface-900 bg-surface-50 group-hover:bg-transparent sticky right-0 shadow-[-1px_0_0_#cbd5e1] border-l border-surface-300"
                >
                  {{ rowTotal(student.id) }}%
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Override Modal -->
    <GradeOverrideModal
      v-if="overrideTarget"
      v-model:visible="overrideVisible"
      :submission-id="overrideTarget.submission.id"
      :student-name="overrideTarget.studentName"
      :deliverable-name="overrideTarget.deliverable.name"
      :deliverable-type="overrideTarget.deliverable.type"
      :original-score="overrideTarget.submission.raw_score ?? 0"
      :max-score="overrideTarget.deliverable.max_score"
      @override-success="onOverrideSuccess"
    />
  </div>

  <div
    v-else-if="auth.hasRole('instructor')"
    class="flex flex-col gap-4 p-6 h-full overflow-hidden"
  >
    <!-- Header Controls -->
    <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-2 flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
      <div>
        <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
          <i class="pi pi-check-square text-primary"></i>
          Lab Grading Matrix
        </h2>
        
        <!-- Deliverable selector grouped by course -->
        <div class="flex flex-col gap-1">
          <label class="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Select Lab Deliverable</label>
          <div class="relative">
            <select
              class="appearance-none bg-white text-gray-900 border border-gray-300 rounded-md py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm w-full transition-all cursor-pointer"
              :disabled="!gradingStore.courses.length"
              @change="(e) => onInstrDeliverableChange(Number((e.target as HTMLSelectElement).value))"
            >
              <option value="">
                {{
                  gradingStore.loading
                    ? 'Loading courses…'
                    : gradingStore.courses.length
                      ? 'Choose a deliverable…'
                      : 'No lab deliverables available in this cohort'
                }}
              </option>
              <template v-for="course in gradingStore.courses" :key="course.id">
                <optgroup
                  v-if="(course.deliverables || []).some((d) => d.type === 'lab')"
                  :label="course.name"
                >
                  <option
                    v-for="d in (course.deliverables || []).filter((d) => d.type === 'lab')"
                    :key="d.id"
                    :value="d.id"
                  >
                    {{ d.name }} · /{{ d.max_score }} pts
                  </option>
                </optgroup>
              </template>
            </select>
            <div
              class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500"
            >
              <i class="pi pi-chevron-down text-[10px]"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Search -->
      <div class="relative w-full md:w-64">
        <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
        <input
          v-model="instrSearch"
          type="text"
          placeholder="Search student..."
          class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all bg-gray-50 focus:bg-white"
        />
      </div>
    </div>

    <!-- Error -->
    <div v-if="gradingStore.error" class="alert alert-error text-sm py-2">
      {{ gradingStore.error }}
    </div>

    <!-- Loading -->
    <div v-if="gradingStore.loading" class="flex items-center gap-2 text-sm text-gray-500">
      <span class="loading loading-spinner loading-sm"></span> Loading…
    </div>

    <!-- Empty prompt — no deliverable selected yet -->
    <div
      v-else-if="!instrDeliverableId"
      class="flex-1 flex items-center justify-center text-sm text-gray-400"
    >
      Select a deliverable to load your lab group's submissions.
    </div>

    <!-- No submissions returned -->
    <div
      v-else-if="instrSubmissionsFiltered.length === 0"
      class="flex-1 flex items-center justify-center text-sm text-gray-400"
    >
      No submissions found for this deliverable.
    </div>

    <!-- Grade table + distribution panel -->
    <template v-else>
      <!-- Grade Table -->
      <div class="flex-1 overflow-auto rounded border border-gray-200 dense-table-container">
        <table class="table table-xs table-pin-rows w-full whitespace-nowrap">
          <thead>
            <tr class="bg-gray-100">
              <th class="w-52 sticky left-0 bg-gray-100 z-10 px-4 py-2 font-semibold text-gray-600">
                Student Name
              </th>
              <th class="w-40 text-left px-4 py-2 font-semibold text-gray-600">Submission</th>
              <th class="text-right min-w-[140px] px-4 py-2 font-semibold text-gray-600">
                Score (Input)
              </th>
              <th class="text-right w-24 px-4 py-2 font-semibold text-gray-600">Grade Preview</th>
              <th class="text-center w-24 px-4 py-2 font-semibold text-gray-600">Status</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="sub in instrSubmissionsFiltered"
              :key="sub.id"
              class="hover:bg-blue-50 group"
            >
              <!-- Student name — links to StudentTagsPage (TASK-003 route) -->
              <td class="sticky left-0 bg-white group-hover:bg-blue-50 font-medium text-xs">
                <RouterLink
                  :to="{ name: 'StudentTags', params: { studentId: sub.student_id } }"
                  class="text-primary hover:underline"
                >
                  <!-- TODO: confirm field name from real SubmissionResource response -->
                  {{
                    (sub as any).student?.name ?? (sub as any).student_name ?? `#${sub.student_id}`
                  }}
                </RouterLink>
              </td>

              <!-- Submission File/Link -->
              <td class="text-xs">
                <a
                  v-if="sub.submission_type === 'link' || sub.submission_type === 'url'"
                  :href="sub.submission_path || '#'"
                  target="_blank"
                  class="text-blue-600 hover:underline truncate inline-block max-w-[150px]"
                  title="Open Submission Link"
                >
                  <i class="pi pi-external-link text-[10px] mr-1"></i> View Link
                </a>
                <a
                  v-else-if="sub.submission_type === 'file'"
                  :href="`/api/submissions/${sub.id}/download`"
                  target="_blank"
                  class="text-blue-600 hover:underline truncate inline-block max-w-[150px]"
                  title="Download File"
                >
                  <i class="pi pi-download text-[10px] mr-1"></i> Download
                </a>
                <span v-else class="text-gray-400 italic">No file attached</span>
              </td>

              <!-- Raw Score column — three states -->
              <td class="text-right font-mono text-xs">
                <!-- State 1: Overridden by Track Admin — read-only, no input shown -->
                <span
                  v-if="sub.override_score !== null"
                  class="flex items-center justify-end gap-1 text-gray-500"
                >
                  <span class="line-through text-[10px] text-gray-400">{{ sub.raw_score }}</span>
                  <span class="font-bold text-primary">{{ sub.override_score }}</span>
                  <span
                    class="text-[9px] text-gray-400 font-bold uppercase tracking-wider bg-gray-100 px-1 rounded ml-1"
                    title="Overridden by Track Admin"
                    >Adj</span
                  >
                </span>

                <!-- State 2: Not yet graded — show input -->
                <span
                  v-else-if="!sub.graded_by && sub.override_score === null"
                  class="flex items-center justify-end gap-1"
                >
                  <template v-if="instrSelectedDeliverable?.type === 'lab'">
                    <input
                      v-model.number="localScores[sub.id]"
                      type="number"
                      min="0"
                      :max="instrSelectedDeliverable?.max_score"
                      placeholder="–"
                      class="w-14 text-right border-b border-gray-400 bg-transparent focus:border-primary focus:outline-none px-1 py-0.5 text-sm font-mono text-gray-900"
                      @keydown.enter="instrSaveGrade(sub)"
                    />
                    <button
                      class="inline-flex items-center justify-center text-primary hover:bg-primary/10 rounded p-1 transition-colors"
                      title="Save"
                      @click="instrSaveGrade(sub)"
                    >
                      <i class="pi pi-check text-[14px]"></i>
                    </button>
                  </template>
                  <template v-else>
                    <span class="text-gray-400 text-xs italic">Pending Admin Grade</span>
                  </template>
                </span>

                <!-- State 3: Graded — show score, highlight if low -->
                <span
                  v-else
                  :class="
                    isLow(sub.raw_score!, instrSelectedDeliverable?.max_score ?? 100)
                      ? 'text-red-600 font-bold'
                      : 'text-gray-900 font-bold'
                  "
                >
                  {{ sub.raw_score }}
                </span>
              </td>

              <!-- Grade Preview (Normalized) -->
              <td class="text-right font-mono font-bold text-xs pr-4 text-gray-900">
                <span
                  v-if="
                    (sub.override_score !== null ||
                      typeof localScores[sub.id] === 'number' ||
                      sub.graded_by) &&
                    instrSelectedDeliverable?.max_score
                  "
                >
                  {{
                    Math.round(
                      ((sub.override_score ??
                        (typeof localScores[sub.id] === 'number' ? localScores[sub.id] : null) ??
                        sub.raw_score ??
                        0) /
                        instrSelectedDeliverable.max_score) *
                        100,
                    )
                  }}%
                </span>
                <span v-else class="text-gray-400 font-normal"> – </span>
              </td>

              <!-- Status Badge -->
              <td class="text-center">
                <span
                  v-if="sub.override_score !== null"
                  class="badge badge-warning badge-sm text-[10px] font-bold uppercase tracking-wider"
                  >Overridden</span
                >
                <span
                  v-else-if="sub.graded_by"
                  class="badge badge-success badge-sm text-[10px] font-bold uppercase tracking-wider"
                  >Graded</span
                >
                <span
                  v-else
                  class="badge badge-ghost badge-sm text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500"
                  >Pending</span
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Grade Distribution Panel -->
      <!-- Histogram pattern extracted from Stitch slide 31 — tokens replaced with real Tailwind -->
      <div class="rounded border border-gray-200 p-4 bg-white shrink-0">
        <p class="text-xs font-semibold text-gray-600 mb-3">Grade Distribution — My Lab Group</p>

        <p v-if="!instrDistBuckets.length" class="text-xs text-gray-400">
          Distribution available after grades are submitted.
        </p>

        <div v-else class="flex items-end gap-2 h-20">
          <div
            v-for="bucket in instrDistBuckets"
            :key="bucket.label"
            class="flex-1 flex flex-col items-center gap-1"
          >
            <span class="text-[10px] text-gray-500 font-mono">{{ bucket.count }}</span>
            <div
              class="w-full rounded-t transition-all duration-300"
              :class="bucket.color"
              :style="{ height: bucket.heightPx + 'px' }"
            ></div>
            <span class="text-[10px] text-gray-400">{{ bucket.label }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>

  <div v-else-if="auth.hasRole('student')" class="max-w-7xl mx-auto w-full px-6 py-8">
    <div
      v-if="studentLoading"
      class="flex items-center justify-center py-12 gap-3 text-surface-500"
    >
      <span class="loading loading-spinner loading-md"></span> Loading your academic record…
    </div>

    <div v-else-if="gradingStore.error" class="alert alert-error text-sm py-3 mb-6 shadow-sm">
      <i class="pi pi-exclamation-triangle"></i>
      {{ gradingStore.error }}
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-12 gap-8">
      <!-- Student Context Sidebar -->
      <aside class="md:col-span-3 flex flex-col gap-4">
        <div class="bg-white border border-surface-200 rounded-2xl p-6 shadow-sm">
          <div class="flex flex-col items-center text-center gap-2 mb-6">
            <div
              class="w-24 h-24 rounded-full overflow-hidden border-4 border-primary-50 bg-surface-100 mb-2 flex items-center justify-center shadow-inner"
            >
              <span class="text-3xl font-bold text-surface-400">
                {{ auth.currentUser?.name.charAt(0).toUpperCase() }}
              </span>
            </div>
            <h2 class="text-lg font-bold text-surface-900">{{ auth.currentUser?.name }}</h2>
            <span
              class="bg-blue-50 text-blue-700 font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md"
              >Student</span
            >
            <p class="text-surface-500 text-sm mt-1">
              {{ gradingStore.courses.length }} Active Courses
            </p>
          </div>

          <div class="space-y-1">
            <div class="flex justify-between items-center py-3 border-b border-surface-100">
              <span class="text-surface-500 text-sm">Overall Score</span>
              <span class="font-mono font-bold text-primary-700 text-base">{{ grandTotal.toFixed(1) }}%</span>
            </div>
            <div class="flex justify-between items-center py-3 border-b border-surface-100">
              <span class="text-surface-500 text-sm">Courses Status</span>
              <span class="font-bold text-sm" :class="isAtRisk ? 'text-red-600' : 'text-green-600'">
                {{ isAtRisk ? 'At Risk' : 'On Track' }}
              </span>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Content Area -->
      <div class="md:col-span-9 flex flex-col gap-6">
        <div class="mb-2">
          <h1 class="text-2xl font-bold text-surface-900 tracking-tight mb-1">My Grades Breakdown</h1>
          <p class="text-surface-500 text-sm">Detailed view of your performance across current courses.</p>
        </div>

        <!-- Course Cards -->
        <div 
          v-for="course in gradingStore.courses" 
          :key="course.id"
          class="bg-white border border-surface-200 rounded-2xl p-6 md:p-8 hover:border-primary-300 transition-colors shadow-sm group"
        >
          <div class="flex justify-between items-start mb-8">
            <div>
              <h3
                class="text-lg font-bold text-surface-900 group-hover:text-primary-700 transition-colors"
              >
                {{ course.name }}
              </h3>
              <p class="text-surface-500 text-sm mt-1">
                {{ course.deliverables.length }} Deliverable(s)
              </p>
            </div>
            <div class="text-right">
              <span class="block text-3xl font-bold text-surface-900 tracking-tight"
                >{{ courseTotal(course).toFixed(1)
                }}<span class="text-xl text-surface-400">%</span></span
              >
              <span class="text-xs font-semibold text-surface-400 uppercase tracking-wider"
                >Overall</span
              >
            </div>
          </div>

          <div class="space-y-6">
            <!-- Grade Components -->
            <div v-for="d in course.deliverables" :key="d.id">
              <div class="flex justify-between text-sm mb-2 items-end">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-surface-700 uppercase tracking-wider text-[11px]">{{
                    d.name
                  }}</span>
                  <span
                    class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                    :class="{
                      'bg-blue-50 text-blue-600': d.type === 'lab',
                      'bg-purple-50 text-purple-600': d.type === 'exam',
                      'bg-emerald-50 text-emerald-600': d.type === 'project',
                    }"
                    >{{ d.type }}</span
                  >
                </div>
                <span class="font-mono text-[13px] text-surface-600">
                  <template v-if="!studentSub(d.id)">
                    <span class="text-surface-400 italic mr-1">Missing</span> /
                    {{ d.max_score }} pts
                  </template>
                  <template
                    v-else-if="
                      (studentSub(d.id)!.override_score ?? studentSub(d.id)!.raw_score) === null
                    "
                  >
                    <span class="text-amber-500 italic mr-1">Pending</span> / {{ d.max_score }} pts
                  </template>
                  <template v-else>
                    <span class="font-bold text-surface-900">
                      {{ studentSub(d.id)!.override_score ?? studentSub(d.id)!.raw_score }}
                    </span>
                    / {{ d.max_score }} pts
                  </template>
                </span>
              </div>
              <div
                class="w-full bg-surface-100 h-2.5 rounded-full overflow-hidden shadow-inner relative"
              >
                <div
                  class="h-full rounded-full transition-all duration-700 ease-out"
                  :class="{
                    'bg-blue-500': d.type === 'lab',
                    'bg-purple-500': d.type === 'exam',
                    'bg-emerald-500': d.type === 'project',
                    'opacity-50':
                      (studentSub(d.id)?.override_score ?? studentSub(d.id)?.raw_score) === null,
                  }"
                  :style="{
                    width:
                      studentSub(d.id) &&
                      (studentSub(d.id)!.override_score ?? studentSub(d.id)!.raw_score) != null
                        ? Math.min(
                            100,
                            ((studentSub(d.id)!.override_score ?? studentSub(d.id)!.raw_score!) /
                              d.max_score) *
                              100,
                          ) + '%'
                        : '0%',
                  }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="gradingStore.courses.length === 0"
          class="text-center py-12 text-surface-500 border-2 border-dashed border-surface-200 rounded-2xl"
        >
          No courses are currently configured for your cohort.
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dense-table-container::-webkit-scrollbar {
  height: 6px;
  width: 6px;
}
.dense-table-container::-webkit-scrollbar-track {
  background: #f9fafb;
}
.dense-table-container::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}
</style>
