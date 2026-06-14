<script setup lang="ts">
interface Props {
  label: string
  value: string | number
  trendText?: string
  trendType?: 'success' | 'danger' | 'neutral'
}

withDefaults(defineProps<Props>(), {
  trendType: 'neutral',
})
</script>

<template>
  <div class="card bg-white border border-surface-200 shadow-xs p-3 sm:p-4 flex flex-col justify-between">
    <div>
      <div class="text-xs font-semibold text-surface-400 uppercase tracking-wider truncate">
        {{ label }}
      </div>
      <div
        class="text-2xl font-bold mt-1 tracking-tight"
        :class="trendType === 'danger' ? 'text-danger' : 'text-surface-900'"
      >
        {{ value }}
      </div>
    </div>

    <div
      v-if="trendText"
      class="mt-2 flex items-center text-xs font-medium"
      :class="{
        'text-success': trendType === 'success',
        'text-danger': trendType === 'danger',
        'text-surface-400': trendType === 'neutral',
      }"
    >
      <i
        v-if="trendType !== 'neutral'"
        :class="[
          'pi mr-1 text-[10px]',
          trendType === 'success' ? 'pi-arrow-up-right' : 'pi-exclamation-triangle',
        ]"
      ></i>
      <span>{{ trendText }}</span>
    </div>
  </div>
</template>
