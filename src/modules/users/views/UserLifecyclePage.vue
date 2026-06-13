<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getCohorts, getLabGroups } from '@/modules/cohorts/services/cohortService'
import type { Cohort, LabGroup } from '@/modules/cohorts/types'
import {
  listStudents,
  listInstructors,
  listTrackAdmins,
  createUser,
  updateUser,
  deleteUser,
} from '@/modules/users/services/userService'
import type {
  UserListItem,
  CreateUserPayload,
  UpdateUserPayload,
  CreateStudentPayload,
  CreateStaffPayload,
} from '@/modules/users/types'
import type { UserRole } from '@/stores/auth'
import ContentCard from '@/components/structural/ContentCard.vue'
import { userFormSchema } from '../validation'

const authStore = useAuthStore()

// Tab state
const activeTab = ref<'students' | 'instructors' | 'track_admins'>('students')

// Lists state
const usersList = ref<any[]>([])
const loadingList = ref(false)
const searchQuery = ref('')
const sortKey = ref('name')
const currentPage = ref(1)
const lastPage = ref(1)
const totalItems = ref(0)

// Metadata state (Cohorts/Lab Groups)
const cohorts = ref<Cohort[]>([])
const labGroups = ref<LabGroup[]>([])

// Modal state
const showModal = ref(false)
const isEditMode = ref(false)
const selectedUserId = ref<number | null>(null)
const submittingForm = ref(false)
const formErrors = ref<Record<string, string>>({})

// Form state
const form = reactive({
  name: '',
  email: '',
  role: 'student' as UserRole,
  expires_at: '' as string | null,
  compensation_type: 'internal' as 'internal' | 'external',
  fixed_salary: undefined as number | undefined,
  hourly_rate: 0 as number | undefined,
  cohort_id: undefined as number | undefined,
  lab_group_id: undefined as number | undefined,
})

// Delete confirmation state
const showDeleteConfirm = ref(false)
const userToDelete = ref<any>(null)
const deletingUserActive = ref(false)

// Role restrictions
const currentUserRole = computed(() => authStore.currentUser?.role)

const availableRoles = computed(() => {
  if (currentUserRole.value === 'track_admin') {
    return [
      { value: 'student', label: 'Student' },
      { value: 'instructor', label: 'Instructor' },
    ]
  } else if (currentUserRole.value === 'branch_manager') {
    return [
      { value: 'student', label: 'Student' },
      { value: 'instructor', label: 'Instructor' },
      { value: 'track_admin', label: 'Track Admin' },
    ]
  }
  return []
})

const sortOptions = computed(() => {
  const options = [
    { value: 'name', label: 'Name (A-Z)' },
    { value: '-name', label: 'Name (Z-A)' },
  ]
  if (activeTab.value === 'students') {
    options.push(
      { value: 'cohort', label: 'Cohort (Ascending)' },
      { value: '-cohort', label: 'Cohort (Descending)' },
      { value: 'attendance', label: 'Attendance (Low to High)' },
      { value: '-attendance', label: 'Attendance (High to Low)' },
    )
  }
  return options
})

// Load metadata
async function loadCohortsList() {
  try {
    cohorts.value = await getCohorts({ is_active: true })
  } catch (err) {
    console.error('Failed to load cohorts:', err)
  }
}

async function handleCohortChange() {
  form.lab_group_id = undefined
  labGroups.value = []
  if (form.cohort_id) {
    try {
      labGroups.value = await getLabGroups(form.cohort_id)
    } catch (err) {
      console.error('Failed to load lab groups:', err)
    }
  }
}

// Load main table data
async function loadData() {
  // Guard: if track_admin somehow gets track_admins activeTab, reset it to students
  if (currentUserRole.value === 'track_admin' && activeTab.value === 'track_admins') {
    activeTab.value = 'students'
  }

  loadingList.value = true
  usersList.value = []
  try {
    let res
    const params = {
      name: searchQuery.value,
      page: currentPage.value,
      sort: sortKey.value,
    }
    if (activeTab.value === 'students') {
      res = await listStudents(params)
    } else if (activeTab.value === 'instructors') {
      res = await listInstructors(params)
    } else {
      // Guard: track_admin cannot list track_admins
      if (currentUserRole.value === 'track_admin') {
        throw new Error('Unauthorized view action')
      }
      res = await listTrackAdmins(params)
    }

    usersList.value = res.data.data
    currentPage.value = res.data.current_page
    lastPage.value = res.data.last_page
    totalItems.value = res.data.total
  } catch (err) {
    console.error('Failed to load users data list:', err)
  } finally {
    loadingList.value = false
  }
}

