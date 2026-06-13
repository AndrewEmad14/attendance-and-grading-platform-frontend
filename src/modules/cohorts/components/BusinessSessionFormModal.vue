<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseModal from '@/components/BaseModal.vue'
import FormRow from '@/components/structural/FormRow.vue'

const props = defineProps<{
  visible: boolean
  saving: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'submit', payload: { name: string }): void
}>()

const name = ref('')
const nameInvalid = computed(() => name.value.trim().length === 0)

watch(
  () => props.visible,
  (open) => {
    if (open) name.value = ''
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
    title="New Business Session"
  >
    <FormRow label="Session name">
      <input
        v-model="name"
        type="text"
        placeholder="e.g. Soft Skills Workshop"
        class="border border-surface-300 bg-surface-50 rounded px-3 py-2 text-surface-900 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 w-full"
        @keyup.enter="submit"
      />
      <p class="text-xs text-surface-400 mt-1">
        Sessions are shared branch-wide — other track admins can attach this to their cohorts too.
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
        :disabled="saving || nameInvalid"
        class="px-4 py-2 rounded text-sm font-medium text-white bg-primary hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <i v-if="saving" class="pi pi-spin pi-spinner text-[10px]"></i>
        Create
      </button>
    </template>
  </BaseModal>
</template>
