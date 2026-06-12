<script setup lang="ts">
import { computed } from 'vue'
import type { CourseDeliverable, Submission } from '@/modules/grading/types'
import { useLatePenalty } from '../../composables/useLatePanelty'

const props = defineProps<{
  deliverable: CourseDeliverable
  submission?: Submission
  status: 'missing' | 'completed' | 'late'
}>()

const emit = defineEmits<{ (e: 'submit'): void }>()

const { label, isLate } = useLatePenalty(
  () => props.submission ?? null,
  () => props.deliverable,
)

const statusBadge = computed(() => {
  switch (props.status) {
    case 'completed':
      return { text: 'Submitted', cls: 'badge-success' }
    case 'late':
      return { text: 'Late', cls: 'badge-warning' }
    default:
      return { text: 'Not submitted', cls: 'badge-ghost' }
  }
})

// null raw → awaiting grade; otherwise show effective (penalty-applied) score.
const scoreText = computed(() => {
  const s = props.submission
  if (!s) return '—'
  if (s.raw_score === null && s.effective_raw_score === null) return 'Awaiting grade'
  const eff = s.effective_raw_score ?? s.raw_score
  return `${eff} / ${props.deliverable.max_score}`
})
</script>

<template>
  <tr class="hover:bg-surface-50">
    <td class="font-medium text-sm">{{ deliverable.name }}</td>
    <td class="text-center">
      <span class="badge badge-sm capitalize">{{ deliverable.type }}</span>
    </td>
    <td class="text-center text-xs text-surface-500">
      {{ deliverable.due_date ?? '—' }}
    </td>
    <td class="text-center">
      <span class="badge badge-sm" :class="statusBadge.cls">{{ statusBadge.text }}</span>
    </td>
    <td class="text-right font-mono text-xs">{{ scoreText }}</td>
    <td class="text-right">
      <button v-if="status === 'missing'" class="btn btn-xs btn-primary" @click="emit('submit')">
        Submit
      </button>
      <span v-else class="text-xs text-surface-400">
        {{ isLate ? label : '✓' }}
      </span>
    </td>
  </tr>
</template>
