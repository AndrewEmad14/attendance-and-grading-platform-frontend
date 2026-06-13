<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getCohorts } from '@/modules/cohorts/services/cohortService'
import type { Cohort } from '@/modules/cohorts/types'
import { announcementService } from '../services/announcementsService'
import type { Announcement } from '../types'
import { createAnnouncementSchema, updateAnnouncementSchema } from '../validation'
import ContentCard from '@/components/structural/ContentCard.vue'

const authStore = useAuthStore()

// Role helpers
const currentUserRole = computed(() => authStore.currentUser?.role)
const isStaff = computed(() => currentUserRole.value !== 'student')
const isTrackAdminOrInstructor = computed(() => {
  const role = currentUserRole.value
  return role === 'track_admin' || role === 'instructor'
})
const studentCohortId = computed(() => authStore.currentUser?.student_profile?.cohort_id)

// State
const cohorts = ref<Cohort[]>([])
const selectedCohortId = ref<number | null>(null)
const announcements = ref<Announcement[]>([])
const loadingList = ref(false)

// Pagination state
const currentPage = ref(1)
const lastPage = ref(1)
const totalAnnouncements = ref(0)

// Modal configurations
const showFormModal = ref(false)
const isEditMode = ref(false)
const selectedAnnouncementId = ref<number | null>(null)
const submittingForm = ref(false)
const formErrors = ref<Record<string, string>>({})

const form = reactive({
  title: '',
  body: '',
})

// Broadcast Modal configurations
const showBroadcastModal = ref(false)
const submittingBroadcast = ref(false)
const broadcastErrors = ref<Record<string, string>>({})

const broadcastForm = reactive({
  title: '',
  body: '',
})

// Delete confirmation configurations
const showDeleteConfirm = ref(false)
const announcementToDelete = ref<Announcement | null>(null)
const deletingAnnouncement = ref(false)

// Load cohorts for staff
async function loadCohorts() {
  if (!isStaff.value) return
  try {
    const res = await getCohorts({ is_active: true })
    cohorts.value = res
    if (res.length > 0) {
      const firstCohort = res[0]
      if (firstCohort) {
        selectedCohortId.value = firstCohort.id
      }
    }
  } catch (err) {
    console.error('Failed to retrieve cohort settings:', err)
  }
}

// Load announcements
async function fetchAnnouncements() {
  const cohortId = isStaff.value ? selectedCohortId.value : studentCohortId.value
  if (!cohortId) {
    announcements.value = []
    currentPage.value = 1
    lastPage.value = 1
    totalAnnouncements.value = 0
    return
  }

  loadingList.value = true
  try {
    const res = await announcementService.list(cohortId, { page: currentPage.value })
    announcements.value = res.data.data
    currentPage.value = res.data.current_page
    lastPage.value = res.data.last_page
    totalAnnouncements.value = res.data.total
  } catch (err) {
    console.error('Failed to retrieve announcements roster:', err)
  } finally {
    loadingList.value = false
  }
}

// Watchers
watch(selectedCohortId, () => {
  currentPage.value = 1
  fetchAnnouncements()
})

watch(currentPage, () => {
  fetchAnnouncements()
})

