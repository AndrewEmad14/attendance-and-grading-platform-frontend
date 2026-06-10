<script setup lang="ts">
import { ref, computed, watchEffect, onMounted } from 'vue'
import { useGradingStore } from '@/stores/grading'
import { useAuthStore } from '@/stores/auth'
import GradeOverrideModal from '@/modules/grading/components/GradeOverrideModal.vue'
import ContentCard from '@/components/structural/ContentCard.vue'
import DashboardGrid from '@/components/structural/DashboardGrid.vue'
import StatCard from '@/components/structural/StatCard.vue'
import type { Submission, CourseDeliverable, Course } from '@/modules/grading/types'

const gradingStore = useGradingStore()
const auth = useAuthStore()

const selectedCohortId = ref<number | null>(null)
const selectedCourseId = ref<number | null>(null)
const groupFilter  = ref('all')
const searchQuery  = ref('')
const overrideVisible  = ref(false)
const overrideTarget   = ref<{
  submission: Submission
  deliverable: CourseDeliverable
  studentName: string
} | null>(null)
const localScores = ref<Record<number, number | null>>({})

// TODO: replace with real call cohort endpoint
const cohortOptions = ref([
  { id: 1, label: 'Cohort 44 – Full Stack' },
  { id: 2, label: 'Cohort 44 – Data Science' },
])

const selectedCourse = computed(() =>
  gradingStore.courses.find(c => c.id === selectedCourseId.value) ?? null
)

const deliverables = computed(() => selectedCourse.value?.deliverables ?? [])

const allStudents = computed(() => {
  const map = new Map<number, { id: number; name: string; labGroup: string }>()
  deliverables.value.forEach(d => {
    gradingStore.submissions[d.id]?.forEach(sub => {
      if (!map.has(sub.student_id)) {
        map.set(sub.student_id, {
          id: sub.student_id,
          name: (sub as any).student?.name ?? `Student #${sub.student_id}`, // TODO: confirm field from SubmissionResource
          labGroup: (sub as any).student?.lab_group?.name ?? 'Unassigned',  // TODO: confirm field
        })
      }
    })
  })
  return Array.from(map.values())
})

const groupNames = computed(() => [...new Set(allStudents.value.map(s => s.labGroup))])

const visibleStudents = computed(() => {
  let list = allStudents.value
  if (groupFilter.value !== 'all')
    list = list.filter(s => s.labGroup === groupFilter.value)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(s => s.name.toLowerCase().includes(q))
  }
  return list
})

const studentsByGroup = computed(() => {
  const groups = new Map<string, typeof visibleStudents.value>()
  visibleStudents.value.forEach(s => {
    if (!groups.has(s.labGroup)) groups.set(s.labGroup, [])
    groups.get(s.labGroup)!.push(s)
  })
  return groups
})

function getSub(studentId: number, deliverableId: number): Submission | undefined {
  return gradingStore.submissions[deliverableId]?.find(s => s.student_id === studentId)
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
  await gradingStore.loadCourses(id)
}

async function onCourseChange(e: Event) {
  const id = Number((e.target as HTMLSelectElement).value)
  if (!id) return
  selectedCourseId.value = id
  const course = gradingStore.courses.find(c => c.id === id)
  if (course) {
    await Promise.all(course.deliverables.map(d => gradingStore.loadSubmissions(d.id)))
  }
}

async function saveGrade(sub: Submission, deliverableId: number) {
  const score = localScores.value[sub.id]
  if (score == null) return
  await gradingStore.saveGrade(sub.id, score, deliverableId)
  delete localScores.value[sub.id]
}

function openOverride(sub: Submission, d: CourseDeliverable, studentName: string) {
  overrideTarget.value = { submission: sub, deliverable: d, studentName }
  overrideVisible.value = true
}

async function onOverrideSuccess() {
  // Refresh all deliverables for the selected course
  if (selectedCourseId.value) {
    const course = gradingStore.courses.find(c => c.id === selectedCourseId.value)
    if (course) await Promise.all(course.deliverables.map(d => gradingStore.loadSubmissions(d.id)))
  }
  overrideVisible.value = false
  overrideTarget.value = null
}




