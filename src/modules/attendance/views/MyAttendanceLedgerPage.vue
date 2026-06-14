<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { attendanceApi } from '../api'
import type { AttendanceLedgerMeta } from '../types'
import AttendanceBalanceCard from '../components/AttendanceBalanceCard.vue'
import AttendanceLedgerTable from '../components/AttendanceLedgerTable.vue'

const auth = useAuthStore()
const meta = ref<AttendanceLedgerMeta | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const MAX_BALANCE = 250

const studentId = computed(() => auth.currentUser?.student_profile?.id)

async function loadMeta() {
  if (!studentId.value) return
  loading.value = true
  error.value = null
  try {
    meta.value = (await attendanceApi.studentLedgerMeta(studentId.value)).data
  } catch (e: any) {
    error.value = e.message || 'Failed to load attendance info'
  } finally {
    loading.value = false
  }
}

onMounted(loadMeta)
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-8 space-y-6 ">
    <div v-if="error" class="rounded-lg border border-danger-border bg-danger p-4 text-sm text-danger-content">
      <i class="pi pi-exclamation-triangle mr-2" />{{ error }}
    </div>

    <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div class="h-80 rounded-xl bg-zinc-100 animate-pulse" />
      <div class="lg:col-span-3 h-80 rounded-xl bg-zinc-100 animate-pulse" />
    </div>
    <div v-else-if="meta" class="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:items-start">
      <!-- Sidebar -->
      <div class="space-y-4  overflow-y-auto">
        <AttendanceBalanceCard :balance="meta.current_balance" :max="MAX_BALANCE"
          :deducted="MAX_BALANCE - meta.current_balance" />
        <div class="rounded-xl border border-zinc-200 bg-white p-5">
          <p class="text-sm font-semibold text-zinc-800 mb-2">
            <i class="pi pi-flag-fill mr-1.5 text-primary" />Maintain Your Balance
          </p>
          <ul class="space-y-2 mt-4 text-xs text-zinc-500">
            <li v-for="text in [
              'Arrive at least 15 minutes early to the campus before your session start time.',
              'Try not to miss sessions unless there is an emergency.',
              'In case of emergencies, submit excuse requests with enough proof to prevent massive deductions.',
            ]" :key="text" class="flex items-start gap-2">
              <i class="pi pi-check-circle text-gray-500 mt-0.5 text-[0.8rem]" />{{ text }}
            </li>
          </ul>
        </div>
      </div>

      <!-- Table lives in its own component, manages its own filters/loading -->
      <AttendanceLedgerTable :student-id="meta.id" class="lg:col-span-3" />
    </div>
  </div>
</template>