function setTab(tab: 'students' | 'instructors' | 'track_admins') {
  activeTab.value = tab
  searchQuery.value = ''
  sortKey.value = 'name' // Reset sort to default when changing tabs
  currentPage.value = 1
  loadData()
}

// Trigger search or sorting adjustments
watch([searchQuery, sortKey], () => {
  currentPage.value = 1
  loadData()
})

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
    loadData()
  }
}

function nextPage() {
  if (currentPage.value < lastPage.value) {
    currentPage.value++
    loadData()
  }
}

// Format utilities
function formatDate(dateString: string | null | undefined) {
  if (!dateString) return 'Never'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatDateForInput(dateString: string | null | undefined): string {
  if (!dateString) return ''
  return dateString.split('T')[0] || ''
}

function getCohortLabel(cohortId?: number | null) {
  if (!cohortId) return 'N/A'
  const c = cohorts.value.find((x) => x.id === cohortId)
  if (!c) return `Cohort #${cohortId}`
  return `Cohort ${c.number} (${c.track?.name || 'Unknown Track'})`
}

function getManagedCohortsLabels(staffProfile: any) {
  if (!staffProfile || !staffProfile.managed_cohorts || staffProfile.managed_cohorts.length === 0) {
    return 'None'
  }
  return staffProfile.managed_cohorts
    .map(
      (entry: any) =>
        `Cohort ${entry.cohort?.number} (${entry.cohort?.track?.name || 'Unknown Track'})`,
    )
    .join(', ')
}

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) return 'N/A'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

// Modal actions
function openCreateModal() {
  isEditMode.value = false
  selectedUserId.value = null
  formErrors.value = {}

  // Reset form with safe default role allowed for current user
  form.name = ''
  form.email = ''
  form.role = availableRoles.value[0]?.value as UserRole || 'student'
  form.expires_at = ''
  form.compensation_type = 'internal'
  form.fixed_salary = undefined
  form.hourly_rate = 0
  form.cohort_id = undefined
  form.lab_group_id = undefined

  showModal.value = true
}