// TODO: replace (auth.currentUser as any)
// cohortId + labGroupId on currentUser after POST /auth/me
const instrCohortId   = computed(() => (auth.currentUser as any)?.cohortId   ?? null)
const instrLabGroupId = computed(() => (auth.currentUser as any)?.labGroupId ?? null)

const instrDeliverableId = ref<number | null>(null)
const instrSearch  = ref('')

// Load courses + lab group analytics reactively when IDs become available.
// Using watchEffect so it auto-triggers if Andrew's auth work isn't done yet.
watchEffect(() => {
  if (auth.hasRole('instructor') && instrCohortId.value) {
    gradingStore.loadCourses(instrCohortId.value)
    if (instrLabGroupId.value) {
      gradingStore.loadLabGroupAnalytics(instrLabGroupId.value)
    }
  }
})

// Currently selected deliverable object
const instrSelectedDeliverable = computed(() =>
  gradingStore.courses
    .flatMap(c => c.deliverables ?? [])
    .find(d => d.id === instrDeliverableId.value) ?? null
)

// Submissions for selected deliverable
// Backend SubmissionPolicy already scopes these to instructor's lab group
const instrSubmissions = computed(() =>
  instrDeliverableId.value
    ? (gradingStore.submissions[instrDeliverableId.value] ?? [])
    : []
)

// Filtered by search
const instrSubmissionsFiltered = computed(() => {
  if (!instrSearch.value.trim()) return instrSubmissions.value
  
  const q = instrSearch.value.toLowerCase()
  return instrSubmissions.value.filter(s => {
    return s.student?.name.toLowerCase().includes(q)
  })
})

