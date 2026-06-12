<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Dialog from 'primevue/dialog'
import { submitDeliverable } from '@/modules/submission/services/submissionService'
import type { CourseDeliverable } from '@/modules/grading/types'
import { previewLatePenalty } from '../composables/useLatePanelty'
import type { CreateSubmissionPayload } from '../types'

const props = defineProps<{
  visible: boolean
  deliverable: CourseDeliverable
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'submitted'): void
}>()

/* ── Client-side validation limits ──────────────────────────────
 * The SERVER is authoritative (SEC-3/SEC-4). These mirror it for fast
 * feedback only — keep them in sync with the backend's validation rule. */
const MAX_FILE_BYTES = 25 * 1024 * 1024 // 25 MB
const ACCEPTED_MIME = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/zip',
  'application/x-zip-compressed',
]
const ACCEPT_ATTR = '.pdf,.png,.jpg,.jpeg,.gif,.webp,.zip'

type Mode = 'url' | 'file'
const mode = ref<Mode>('url')
const url = ref('')
const file = ref<File | null>(null)
const saving = ref(false)
const errorMsg = ref('')

// Reset everything each time the modal opens.
watch(
  () => props.visible,
  (open) => {
    if (open) {
      mode.value = 'url'
      url.value = ''
      file.value = null
      errorMsg.value = ''
      saving.value = false
    }
  },
)

// Live "if you submit now" penalty preview (compares due_date to now).
const preview = computed(() => previewLatePenalty(props.deliverable))

function onFileChange(e: Event) {
  errorMsg.value = ''
  const target = e.target as HTMLInputElement
  const f = target.files?.[0] ?? null
  if (!f) {
    file.value = null
    return
  }
  if (f.size > MAX_FILE_BYTES) {
    errorMsg.value = `File exceeds the 25 MB limit (${(f.size / 1024 / 1024).toFixed(1)} MB).`
    file.value = null
    return
  }
  if (f.type && !ACCEPTED_MIME.includes(f.type)) {
    errorMsg.value = 'Unsupported file type. Allowed: PDF, image, or ZIP.'
    file.value = null
    return
  }
  file.value = f
}

function isLikelyUrl(v: string): boolean {
  try {
    const u = new URL(v.trim())
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

const canSubmit = computed(() => {
  if (saving.value) return false
  if (mode.value === 'url') return isLikelyUrl(url.value)
  return file.value !== null
})

function close() {
  emit('update:visible', false)
}

async function handleSubmit() {
  if (!canSubmit.value) return
  saving.value = true
  errorMsg.value = ''

  const payload: CreateSubmissionPayload =
    mode.value === 'url'
      ? { type: 'url', url: url.value.trim() }
      : { type: 'file', file: file.value as File }

  try {
    await submitDeliverable(props.deliverable.id, payload)
    emit('submitted')
  } catch (err: any) {
    errorMsg.value = err.message || 'Submission failed. Please try again.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    modal
    :header="`Submit: ${deliverable.name}`"
    :style="{ width: '480px' }"
    class="text-surface-800"
  >
    <div class="space-y-4 pt-1">
      <!-- Deliverable context + live penalty preview -->
      <div class="p-3 bg-surface-50 rounded-lg border border-surface-200 text-xs space-y-1">
        <p class="text-surface-500">
          Type:
          <span class="text-surface-900 font-medium capitalize">{{ deliverable.type }}</span> · Max
          score: <span class="text-surface-900 font-medium">{{ deliverable.max_score }}</span>
        </p>
        <p class="text-surface-500">
          Due:
          <span class="text-surface-900 font-medium">{{
            deliverable.due_date ?? 'No deadline'
          }}</span>
        </p>
        <p v-if="preview.isLate" class="font-medium text-amber-600 flex items-center gap-1 pt-1">
          <i class="pi pi-exclamation-triangle text-[11px]"></i>
          Submitting now is {{ preview.daysLate }}
          {{ preview.daysLate === 1 ? 'day' : 'days' }} late — {{ preview.penaltyPct }}% penalty
          applies.
        </p>
        <p v-else class="text-green-600 font-medium pt-1">On time — no penalty.</p>
      </div>

      <!-- Mode toggle -->
      <div class="flex gap-1 p-1 bg-surface-100 rounded-lg">
        <button
          class="flex-1 py-1.5 rounded-md text-sm font-medium transition-colors"
          :class="mode === 'url' ? 'bg-white shadow-sm text-surface-900' : 'text-surface-500'"
          @click="
            () => {
              mode = 'url'
              errorMsg = ''
            }
          "
        >
          <i class="pi pi-link text-[11px] mr-1"></i> Link
        </button>
        <button
          class="flex-1 py-1.5 rounded-md text-sm font-medium transition-colors"
          :class="mode === 'file' ? 'bg-white shadow-sm text-surface-900' : 'text-surface-500'"
          @click="
            () => {
              mode = 'file'
              errorMsg = ''
            }
          "
        >
          <i class="pi pi-upload text-[11px] mr-1"></i> File
        </button>
      </div>

      <!-- URL input -->
      <div v-if="mode === 'url'" class="flex flex-col gap-1">
        <label class="text-xs font-semibold text-surface-600">Repository or drive link</label>
        <input
          v-model="url"
          type="url"
          placeholder="https://github.com/you/project"
          class="input input-bordered input-sm w-full"
        />
        <p v-if="url && !isLikelyUrl(url)" class="text-xs text-red-500">
          Enter a valid http(s) URL.
        </p>
      </div>

      <!-- File input -->
      <div v-else class="flex flex-col gap-1">
        <label class="text-xs font-semibold text-surface-600">Upload file</label>
        <input
          type="file"
          :accept="ACCEPT_ATTR"
          class="file-input file-input-bordered file-input-sm w-full"
          @change="onFileChange"
        />
        <p class="text-xs text-surface-400">PDF, image, or ZIP · max 25 MB.</p>
        <p v-if="file" class="text-xs text-surface-600">
          {{ file.name }} ({{ (file.size / 1024 / 1024).toFixed(1) }} MB)
        </p>
      </div>

      <!-- Error -->
      <div v-if="errorMsg" class="p-2 bg-red-50 text-red-600 text-xs rounded border border-red-200">
        {{ errorMsg }}
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-2 pt-1">
        <button class="btn btn-sm btn-ghost text-surface-500" :disabled="saving" @click="close">
          Cancel
        </button>
        <button
          class="btn btn-sm btn-primary flex items-center gap-2"
          :disabled="!canSubmit"
          @click="handleSubmit"
        >
          <i v-if="saving" class="pi pi-spinner pi-spin text-[11px]"></i>
          Submit
        </button>
      </div>
    </div>
  </Dialog>
</template>
