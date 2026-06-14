<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import DashboardGrid from '@/components/structural/DashboardGrid.vue'
import ContentCard from '@/components/structural/ContentCard.vue'

const auth = useAuthStore()

const user = computed(() => auth.currentUser)

const userInitials = computed(() => {
  if (!user.value) return '??'
  return user.value.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

const formatRole = (role: string) => {
  if (!role) return ''
  return role.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const getRoleBadgeClass = (role: string) => {
  switch (role) {
    case 'branch_manager':
      return 'bg-info text-info-content border border-info-border'
    case 'track_admin':
      return 'bg-purple-50 text-purple-700 border border-purple-200'
    case 'instructor':
      return 'bg-warning text-warning-content border border-warning-border'
    case 'student':
      return 'bg-success text-success-content border border-success-border'
    default:
      return 'bg-zinc-50 text-zinc-700 border border-zinc-200'
  }
}

const formatCurrency = (value: number | null) => {
  if (value === null) return 'N/A'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>

<template>
  <div v-if="user" class="space-y-6 max-w-6xl mx-auto">
    <!-- Hero Header Profile Summary Card -->
    <div class="card bg-white border border-surface-200 shadow-xs p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 rounded-xl">
      <div class="avatar placeholder">
        <div class="bg-primary text-white w-24 h-24 rounded-full font-bold text-3xl tracking-wider shadow-inner flex items-center justify-center">
          <span>{{ userInitials }}</span>
        </div>
      </div>

      <div class="flex-1 text-center md:text-left space-y-2">
        <div class="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
          <h2 class="text-2xl font-bold text-surface-900 tracking-tight">{{ user.name }}</h2>
          <span :class="['px-2.5 py-1 text-xs font-semibold rounded-full w-fit mx-auto md:mx-0', getRoleBadgeClass(user.role)]">
            {{ formatRole(user.role) }}
          </span>
        </div>
        <p class="text-sm text-surface-500 flex items-center justify-center md:justify-start gap-2">
          <i class="pi pi-envelope text-xs"></i>
          <span>{{ user.email }}</span>
        </p>
        <p v-if="user.expires_at" class="text-xs text-danger-content font-medium">
          Account Access Expires: {{ formatDate(user.expires_at) }}
        </p>
      </div>
    </div>

    <!-- Details Grid -->
    <DashboardGrid variant="main-with-sidebar">
      <!-- Main Content Block -->
      <div class="xl:col-span-2 space-y-6">
        <!-- STUDENT PANEL -->
        <template v-if="user.role === 'student' && user.student_profile">
          <!-- Academic Ledger Card -->
          <ContentCard title="Academic Profile" subtitle="Cohort enrollment and assignment registry details">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-4 rounded-lg bg-surface-50 border border-surface-200 space-y-1">
                <span class="text-xs font-bold uppercase text-surface-400 tracking-wider">Cohort Group</span>
                <p class="text-lg font-bold text-surface-800">
                  Cohort {{ user.student_profile.cohort?.number || 'N/A' }}
                </p>
                <p class="text-xs text-surface-500">
                  {{ user.student_profile.cohort?.track?.name || 'Unassigned Track' }}
                </p>
              </div>

              <div class="p-4 rounded-lg bg-surface-50 border border-surface-200 space-y-1">
                <span class="text-xs font-bold uppercase text-surface-400 tracking-wider">Lab Group</span>
                <p class="text-lg font-bold text-surface-800">
                  {{ user.student_profile.lab_group?.name || 'Unassigned' }}
                </p>
                <p class="text-xs text-surface-500">Weekly session assignment group</p>
              </div>

              <div class="p-4 rounded-lg bg-surface-50 border border-surface-200 space-y-1 md:col-span-2 flex justify-between items-center">
                <div>
                  <span class="text-xs font-bold uppercase text-surface-400 tracking-wider block">Attendance Balance</span>
                  <p class="text-sm text-surface-500 mt-0.5">Current net standing balance of class checks</p>
                </div>
                <div :class="[
                  'px-4 py-2 rounded-lg text-lg font-black tabular-nums border',
                  user.student_profile.attendance_balance >= 0 
                    ? 'bg-success text-success-content border-success-border' 
                    : 'bg-danger text-danger-content border-danger-border'
                ]">
                  {{ user.student_profile.attendance_balance }} hrs
                </div>
              </div>
            </div>
          </ContentCard>

          <!-- Student Badges / Tags -->
          <ContentCard v-if="user.student_profile.tags && user.student_profile.tags.length > 0" title="Tags & Categories" subtitle="Assigned markers and tracking categories">
            <div class="flex flex-wrap gap-2">
              <span v-for="tag in user.student_profile.tags" :key="tag.id" class="px-3 py-1.5 bg-surface-100 hover:bg-surface-200 border border-surface-200 text-surface-700 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5">
                <i class="pi pi-tag text-[10px]"></i>
                {{ tag.tag }}
              </span>
            </div>
          </ContentCard>

          <!-- Notes Card -->
          <ContentCard v-if="user.student_profile.notes" title="Notes & Remarks" subtitle="Confidential files and remarks logged by facilitators">
            <div class="p-4 rounded-lg bg-warning border border-warning-border text-sm text-surface-700 whitespace-pre-line leading-relaxed">
              {{ user.student_profile.notes }}
            </div>
          </ContentCard>
        </template>

        <!-- STAFF PANEL (Track Admin / Instructor) -->
        <template v-else-if="(user.role === 'track_admin' || user.role === 'instructor') && user.staff_profile">
          <!-- Salary/Compensation Card -->
          <ContentCard title="Compensation & Classification" subtitle="Internal accounting and hiring classification details">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-4 rounded-lg bg-surface-50 border border-surface-200 space-y-1">
                <span class="text-xs font-bold uppercase text-surface-400 tracking-wider">Classification</span>
                <p class="text-lg font-bold text-surface-800 uppercase">
                  {{ user.staff_profile.compensation_type }} Staff
                </p>
                <p class="text-xs text-surface-500">Corporate HR hiring status</p>
              </div>

              <div class="p-4 rounded-lg bg-surface-50 border border-surface-200 space-y-1">
                <span class="text-xs font-bold uppercase text-surface-400 tracking-wider">Compensation Rate</span>
                <p class="text-lg font-bold text-surface-800" v-if="user.staff_profile.compensation_type === 'internal'">
                  {{ formatCurrency(user.staff_profile.fixed_salary) }} <span class="text-xs text-surface-500 font-normal">/ month</span>
                </p>
                <p class="text-lg font-bold text-surface-800" v-else>
                  {{ formatCurrency(user.staff_profile.hourly_rate) }} <span class="text-xs text-surface-500 font-normal">/ hour</span>
                </p>
                <p class="text-xs text-surface-500">Fixed salary or contracted hourly wage</p>
              </div>
            </div>
          </ContentCard>

          <!-- Managed Cohorts -->
          <ContentCard title="Managed Cohorts" subtitle="Academic cohorts currently managed or monitored by you">
            <div v-if="user.staff_profile.managed_cohorts && user.staff_profile.managed_cohorts.length > 0" class="space-y-3">
              <div v-for="item in user.staff_profile.managed_cohorts" :key="item.id" class="p-4 border border-surface-200 rounded-lg bg-surface-50 flex justify-between items-center shadow-2xs">
                <div class="space-y-1">
                  <h4 class="font-bold text-sm text-surface-800">Cohort {{ item.cohort?.number }}</h4>
                  <p class="text-xs text-surface-500 flex items-center gap-1.5">
                    <i class="pi pi-compass text-[10px]"></i>
                    {{ item.cohort?.track?.name || 'Unassigned Track' }}
                  </p>
                </div>
                <span class="badge badge-sm bg-success border-success-border text-success-content" v-if="item.cohort?.is_active">Active</span>
                <span class="badge badge-sm bg-surface-200 border-surface-300 text-surface-600" v-else>Inactive</span>
              </div>
            </div>
            <div v-else class="text-center py-6 text-surface-400 text-sm">
              <i class="pi pi-folder-open text-2xl mb-2 block"></i>
              No cohorts assigned to manage.
            </div>
          </ContentCard>
        </template>

        <!-- BRANCH MANAGER PANEL (Fallback) -->
        <template v-else>
          <ContentCard title="Administrative Information" subtitle="Branch management status parameters">
            <div class="p-4 bg-surface-50 border border-surface-200 rounded-lg text-sm text-surface-700 flex items-start gap-3">
              <i class="pi pi-shield text-primary text-lg mt-0.5"></i>
              <div>
                <h4 class="font-bold text-surface-800">Global Branch Authority</h4>
                <p class="text-xs text-surface-500 mt-1 leading-relaxed">
                  As a Branch Manager, you have full overview authority across all tracks, schedules, grading catalogs, and engagement matrices. Role-specific compensation and ledger balances are restricted to operational accounts.
                </p>
              </div>
            </div>
          </ContentCard>
        </template>
      </div>

      <!-- Sidebar Metadata Block -->
      <div class="space-y-6">
        <!-- Account Profile Details -->
        <ContentCard title="Account Metadata" subtitle="System records and identification markers">
          <div class="divide-y divide-surface-100 text-xs">
            <div class="py-2.5 flex justify-between items-center">
              <span class="text-surface-500 font-semibold uppercase tracking-wider">System User ID</span>
              <span class="font-mono text-surface-700">{{ user.id }}</span>
            </div>
            <div class="py-2.5 flex justify-between items-center" v-if="user.student_profile">
              <span class="text-surface-500 font-semibold uppercase tracking-wider">Student Profile ID</span>
              <span class="font-mono text-surface-700">{{ user.student_profile.id }}</span>
            </div>
            <div class="py-2.5 flex justify-between items-center" v-if="user.staff_profile">
              <span class="text-surface-500 font-semibold uppercase tracking-wider">Staff Profile ID</span>
              <span class="font-mono text-surface-700">{{ user.staff_profile.id }}</span>
            </div>
            <div class="py-2.5 flex justify-between items-center">
              <span class="text-surface-500 font-semibold uppercase tracking-wider">Profile Registry Date</span>
              <span class="text-surface-700">{{ formatDate(user.created_at || user.student_profile?.created_at || user.staff_profile?.created_at) }}</span>
            </div>
            <div class="py-2.5 flex justify-between items-center">
              <span class="text-surface-500 font-semibold uppercase tracking-wider">Last Profile Update</span>
              <span class="text-surface-700">{{ formatDate(user.updated_at || user.student_profile?.updated_at || user.staff_profile?.updated_at) }}</span>
            </div>
          </div>
        </ContentCard>

        <!-- Terms / Support Center widget -->
        <div class="card bg-white border border-surface-200 shadow-xs p-5 rounded-xl space-y-3">
          <h4 class="font-bold text-xs uppercase tracking-wider text-surface-400">Security & Privacy</h4>
          <p class="text-xs text-surface-600 leading-relaxed">
            Need to update your email address or make name changes? Please contact your Cohort Track Administrator to edit core identity records.
          </p>
          <div class="pt-1.5 flex gap-2">
            <router-link to="/forgot-password" class="btn btn-xs btn-outline btn-primary">
              <i class="pi pi-key text-[10px]"></i>
              Reset Password
            </router-link>
          </div>
        </div>
      </div>
    </DashboardGrid>
  </div>
</template>
