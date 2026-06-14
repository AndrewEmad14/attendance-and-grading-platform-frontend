<script setup lang="ts">
interface Props {
  title?: string
  subtitle?: string
  // Set to true when wrapping a PrimeVue DataTable to ensure safe inner mobile scrolling
  isTableContainer?: boolean
  // Allows easy column span overriding when used inside a main-with-sidebar grid layout
  isMainCanvas?: boolean
}

withDefaults(defineProps<Props>(), {
  isTableContainer: false,
  isMainCanvas: false,
})
</script>

<template>
  <div
    class="card bg-white border border-surface-200 shadow-xs w-full overflow-hidden min-w-0"
    :class="{ 'xl:col-span-2': isMainCanvas }"
  >
    <div
      v-if="title"
      class="p-3 sm:p-4 bg-surface-50 border-b border-surface-200 flex flex-wrap justify-between items-center gap-2"
    >
      <div>
        <h3 class="font-bold text-surface-900 text-sm tracking-tight">{{ title }}</h3>
        <p v-if="subtitle" class="text-xs text-surface-500 mt-0.5">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.headerAction" class="flex gap-2">
        <slot name="headerAction" />
      </div>
    </div>

    <div v-if="isTableContainer" class="w-full overflow-x-auto scrollbar-thin">
      <slot />
    </div>
    <div v-else class="p-4 space-y-4">
      <slot />
    </div>
  </div>
</template>
