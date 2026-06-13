<script setup lang="ts">
import type { Engagement } from '../types'

const props = defineProps<{
  session: Engagement
  active?: boolean
}>()

const emit = defineEmits<{ (e: 'select', id: number): void }>()

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })

const typeIcon: Record<string, string> = {
  lecture: 'pi pi-desktop',
  lab: 'pi pi-code',
  business_session: 'pi pi-briefcase',
}
</script>

<template>
  <button
    type="button"
    @click="emit('select', props.session.id)"
    :class="[
      'w-full text-left rounded-lg border px-4 py-3 transition-all',
      props.active
        ? 'border-indigo-400 bg-indigo-50 ring-1 ring-indigo-300'
        : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50',
    ]"
  >
    <div class="flex items-start gap-3">
      <div
        :class="[
          'mt-0.5 flex-shrink-0 rounded-md p-2',
          props.active ? 'bg-indigo-100 text-indigo-600' : 'bg-zinc-100 text-zinc-500',
        ]"
      >
        <i :class="typeIcon[props.session.type] || 'pi pi-calendar'" style="font-size: 0.9rem" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-sm font-semibold text-zinc-800 truncate">
          {{ props.session.display_title }}
        </p>
        <p class="text-xs text-zinc-500 mt-0.5">{{ props.session.display_context }}</p>
        <div class="flex items-center gap-3 mt-1.5 text-xs text-zinc-400">
          <span><i class="pi pi-calendar mr-1" />{{ formatDate(props.session.starts_at) }}</span>
          <span
            ><i class="pi pi-clock mr-1" />{{ formatTime(props.session.starts_at) }} –
            {{ formatTime(props.session.ends_at) }}</span
          >
        </div>
      </div>
      <span class="text-xs text-zinc-400 flex-shrink-0">{{ props.session.scheduled_hours }}h</span>
    </div>
  </button>
</template>
