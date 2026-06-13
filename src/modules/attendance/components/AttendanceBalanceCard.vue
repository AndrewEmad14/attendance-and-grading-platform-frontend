<script setup lang="ts">
const props = defineProps<{
  balance: number
  max: number
  studentName?: string
}>()

const percentage = computed(() => Math.max(0, Math.min(100, (props.balance / props.max) * 100)))

const color = computed(() => {
  if (percentage.value >= 70) return { bar: 'bg-emerald-500', text: 'text-emerald-700', ring: 'ring-emerald-200' }
  if (percentage.value >= 40) return { bar: 'bg-amber-400',   text: 'text-amber-700',   ring: 'ring-amber-200' }
  return                              { bar: 'bg-red-500',     text: 'text-red-700',     ring: 'ring-red-200' }
})

import { computed } from 'vue'
</script>

<template>
  <div :class="['rounded-xl border bg-white p-5 ring-1', color.ring]">
    <div class="flex items-start justify-between mb-3">
      <div>
        <p class="text-xs uppercase tracking-widest text-zinc-400 font-medium mb-1">Attendance Balance</p>
        <p v-if="studentName" class="text-sm text-zinc-600">{{ studentName }}</p>
      </div>
      <span :class="['text-3xl font-bold tabular-nums', color.text]">{{ balance }}</span>
    </div>

    <div class="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
      <div
        :class="['h-2 rounded-full transition-all duration-500', color.bar]"
        :style="{ width: percentage + '%' }"
      />
    </div>

    <p class="text-xs text-zinc-400 mt-2 text-right">{{ balance }} / {{ max }} hours remaining</p>
  </div>
</template>