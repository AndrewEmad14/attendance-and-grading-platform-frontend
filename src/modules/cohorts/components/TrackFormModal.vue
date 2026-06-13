<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseModal from '@/components/BaseModal.vue'
import FormRow from '@/components/structural/FormRow.vue'
import type { Track } from '@/modules/cohorts/types'

const props = defineProps<{
  visible: boolean
  // null = create mode; a Track = edit mode
  track: Track | null
  saving: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'submit', payload: { name: string }): void
}>()

const name = ref('')
const mode = computed<'create' | 'edit'>(() => (props.track ? 'edit' : 'create'))
const nameInvalid = computed(() => name.value.trim().length === 0)

// Sync local field whenever the modal opens.
watch(
  () => props.visible,
  (open) => {
    if (open) name.value = props.track?.name ?? ''
  },
)

function submit() {
  if (nameInvalid.value || props.saving) return
  emit('submit', { name: name.value.trim() })
}
</script>

<template>
  <BaseModal
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    :title="mode === 'create' ? 'New Track' : 'Edit Track'"
  >
    <FormRow label="Track name">
      <input
        v-model="name"
        type="text"
        placeholder="e.g. Web Development"
        class="border border-surface-300 bg-surface-50 rounded px-3 py-2 text-surface-900 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 w-full"
        @keyup.enter="submit"
      />
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
        :disabled="saving || nameInvalid"
        class="px-4 py-2 rounded text-sm font-medium text-white bg-primary hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <i v-if="saving" class="pi pi-spin pi-spinner text-[10px]"></i>
        {{ mode === 'create' ? 'Create' : 'Save' }}
      </button>
    </template>
  </BaseModal>
</template>
