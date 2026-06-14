<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ContentCard from '@/components/structural/ContentCard.vue'
import { useAtRiskStudents } from '../composables/useAtRiskStudents'
import type { FailingCourse } from '../types'

const route = useRoute()
const router = useRouter()

const cohortId = Number(route.params.cohortId)

// ─── Composable State ────────────────────────────────────────────────────────
const { students, isLoading, error, loadStudents } = useAtRiskStudents()

onMounted(() => loadStudents(cohortId))

// ─── Summary Stats ───────────────────────────────────────────────────────────
const totalAtRisk = computed(() => students.value.length)

const attendanceOnlyCount = computed(
  () => students.value.filter((s) => s.at_risk_attendance && !s.at_risk_grade).length,
)

const gradeOnlyCount = computed(
  () => students.value.filter((s) => !s.at_risk_attendance && s.at_risk_grade).length,
)

const bothCount = computed(
  () => students.value.filter((s) => s.at_risk_attendance && s.at_risk_grade).length,
)

// ─── Search & Risk Reason Filter ─────────────────────────────────────────────
const searchQuery = ref('')
const selectedRisk = ref<'all' | 'attendance' | 'grade' | 'both'>('all')

const filteredStudents = computed(() => {
  let rows = students.value

  // Risk reason filter
  if (selectedRisk.value === 'attendance') {
    rows = rows.filter((s) => s.at_risk_attendance && !s.at_risk_grade)
  } else if (selectedRisk.value === 'grade') {
    rows = rows.filter((s) => !s.at_risk_attendance && s.at_risk_grade)
  } else if (selectedRisk.value === 'both') {
    rows = rows.filter((s) => s.at_risk_attendance && s.at_risk_grade)
  }

  // Search filter
  const q = searchQuery.value.toLowerCase().trim()
  if (q) {
    rows = rows.filter(
      (s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q),
    )
  }

  return rows
})

// ─── Pagination ──────────────────────────────────────────────────────────────
const currentPage = ref(1)
const perPage = ref(10)

const totalPages = computed(() => {
  return Math.ceil(filteredStudents.value.length / perPage.value)
})

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * perPage.value
  const end = start + perPage.value
  return filteredStudents.value.slice(start, end)
})

const paginationLabel = computed(() => {
  const total = filteredStudents.value.length
  if (total === 0) return 'No students'
  const from = (currentPage.value - 1) * perPage.value + 1
  const to = Math.min(currentPage.value * perPage.value, total)
  return `Showing ${from}–${to} of ${total} students`
})

// Reset page to 1 when filters change
watch([searchQuery, selectedRisk], () => {
  currentPage.value = 1
})

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

// ─── Failing Courses inline expansion ────────────────────────────────────────
const expandedStudentIds = ref<Set<number>>(new Set())

function toggleCourses(studentId: number) {
  if (expandedStudentIds.value.has(studentId)) {
    expandedStudentIds.value.delete(studentId)
  } else {
    expandedStudentIds.value.add(studentId)
  }
}

