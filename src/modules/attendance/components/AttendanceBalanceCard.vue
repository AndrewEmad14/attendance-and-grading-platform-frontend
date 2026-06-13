<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = defineProps<{
  balance: number
  max: number
  deducted: number
}>()

const RADIUS = 54
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const color = computed(() => {
  if (props.balance >= 150) return { stroke: 'stroke-emerald-500', text: 'text-emerald-700' }
  if (props.balance >= 40) return { stroke: 'stroke-amber-400', text: 'text-amber-700' }
  return { stroke: 'stroke-red-500', text: 'text-red-700' }
})

const statusLabel = computed(() => {
  if (props.balance >= 150) return 'In Good Standing'
  if (props.balance >= 40) return 'At Risk'
  return 'Critical'
})

// Animate the ring fill from 0 on mount
const animatedOffset = ref(CIRCUMFERENCE)

onMounted(() => {
  requestAnimationFrame(() => {
    animatedOffset.value = CIRCUMFERENCE * (1 - props.balance / 250)
  })
})
</script>

<template>
  <div class="rounded-xl border border-zinc-200 bg-white p-5">
    <p class="text-xs uppercase tracking-widest text-zinc-400 font-medium mb-4">Balance Overview</p>

    <div class="flex items-center justify-center">
      <svg viewBox="0 0 120 120" class="w-40 h-40 -rotate-90">
        <circle cx="60" cy="60" :r="RADIUS" fill="none" class="stroke-zinc-100" stroke-width="10" />
        <circle cx="60" cy="60" :r="RADIUS" fill="none" :class="color.stroke" stroke-width="10" stroke-linecap="round"
          :stroke-dasharray="CIRCUMFERENCE" :stroke-dashoffset="animatedOffset"
          style="transition: stroke-dashoffset 1s ease-out" />
        <text x="60" y="60" text-anchor="middle" dominant-baseline="central" transform="rotate(90 60 60)"
          :class="['font-bold tabular-nums', color.text]" style="font-size: 28px;">
          {{ balance }}
        </text>
        <text x="60" y="80" text-anchor="middle" dominant-baseline="central" transform="rotate(90 60 60)"
          class="fill-zinc-400" style="font-size: 9px;">
          / {{ max }} PTS
        </text>
      </svg>
    </div>

    <div class="flex items-center justify-between mt-4 text-xs">
      <div>
        <p class="text-zinc-400 mb-0.5">Deducted</p>
        <p :class="['font-semibold', deducted > 0 ? 'text-red-600' : 'text-zinc-400']">
          {{ deducted > 0 ? `-${deducted}` : '0' }} pts
        </p>
      </div>
      <div class="text-right">
        <p class="text-zinc-400 mb-0.5">Status</p>
        <p :class="['font-semibold', color.text]">{{ statusLabel }}</p>
      </div>
    </div>
  </div>
</template>