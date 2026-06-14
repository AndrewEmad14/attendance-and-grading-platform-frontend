<script setup lang="ts">
interface Props {
  current: number
  last: number
  total: number
}

defineProps<Props>()

defineEmits<{
  (e: 'change', page: number): void
}>()
</script>

<template>
  <div
    v-if="last > 1"
    class="flex flex-col sm:flex-row flex-wrap items-center justify-between gap-2 pt-4 border-t border-surface-100 bg-white"
  >
    <div class="text-xs text-surface-500">
      Showing page <span class="font-semibold text-surface-900">{{ current }}</span> of
      <span class="font-semibold text-surface-900">{{ last }}</span> (<span
        class="font-semibold text-surface-900"
        >{{ total }}</span
      >
      items)
    </div>

    <div class="join">
      <button
        type="button"
        class="join-item btn btn-xs min-h-8 h-8 px-3 bg-white border border-surface-200 text-surface-700 hover:bg-surface-50 disabled:bg-surface-50 disabled:text-surface-300"
        :disabled="current === 1"
        @click="$emit('change', current - 1)"
      >
        Previous
      </button>
      <button
        type="button"
        class="join-item btn btn-xs min-h-8 h-8 px-3 bg-white border border-surface-200 text-surface-700 hover:bg-surface-50 disabled:bg-surface-50 disabled:text-surface-300"
        :disabled="current === last"
        @click="$emit('change', current + 1)"
      >
        Next
      </button>
    </div>
  </div>
</template>
