<script setup lang="ts">
import { computed } from 'vue'
import Tag from 'primevue/tag'
import Paginator from 'primevue/paginator'
import type { Engagement } from '../types'
import type { PaginatedResponse } from '@/types'

interface Props {
  engagements: Engagement[]
  meta?: PaginatedResponse<any>['meta'] | null
  showActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  meta: null,
  showActions: false,
})

const emit = defineEmits<{
  (e: 'cancel', id: number): void
  (e: 'page-change', pageNumber: number): void
}>()

function formatDateHeader(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const groupedEngagements = computed(() => {
  const groups: Record<string, Engagement[]> = {}
  
  const sorted = [...props.engagements].sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
  )

  sorted.forEach((engagement) => {
    const dayKey = engagement.starts_at.split('T')[0]
    if (!dayKey) return
    if (!groups[dayKey]) groups[dayKey] = []
    groups[dayKey].push(engagement)
  })

  return groups
})

function getSeverity(type: string) {
  switch (type) {
    case 'lecture': return 'success'
    case 'lab': return 'info'
    case 'business_session': return 'warn'
    default: return 'secondary'
  }
}

// Map PrimeVue page index event parameter into Laravel baseline page number
function handlePageChange(event: any) {
  const targetPage = event.page + 1
  emit('page-change', targetPage)
}
</script>

<template>
  <div class="space-y-6">
    <div v-if="engagements.length === 0" class="text-center p-8 border border-dashed border-surface-200 rounded-xl text-surface-400 text-sm">
      No scheduled sessions found for the current window parameter.
    </div>

    <div 
      v-for="(sessions, day) in groupedEngagements" 
      :key="day" 
      class="space-y-3"
    >
      <div v-if="sessions[0]" class="text-xs font-bold text-surface-500 tracking-wider uppercase border-b border-surface-100 pb-1">
        {{ formatDateHeader(sessions[0].starts_at) }}
      </div>

      <div class="grid grid-cols-1 gap-3">
        <div 
          v-for="session in sessions" 
          :key="session.id"
          class="flex items-center justify-between p-3 bg-white border border-surface-200 rounded-xl shadow-xs hover:border-surface-300 transition-colors"
        >
          <div class="flex items-start gap-4 min-w-0">
            <div class="text-center bg-surface-50 px-2.5 py-1.5 rounded-lg border border-surface-100 min-w-[75px]">
              <div class="text-xs font-bold text-surface-900">
                {{ formatTime(session.starts_at) }}
              </div>
              <div class="text-[10px] text-surface-400 font-medium mt-0.5">
                {{ session.scheduled_hours }} hrs
              </div>
            </div>

            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h4 class="text-sm font-semibold text-surface-900 truncate">
                  {{ session.display_title }}
                </h4>
                <Tag 
                  :value="session.type.replace('_', ' ')" 
                  :severity="getSeverity(session.type)"
                  style="font-size: 10px; padding: 2px 6px;"
                />
              </div>
              <p class="text-xs text-surface-500 mt-0.5 flex items-center gap-1.5 truncate">
                <span v-if="(session as any).staff_name" class="font-medium text-surface-700">
                  <i class="pi pi-user text-[10px] mr-0.5 text-surface-400"></i> Instructor: {{ (session as any).staff_name }}
                </span>
                <span v-if="session.display_context" class="text-surface-400">
                  ({{ session.display_context }})
                </span>
              </p>
            </div>
          </div>

          <div v-if="showActions" class="flex items-center gap-2 shrink-0">
            <button 
              type="button"
              @click="$emit('cancel', session.id)"
              class="btn btn-sm btn-ghost text-error hover:bg-error/10 border-none px-2 h-8 min-h-0"
              title="Cancel Session"
            >
              <i class="pi pi-trash text-xs"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="meta && meta.last_page > 1" class="pt-4 border-t border-surface-100">
      <Paginator
        :rows="meta.per_page"
        :totalRecords="meta.total"
        :first="(meta.current_page - 1) * meta.per_page"
        @page="handlePageChange"
        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} engagements"
        :pt="{
          root: { class: 'bg-transparent border-none p-0 flex justify-between items-center text-xs' },
          nav: { class: 'flex gap-1' },
          pageButton: (options: any) => ({
            class: [
              'w-8 h-8 rounded-lg flex items-center justify-center font-medium transition-colors border text-xs',
              options.context.active 
                ? 'bg-primary text-white border-primary' 
                : 'bg-white text-surface-700 border-surface-200 hover:bg-surface-50'
            ]
          }),
          action: { class: 'w-8 h-8 rounded-lg flex items-center justify-center text-surface-500 hover:bg-surface-50 border border-surface-200 transition-colors text-xs' }
        }"
      />
    </div>
  </div>
</template>