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
  createTag
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
  availableTags.value.filter(t => !studentTags.value.some(st => st.id === t.id))
)

const isAssignDisabled = computed(() =>
  !selectedTagId.value || studentTags.value.some(t => t.id === selectedTagId.value)
)

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [tags, allTags] = await Promise.all([
      getStudentTags(studentId.value),
      getTags()
    ])
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
  <div class="flex flex-col gap-4 p-6 max-w-4xl mx-auto">

    <h1 class="text-xl font-bold text-surface-900">
      Student Tags &amp; Notes
      <span class="text-sm font-normal text-gray-400 ml-2">Student #{{ studentId }}</span>
    </h1>

    <div v-if="loading" class="flex items-center gap-2 text-sm text-gray-500">
      <span class="loading loading-spinner loading-sm"></span> Loading…
    </div>

    <div v-if="error" class="alert alert-error text-sm py-2">
      {{ error }}
    </div>

    <!-- Tags Panel -->
    <ContentCard title="Tags">
      <div class="flex flex-wrap gap-2 mb-4">
        <span
          v-for="tag in studentTags"
          :key="tag.id"
          class="badge badge-lg gap-1"
        >
          {{ tag.tag }}
          <button
            v-if="auth.hasRole('track_admin')"
            class="btn btn-ghost btn-xs px-0 text-error"
            @click="removeTag(tag.id)"
            :disabled="saving"
          >×</button>
        </span>
        <span v-if="!studentTags.length" class="text-sm text-gray-400">No tags assigned.</span>
      </div>

      <div class="flex items-center gap-2">
        <select
          v-model="selectedTagId"
          class="select select-bordered select-sm flex-1"
        >
          <option :value="null">Select tag to assign…</option>
          <option v-for="tag in unassignedTags" :key="tag.id" :value="tag.id">
            {{ tag.tag }}
          </option>
        </select>
        <button
          class="btn btn-sm btn-primary"
          :disabled="isAssignDisabled || saving"
          @click="assignTag"
        >Assign</button>
      </div>

      <div v-if="auth.hasRole('track_admin')" class="mt-4 pt-4 border-t border-gray-200">
        <p class="text-xs font-semibold text-gray-500 mb-2">Create New Tag</p>
        <div class="flex items-center gap-2">
          <input
            v-model="newTagText"
            type="text"
            maxlength="100"
            placeholder="New tag name…"
            class="input input-bordered input-sm flex-1"
          />
          <button
            class="btn btn-sm btn-outline"
            :disabled="!newTagText.trim() || saving"
            @click="addNewTag"
          >Add Tag</button>
        </div>
      </div>
    </ContentCard>

    <!-- Notes Panel -->
    <ContentCard title="Notes">
      <div v-if="notes" class="bg-gray-50 rounded p-3 mb-4 text-sm whitespace-pre-wrap font-mono text-gray-700 max-h-64 overflow-y-auto">{{ notes }}</div>
      <div v-else class="text-sm text-gray-400 mb-4">No notes yet.</div>

      <div class="flex flex-col gap-2">
        <Textarea
          v-model="noteText"
          rows="3"
          :maxlength="1000"
          placeholder="Add a note about this student…"
          class="text-sm"
          fluid
        />
        <div class="flex items-center justify-between">
          <span class="text-xs" :class="noteText.length > 950 ? 'text-red-500' : 'text-gray-400'">
            {{ noteText.length }} / 1000
          </span>
          <button
            class="btn btn-sm btn-primary"
            :disabled="!noteText.trim() || saving"
            @click="appendNote"
          >Append Note</button>
        </div>
      </div>
    </ContentCard>

  </div>
</template>