function visibleCourses(studentId: number, courses: FailingCourse[]): FailingCourse[] {
  if (expandedStudentIds.value.has(studentId) || courses.length <= 2) {
    return courses
  }
  return courses.slice(0, 2)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Back link + breadcrumb -->
    <div>
      <button
        class="flex items-center gap-1.5 text-xs font-semibold text-surface-500 hover:text-primary transition-colors mb-3 cursor-pointer"
        @click="router.push('/analytics/at-risk')"
      >
        <i class="pi pi-chevron-left text-[10px]"></i>
        Back to Cohort Picker
      </button>
      <div class="text-xs font-semibold tracking-wider text-surface-400 uppercase">
        ANALYTICS <span class="mx-1 text-surface-300">&rsaquo;</span>
        AT-RISK STUDENTS
      </div>
      <h2 class="text-2xl font-bold text-surface-900 mt-1">At-Risk Students</h2>
      <p class="text-sm text-surface-500 mt-0.5">
        Cohort #{{ cohortId }}
      </p>
    </div>

    <!-- Loading Skeleton -->
    <template v-if="isLoading">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          v-for="i in 4"
          :key="i"
          class="h-20 bg-surface-100 border border-surface-200 animate-pulse rounded-lg"
        ></div>
      </div>
      <div class="h-96 bg-surface-100 border border-surface-200 animate-pulse rounded-lg"></div>
    </template>

    <!-- Error State -->
    <template v-else-if="error">
      <div
        class="flex items-center gap-3 p-4 bg-danger border border-danger-border text-danger-content rounded-lg text-sm"
      >
        <i class="pi pi-exclamation-triangle text-lg text-danger-content"></i>
        <span>{{ error }}</span>
        <button
          class="ml-auto btn btn-xs btn-outline border-danger-border text-danger-content cursor-pointer"
          @click="loadStudents(cohortId)"
        >
          Retry
        </button>
      </div>
    </template>

    <!-- Main content once loaded -->
    <template v-else>
      <!-- Summary Stat Chips -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div class="bg-white border border-surface-200 p-4 rounded-lg shadow-xs">
          <div class="text-[11px] font-bold tracking-widest text-surface-500 uppercase">Total At-Risk</div>
          <div class="text-3xl font-extrabold text-surface-900 mt-1">{{ totalAtRisk }}</div>
        </div>
        <div class="bg-white border border-surface-200 p-4 rounded-lg shadow-xs">
          <div class="text-[11px] font-bold tracking-widest text-surface-500 uppercase">Attendance Only</div>
          <div class="text-3xl font-extrabold text-warning-content mt-1">{{ attendanceOnlyCount }}</div>
        </div>
        <div class="bg-white border border-surface-200 p-4 rounded-lg shadow-xs">
          <div class="text-[11px] font-bold tracking-widest text-surface-500 uppercase">Grade Only</div>
          <div class="text-3xl font-extrabold text-warning-content mt-1">{{ gradeOnlyCount }}</div>
        </div>
        <div class="bg-white border border-surface-200 p-4 rounded-lg shadow-xs">
          <div class="text-[11px] font-bold tracking-widest text-surface-500 uppercase">Both Risks</div>
          <div class="text-3xl font-extrabold text-danger-content mt-1">{{ bothCount }}</div>
        </div>
      </div>

      <!-- At-Risk Students Table -->
      <ContentCard title="At-Risk Students" :isTableContainer="true">
        <template #headerAction>
          <!-- Filters & Search -->
          <div class="flex flex-col sm:flex-row gap-3 mt-4 sm:mt-0">
            <!-- Risk reason filter -->
            <select
              v-model="selectedRisk"
              class="select select-bordered select-xs bg-white text-surface-800 border-surface-300 font-semibold"
            >
              <option value="all">All Risks</option>
              <option value="attendance">Attendance Risk</option>
              <option value="grade">Grade Risk</option>
              <option value="both">Both</option>
            </select>

            <!-- Search -->
            <div class="relative">
              <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 text-xs"></i>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search name or email…"
                class="input input-bordered input-xs pl-7 w-full sm:w-52 bg-white text-surface-800 border-surface-300"
              />
            </div>
          </div>
        </template>

        <!-- Empty State -->
        <template v-if="students.length === 0">
          <div class="flex flex-col items-center justify-center py-16 text-center text-surface-400">
            <i class="pi pi-check-circle text-5xl mb-4 text-success-content"></i>
            <p class="text-base font-semibold text-surface-700">No students at risk</p>
            <p class="text-sm mt-1">All students in this cohort are currently meeting attendance and grade requirements.</p>
          </div>
        </template>

        <!-- Table -->
        <div v-else class="overflow-x-auto">
          <table class="table table-sm w-full text-sm">
            <thead>
              <tr class="bg-surface-50 text-surface-600 text-xs uppercase tracking-wider">
                <th class="font-semibold py-3 px-4">Name</th>
                <th class="font-semibold py-3 px-4">Email</th>
                <th class="font-semibold py-3 px-4 text-right">Attendance Balance</th>
                <th class="font-semibold py-3 px-4">Risk Reason</th>
                <th class="font-semibold py-3 px-4">Failing Courses</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredStudents.length === 0">
                <td colspan="5" class="text-center py-12 text-surface-400 italic text-sm">
                  No students match your filters.
                </td>
              </tr>
              <tr
                v-for="student in paginatedStudents"
                :key="student.student_id"
                class="border-b border-surface-100 hover:bg-surface-50 transition-colors align-top"
              >
                <!-- Name -->
                <td class="py-3 px-4 font-medium text-surface-800 whitespace-nowrap">
                  {{ student.name }}
                </td>

                <!-- Email -->
                <td class="py-3 px-4 text-surface-600 text-xs">{{ student.email }}</td>

                <!-- Attendance Balance with warning indicator -->
                <td class="py-3 px-4 text-right font-mono">
                  <span
                    class="inline-flex items-center gap-1 font-semibold"
                    :class="student.attendance_balance < 150 ? 'text-danger-content' : 'text-surface-800'"
                  >
                    <i
                      v-if="student.attendance_balance < 150"
                      class="pi pi-exclamation-triangle text-[10px]"
                    ></i>
                    {{ student.attendance_balance }}
                  </span>
                </td>

                <!-- Risk Reason Badges -->
                <td class="py-3 px-4">
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-if="student.at_risk_attendance"
                      class="badge badge-xs font-semibold px-2 py-1 bg-warning text-warning-content border-warning-border"
                    >
                      Attendance
                    </span>
                    <span
                      v-if="student.at_risk_grade"
                      class="badge badge-xs font-semibold px-2 py-1 bg-danger text-danger-content border-danger-border"
                    >
                      Grade
                    </span>
                  </div>
                </td>

                <!-- Failing Courses with +N expand -->
                <td class="py-3 px-4">
                  <div class="flex flex-wrap gap-1 items-center">
                    <span
                      v-for="course in visibleCourses(student.student_id, student.failing_courses)"
                      :key="course.course_id"
                      class="inline-flex items-center gap-1 text-xs bg-surface-100 border border-surface-200 text-surface-700 font-medium rounded px-2 py-0.5 whitespace-nowrap"
                      :title="course.course_name"
                    >
                      {{ course.course_name.split(' ').slice(0, 2).join(' ') }}
                      <span class="text-danger-content font-bold">— {{ course.score }}</span>
                    </span>

                    <!-- +N more / collapse toggle -->
                    <button
                      v-if="student.failing_courses.length > 2"
                      class="text-xs font-semibold text-primary hover:underline whitespace-nowrap cursor-pointer"
                      @click.stop="toggleCourses(student.student_id)"
                    >
                      {{
                        expandedStudentIds.has(student.student_id)
                          ? 'Show less'
                          : `+${student.failing_courses.length - 2} more`
                      }}
                    </button>

                    <span
                      v-if="student.failing_courses.length === 0"
                      class="text-surface-400 text-xs italic"
                    >—</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Footer -->
        <div
          v-if="filteredStudents.length > 0"
          class="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-surface-100 bg-surface-50"
        >
          <!-- Left side info & perPage control -->
          <div class="flex flex-wrap items-center gap-3">
            <span class="text-xs text-surface-500">{{ paginationLabel }}</span>
            <div class="flex items-center gap-1 text-xs text-surface-500 whitespace-nowrap">
              <span>Show</span>
              <select
                v-model="perPage"
                @change="currentPage = 1"
                class="select select-bordered select-xs bg-white text-surface-800 border-surface-300 font-semibold max-w-[70px]"
              >
                <option :value="5">5</option>
                <option :value="10">10</option>
                <option :value="20">20</option>
                <option :value="50">50</option>
              </select>
              <span>per page</span>
            </div>
          </div>

          <!-- Right side pagination controls -->
          <div v-if="totalPages > 1" class="flex items-center gap-1">
            <button
              class="btn btn-xs btn-outline border-surface-300 text-surface-600"
              :disabled="currentPage <= 1"
              @click="goToPage(currentPage - 1)"
            >
              <i class="pi pi-chevron-left text-[10px]"></i>
            </button>
            <button
              v-for="p in totalPages"
              :key="p"
              class="btn btn-xs cursor-pointer"
              :class="
                p === currentPage
                  ? 'btn-primary text-white'
                  : 'btn-outline border-surface-300 text-surface-600'
              "
              @click="goToPage(p)"
            >
              {{ p }}
            </button>
            <button
              class="btn btn-xs btn-outline border-surface-300 text-surface-600"
              :disabled="currentPage >= totalPages"
              @click="goToPage(currentPage + 1)"
            >
              <i class="pi pi-chevron-right text-[10px]"></i>
            </button>
          </div>
        </div>
      </ContentCard>
    </template>
  </div>
</template>
