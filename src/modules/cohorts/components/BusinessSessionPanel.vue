<script setup lang="ts">
import ContentCard from '@/components/structural/ContentCard.vue'
import type { BusinessSession } from '@/modules/cohorts/types'

defineProps<{
  attached: BusinessSession[]
  available: BusinessSession[]
  loading: boolean
  mutatingSessionId: number | null
}>()

const emit = defineEmits<{
  (e: 'create-session'): void
  (e: 'attach', session: BusinessSession): void
  (e: 'detach', session: BusinessSession): void
}>()
</script>

<template>
  <ContentCard
    title="Business Sessions"
    subtitle="Cross-track events shared across the branch. Attach existing ones, or create a new shared session."
  >
    <template #headerAction>
      <button
        @click="emit('create-session')"
        class="px-3 py-2 rounded text-sm font-medium text-white bg-primary hover:bg-primary/90 transition-colors flex items-center gap-2 cursor-pointer"
      >
        <i class="pi pi-plus text-[10px]"></i>
        New Session
      </button>
    </template>

    <div v-if="loading" class="py-8 flex items-center justify-center text-surface-400">
      <i class="pi pi-spin pi-spinner text-xl"></i>
    </div>

    <template v-else>
      <!-- Attached to this cohort -->
      <div>
        <h4 class="text-xs font-bold uppercase tracking-wider text-surface-500 mb-2">
          Attached ({{ attached.length }})
        </h4>
        <div v-if="attached.length === 0" class="text-xs text-surface-400 italic py-2">
          No business sessions attached to this cohort.
        </div>
        <ul v-else class="space-y-1.5">
          <li
            v-for="session in attached"
            :key="session.id"
            class="flex items-center justify-between gap-2 rounded border border-surface-200 bg-white px-3 py-2"
          >
            <div class="text-sm font-medium text-surface-900 truncate">{{ session.name }}</div>
            <button
              @click="emit('detach', session)"
              :disabled="mutatingSessionId === session.id"
              class="text-danger hover:bg-danger/5 rounded px-2 py-1 text-xs font-medium transition-colors flex items-center gap-1 disabled:opacity-60 shrink-0"
            >
              <i
                v-if="mutatingSessionId === session.id"
                class="pi pi-spin pi-spinner text-[10px]"
              ></i>
              <i v-else class="pi pi-times text-[10px]"></i>
              Remove
            </button>
          </li>
        </ul>
      </div>

      <!-- Available to attach -->
      <div class="pt-2 border-t border-surface-100">
        <h4 class="text-xs font-bold uppercase tracking-wider text-surface-500 mb-2">
          Available ({{ available.length }})
        </h4>
        <div v-if="available.length === 0" class="text-xs text-surface-400 italic py-2">
          No further sessions available. Create one to share across tracks.
        </div>
        <ul v-else class="space-y-1.5 max-h-64 overflow-y-auto scrollbar-thin">
          <li
            v-for="session in available"
            :key="session.id"
            class="flex items-center justify-between gap-2 rounded border border-surface-200 bg-surface-50 px-3 py-2"
          >
            <div class="text-sm font-medium text-surface-900 truncate">{{ session.name }}</div>
            <button
              @click="emit('attach', session)"
              :disabled="mutatingSessionId === session.id"
              class="text-primary hover:bg-primary/5 rounded px-2 py-1 text-xs font-medium transition-colors flex items-center gap-1 disabled:opacity-60 shrink-0"
            >
              <i
                v-if="mutatingSessionId === session.id"
                class="pi pi-spin pi-spinner text-[10px]"
              ></i>
              <i v-else class="pi pi-plus text-[10px]"></i>
              Attach
            </button>
          </li>
        </ul>
      </div>
    </template>
  </ContentCard>
</template>
