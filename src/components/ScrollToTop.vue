<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps<{
  scrollContainer?: HTMLElement | null
}>()

const isVisible = ref(false)

function checkScroll() {
  const el = props.scrollContainer
  if (!el) return
  const threshold = el.clientHeight
  isVisible.value = el.scrollTop > threshold
}

function scrollToTop() {
  const el = props.scrollContainer
  if (!el) return
  el.scrollTo({ top: 0, behavior: 'smooth' })
}

let cleanupFn: (() => void) | null = null

function attachListener(el: HTMLElement | null | undefined) {
  // Remove any previous listener
  if (cleanupFn) {
    cleanupFn()
    cleanupFn = null
  }
  if (!el) return
  el.addEventListener('scroll', checkScroll, { passive: true })
  cleanupFn = () => el.removeEventListener('scroll', checkScroll)
  // Initial check
  checkScroll()
}

watch(() => props.scrollContainer, (el) => {
  attachListener(el)
}, { immediate: true })

onMounted(() => attachListener(props.scrollContainer))
onUnmounted(() => {
  if (cleanupFn) cleanupFn()
})
</script>

<template>
  <button class="cursor-pointer"
    @click="scrollToTop"
    :class="[
      'fixed right-4 bottom-4 z-30',
      'w-11 h-11 rounded-full',
      'bg-primary text-white shadow-lg shadow-primary/25',
      'hover:bg-primary-hover hover:shadow-xl hover:shadow-primary/30',
      'active:scale-95',
      'flex items-center justify-center',
      'transition-all duration-300 ease-in-out',
      isVisible
        ? 'opacity-100 translate-y-0 pointer-events-auto'
        : 'opacity-0 translate-y-2 pointer-events-none'
    ]"
    aria-label="Scroll to top"
    tabindex="0"
  >
    <i class="pi pi-arrow-up text-sm"></i>
  </button>
</template>
