<script setup lang="ts">
interface Props {
  label: string
}
defineProps<Props>()
</script>

<template>
  <div class="flex flex-col gap-1 w-full">
    <label class="text-xs font-semibold text-surface-600 tracking-wide">
      {{ label }}
    </label>
    <slot />
  </div>
</template>
