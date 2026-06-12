<script setup lang="ts">
import Dialog from 'primevue/dialog'

interface Props {
  visible: boolean
  title: string
  modalClass?: string
}

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'close'): void
}>()

defineProps<Props>()

function handleClose() {
  emit('update:visible', false)
  emit('close')
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    :header="title"
    :modal="true"
    :dismissableMask="true"
    @hide="handleClose"
    :pt="{
      root: { class: ['bg-white border border-surface-200 shadow-xl rounded-xl max-w-lg w-full mx-4 overflow-hidden', modalClass] },
      header: { class: 'p-4 bg-surface-50 border-b border-surface-200 flex items-center justify-between text-surface-900 font-bold text-sm tracking-tight' },
      content: { class: 'p-4 space-y-4 text-sm text-surface-600' },
    }"
  >
    <slot />

    <template v-if="$slots.footer" #footer>
      <div class="p-4 bg-surface-50 border-t border-surface-200 flex justify-end gap-2">
        <slot name="footer" />
      </div>
    </template>
  </Dialog>
</template>