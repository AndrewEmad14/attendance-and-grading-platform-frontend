<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { attendanceApi } from '../api'
import type { AttendanceLedgerMeta } from '../types'
import AttendanceBalanceCard from '../components/AttendanceBalanceCard.vue'
import AttendanceLedgerTable from '../components/AttendanceLedgerTable.vue'

const route = useRoute()
const router = useRouter()
const studentId = Number(route.params.studentId)

const meta = ref<AttendanceLedgerMeta | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const MAX_BALANCE = 250

async function loadMeta() {
  loading.value = true
  error.value = null
  try {
    meta.value = (await attendanceApi.studentLedgerMeta(studentId)).data
  } catch (e: any) {
    error.value = e.message || 'Failed to load attendance info'
  } finally {
    loading.value = false
  }
}

onMounted(loadMeta)
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-8 space-y-6">
    <div class="flex items-center gap-3">
      <button @click="router.push({ name: 'AdminCohortAttendance' })"
        class="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 text-xs text-zinc-600 hover:bg-zinc-50 transition">
        <i class="pi pi-arrow-left text-[0.7rem]" /> All Students
      </button>
    </div>

    <div v-if="error" class="rounded-lg border border-danger-border bg-danger p-4 text-sm text-danger-content">
      <i class="pi pi-exclamation-triangle mr-2" />{{ error }}
    </div>

    <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div class="h-80 rounded-xl bg-zinc-100 animate-pulse" />
      <div class="lg:col-span-3 h-80 rounded-xl bg-zinc-100 animate-pulse" />
    </div>

    <div v-else-if="meta" class="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:items-start">
      <!-- Sidebar -->
      <div class="space-y-4 sticky top-0 h-screen overflow-y-auto">
        <div class="rounded-xl border border-zinc-200 bg-white p-4">
          <p class="text-sm font-semibold text-zinc-800">{{ meta.name }}</p>
          <p class="text-xs text-zinc-400 mt-0.5">Student #{{ studentId }}</p>
        </div>
        <AttendanceBalanceCard :balance="meta.current_balance" :max="MAX_BALANCE"
          :deducted="MAX_BALANCE - meta.current_balance" />
      </div>

      <!-- Table -->
      <AttendanceLedgerTable :student-id="meta.id" class="lg:col-span-3" />
    </div>
  </div>
</template>