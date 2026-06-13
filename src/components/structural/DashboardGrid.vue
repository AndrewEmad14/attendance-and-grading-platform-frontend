<script setup lang="ts">
interface Props {
  // Supports standard uniform layouts or complex administrative dash layouts
  variant?: 'uniform-four' | 'main-with-sidebar'
}

withDefaults(defineProps<Props>(), {
  variant: 'uniform-four',
})
</script>

<template>
  <div
    v-if="variant === 'uniform-four'"
    class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full"
  >
    <slot />
  </div>

  <div
    v-else-if="variant === 'main-with-sidebar'"
    class="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start w-full"
  >
    <slot />
  </div>
</template>
