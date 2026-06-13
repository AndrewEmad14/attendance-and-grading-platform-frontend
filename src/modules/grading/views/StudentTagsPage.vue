<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  getStudentTags,
  getTags,
  attachStudentTag,
  removeStudentTag,
  appendStudentNote,
  createTag,
} from '@/modules/grading/services/gradingService'
import type { Tag } from '@/modules/grading/types'
import ContentCard from '@/components/structural/ContentCard.vue'
import Textarea from 'primevue/textarea'

const route = useRoute()
const auth = useAuthStore()
const studentId = computed(() => Number(route.params.studentId))

const studentTags = ref<Tag[]>([])
const availableTags = ref<Tag[]>([])
const notes = ref('')
const loading = ref(false)
const error = ref('')

const selectedTagId = ref<number | null>(null)
const newTagText = ref('')
const noteText = ref('')
const saving = ref(false)

const unassignedTags = computed(() =>
  availableTags.value.filter((t) => !studentTags.value.some((st) => st.id === t.id)),
)

const isAssignDisabled = computed(
  () => !selectedTagId.value || studentTags.value.some((t) => t.id === selectedTagId.value),
)

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [tags, allTags] = await Promise.all([getStudentTags(studentId.value), getTags()])
    studentTags.value = tags
    availableTags.value = allTags
  } catch (err: any) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function assignTag() {
  if (!selectedTagId.value) return
  saving.value = true
  try {
    await attachStudentTag(studentId.value, selectedTagId.value)
    selectedTagId.value = null
    await loadData()
  } catch (err: any) {
    error.value = err.message
  } finally {
    saving.value = false
  }
}

async function removeTag(tagId: number) {
  saving.value = true
  try {
    await removeStudentTag(studentId.value, tagId)
    await loadData()
  } catch (err: any) {
    error.value = err.message
  } finally {
    saving.value = false
  }
}

async function addNewTag() {
  if (!newTagText.value.trim()) return
  saving.value = true
  try {
    await createTag(newTagText.value.trim())
    newTagText.value = ''
    availableTags.value = await getTags()
  } catch (err: any) {
    error.value = err.message
  } finally {
    saving.value = false
  }
}

