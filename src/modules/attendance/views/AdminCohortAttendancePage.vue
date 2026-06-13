<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/utils/api'
import { attendanceApi } from '../api'
import type { Cohort } from '@/modules/cohorts/types'
import type { CohortStudent } from '@/types'

const router = useRouter()

// --- Cohorts ---
const cohorts = ref<Cohort[]>([])
const selectedCohortId = ref<number | null>(null)
const cohortsLoading = ref(false)

// --- Students ---
const students = ref<CohortStudent[]>([])
const studentsLoading = ref(false)
const studentPage = ref(1)
const studentTotal = ref(0)
const STUDENTS_PER_PAGE = 10

const studentSearch = ref('')
const studentStatusFilter = ref<'all' | 'good' | 'risk' | 'critical'>('all')

// --- Stats (unfiltered, all pages) ---
const allStudents = ref<CohortStudent[]>([])
const atRiskStudents = computed(() => allStudents.value.filter(s => s.attendance_balance < 150))
const atRiskCount = computed(() => atRiskStudents.value.length)
const avgBalance = computed(() => {
  if (!allStudents.value.length) return 0
  const total = allStudents.value.reduce((sum, s) => sum + s.attendance_balance, 0)
  return Math.round((total / allStudents.value.length / 250) * 100)
})

const totalStudentPages = computed(() => Math.max(1, Math.ceil(studentTotal.value / STUDENTS_PER_PAGE)))

let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null

// Search waits 800ms before firing; status/cohort changes fire immediately
watch(studentSearch, () => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    studentPage.value = 1
    loadStudents()
  }, 800)
})

watch([studentStatusFilter], () => {
  studentPage.value = 1
  loadStudents()
})

// Cohort change reloads everything including stats
watch(selectedCohortId, () => {
  studentPage.value = 1
  Promise.all([loadStudents(), loadAllStudents(), loadPendingExcuses()])
})

watch(studentPage, loadStudents)

// --- Excuses (for stats only) ---
const pendingCount = ref(0)

const error = ref<string | null>(null)

async function loadCohorts() {
  cohortsLoading.value = true
  try {
    const res = await api.get<{ data: Cohort[] }>('/cohorts')
    cohorts.value = res.data
    if (cohorts.value.length) selectedCohortId.value = cohorts.value[0]?.id ?? null
  } catch (e: any) {
    error.value = e.message || 'Failed to load cohorts'
  } finally {
    cohortsLoading.value = false
  }
}

async function loadStudents() {
  if (!selectedCohortId.value) return
  studentsLoading.value = true
  try {
    const res = await attendanceApi.cohortStudents(selectedCohortId.value, {
      page: studentPage.value,
      per_page: STUDENTS_PER_PAGE,
      ...(studentSearch.value ? { search: studentSearch.value } : {}),
      ...(studentStatusFilter.value !== 'all' ? { status: studentStatusFilter.value } : {}),
    })
    students.value = res.data
    studentTotal.value = res.meta.total
  } catch (e: any) {
    error.value = e.message || 'Failed to load students'
  } finally {
    studentsLoading.value = false
  }
}

async function loadAllStudents() {
  if (!selectedCohortId.value) return
  try {
    const res = await attendanceApi.cohortStudents(selectedCohortId.value, { per_page: 1000 })
    allStudents.value = res.data
  } catch { }
}

async function loadPendingExcuses() {
  if (!selectedCohortId.value) return
  try {
    const res = await attendanceApi.adminExcuses({
      cohort_id: selectedCohortId.value,
      status: 'pending',
      per_page: 100,
    })
    pendingCount.value = res.meta.total
  } catch { }
}

