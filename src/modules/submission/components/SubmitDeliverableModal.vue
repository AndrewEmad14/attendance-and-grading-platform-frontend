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

/* Backend discriminator. The two submission methods map to these literals:
 *   URL  → 'link'
 *   File → 'file'
 * This is the single source of truth for the submission_type field. */
type SubmissionType = 'link' | 'file'

const mode = ref<SubmissionType>('link')
const url = ref('')
const file = ref<File | null>(null)
const saving = ref(false)
const errorMsg = ref('')

// Reset everything each time the modal opens.
watch(
  () => props.visible,
  (open) => {
    if (open) {
      mode.value = 'link'
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
  if (mode.value === 'link') return isLikelyUrl(url.value)
  return file.value !== null
})

function setMode(next: SubmissionType) {
  mode.value = next
  errorMsg.value = ''
}

function close() {
  emit('update:visible', false)
}

async function handleSubmit() {
  if (!canSubmit.value) return
  saving.value = true
  errorMsg.value = ''

  const payload: CreateSubmissionPayload =
    mode.value === 'link'
      ? { submission_type: 'link', url: url.value.trim() }
      : { submission_type: 'file', file: file.value as File }

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
    :header="`Submit Deliverable: ${deliverable.name}`"
    :style="{ width: '480px' }"
    class="text-surface-800"
  >
    <div class="space-y-4 pt-2">
      <!-- Deliverable context + live penalty preview -->
      <div class="p-3 bg-surface-50 rounded-lg border border-surface-200 text-xs space-y-1">
        <p class="text-surface-500 font-medium">
          Type:
          <span class="text-surface-900 font-bold capitalize">{{ deliverable.type }}</span>
          · Max score:
          <span class="text-surface-900 font-mono font-bold">{{ deliverable.max_score }}</span>
        </p>
        <p class="text-surface-500 font-medium">
          Due:
          <span class="text-surface-900 font-bold">{{
            deliverable.due_date ?? 'No deadline'
          }}</span>
        </p>
        <p v-if="preview.isLate" class="font-medium text-warning flex items-center gap-1 pt-1">
          <i class="pi pi-exclamation-triangle text-[11px]"></i>
          Submitting now is {{ preview.daysLate }}
          {{ preview.daysLate === 1 ? 'day' : 'days' }} late — {{ preview.penaltyPct }}% penalty
          applies.
        </p>
        <p v-else class="text-success font-medium pt-1 flex items-center gap-1">
          <i class="pi pi-check-circle text-[11px]"></i> On time — no penalty.
        </p>
      </div>

      <!-- Mode toggle: link | file -->
      <div class="flex gap-1 p-1 bg-surface-100 rounded-lg">
        <button
          class="flex-1 py-1.5 rounded-md text-sm font-medium transition-colors normal-case cursor-pointer"
          :class="mode === 'link' ? 'bg-white shadow-sm text-surface-900' : 'text-surface-500'"
          @click="setMode('link')"
        >
          <i class="pi pi-link text-[11px] mr-1"></i> Link
        </button>
        <button
          class="flex-1 py-1.5 rounded-md text-sm font-medium transition-colors normal-case cursor-pointer"
          :class="mode === 'file' ? 'bg-white shadow-sm text-surface-900' : 'text-surface-500'"
          @click="setMode('file')"
        >
          <i class="pi pi-upload text-[11px] mr-1"></i> File
        </button>
      </div>

      <!-- URL input -->
      <div v-if="mode === 'link'" class="flex flex-col gap-1">
        <label class="text-xs font-semibold text-surface-600">Repository or drive link</label>
        <input
          v-model="url"
          type="url"
          placeholder="https://github.com/you/project"
          class="input input-bordered input-sm w-full"
        />
        <p v-if="url && !isLikelyUrl(url)" class="text-xs text-danger">
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
        <p class="text-[11px] text-surface-400">PDF, image, or ZIP · max 25 MB.</p>
        <p v-if="file" class="text-xs text-surface-600">
          {{ file.name }} ({{ (file.size / 1024 / 1024).toFixed(1) }} MB)
        </p>
      </div>

      <!-- Error -->
      <div
        v-if="errorMsg"
        class="p-2 bg-danger/10 text-danger text-xs rounded border border-danger/20"
      >
        {{ errorMsg }}
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-2 pt-2">
        <button
          class="btn btn-sm btn-ghost text-surface-500 font-medium normal-case"
          :disabled="saving"
          @click="close"
        >
          Cancel
        </button>
        <button
          class="btn btn-sm btn-primary text-white font-medium normal-case flex items-center gap-2"
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