async function appendNote() {
  if (!noteText.value.trim()) return
  saving.value = true
  try {
    const result = await appendStudentNote(studentId.value, noteText.value.trim())
    notes.value = result.notes ?? ''
    noteText.value = ''
  } catch (err: any) {
    error.value = err.message
  } finally {
    saving.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <div class="flex flex-col gap-6 p-8 max-w-5xl mx-auto h-full overflow-y-auto bg-surface-50">
    <!-- Page Header -->
    <header class="flex items-center justify-between pb-4 border-b border-surface-200">
      <div class="flex items-center gap-4">
        <div
          class="w-12 h-12 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center shadow-sm border border-blue-200"
        >
          <i class="pi pi-user text-xl font-bold"></i>
        </div>
        <div>
          <h1 class="text-2xl font-bold text-surface-900 tracking-tight">
            Student Profile &amp; Records
          </h1>
          <p class="text-sm font-medium text-surface-500 mt-0.5">
            Managing notes and tags for Student #{{ studentId }}
          </p>
        </div>
      </div>
      <button
        class="text-surface-500 hover:text-surface-800 transition-colors flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg hover:bg-surface-200"
        @click="$router.back()"
      >
        <i class="pi pi-arrow-left"></i>
        Back to Gradebook
      </button>
    </header>

    <!-- State Overlays -->
    <div
      v-if="loading"
      class="flex items-center gap-3 text-sm text-surface-600 bg-white p-4 rounded-lg shadow-sm border border-surface-200"
    >
      <span class="loading loading-spinner loading-sm text-primary-500"></span>
      <span class="font-medium">Retrieving student records…</span>
    </div>

    <div
      v-if="error"
      class="bg-red-50 text-red-700 border border-red-200 p-4 rounded-lg text-sm font-medium shadow-sm flex items-center gap-2"
    >
      <i class="pi pi-exclamation-triangle"></i>
      {{ error }}
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" v-if="!loading">
      <!-- Tags Panel -->
      <ContentCard
        title="Classification Tags"
        class="h-full flex flex-col shadow-sm border-surface-200"
      >
        <div class="flex flex-wrap gap-2 mb-6 min-h-[40px]">
          <span
            v-for="tag in studentTags"
            :key="tag.id"
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-sm transition-all"
          >
            <i class="pi pi-tag text-[10px] text-blue-500"></i>
            {{ tag.tag }}
            <button
              v-if="auth.hasRole('track_admin')"
              class="w-5 h-5 rounded-full flex items-center justify-center text-blue-400 hover:text-red-600 hover:bg-red-100 transition-colors focus:outline-none"
              @click="removeTag(tag.id)"
              :disabled="saving"
              title="Remove tag"
            >
              <i class="pi pi-times text-[10px]"></i>
            </button>
          </span>
          <span
            v-if="!studentTags.length"
            class="text-sm text-surface-400 italic flex items-center h-full"
          >
            No tags currently assigned.
          </span>
        </div>

        <div class="space-y-4 mt-auto">
          <!-- Assign Existing Tag -->
          <div>
            <label class="block text-xs font-bold text-surface-600 uppercase tracking-wider mb-2"
              >Assign Tag</label
            >
            <div class="flex items-stretch gap-2">
              <select
                v-model="selectedTagId"
                class="flex-1 border border-surface-300 rounded-lg px-3 py-2 text-sm text-surface-900 bg-surface-50 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-200 transition-all shadow-sm"
              >
                <option :value="null">Select a tag from library…</option>
                <option v-for="tag in unassignedTags" :key="tag.id" :value="tag.id">
                  {{ tag.tag }}
                </option>
              </select>
              <button
                class="bg-surface-800 hover:bg-surface-900 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                :disabled="isAssignDisabled || saving"
                @click="assignTag"
              >
                <i class="pi pi-plus text-xs"></i> Assign
              </button>
            </div>
          </div>

          <!-- Create New Tag -->
          <div v-if="auth.hasRole('track_admin')" class="pt-4 border-t border-surface-200">
            <label class="block text-xs font-bold text-surface-600 uppercase tracking-wider mb-2"
              >Create New Tag</label
            >
            <div class="flex items-stretch gap-2">
              <input
                v-model="newTagText"
                type="text"
                maxlength="100"
                placeholder="Type new tag name..."
                class="flex-1 border border-surface-300 rounded-lg px-3 py-2 text-sm text-surface-900 bg-surface-50 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-200 transition-all shadow-sm"
              />
              <button
                class="bg-white border border-surface-300 text-surface-700 hover:bg-surface-50 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                :disabled="!newTagText.trim() || saving"
                @click="addNewTag"
              >
                <i class="pi pi-code text-xs"></i> Create
              </button>
            </div>
          </div>
        </div>
      </ContentCard>

      <!-- Notes Panel -->
      <ContentCard
        title="Administrative Notes"
        class="h-full flex flex-col shadow-sm border-surface-200"
      >
        <div class="flex-1 flex flex-col">
          <div
            v-if="notes"
            class="bg-yellow-50/50 border border-yellow-200/50 rounded-xl p-4 mb-5 text-sm whitespace-pre-wrap font-mono text-surface-800 h-64 overflow-y-auto shadow-inner leading-relaxed"
          >
            {{ notes }}
          </div>
          <div
            v-else
            class="h-64 flex flex-col items-center justify-center border-2 border-dashed border-surface-200 rounded-xl mb-5 bg-surface-50/50"
          >
            <i class="pi pi-align-left text-3xl text-surface-300 mb-2"></i>
            <span class="text-sm text-surface-400 font-medium"
              >No administrative notes recorded yet.</span
            >
          </div>

          <div class="flex flex-col gap-3 mt-auto">
            <label class="block text-xs font-bold text-surface-600 uppercase tracking-wider"
              >Append to Ledger</label
            >
            <Textarea
              v-model="noteText"
              rows="3"
              :maxlength="1000"
              placeholder="Type your official administrative note here. It will be timestamped and appended..."
              class="w-full border border-surface-300 rounded-lg p-3 text-sm text-surface-900 bg-surface-50 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-200 transition-all shadow-sm resize-none"
            />
            <div class="flex items-center justify-between">
              <span
                class="text-xs font-medium"
                :class="noteText.length > 950 ? 'text-red-500 font-bold' : 'text-surface-500'"
              >
                {{ noteText.length }} / 1000 characters
              </span>
              <button
                class="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm shadow-primary-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="!noteText.trim() || saving"
                @click="appendNote"
              >
                <i class="pi pi-send text-xs"></i>
                Append Note
              </button>
            </div>
          </div>
        </div>
      </ContentCard>
    </div>
  </div>
</template>