// Grade distribution histogram buckets from lab group analytics
const instrDistBuckets = computed(() => {
  const dist = (gradingStore.analytics as any)?.grade_distribution
  if (!dist) return []
  const buckets = [
    { label: '0–59',   key: '0_59',   color: 'bg-red-300'    },
    { label: '60–69',  key: '60_69',  color: 'bg-yellow-200' },
    { label: '70–79',  key: '70_79',  color: 'bg-blue-200'   },
    { label: '80–89',  key: '80_89',  color: 'bg-green-300'  },
    { label: '90–100', key: '90_100', color: 'bg-green-500'  },
  ]
  const maxCount = Math.max(...buckets.map(b => dist[b.key] ?? 0), 1)
  return buckets.map(b => ({
    ...b,
    count:    dist[b.key] ?? 0,
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

const studentCohortId = computed(() => (auth.currentUser as any)?.cohortId ?? 1)

const studentLoading = ref(false)

if (auth.hasRole('student')) {
  onMounted(async () => {
    studentLoading.value = true
    await gradingStore.loadCourses(studentCohortId.value)
    const allDeliverables = gradingStore.courses.flatMap(c => c.deliverables ?? [])
    await Promise.all(allDeliverables.map(d => gradingStore.loadSubmissions(d.id)))
    studentLoading.value = false
  })
}

function studentSub(deliverableId: number): Submission | undefined {
  const subs = gradingStore.submissions[deliverableId]
  if (!subs) return undefined
  const studentId = (auth.currentUser as any)?.studentId ?? (auth.currentUser as any)?.id
  return subs.find(s => s.student_id === studentId) ?? subs[0]
}

function componentScore(sub: Submission | undefined, d: CourseDeliverable): number {
  if (!sub) return 0
  const eff = sub.override_score ?? sub.raw_score ?? 0
  if (d.max_score === 0) return 0
  return (eff / d.max_score) * d.course_weight
}

function courseTotal(course: Course): number {
  return (course.deliverables ?? []).reduce((sum, d) => {
    return sum + componentScore(studentSub(d.id), d)
  }, 0)
}

const grandTotal = computed(() =>
  gradingStore.courses.reduce((sum, c) => sum + courseTotal(c), 0)
)

const isAtRisk = computed(() =>
  gradingStore.courses.some(c => courseTotal(c) < 60)
)

</script>

<template>
  <div v-if="auth.hasRole('track_admin')" class="flex flex-col gap-4 p-6 h-full overflow-hidden">

    <!-- Controls -->
    <div class="flex items-center gap-3 flex-wrap">
      <select
        class="select select-bordered select-sm"
        @change="onCohortChange"
      >
        <option value="">Select Cohort…</option>
        <option v-for="c in cohortOptions" :key="c.id" :value="c.id">{{ c.label }}</option>
      </select>

      <!-- Always rendered — disabled until cohort is selected -->
      <select
        class="select select-bordered select-sm"
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
        class="select select-bordered select-sm"
      >
        <option value="all">All Groups</option>
        <option v-for="g in groupNames" :key="g" :value="g">{{ g }}</option>
      </select>

      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search student…"
        class="input input-bordered input-sm w-52"
      />
    </div>

    <!-- Error -->
    <div v-if="gradingStore.error" class="alert alert-error text-sm py-2">
      {{ gradingStore.error }}
    </div>

    <!-- Loading -->
    <div v-if="gradingStore.loading" class="flex items-center gap-2 text-sm text-gray-500">
      <span class="loading loading-spinner loading-sm"></span> Loading…
    </div>

    <!-- Empty prompt -->
    <div
      v-else-if="!selectedCourseId"
      class="flex-1 flex items-center justify-center text-sm text-gray-400"
    >
      Select a cohort and course to load the gradebook.
    </div>

    <!-- Table -->
    <div v-else class="flex-1 overflow-auto rounded border border-gray-200 dense-table-container">
      <table class="table table-xs table-pin-rows w-full whitespace-nowrap">

        <!-- Head -->
        <thead>
          <tr class="bg-gray-100">
            <th class="w-52 sticky left-0 bg-gray-100 z-10">Student</th>
            <th
              v-for="d in deliverables"
              :key="d.id"
              class="text-center min-w-[110px]"
            >
              <div class="font-semibold text-xs">{{ d.name }}</div>
              <div class="text-[10px] text-gray-400 font-normal capitalize">{{ d.type }} · /{{ d.max_score }}</div>
            </th>
            <th class="text-right w-20 bg-gray-50">Total</th>
          </tr>
        </thead>

        <!-- Body -->
        <tbody>
          <template v-for="[groupName, students] in studentsByGroup" :key="groupName">

            <!-- Group Separator -->
            <tr class="bg-gray-50">
              <td :colspan="deliverables.length + 2" class="font-semibold text-xs text-gray-600 sticky left-0 bg-gray-50">
                {{ groupName }}
              </td>
            </tr>

            <!-- Student Rows -->
            <tr
              v-for="student in students"
              :key="student.id"
              class="hover:bg-blue-50 group"
            >
              <!-- Name (sticky) -->
              <td class="sticky left-0 bg-white group-hover:bg-blue-50 font-medium text-xs">
                {{ student.name }}
              </td>

              <!-- Score Cells -->
              <td
                v-for="d in deliverables"
                :key="d.id"
                class="text-right font-mono text-xs"
              >
                <!-- No submission -->
                <span v-if="!getSub(student.id, d.id)" class="text-gray-300">—</span>

                <!-- Ungraded: show input -->
                <span v-else-if="getSub(student.id, d.id)!.raw_score === null" class="flex items-center justify-end gap-1">
                  <input
                    v-model.number="localScores[getSub(student.id, d.id)!.id]"
                    type="number"
                    min="0"
                    :max="d.max_score"
                    placeholder="–"
                    class="input input-bordered input-xs w-14 text-right"
                    @keydown.enter="saveGrade(getSub(student.id, d.id)!, d.id)"
                  />
                  <button
                    class="btn btn-xs btn-ghost text-primary"
                    @click="saveGrade(getSub(student.id, d.id)!, d.id)"
                  >
                    save
                  </button>
                </span>

                <!-- Overridden -->
                <span v-else-if="getSub(student.id, d.id)!.override_score !== null" class="flex items-center justify-end gap-1">
                  <span class="material-symbols-outlined text-amber-500 text-[14px]" title="Overridden">bolt</span>
                  {{ getSub(student.id, d.id)!.override_score }}
                  <button
                    class="btn btn-xs btn-ghost text-primary opacity-0 group-hover:opacity-100"
                    @click="openOverride(getSub(student.id, d.id)!, d, student.name)"
                  >edit</button>
                </span>

                <!-- Graded -->
                <span v-else class="flex items-center justify-end gap-1">
                  <span :class="isLow(getSub(student.id, d.id)!.raw_score!, d.max_score) ? 'text-red-600 font-bold' : ''">
                    {{ getSub(student.id, d.id)!.raw_score }}
                  </span>
                  <button
                    class="btn btn-xs btn-ghost text-primary opacity-0 group-hover:opacity-100"
                    @click="openOverride(getSub(student.id, d.id)!, d, student.name)"
                  >override</button>
                </span>
              </td>

              <!-- Grand Total -->
              <td class="text-right font-mono font-bold text-xs">
                {{ rowTotal(student.id) }}
              </td>
            </tr>

          </template>
        </tbody>
      </table>
    </div>

    <!-- Override Modal -->
    <GradeOverrideModal
      v-if="overrideTarget"
      v-model:visible="overrideVisible"
      :submission-id="overrideTarget.submission.id"
      :student-name="overrideTarget.studentName"
      :deliverable-name="overrideTarget.deliverable.name"
      :original-score="overrideTarget.submission.raw_score ?? 0"
      :max-score="overrideTarget.deliverable.max_score"
      @override-success="onOverrideSuccess"
    />
  </div>

<div v-else-if="auth.hasRole('instructor')" class="flex flex-col gap-4 p-6 h-full overflow-hidden">

  <!-- Controls -->
  <div class="flex items-center gap-3 flex-wrap">

    <!-- Deliverable selector grouped by course -->
    <select
      class="select select-bordered select-sm"
      :disabled="!gradingStore.courses.length"
      @change="e => onInstrDeliverableChange(Number((e.target as HTMLSelectElement).value))"
    >
      <option value="">
        {{ gradingStore.courses.length ? 'Select Deliverable…' : 'Loading courses…' }}
      </option>
      <optgroup
        v-for="course in gradingStore.courses"
        :key="course.id"
        :label="course.name"
      >
        <option
          v-for="d in course.deliverables"
          :key="d.id"
          :value="d.id"
        >
          {{ d.name }} · /{{ d.max_score }} ({{ d.type }})
        </option>
      </optgroup>
    </select>

    <input
      v-model="instrSearch"
      type="text"
      placeholder="Search student…"
      class="input input-bordered input-sm w-52"
    />
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
            <th class="w-52 sticky left-0 bg-gray-100 z-10">Student</th>
            <th class="text-right min-w-[140px]">Raw Score</th>
            <th class="text-center w-24">Status</th>
            <th class="text-right w-24">Effective</th>
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
                {{ (sub as any).student?.name ?? (sub as any).student_name ?? `#${sub.student_id}` }}
              </RouterLink>
            </td>

            <!-- Raw Score column — three states -->
            <td class="text-right font-mono text-xs">

              <!-- State 1: Overridden by Track Admin — read-only, no input shown -->
              <span
                v-if="sub.override_score !== null"
                class="flex items-center justify-end gap-1 text-gray-400"
              >
                <span
                  class="material-symbols-outlined text-amber-500 text-[14px]"
                  title="Overridden by Track Admin"
                >bolt</span>
                <span class="line-through">{{ sub.raw_score }}</span>
                <span class="text-[10px] ml-1">by admin</span>
              </span>

              <!-- State 2: Not yet graded — show input -->
              <span
                v-else-if="sub.raw_score === null"
                class="flex items-center justify-end gap-1"
              >
                <input
                  v-model.number="localScores[sub.id]"
                  type="number"
                  min="0"
                  :max="instrSelectedDeliverable?.max_score"
                  placeholder="–"
                  class="input input-bordered input-xs w-14 text-right"
                  @keydown.enter="instrSaveGrade(sub)"
                />
                <button
                  class="btn btn-xs btn-ghost text-primary"
                  @click="instrSaveGrade(sub)"
                >
                  save
                </button>
              </span>

              <!-- State 3: Graded — show score, highlight if low -->
              <span
                v-else
                :class="isLow(sub.raw_score!, instrSelectedDeliverable?.max_score ?? 100)
                  ? 'text-red-600 font-bold'
                  : ''"
              >
                {{ sub.raw_score }}
              </span>
            </td>

            <!-- Status Badge -->
            <td class="text-center">
              <span v-if="sub.override_score !== null"
                class="badge badge-warning badge-sm text-xs">Overridden</span>
              <span v-else-if="sub.raw_score !== null"
                class="badge badge-success badge-sm text-xs">Graded</span>
              <span v-else
                class="badge badge-ghost badge-sm text-xs">Pending</span>
            </td>

            <!-- Effective Score -->
            <td class="text-right font-mono font-bold text-xs">
              {{ sub.override_score ?? sub.raw_score ?? '–' }}
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


  <div v-else-if="auth.hasRole('student')" class="flex flex-col gap-4 p-6">

    <div v-if="studentLoading" class="flex items-center gap-2 text-sm text-gray-500">
      <span class="loading loading-spinner loading-sm"></span> Loading grades…
    </div>

    <div v-if="gradingStore.error" class="alert alert-error text-sm py-2">
      {{ gradingStore.error }}
    </div>

    <DashboardGrid variant="uniform-four">
      <StatCard
        label="Course Score"
        :value="grandTotal.toFixed(1)"
        :trend-text="gradingStore.courses.length + ' course(s)'"
      />
      <StatCard
        label="Grade Status"
        :value="isAtRisk ? 'At Risk' : 'Passing'"
        :trend-type="isAtRisk ? 'danger' : 'success'"
        :trend-text="isAtRisk ? 'One or more courses below 60' : 'All courses ≥ 60'"
      />
    </DashboardGrid>

    <ContentCard
      v-for="course in gradingStore.courses"
      :key="course.id"
      :title="course.name"
      :subtitle="'Course Total: ' + courseTotal(course).toFixed(1)"
      isTableContainer
    >
      <table class="table table-xs w-full">
        <thead>
          <tr class="bg-gray-100">
            <th>Deliverable</th>
            <th class="text-center">Type</th>
            <th class="text-right">Max Score</th>
            <th class="text-right">Your Score</th>
            <th class="text-right">Weight (%)</th>
            <th class="text-right">Component Score</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="d in course.deliverables" :key="d.id" class="hover:bg-blue-50">
            <td class="font-medium text-xs">{{ d.name }}</td>
            <td class="text-center">
              <span class="badge badge-sm" :class="{
                'badge-info': d.type === 'lab',
                'badge-warning': d.type === 'exam',
                'badge-accent': d.type === 'project'
              }">{{ d.type }}</span>
            </td>
            <td class="text-right font-mono text-xs">{{ d.max_score }}</td>
            <td class="text-right font-mono text-xs">
              <template v-if="!studentSub(d.id)">
                <span class="badge badge-ghost badge-sm">Not Submitted</span>
              </template>
              <template v-else>
                <span class="flex items-center justify-end gap-1">
                  <span v-if="studentSub(d.id)!.override_score !== null" class="badge badge-warning badge-sm text-[10px]">Adjusted</span>
                  {{ (studentSub(d.id)!.override_score ?? studentSub(d.id)!.raw_score) ?? '–' }}
                </span>
              </template>
            </td>
            <td class="text-right font-mono text-xs">{{ d.course_weight }}%</td>
            <td class="text-right font-mono font-bold text-xs">{{ componentScore(studentSub(d.id), d).toFixed(1) }}</td>
          </tr>
          <tr class="bg-gray-50 font-bold">
            <td colspan="5" class="text-right text-xs">Course Total</td>
            <td class="text-right font-mono text-xs">{{ courseTotal(course).toFixed(1) }}</td>
          </tr>
        </tbody>
      </table>
    </ContentCard>

    <p class="text-xs text-gray-400 text-center mt-2">
      Score formula: (Your Score ÷ Max Score) × Weight
    </p>
  </div>
</template>

<style scoped>
.dense-table-container::-webkit-scrollbar       { height: 6px; width: 6px; }
.dense-table-container::-webkit-scrollbar-track  { background: #f9fafb; }
.dense-table-container::-webkit-scrollbar-thumb  { background: #d1d5db; border-radius: 4px; }
</style>