onMounted(async () => {
  await loadCohorts()
  if (selectedCohortId.value) {
    await Promise.all([loadStudents(), loadAllStudents(), loadPendingExcuses()])
  }
})
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8 space-y-6">

    <div>
      <h1 class="text-xl font-semibold text-zinc-800">Attendance Management</h1>
      <p class="text-sm text-zinc-700 mt-0.5">Monitor cohort health, student balances and excuse requests</p>
    </div>

    <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <i class="pi pi-exclamation-triangle mr-2" />{{ error }}
    </div>

    <!-- Stats row -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">

      <!-- Cohort Health -->
      <div class="rounded-xl border border-zinc-200 bg-white p-5 space-y-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 text-xs font-semibold text-zinc-700">
            <div class="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center">
              <i class="pi pi-shield text-zinc-700 text-xs" />
            </div>
            Cohort Health
          </div>
          <span :class="[
            'text-xs font-medium px-2 py-0.5 rounded-full border',
            avgBalance >= 70 ? 'bg-emerald-50 text-success border-emerald-200' :
              avgBalance >= 40 ? 'bg-amber-50 text-amber-500 border-amber-200' :
                'bg-red-50 text-red-700 border-red-200'
          ]">
            {{ avgBalance >= 70 ? 'Good' : avgBalance >= 40 ? 'At Risk' : 'Critical' }}
          </span>
        </div>
        <div>
          <p class="text-3xl font-bold text-zinc-800">{{ avgBalance }}%</p>
          <p class="text-xs text-zinc-700 mt-0.5">Average Attendance</p>
        </div>
        <div class="w-full h-1.5 rounded-full bg-zinc-100 overflow-hidden">
          <div :class="[
            'h-full rounded-full transition-all',
            avgBalance >= 70 ? 'bg-success' : avgBalance >= 40 ? 'bg-amber-500' : 'bg-red-700'
          ]" :style="{ width: `${avgBalance}%` }" />
        </div>
      </div>

      <!-- Pending Excuses — entire card is the nav target -->
      <div @click="router.push({ name: 'AdminExcuses' })" class="group rounded-xl border border-zinc-200 bg-white p-5 space-y-3 cursor-pointer
               transition-all duration-200
               hover:border-red-200 hover:bg-red-50 hover:shadow-sm hover:-translate-y-0.5">
        <div class="flex items-center justify-between">
          <div
            class="flex items-center gap-2 text-xs font-semibold text-zinc-700 group-hover:text-red-700 transition-colors">
            <div
              class="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
              <i class="pi pi-inbox text-red-700 text-xs" />
            </div>
            Pending Excuses
          </div>
          <span v-if="pendingCount > 0" class="w-2 h-2 rounded-full bg-red-700 animate-pulse" />
        </div>
        <div>
          <p class="text-3xl font-bold text-zinc-800 group-hover:text-red-700 transition-colors">{{ pendingCount }}</p>
          <p class="text-xs text-zinc-700 mt-0.5">Require Review</p>
        </div>
        <div class="text-xs font-semibold text-red-700 flex items-center gap-2 transition-all">
          Review Now <i class="pi pi-arrow-right group-hover:translate-x-0.5 transition-transform"
            style="font-size: 0.6rem;" />
        </div>
      </div>

      <!-- At Risk Students -->
      <div class="rounded-xl border border-zinc-200 bg-white p-5 space-y-3">
        <div class="flex items-center gap-2 text-xs font-semibold text-zinc-700">
          <div class="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
            <i class="pi pi-exclamation-triangle text-amber-500 text-xs" />
          </div>
          At-Risk Students
        </div>
        <div>
          <p class="text-3xl font-bold text-zinc-800">{{ atRiskCount }}</p>
          <p class="text-xs text-zinc-700 mt-0.5">Below Academic Threshold</p>
        </div>
        <div class="flex flex-wrap gap-1">
          <span v-for="s in atRiskStudents.slice(0, 3)" :key="s.student_profile_id"
            class="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
            {{s.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() ?? '??'}} </span>
          <span v-if="atRiskCount > 3" class="text-[10px] text-zinc-700 self-center">+{{ atRiskCount - 3 }} more</span>
        </div>
      </div>
    </div>

    <!-- Students table -->
    <div class="space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <p class="text-xs font-semibold uppercase tracking-widest text-zinc-700">
          Students
          <span v-if="studentTotal" class="ml-1 text-zinc-400">
            ({{ studentTotal }})
          </span>
        </p>

        <!-- Cohort picker + filters together -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- Cohort select (moved here from above) -->
          <div v-if="cohortsLoading" class="h-8 w-32 rounded-lg bg-zinc-100 animate-pulse" />
          <div v-else class="relative">
            <select v-model="selectedCohortId"
              class="appearance-none bg-white text-gray-900 border border-gray-300 rounded-md py-2 pl-3 pr-7 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm w-full transition-all cursor-pointer">
              <option v-for="c in cohorts" :key="c.id" :value="c.id">Cohort #{{ c.number }}</option>
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <i class="pi pi-chevron-down text-[10px]"></i>
            </div>
          </div>

          <div class="relative">
            <select v-model="studentStatusFilter"
              class="appearance-none bg-white text-gray-900 border border-gray-300 rounded-md py-2 pl-3 pr-7 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm w-full transition-all cursor-pointer">
              <option value="all">All Students</option>
              <option value="good">Good Standing</option>
              <option value="risk">At Risk</option>
              <option value="critical">Critical</option>
            </select>
            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
              <i class="pi pi-chevron-down text-[10px]"></i>
            </div>
          </div>

          <div class="relative">
            <i class="pi pi-search absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-700 text-xs" />
            <input v-model="studentSearch" type="text" placeholder="Search students…"
              class="pl-7 pr-3 py-1.5 rounded-lg border border-zinc-200 text-xs text-zinc-700 w-44 focus:outline-none focus:ring-1 focus:ring-indigo-300" />
          </div>
        </div>
      </div>

      <div v-if="studentsLoading" class="space-y-2">
        <div v-for="n in 8" :key="n" class="h-14 rounded-xl bg-zinc-100 animate-pulse" />
      </div>

      <div v-else-if="!students.length"
        class="rounded-xl border border-zinc-200 bg-zinc-50 p-10 text-center text-sm text-zinc-700">
        No students found.
      </div>

      <div v-else class="overflow-x-auto rounded-xl border border-zinc-200">
        <table class="w-full text-sm">
          <thead class="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th class="text-left px-4 py-3 text-xs font-semibold text-zinc-700 uppercase tracking-wide">Student</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-zinc-700 uppercase tracking-wide">Email</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-zinc-700 uppercase tracking-wide">Balance</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-zinc-700 uppercase tracking-wide">Status</th>
              <th class="px-4 py-3" />
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100">
            <tr v-for="student in students" :key="student.student_profile_id"
              @click="router.push({ name: 'StudentLedger', params: { studentId: student.student_profile_id } })"
              class="hover:bg-zinc-50 cursor-pointer transition-colors">
              <td class="px-4 py-3">
                <div class="flex items-center gap-2.5">
                  <div
                    class="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-700 shrink-0">
                    {{student.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}}
                  </div>
                  <span class="font-medium text-zinc-800">{{ student.name }}</span>
                </div>
              </td>
              <td class="px-4 py-3 text-xs text-zinc-700">{{ student.email }}</td>
              <td class="px-4 py-3">
                <span :class="[
                  'text-sm font-semibold',
                  student.attendance_balance >= 150 ? 'text-success' :
                    student.attendance_balance >= 40 ? 'text-amber-500' : 'text-red-700'
                ]">{{ student.attendance_balance }}</span>
                <span class="text-xs text-zinc-300 ml-1">/ 250</span>
              </td>
              <td class="px-4 py-3">
                <span :class="[
                  'text-xs font-medium px-2 py-0.5 rounded-full border',
                  student.attendance_balance >= 150 ? 'bg-emerald-50 text-success border-emerald-200' :
                    student.attendance_balance >= 40 ? 'bg-amber-50 text-amber-500 border-amber-200' :
                      'bg-red-50 text-red-700 border-red-200'
                ]">
                  {{ student.attendance_balance >= 150 ? 'Good' : student.attendance_balance >= 40 ? 'At Risk' :
                    'Critical' }}
                </span>
              </td>
              <td class="px-4 py-3 text-right">
                <i class="pi pi-chevron-right text-xs text-zinc-300" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="totalStudentPages > 1" class="flex items-center justify-between text-xs text-zinc-700">
        <button :disabled="studentPage === 1" @click="studentPage--"
          class="cursor-pointer disabled:cursor-not-allowed px-3 py-1.5 rounded border border-zinc-200 disabled:opacity-40 hover:bg-zinc-50 transition">
          <i class="pi pi-chevron-left" style="font-size: 0.6rem;" />
        </button>
        <span>Page {{ studentPage }} of {{ totalStudentPages }}</span>
        <button :disabled="studentPage === totalStudentPages" @click="studentPage++"
          class="cursor-pointer disabled:cursor-not-allowed px-3 py-1.5 rounded border border-zinc-200 disabled:opacity-40 hover:bg-zinc-50 transition">
          <i class="pi pi-chevron-right" style="font-size: 0.6rem;" />
        </button>
      </div>
    </div>

  </div>
</template>