// Format Helpers
function formatDate(dateString: string | null | undefined) {
  if (!dateString) return 'Unpublished'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Normal Create / Edit modal triggers
function openCreateModal() {
  isEditMode.value = false
  selectedAnnouncementId.value = null
  formErrors.value = {}
  form.title = ''
  form.body = ''
  showFormModal.value = true
}

function openEditModal(ann: Announcement) {
  isEditMode.value = true
  selectedAnnouncementId.value = ann.id
  formErrors.value = {}
  form.title = ann.title
  form.body = ann.body
  showFormModal.value = true
}

function closeFormModal() {
  showFormModal.value = false
}

// Normal announcement submit handler
async function handleFormSubmit() {
  formErrors.value = {}
  const schema = isEditMode.value ? updateAnnouncementSchema : createAnnouncementSchema
  const result = schema.safeParse(form)

  if (!result.success) {
    result.error.issues.forEach((issue) => {
      const path = issue.path[0] as string
      formErrors.value[path] = issue.message
    })
    return
  }

  const cohortId = selectedCohortId.value
  if (!cohortId) {
    formErrors.value.general = 'No cohort selected'
    return
  }

  submittingForm.value = true
  try {
    if (isEditMode.value && selectedAnnouncementId.value) {
      await announcementService.update(selectedAnnouncementId.value, {
        title: form.title,
        body: form.body,
      })
    } else {
      await announcementService.create(cohortId, {
        title: form.title,
        body: form.body,
      })
    }
    closeFormModal()
    fetchAnnouncements()
  } catch (err: any) {
    console.error('Failed to submit announcement form:', err)
    formErrors.value.general = err.message || 'Operation failed'
  } finally {
    submittingForm.value = false
  }
}

// Broadcast modal triggers
function openBroadcastModal() {
  if (isTrackAdminOrInstructor.value) {
    return
  }
  broadcastErrors.value = {}
  broadcastForm.title = ''
  broadcastForm.body = ''
  showBroadcastModal.value = true
}

function closeBroadcastModal() {
  showBroadcastModal.value = false
}

// Broadcast submit handler
async function handleBroadcastSubmit() {
  if (isTrackAdminOrInstructor.value) {
    return
  }
  broadcastErrors.value = {}
  const result = createAnnouncementSchema.safeParse(broadcastForm)

  if (!result.success) {
    result.error.issues.forEach((issue) => {
      const path = issue.path[0] as string
      broadcastErrors.value[path] = issue.message
    })
    return
  }

  submittingBroadcast.value = true
  try {
    await announcementService.broadcast({
      title: broadcastForm.title,
      body: broadcastForm.body,
    })
    closeBroadcastModal()
    fetchAnnouncements()
  } catch (err: any) {
    console.error('Failed to broadcast announcement:', err)
    broadcastErrors.value.general = err.message || 'Broadcast operation failed'
  } finally {
    submittingBroadcast.value = false
  }
}

// Delete triggers
function triggerDelete(ann: Announcement) {
  announcementToDelete.value = ann
  showDeleteConfirm.value = true
}

async function confirmDeleteAnnouncement() {
  if (!announcementToDelete.value) return
  deletingAnnouncement.value = true
  try {
    await announcementService.remove(announcementToDelete.value.id)
    showDeleteConfirm.value = false
    announcementToDelete.value = null
    fetchAnnouncements()
  } catch (err) {
    console.error('Failed to delete announcement record:', err)
  } finally {
    deletingAnnouncement.value = false
  }
}

// Pagination
function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

function nextPage() {
  if (currentPage.value < lastPage.value) {
    currentPage.value++
  }
}

onMounted(async () => {
  await loadCohorts()
  await fetchAnnouncements()
})
</script>

<template>
  <div class="space-y-6 max-w-4xl mx-auto">
    <!-- Top Action header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 class="text-2xl font-bold text-surface-900 tracking-tight">Cohort Announcements</h2>
        <p class="text-sm text-surface-500 mt-1">
          Stay informed with active notices, schedules, and broadcasts.
        </p>
      </div>

      <!-- Action buttons for staff only -->
      <div v-if="isStaff" class="flex gap-2 w-full sm:w-auto">
        <button
          v-if="!isTrackAdminOrInstructor"
          @click="openBroadcastModal"
          :disabled="isTrackAdminOrInstructor"
          class="flex-1 sm:flex-none bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors cursor-pointer border border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i class="pi pi-megaphone text-xs"></i>
          <span>Global Broadcast</span>
        </button>
        <button
          @click="openCreateModal"
          class="flex-1 sm:flex-none bg-[#990011] hover:bg-[#7a000d] text-white font-semibold px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors cursor-pointer border border-transparent"
        >
          <i class="pi pi-plus text-xs"></i>
          <span>Post Announcement</span>
        </button>
      </div>
    </div>

    <!-- Toolbar filter -->
    <div class="flex items-center justify-between p-4 bg-white border border-surface-200 rounded-xl shadow-xs">
      <div class="flex items-center gap-3 w-full">
        <span class="text-xs font-bold text-surface-600 uppercase tracking-wider">Cohort Scope:</span>
        
        <!-- Cohort select dropdown for staff -->
        <select
          v-if="isStaff"
          v-model="selectedCohortId"
          class="text-xs px-3 py-1.5 bg-white border border-surface-300 rounded-lg focus:outline-none focus:border-[#990011] text-zinc-900 font-semibold cursor-pointer max-w-xs"
        >
          <option v-for="c in cohorts" :key="c.id" :value="c.id">
            Cohort {{ c.number }} ({{ c.track?.name || 'Unknown Track' }})
          </option>
        </select>

        <!-- Cohort display badge for student -->
        <span
          v-else-if="studentCohortId"
          class="px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-extrabold"
        >
          Assigned Cohort #{{ studentCohortId }}
        </span>

        <!-- Unassigned student state -->
        <span
          v-else
          class="text-xs text-red-650 font-bold italic"
        >
          No Assigned Cohort — Contact Registrar Administration
        </span>
      </div>
    </div>

    <!-- Main Announcements list container -->
    <div class="relative min-h-[300px]">
      <!-- Loading indicator overlay -->
      <div v-if="loadingList" class="absolute inset-0 bg-surface-50/50 flex items-center justify-center z-10 py-20 rounded-xl">
        <div class="flex items-center gap-2 text-sm text-surface-600 font-medium">
          <i class="pi pi-spin pi-spinner text-base text-[#990011]"></i>
          <span>Syncing notices bulletin...</span>
        </div>
      </div>

      <!-- Empty announcements list -->
      <div
        v-if="!loadingList && announcements.length === 0"
        class="flex flex-col items-center justify-center py-20 bg-white border border-surface-200 rounded-xl text-surface-400 gap-3 shadow-xs"
      >
        <i class="pi pi-inbox text-5xl"></i>
        <p class="text-sm font-semibold text-surface-600">No active announcements posted</p>
        <p class="text-xs text-surface-500">Important alerts and notices will show up here once published.</p>
      </div>

      <!-- Feed Grid -->
      <div v-else class="space-y-4">
        <div
          v-for="ann in announcements"
          :key="ann.id"
          class="bg-white border border-surface-200 rounded-xl p-6 shadow-xs flex flex-col gap-4 relative overflow-hidden transition-all hover:shadow-md hover:-translate-y-[1px]"
        >
          <!-- Global broadcast indicator bar -->
          <div v-if="ann.cohort_id === null" class="absolute top-0 left-0 right-0 h-1 bg-zinc-800"></div>

          <!-- Announcement Header Info -->
          <div class="flex justify-between items-start gap-4">
            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-lg font-bold text-zinc-900 leading-snug">{{ ann.title }}</h3>
                <span
                  v-if="ann.cohort_id === null"
                  class="px-2 py-0.5 bg-zinc-150 border border-zinc-300 text-zinc-800 rounded text-[9px] font-extrabold uppercase tracking-wide flex items-center gap-1"
                >
                  <i class="pi pi-megaphone text-[9px]"></i>
                  <span>Broadcast</span>
                </span>
              </div>
              <div class="flex items-center gap-2 text-xs text-surface-500 font-medium">
                <span>By {{ ann.staff?.user?.name || 'Administrator' }}</span>
                <span>•</span>
                <span>{{ formatDate(ann.created_at) }}</span>
              </div>
            </div>

            <!-- Edit/Delete actions for staff -->
            <div v-if="isStaff" class="flex gap-1.5">
              <button
                @click="openEditModal(ann)"
                class="p-1.5 text-surface-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-md transition-all cursor-pointer"
                title="Edit Announcement"
              >
                <i class="pi pi-pencil text-xs"></i>
              </button>
              <button
                @click="triggerDelete(ann)"
                class="p-1.5 text-surface-500 hover:text-red-650 hover:bg-red-50 border border-transparent hover:border-red-150 rounded-md transition-all cursor-pointer"
                title="Delete Announcement"
              >
                <i class="pi pi-trash text-xs"></i>
              </button>
            </div>
          </div>

          <!-- Body Text content -->
          <div class="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
            {{ ann.body }}
          </div>
        </div>
      </div>
    </div>

    <!-- Feed Pagination controls -->
    <div
      v-if="lastPage > 1"
      class="flex items-center justify-between p-4 bg-white border border-surface-200 rounded-xl shadow-xs text-xs font-semibold text-surface-600"
    >
      <span>Showing {{ announcements.length }} of {{ totalAnnouncements }} notices</span>
      <div class="flex items-center gap-3">
        <span>Page {{ currentPage }} of {{ lastPage }}</span>
        <div class="flex gap-1">
          <button
            @click="prevPage"
            :disabled="currentPage <= 1 || loadingList"
            class="p-2 bg-white hover:bg-surface-50 border border-surface-250 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-surface-700"
          >
            <i class="pi pi-chevron-left text-[10px]"></i>
          </button>
          <button
            @click="nextPage"
            :disabled="currentPage >= lastPage || loadingList"
            class="p-2 bg-white hover:bg-surface-50 border border-surface-250 rounded-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-surface-700"
          >
            <i class="pi pi-chevron-right text-[10px]"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Create / Edit Modal Overlay -->
    <div
      v-if="showFormModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 transition-opacity animate-fade-in text-zinc-900"
    >
      <div class="bg-white border border-surface-200 text-zinc-900 rounded-xl shadow-lg max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        <!-- Header -->
        <div class="p-5 border-b border-surface-200 flex justify-between items-center bg-surface-50 text-zinc-900">
          <h3 class="font-bold text-sm tracking-tight text-zinc-900">
            {{ isEditMode ? 'Modify Cohort Notice' : 'Post New Cohort Notice' }}
          </h3>
          <button @click="closeFormModal" class="text-zinc-400 hover:text-zinc-650 transition-colors cursor-pointer border-none bg-transparent">
            <i class="pi pi-times text-xs"></i>
          </button>
        </div>

        <!-- Scroll Form Body -->
        <form @submit.prevent="handleFormSubmit" class="flex flex-col flex-1 min-h-0 text-zinc-900 bg-white">
          <div class="p-6 overflow-y-auto space-y-4 flex-1 text-xs text-zinc-800">
            <div v-if="formErrors.general" class="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-center gap-2 font-medium">
              <i class="pi pi-exclamation-circle text-sm"></i>
              <span>{{ formErrors.general }}</span>
            </div>

            <!-- Title -->
            <div class="flex flex-col gap-1.5">
              <label for="title" class="font-bold text-zinc-700 uppercase tracking-wider">Notice Title</label>
              <input
                id="title"
                v-model="form.title"
                type="text"
                placeholder="Enter title text (min 3 characters)"
                class="w-full pl-3 pr-3 py-2 border border-surface-300 rounded-md focus:outline-none focus:border-[#990011] text-zinc-900 bg-white"
                :class="{ 'border-red-500': formErrors.title }"
              />
              <p v-if="formErrors.title" class="text-[10px] text-red-650 mt-0.5">{{ formErrors.title }}</p>
            </div>

            <!-- Body Content -->
            <div class="flex flex-col gap-1.5">
              <label for="body" class="font-bold text-zinc-700 uppercase tracking-wider">Announcement Content</label>
              <textarea
                id="body"
                v-model="form.body"
                rows="6"
                placeholder="Write detailed cohort announcements notice content here... (min 10 characters)"
                class="w-full pl-3 pr-3 py-2 border border-surface-300 rounded-md focus:outline-none focus:border-[#990011] text-zinc-900 bg-white text-xs leading-relaxed"
                :class="{ 'border-red-500': formErrors.body }"
              ></textarea>
              <p v-if="formErrors.body" class="text-[10px] text-red-650 mt-0.5">{{ formErrors.body }}</p>
            </div>
          </div>

          <!-- Actions Footer -->
          <div class="p-4 border-t border-surface-200 flex justify-end gap-2 bg-surface-50 text-zinc-900">
            <button
              type="button"
              @click="closeFormModal"
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
              <span>{{ isEditMode ? 'Apply Updates' : 'Publish Notice' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Broadcast Modal Overlay -->
    <div
      v-if="showBroadcastModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 transition-opacity animate-fade-in text-zinc-900"
    >
      <div class="bg-white border border-surface-200 text-zinc-900 rounded-xl shadow-lg max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        <!-- Header -->
        <div class="p-5 border-b border-surface-200 flex justify-between items-center bg-surface-50 text-zinc-900">
          <h3 class="font-bold text-sm tracking-tight text-zinc-900">
            Broadcast Global Notice
          </h3>
          <button @click="closeBroadcastModal" class="text-zinc-400 hover:text-zinc-650 transition-colors cursor-pointer border-none bg-transparent">
            <i class="pi pi-times text-xs"></i>
          </button>
        </div>

        <!-- Scroll Form Body -->
        <form @submit.prevent="handleBroadcastSubmit" class="flex flex-col flex-1 min-h-0 text-zinc-900 bg-white">
          <div class="p-6 overflow-y-auto space-y-4 flex-1 text-xs text-zinc-800">
            <div v-if="broadcastErrors.general" class="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-center gap-2 font-medium">
              <i class="pi pi-exclamation-circle text-sm"></i>
              <span>{{ broadcastErrors.general }}</span>
            </div>

            <!-- Warning Notice Alert -->
            <div class="p-3 bg-zinc-100 border border-zinc-300 text-zinc-800 rounded-md flex items-start gap-2.5 leading-relaxed">
              <i class="pi pi-exclamation-triangle text-amber-600 mt-0.5 text-sm"></i>
              <p>
                <strong>Megaphone Broadcast:</strong> This notice will immediately broadcast globally across all system cohorts. Everyone enrolled or assigned across any track will receive this update.
              </p>
            </div>

            <!-- Title -->
            <div class="flex flex-col gap-1.5">
              <label for="b_title" class="font-bold text-zinc-700 uppercase tracking-wider">Broadcast Title</label>
              <input
                id="b_title"
                v-model="broadcastForm.title"
                type="text"
                placeholder="Enter title text (min 3 characters)"
                class="w-full pl-3 pr-3 py-2 border border-surface-300 rounded-md focus:outline-none focus:border-[#990011] text-zinc-900 bg-white"
                :class="{ 'border-red-500': broadcastErrors.title }"
              />
              <p v-if="broadcastErrors.title" class="text-[10px] text-red-650 mt-0.5">{{ broadcastErrors.title }}</p>
            </div>

            <!-- Body Content -->
            <div class="flex flex-col gap-1.5">
              <label for="b_body" class="font-bold text-zinc-700 uppercase tracking-wider">Broadcast Content</label>
              <textarea
                id="b_body"
                v-model="broadcastForm.body"
                rows="6"
                placeholder="Write detailed announcements broadcast content here... (min 10 characters)"
                class="w-full pl-3 pr-3 py-2 border border-surface-300 rounded-md focus:outline-none focus:border-[#990011] text-zinc-900 bg-white text-xs leading-relaxed"
                :class="{ 'border-red-500': broadcastErrors.body }"
              ></textarea>
              <p v-if="broadcastErrors.body" class="text-[10px] text-red-650 mt-0.5">{{ broadcastErrors.body }}</p>
            </div>
          </div>

          <!-- Actions Footer -->
          <div class="p-4 border-t border-surface-200 flex justify-end gap-2 bg-surface-50 text-zinc-900">
            <button
              type="button"
              @click="closeBroadcastModal"
              class="px-4 py-2 border border-surface-300 text-zinc-700 rounded-lg hover:bg-surface-100 transition-colors text-xs font-semibold cursor-pointer bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 bg-zinc-800 hover:bg-zinc-900 text-white rounded-lg transition-colors text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
              :disabled="submittingBroadcast"
            >
              <i v-if="submittingBroadcast" class="pi pi-spin pi-spinner text-xs"></i>
              <span>Transmit Broadcast</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirm Modal -->
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
            <h4 class="font-bold text-zinc-900 text-sm">Purge Announcement Notice</h4>
            <p class="text-zinc-650 leading-relaxed">
              Are you absolutely sure you want to permanently delete the notice titled "<span class="font-bold text-zinc-800">{{ announcementToDelete?.title }}</span>"? This action is final and cannot be recovered.
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
            @click="confirmDeleteAnnouncement"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
            :disabled="deletingAnnouncement"
          >
            <i v-if="deletingAnnouncement" class="pi pi-spin pi-spinner text-xs"></i>
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
