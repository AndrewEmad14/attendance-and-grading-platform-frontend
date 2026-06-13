<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseModal from '@/components/BaseModal.vue'
import FormRow from '@/components/structural/FormRow.vue'
import type { Cohort } from '@/modules/cohorts/types'

const props = defineProps<{
  visible: boolean
  // null = create mode; a Cohort = edit mode
  cohort: Cohort | null
  saving: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'submit', payload: { number: number; is_active: boolean }): void
}>()

const number = ref<number | null>(null)
const isActive = ref(false)
const mode = computed<'create' | 'edit'>(() => (props.cohort ? 'edit' : 'create'))
const numberInvalid = computed(() => number.value === null || number.value < 1)

watch(
  () => props.visible,
  (open) => {
    if (open) {
      number.value = props.cohort?.number ?? null
      isActive.value = props.cohort?.is_active ?? false
    }
  },
)

function submit() {
  if (numberInvalid.value || props.saving) return
  emit('submit', { number: number.value as number, is_active: isActive.value })
}
</script>

<template>
  <BaseModal
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    :title="mode === 'create' ? 'New Cohort' : 'Edit Cohort'"
  >
    <FormRow label="Intake number">
      <input
        v-model.number="number"
        type="number"
        min="1"
        placeholder="e.g. 45"
        class="border border-surface-300 bg-surface-50 rounded px-3 py-2 text-surface-900 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 w-full font-data-tabular"
        @keyup.enter="submit"
      />
    </FormRow>

    <FormRow label="Status">
      <label class="flex items-center gap-2 cursor-pointer">
        <input v-model="isActive" type="checkbox" class="checkbox checkbox-sm" />
        <span class="text-sm text-surface-700">Set as the active cohort for this track</span>
      </label>
      <p class="text-xs text-surface-400 mt-1">
        A track allows only one active cohort; the server enforces this on save.
      </p>
    </FormRow>

    <template #footer>
      <button
        @click="emit('update:visible', false)"
        :disabled="saving"
        class="px-4 py-2 rounded text-sm font-medium text-surface-500 hover:bg-surface-100 transition-colors"
      >
        Cancel
      </button>
      <button
        @click="submit"
        :disabled="saving || numberInvalid"
        class="px-4 py-2 rounded text-sm font-medium text-white bg-primary hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <i v-if="saving" class="pi pi-spin pi-spinner text-[10px]"></i>
        {{ mode === 'create' ? 'Create' : 'Save' }}
      </button>
    </template>
  </BaseModal>
</template>
