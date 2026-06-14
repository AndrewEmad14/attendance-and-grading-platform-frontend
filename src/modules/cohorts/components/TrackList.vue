<script setup lang="ts">
import ContentCard from '@/components/structural/ContentCard.vue'
import type { Track } from '@/modules/cohorts/types'

defineProps<{
  tracks: Track[]
  loading: boolean
  selectedTrackId: number | null
}>()

const emit = defineEmits<{
  (e: 'select', trackId: number): void
  (e: 'create'): void
  (e: 'edit', track: Track): void
}>()
</script>

<template>
  <ContentCard
    title="Branch Tracks"
    subtitle="Disciplines within the branch. Select one to manage its cohorts."
  >
    <template #headerAction>
      <button
        @click="emit('create')"
        class="px-3 py-2 rounded text-sm font-medium text-white bg-primary hover:bg-primary/90 transition-colors flex items-center gap-2 cursor-pointer"
      >
        <i class="pi pi-plus text-[10px]"></i>
        New Track
      </button>
    </template>

    <div v-if="loading" class="py-8 flex items-center justify-center text-surface-400">
      <i class="pi pi-spin pi-spinner text-xl"></i>
    </div>

    <div v-else-if="tracks.length === 0" class="py-8 text-center text-sm text-surface-400 italic">
      No tracks yet. Create the first one to begin.
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      <div
        v-for="track in tracks"
        :key="track.id"
        @click="emit('select', track.id)"
        class="cursor-pointer rounded-lg border p-4 transition-all"
        :class="
          selectedTrackId === track.id
            ? 'border-primary bg-primary/5 shadow-sm'
            : 'border-surface-200 bg-white hover:border-surface-300 hover:bg-surface-50'
        "
      >
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <h4 class="font-bold text-surface-900 text-sm tracking-tight truncate">
              {{ track.name }}
            </h4>
          </div>
          <button
            @click.stop="emit('edit', track)"
            class="text-surface-400 hover:text-primary transition-colors shrink-0 cursor-pointer"
            title="Edit track"
          >
            <i class="pi pi-pencil text-xs"></i>
          </button>
        </div>
      </div>
    </div>
  </ContentCard>
</template>
