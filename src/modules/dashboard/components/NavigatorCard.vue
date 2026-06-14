<script setup lang="ts">
interface Props {
  label: string
  description: string
  icon: string
  to: string
}

defineProps<Props>()
</script>

<template>
  <RouterLink :to="to"
    class="card bg-white border border-surface-200 shadow-xs p-5 flex items-start gap-4 transition-all duration-200 hover:border-primary hover:shadow-md hover:shadow-primary/10 group cursor-pointer">
    <div
      class="w-11 h-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-lg shrink-0 group-hover:bg-primary group-hover:text-white transition-colors duration-200">
      <i :class="icon"></i>
    </div>

    <div class="min-w-0">
      <h3 class="font-bold text-surface-900 text-sm tracking-tight flex items-baseline gap-2 justify-start">
        {{ label }}
        <i
          class="pi pi-arrow-right text-[10px] text-surface-300 group-hover:text-primary transition-all duration-200 group-hover:translate-x-0.5"></i>
      </h3>
      <p class="text-xs text-surface-500 mt-1 leading-relaxed">
        {{ description }}
      </p>
    </div>
  </RouterLink>
</template>