async function openEditModal(userItem: any) {
  isEditMode.value = true
  selectedUserId.value = userItem.id
  formErrors.value = {}

  form.name = userItem.name
  form.email = userItem.email
  form.role = userItem.role
  form.expires_at = formatDateForInput(userItem.expires_at)

  if (userItem.role === 'student' && userItem.student_profile) {
    form.cohort_id = userItem.student_profile.cohort_id || undefined
    form.lab_group_id = userItem.student_profile.lab_group_id || undefined
    if (form.cohort_id) {
      try {
        labGroups.value = await getLabGroups(form.cohort_id)
      } catch (err) {
        console.error('Failed to load lab groups during modal opening:', err)
      }
    }
  } else if (userItem.staff_profile) {
    form.compensation_type = userItem.staff_profile.compensation_type
    form.fixed_salary = userItem.staff_profile.fixed_salary || undefined
    form.hourly_rate = userItem.staff_profile.hourly_rate ?? 0
  }

  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

// Form validations
function validateForm() {
  formErrors.value = {}
  
  const result = userFormSchema.safeParse(form)
  if (!result.success) {
    result.error.issues.forEach((issue) => {
      const path = issue.path[0] as string
      formErrors.value[path] = issue.message
    })
  }

  // Always default the hourly rate to zero if not provided
  if (form.hourly_rate === undefined || form.hourly_rate === null || (form.hourly_rate as any) === '') {
    form.hourly_rate = 0
  }

  return result.success
}

// Submit action
async function handleSubmit() {
  if (!validateForm()) return

  submittingForm.value = true
  try {
    if (isEditMode.value && selectedUserId.value) {
      const payload: UpdateUserPayload = {
        name: form.name,
        email: form.email,
        role: form.role,
        expires_at: form.expires_at || null,
        compensation_type:
          form.role !== 'student'
            ? (form.compensation_type as 'internal' | 'external')
            : undefined,
        fixed_salary:
          form.role !== 'student' && form.compensation_type === 'internal'
            ? (form.fixed_salary !== undefined && form.fixed_salary !== null && (form.fixed_salary as any) !== '' ? Number(form.fixed_salary) : undefined)
            : undefined,
        hourly_rate:
          form.role !== 'student'
            ? Number(form.hourly_rate ?? 0)
            : undefined,
        cohort_id: form.role === 'student' ? form.cohort_id : undefined,
        lab_group_id: form.role === 'student' ? form.lab_group_id || null : undefined,
      }
      await updateUser(selectedUserId.value, payload)
    } else {
      let payload: CreateUserPayload
      if (form.role === 'student') {
        payload = {
          name: form.name,
          email: form.email,
          role: 'student',
          expires_at: form.expires_at || null,
          cohort_id: Number(form.cohort_id),
          lab_group_id: form.lab_group_id ? Number(form.lab_group_id) : null,
        }
      } else {
        payload = {
          name: form.name,
          email: form.email,
          role: form.role as 'instructor' | 'track_admin' | 'branch_manager',
          expires_at: form.expires_at || null,
          compensation_type: form.compensation_type,
          fixed_salary:
            form.compensation_type === 'internal' && form.fixed_salary !== undefined && form.fixed_salary !== null && (form.fixed_salary as any) !== ''
              ? Number(form.fixed_salary)
              : undefined,
          hourly_rate: Number(form.hourly_rate ?? 0),
        }
      }
      await createUser(payload)
    }

    closeModal()
    loadData()
  } catch (err: any) {
    console.error('Failed to submit user profile form:', err)
    formErrors.value.general = err.message || 'Operation failed'
  } finally {
    submittingForm.value = false
  }
}

// Delete trigger
function triggerDelete(userItem: any) {
  userToDelete.value = userItem
  showDeleteConfirm.value = true
}

async function confirmDeleteUser() {
  if (!userToDelete.value) return
  deletingUserActive.value = true
  try {
    await deleteUser(userToDelete.value.id)
    showDeleteConfirm.value = false
    userToDelete.value = null
    loadData()
  } catch (err) {
    console.error('Failed to purge target user database file:', err)
  } finally {
    deletingUserActive.value = false
  }
}

onMounted(() => {
  loadCohortsList()
  loadData()
})
</script>

<template>
  <div class="space-y-6 max-w-6xl mx-auto">
    <!-- Header Title card -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 class="text-2xl font-bold text-surface-900 tracking-tight">System Users Console</h2>
        <p class="text-sm text-surface-500 mt-1">
          Review credentials, edit compensation structures, or adjust expiry limits.
        </p>
      </div>

      <button
        @click="openCreateModal"
        class="bg-[#990011] hover:bg-[#7a000d] text-white font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm shadow-xs transition-colors cursor-pointer"
      >
        <i class="pi pi-user-plus text-xs"></i>
        <span>Register New User</span>
      </button>
    </div>

    <!-- Toolbar Filters -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <!-- Tabs Selector -->
      <div class="tabs bg-surface-100 p-1 rounded-lg flex gap-1 w-fit border border-surface-200">
        <button
          @click="setTab('students')"
          :class="[
            'px-4 py-2 text-xs font-bold rounded-md transition-all cursor-pointer border-none outline-none uppercase tracking-wide',
            activeTab === 'students'
              ? 'bg-white text-surface-900 shadow-xs'
              : 'text-surface-500 hover:text-surface-800 bg-transparent',
          ]"
        >
          Students
        </button>
        <button
          @click="setTab('instructors')"
          :class="[
            'px-4 py-2 text-xs font-bold rounded-md transition-all cursor-pointer border-none outline-none uppercase tracking-wide',
            activeTab === 'instructors'
              ? 'bg-white text-surface-900 shadow-xs'
              : 'text-surface-500 hover:text-surface-800 bg-transparent',
          ]"
        >
          Instructors
        </button>
        <button
          v-if="currentUserRole === 'branch_manager'"
          @click="setTab('track_admins')"
          :class="[
            'px-4 py-2 text-xs font-bold rounded-md transition-all cursor-pointer border-none outline-none uppercase tracking-wide',
            activeTab === 'track_admins'
              ? 'bg-white text-surface-900 shadow-xs'
              : 'text-surface-500 hover:text-surface-800 bg-transparent',
          ]"
        >
          Track Admins
        </button>
      </div>

      <!-- Filters & Search -->
      <div class="flex flex-col sm:flex-row gap-2 w-full md:max-w-md">
        <!-- Sort Select -->
        <select
          v-model="sortKey"
          class="text-xs px-3 py-1.5 bg-white border border-surface-300 rounded-lg focus:outline-none focus:border-[#990011] text-zinc-900 font-medium cursor-pointer"
        >
          <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
            Sort: {{ opt.label }}
          </option>
        </select>

        <!-- Search Field -->
        <div class="relative w-full">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by name..."
            class="w-full text-xs pl-8 pr-4 py-2 bg-white border border-surface-300 rounded-lg focus:outline-none focus:border-[#990011] text-zinc-900"
          />
          <i class="pi pi-search absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-400 text-xs"></i>
        </div>
      </div>
    </div>

    <!-- Main Table Container Card -->
    <ContentCard
      isTableContainer
      title="User Registry"
      subtitle="Showing registered student, instructor, and track administrator profiles."
    >
      <div class="relative min-h-[300px]">
        <!-- Loading overlay -->
        <div
          v-if="loadingList"
          class="absolute inset-0 bg-white/70 flex items-center justify-center z-10"
        >
          <div class="flex items-center gap-2 text-sm text-surface-600 font-medium">
            <i class="pi pi-spin pi-spinner text-base text-[#990011]"></i>
            <span>Extracting profile index catalogs...</span>
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-if="!loadingList && usersList.length === 0"
          class="flex flex-col items-center justify-center py-20 text-surface-400 gap-2"
        >
          <i class="pi pi-users text-4xl"></i>
          <p class="text-sm font-semibold text-surface-600">No users found matching query</p>
        </div>

        <table v-else class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-surface-50 border-b border-surface-200 text-[10px] font-bold text-surface-500 uppercase tracking-wider">
              <th class="p-4">Name & Credentials</th>
              <!-- Conditional column header -->
              <th v-if="activeTab === 'students'" class="p-4">Cohort Roster</th>
              <th v-if="activeTab === 'students'" class="p-4">Group Assignment</th>
              <th v-if="activeTab === 'students'" class="p-4 text-center">Balance Status</th>
              <th v-if="activeTab === 'instructors'" class="p-4">Employment Classification</th>
              <th v-if="activeTab === 'instructors'" class="p-4">Salary details</th>
              <th v-if="activeTab === 'track_admins'" class="p-4">Supervised Cohorts</th>

              <th class="p-4">Account Expiry</th>
              <th class="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-surface-150 text-xs text-surface-800">
            <tr v-for="userItem in usersList" :key="userItem.id" class="hover:bg-surface-50/50">
              <!-- Name & Email -->
              <td class="p-4">
                <div class="font-bold text-surface-900">{{ userItem.name }}</div>
                <div class="text-[10px] text-surface-500 font-medium mt-0.5">{{ userItem.email }}</div>
              </td>

              <!-- Tab specific items -->
              <!-- STUDENTS -->
              <td v-if="activeTab === 'students'" class="p-4 font-semibold text-surface-700">
                {{ getCohortLabel(userItem.student_profile?.cohort_id) }}
              </td>
              <td v-if="activeTab === 'students'" class="p-4">
                <span v-if="userItem.student_profile?.lab_group_id" class="px-2 py-0.5 bg-surface-100 border border-surface-200 rounded text-surface-600 font-mono text-[10px]">
                  Group #{{ userItem.student_profile.lab_group_id }}
                </span>
                <span v-else class="text-surface-400 font-medium italic">Unassigned</span>
              </td>
              <td v-if="activeTab === 'students'" class="p-4 text-center">
                <span :class="[
                  'px-2.5 py-1 text-[11px] font-extrabold rounded-full border tabular-nums',
                  (userItem.student_profile?.attendance_balance ?? 0) >= 0 
                    ? 'bg-green-50 text-green-700 border-green-200' 
                    : 'bg-red-50 text-red-700 border-red-200'
                ]">
                  {{ userItem.student_profile?.attendance_balance ?? 0 }}
                </span>
              </td>

              <!-- INSTRUCTORS -->
              <td v-if="activeTab === 'instructors'" class="p-4">
                <span class="badge badge-sm font-semibold uppercase bg-surface-100 text-surface-700 border border-surface-200">
                  {{ userItem.staff_profile?.compensation_type || 'Unspecified' }}
                </span>
              </td>
              <td v-if="activeTab === 'instructors'" class="p-4 font-bold text-surface-750">
                <span v-if="userItem.staff_profile?.hourly_rate && Number(userItem.staff_profile.hourly_rate) > 0">
                  {{ formatCurrency(userItem.staff_profile.hourly_rate) }} / hr
                </span>
                <span v-else-if="userItem.staff_profile?.fixed_salary && Number(userItem.staff_profile.fixed_salary) > 0">
                  {{ formatCurrency(userItem.staff_profile.fixed_salary) }} / mo
                </span>
                <span v-else class="text-surface-400 italic font-normal">N/A</span>
              </td>

              <!-- TRACK ADMINS -->
              <td v-if="activeTab === 'track_admins'" class="p-4 max-w-[280px] truncate" :title="getManagedCohortsLabels(userItem.staff_profile)">
                {{ getManagedCohortsLabels(userItem.staff_profile) }}
              </td>

              <!-- Expiry date -->
              <td class="p-4 font-medium" :class="userItem.expires_at ? 'text-surface-700' : 'text-surface-400 italic'">
                {{ formatDate(userItem.expires_at) }}
              </td>

              <!-- Action button triggers -->
              <td class="p-4 text-right">
                <div class="flex justify-end gap-2">
                  <button
                    @click="openEditModal(userItem)"
                    class="p-1.5 text-surface-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-md transition-all cursor-pointer"
                    title="Edit User Profile"
                  >
                    <i class="pi pi-pencil text-xs"></i>
                  </button>
                  <button
                    @click="triggerDelete(userItem)"
                    class="p-1.5 text-surface-500 hover:text-red-650 hover:bg-red-50 border border-transparent hover:border-red-150 rounded-md transition-all cursor-pointer"
                    title="Delete User"
                  >
                    <i class="pi pi-trash text-xs"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <template #headerAction>
        <div class="flex items-center gap-3 text-xs font-semibold text-surface-600">
          <span>Page {{ currentPage }} of {{ lastPage }}</span>
          <div class="flex gap-1">
            <button
              @click="prevPage"
              :disabled="currentPage <= 1 || loadingList"
              class="p-1.5 bg-white hover:bg-surface-50 border border-surface-250 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-surface-700"
            >
              <i class="pi pi-chevron-left text-[10px]"></i>
            </button>
            <button
              @click="nextPage"
              :disabled="currentPage >= lastPage || loadingList"
              class="p-1.5 bg-white hover:bg-surface-50 border border-surface-250 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-surface-700"
            >
              <i class="pi pi-chevron-right text-[10px]"></i>
            </button>
          </div>
        </div>
      </template>
    </ContentCard>

    <!-- Create / Edit User Dialog Overlay -->
    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 transition-opacity animate-fade-in text-zinc-900"
    >
      <div class="bg-white border border-surface-200 text-zinc-900 rounded-xl shadow-lg max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        <!-- Dialog Header -->
        <div class="p-5 border-b border-surface-200 flex justify-between items-center bg-surface-50 text-zinc-900">
          <h3 class="font-bold text-sm tracking-tight text-zinc-900">
            {{ isEditMode ? 'Modify User Profile' : 'Register New User' }}
          </h3>
          <button @click="closeModal" class="text-zinc-400 hover:text-zinc-650 transition-colors cursor-pointer border-none bg-transparent">
            <i class="pi pi-times text-xs"></i>
          </button>
        </div>

        <!-- Dialog Scroll Body -->
        <form @submit.prevent="handleSubmit" class="flex flex-col flex-1 min-h-0 text-zinc-900 bg-white">
          <div class="p-6 overflow-y-auto space-y-4 flex-1 text-xs text-zinc-800">
            
            <div v-if="formErrors.general" class="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-center gap-2 font-medium">
              <i class="pi pi-exclamation-circle text-sm"></i>
              <span>{{ formErrors.general }}</span>
            </div>

            <!-- Name Input -->
            <div class="flex flex-col gap-1.5">
              <label for="name" class="font-bold text-zinc-700 uppercase tracking-wider">Full Name</label>
              <input
                id="name"
                v-model="form.name"
                type="text"
                required
                placeholder="Enter full name"
                class="w-full pl-3 pr-3 py-2 border border-surface-300 rounded-md focus:outline-none focus:border-[#990011] text-zinc-900 bg-white"
                :class="{ 'border-red-500': formErrors.name }"
              />
              <p v-if="formErrors.name" class="text-[10px] text-red-650 mt-0.5">{{ formErrors.name }}</p>
            </div>

            <!-- Email Input -->
            <div class="flex flex-col gap-1.5">
              <label for="email" class="font-bold text-zinc-700 uppercase tracking-wider">Email Address</label>
              <input
                id="email"
                v-model="form.email"
                type="email"
                required
                placeholder="Enter email address"
                class="w-full pl-3 pr-3 py-2 border border-surface-300 rounded-md focus:outline-none focus:border-[#990011] text-zinc-900 bg-white"
                :class="{ 'border-red-500': formErrors.email }"
              />
              <p v-if="formErrors.email" class="text-[10px] text-red-650 mt-0.5">{{ formErrors.email }}</p>
            </div>

            <!-- System Role (Drop-down, restricted on create, disabled on edit) -->
            <div class="flex flex-col gap-1.5">
              <label for="role" class="font-bold text-zinc-700 uppercase tracking-wider">Operational Role</label>
              <select
                id="role"
                v-model="form.role"
                :disabled="isEditMode"
                class="w-full px-3 py-2 border border-surface-300 rounded-md focus:outline-none focus:border-[#990011] bg-white text-zinc-900"
              >
                <option v-for="roleOption in availableRoles" :key="roleOption.value" :value="roleOption.value" class="text-zinc-900 bg-white">
                  {{ roleOption.label }}
                </option>
              </select>
              <p v-if="formErrors.role" class="text-[10px] text-red-650 mt-0.5">{{ formErrors.role }}</p>
            </div>

            <!-- Expiry date input -->
            <div class="flex flex-col gap-1.5">
              <label for="expires_at" class="font-bold text-zinc-700 uppercase tracking-wider">Account Access Expiry Date (Optional)</label>
              <input
                id="expires_at"
                v-model="form.expires_at"
                type="date"
                class="w-full px-3 py-2 border border-surface-300 rounded-md focus:outline-none focus:border-[#990011] bg-white text-zinc-900"
              />
            </div>

            <!-- Role specific fields -->
            <!-- STUDENT OPTIONS -->
            <div v-if="form.role === 'student'" class="border-t border-surface-150 pt-4 space-y-4">
              <!-- Cohort Select -->
              <div class="flex flex-col gap-1.5">
                <label for="cohort_id" class="font-bold text-zinc-700 uppercase tracking-wider">Cohort Assignment</label>
                <select
                  id="cohort_id"
                  v-model="form.cohort_id"
                  @change="handleCohortChange"
                  class="w-full px-3 py-2 border border-surface-300 rounded-md focus:outline-none focus:border-[#990011] bg-white text-zinc-900"
                  :class="{ 'border-red-500': formErrors.cohort_id }"
                >
                  <option :value="undefined" disabled class="text-zinc-900 bg-white">Select active cohort roster...</option>
                  <option v-for="c in cohorts" :key="c.id" :value="c.id" class="text-zinc-900 bg-white">
                    Cohort {{ c.number }} ({{ c.track?.name || 'Unknown' }})
                  </option>
                </select>
                <p v-if="formErrors.cohort_id" class="text-[10px] text-red-650 mt-0.5">{{ formErrors.cohort_id }}</p>
              </div>

              <!-- Lab Group Select -->
              <div class="flex flex-col gap-1.5">
                <label for="lab_group_id" class="font-bold text-zinc-700 uppercase tracking-wider">Lab Group Bucket (Optional)</label>
                <select
                  id="lab_group_id"
                  v-model="form.lab_group_id"
                  :disabled="!form.cohort_id"
                  class="w-full px-3 py-2 border border-surface-300 rounded-md focus:outline-none focus:border-[#990011] bg-white text-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option :value="undefined" class="text-zinc-900 bg-white">No Group (Unassigned)</option>
                  <option v-for="g in labGroups" :key="g.id" :value="g.id" class="text-zinc-900 bg-white">
                    {{ g.name }}
                  </option>
                </select>
              </div>
            </div>

            <!-- STAFF OPTIONS -->
            <div v-else-if="form.role === 'instructor' || form.role === 'track_admin'" class="border-t border-surface-150 pt-4 space-y-4">
              <!-- Compensation type -->
              <div class="flex flex-col gap-1.5">
                <label for="compensation_type" class="font-bold text-zinc-700 uppercase tracking-wider">Compensation Classification</label>
                <select
                  id="compensation_type"
                  v-model="form.compensation_type"
                  class="w-full px-3 py-2 border border-surface-300 rounded-md focus:outline-none focus:border-[#990011] bg-white text-zinc-900"
                  :class="{ 'border-red-500': formErrors.compensation_type }"
                >
                  <option value="internal" class="text-zinc-900 bg-white">Internal (Monthly Salaried Salary)</option>
                  <option value="external" class="text-zinc-900 bg-white">External (Contractual Hourly Wages)</option>
                </select>
                <p v-if="formErrors.compensation_type" class="text-[10px] text-red-650 mt-0.5">{{ formErrors.compensation_type }}</p>
              </div>

              <!-- Fixed Salary -->
              <div class="flex flex-col gap-1.5">
                <label for="fixed_salary" class="font-bold text-zinc-700 uppercase tracking-wider">Monthly Base Salary ($)</label>
                <input
                  id="fixed_salary"
                  v-model="form.fixed_salary"
                  type="number"
                  placeholder="e.g. 5000"
                  class="w-full px-3 py-2 border border-surface-300 rounded-md focus:outline-none focus:border-[#990011] text-zinc-900 bg-white"
                  :class="{ 'border-red-500': formErrors.fixed_salary }"
                />
                <p v-if="formErrors.fixed_salary" class="text-[10px] text-red-650 mt-0.5">{{ formErrors.fixed_salary }}</p>
              </div>

              <!-- Hourly Rate -->
              <div class="flex flex-col gap-1.5">
                <label for="hourly_rate" class="font-bold text-zinc-700 uppercase tracking-wider">Hourly Billing Rate ($)</label>
                <input
                  id="hourly_rate"
                  v-model="form.hourly_rate"
                  type="number"
                  placeholder="e.g. 50"
                  class="w-full px-3 py-2 border border-surface-300 rounded-md focus:outline-none focus:border-[#990011] text-zinc-900 bg-white"
                  :class="{ 'border-red-500': formErrors.hourly_rate }"
                />
                <p v-if="formErrors.hourly_rate" class="text-[10px] text-red-650 mt-0.5">{{ formErrors.hourly_rate }}</p>
              </div>
            </div>
          </div>

          <!-- Dialog Footer Actions -->
          <div class="p-4 border-t border-surface-200 flex justify-end gap-2 bg-surface-50 text-zinc-900">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 border border-surface-300 text-zinc-700 rounded-lg hover:bg-surface-100 transition-colors text-xs font-semibold cursor-pointer bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-[#990011] hover:bg-[#7a000d] text-white rounded-lg transition-colors text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              :disabled="submittingForm"
            >
              <i v-if="submittingForm" class="pi pi-spin pi-spinner text-xs"></i>
              <span>{{ isEditMode ? 'Apply Changes' : 'Commit Registration' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirm Modal overlay -->
    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 transition-opacity animate-fade-in text-zinc-900"
    >
      <div class="bg-white border border-surface-200 text-zinc-900 rounded-xl shadow-lg max-w-sm w-full overflow-hidden flex flex-col p-6 space-y-4">
        <div class="flex items-start gap-3 text-xs text-zinc-800">
          <div class="w-8 h-8 rounded-full bg-red-50 border border-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
            <i class="pi pi-exclamation-triangle text-sm"></i>
          </div>
          <div class="space-y-1.5">
            <h4 class="font-bold text-zinc-900 text-sm">Confirm Account Deletion</h4>
            <p class="text-zinc-650 leading-relaxed">
              Are you absolutely sure you want to delete the user record for <span class="font-bold text-zinc-800">{{ userToDelete?.name }}</span>? All cohort indexes and records linked to this email registry will be permanently dropped. This action is irreversible.
            </p>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-surface-150 text-xs font-semibold text-zinc-900">
          <button
            @click="showDeleteConfirm = false"
            class="px-4 py-2 border border-surface-300 text-zinc-700 rounded-lg hover:bg-surface-100 transition-colors cursor-pointer bg-white"
          >
            Cancel
          </button>
          <button
            @click="confirmDeleteUser"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
            :disabled="deletingUserActive"
          >
            <i v-if="deletingUserActive" class="pi pi-spin pi-spinner text-xs"></i>
            <span>Confirm Deletion</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>