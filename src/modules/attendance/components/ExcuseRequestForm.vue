<script setup lang="ts">
import { ref, reactive } from 'vue'
import { attendanceApi } from '../api'
import type { ExcuseRequest } from '../types'

const props = defineProps<{
  engagementId?: number
  engagementLabel?: string
  excuse?: ExcuseRequest
}>()

const emit = defineEmits<{
  (e: 'submitted'): void
  (e: 'cancel'): void
}>()

const isEdit = !!props.excuse

const form = reactive({
  reason: props.excuse?.reason ?? '',
  attachment: null as File | null,
})

const loading = ref(false)
const error = ref<string | null>(null)
const clearedAttachment = ref<boolean>(false)
const fileInput = ref<HTMLInputElement | null>(null)

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0] ?? null
  form.attachment = file
}

function clearAttachment() {
  clearedAttachment.value = true
  form.attachment = null
  if (fileInput.value) fileInput.value.value = ''
}

async function submit() {
  if (!form.reason.trim()) { error.value = 'Reason is required'; return }
  if (!isEdit && !props.engagementId) { error.value = 'Missing engagement'; return }

  loading.value = true
  error.value = null
  try {
    if (isEdit && props.excuse) {
      await attendanceApi.updateExcuse(props.excuse.id, {
        reason: form.reason,
        attachment: form.attachment,
        remove_attachment: clearedAttachment.value && !form.attachment,
      })
    } else {
      await attendanceApi.createExcuse({
        engagement_id: props.engagementId!,
        reason: form.reason,
        attachment: form.attachment,
      })
    }
    emit('submitted')
  } catch (e: any) {
    error.value = e.message || 'Submission failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
    <div v-if="error" class="rounded-lg border border-danger-border bg-danger px-3 py-2 text-sm text-danger-content">
      <i class="pi pi-exclamation-triangle mr-1.5" />{{ error }}
    </div>

    <!-- Session info — read only -->
    <div v-if="excuse?.engagement || engagementId" class="space-y-1">
      <label class="block text-xs font-medium text-zinc-600">Session</label>
      <div class="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
        <template v-if="excuse?.engagement">
          <p class="text-sm font-medium text-zinc-700">{{ excuse.engagement.name }}</p>
          <p class="text-xs text-zinc-400">{{ formatDate(excuse.engagement.starts_at) }}</p>
        </template>
        <p v-else class="text-sm text-zinc-700">
          {{ engagementLabel ?? `Session #${engagementId}` }}
        </p>
      </div>
    </div>

    <!-- Reason -->
    <div class="space-y-1">
      <label class="block text-xs font-medium text-zinc-600">
        Reason <span class="text-danger-content">*</span>
      </label>
      <textarea v-model="form.reason" rows="4" placeholder="Explain why you couldn't attend..."
        class="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-800 placeholder-zinc-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none" />
    </div>

    <!-- Attachment -->
    <div class="space-y-1">
      <label class="block text-xs font-medium text-zinc-600">
        Attachment <span class="text-zinc-400">(optional)</span>
      </label>

      <!-- Existing attachment in edit mode -->
      <div v-if="isEdit && excuse?.attachment_url && !form.attachment && !clearedAttachment"
        class="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
        <a :href="excuse.attachment_url" target="_blank"
          class="text-xs text-indigo-500 hover:underline flex items-center gap-1.5 cursor-pointer">
          <i class="pi pi-paperclip" /> Current attachment
        </a>
        <button @click="clearAttachment"
          class="cursor-pointer flex items-center justify-center  gap-1 text-xs text-zinc-400 hover:text-danger-content transition">
          Remove<i class="pi pi-times" style="font-size: smaller;" />
        </button>
      </div>

      <!-- File picker -->
      <div v-else @click="fileInput?.click()"
        class="cursor-pointer rounded-lg border border-dashed border-zinc-300 px-4 py-4 text-center hover:border-indigo-400 hover:bg-indigo-50/30 transition">
        <i class="pi pi-paperclip text-zinc-400 text-lg block mb-1" />
        <p class="text-xs text-zinc-400">
          {{ form.attachment ? form.attachment.name : 'Click to attach a file' }}
        </p>
        <p v-if="form.attachment" class="text-xs text-indigo-400 mt-1 hover:underline cursor-pointer" @click.stop="clearAttachment">
          Remove
        </p>
      </div>

      <input ref="fileInput" type="file" class="hidden" @change="onFileChange" />
    </div>

    <!-- Actions -->
    <div class="flex gap-2 justify-end pt-1">
      <button type="button" @click="emit('cancel')"
        class="cursor-pointer px-4 py-2 rounded-lg text-sm text-zinc-600 border border-zinc-200 hover:bg-zinc-50 transition">
        Cancel
      </button>
      <button type="button" :disabled="loading" @click="submit"
        class="cursor-pointer px-4 py-2 rounded-lg text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition flex items-center gap-2">
        <i v-if="loading" class="pi pi-spin pi-spinner" />
        {{ isEdit ? 'Save Changes' : 'Submit' }}
      </button>
    </div>
  </div>
</template>