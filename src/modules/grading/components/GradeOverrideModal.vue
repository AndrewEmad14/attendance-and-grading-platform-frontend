<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import { overrideSubmission } from '@/modules/grading/services/gradingService'

const props = defineProps<{
  submissionId: number
  studentName: string
  deliverableName: string
  deliverableType: string
  originalScore: number
  maxScore: number
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'overrideSuccess'): void
}>()

const newScore = ref<number | null>(null)
const overrideNote = ref<string>('')
const saving = ref<boolean>(false)
const errorMsg = ref<string>('')

// Reset state when modal opens
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      newScore.value = null
      overrideNote.value = ''
      errorMsg.value = ''
    }
  },
)

const isNoteInvalid = computed(() => {
  // Notes are strictly mandatory ONLY when overriding instructor-graded labs
  if (props.deliverableType === 'lab') {
    return overrideNote.value.trim().length < 10
  }
  return false
})

const isSubmitDisabled = computed(() => {
  return (
    newScore.value === null ||
    newScore.value > props.maxScore ||
    newScore.value < 0 ||
    isNoteInvalid.value ||
    saving.value
  )
})

const close = () => {
  emit('update:visible', false)
}

const commitOverrideChange = async () => {
  if (isSubmitDisabled.value) return

  saving.value = true
  errorMsg.value = ''

  try {
    await overrideSubmission(
      props.submissionId,
      newScore.value as number,
      overrideNote.value.trim(),
    )
    emit('overrideSuccess')
    close()
  } catch (err: any) {
    errorMsg.value = err.message || 'Failed to override submission.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    modal
    :header="deliverableType === 'lab' ? 'Manual Grade Override Authorization' : 'Enter Grade'"
    :style="{ width: '450px' }"
    class="text-surface-800"
  >
    <div class="space-y-4 pt-2">
      <div class="p-3 bg-surface-50 rounded-lg border border-surface-200 text-xs space-y-1">
        <p class="text-surface-500 font-medium">
          Target Student profile: <span class="text-surface-900 font-bold">{{ studentName }}</span>
        </p>
        <p class="text-surface-500 font-medium">
          Deliverable: <span class="text-surface-900">{{ deliverableName }}</span>
        </p>
        <p class="text-surface-500 font-medium" v-if="deliverableType === 'lab'">
          Current Calculated Value:
          <span class="text-surface-900 font-mono font-bold">{{ originalScore }}</span> /
          {{ maxScore }}
        </p>
      </div>

      <div v-if="errorMsg" class="p-2 bg-red-50 text-red-600 text-xs rounded border border-red-200">
        {{ errorMsg }}
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-xs font-semibold text-surface-600">
          {{ deliverableType === 'lab' ? 'Authorized Score Adjustment Value' : 'Grade Value' }}
        </label>
        <input
          v-model.number="newScore"
          type="number"
          min="0"
          :max="maxScore"
          class="border border-surface-300 bg-surface-50 rounded px-3 py-2 text-surface-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 w-full font-data-tabular text-sm"
        />
        <small v-if="newScore !== null && newScore > maxScore" class="text-red-500 mt-1">
          Score cannot exceed deliverable maximum of {{ maxScore }}.
        </small>
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-xs font-semibold text-surface-600">
          {{ deliverableType === 'lab' ? 'Mandatory Administrative Justification Note' : 'Optional Note (Internal)' }}
        </label>
        <Textarea
          v-model="overrideNote"
          rows="3"
          fluid
          :placeholder="deliverableType === 'lab' ? 'State explicit educational reasons or context validating this manual entry logic... (Min 10 chars)' : 'Any optional context for this grade...'"
          class="text-sm"
        />
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <button
          @click="close"
          :disabled="saving"
          class="px-4 py-2 rounded text-sm font-medium text-surface-500 hover:bg-surface-100 transition-colors"
        >
          Cancel
        </button>
        <button
          @click="commitOverrideChange"
          :disabled="isSubmitDisabled"
          class="px-4 py-2 rounded text-sm font-medium text-white bg-primary hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:bg-surface-dim disabled:text-secondary disabled:cursor-not-allowed disabled:opacity-70"
        >
          <i v-if="saving" class="pi pi-spinner pi-spin text-[10px]"></i>
          Apply Audit Adjustments
        </button>
      </div>
    </div>
  </Dialog>
</template>
