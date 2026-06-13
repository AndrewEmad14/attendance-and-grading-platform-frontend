<script setup lang="ts">
import BaseModal from '@/components/BaseModal.vue'
import type { Cohort, CohortAdmin, TrackAdminCandidate } from '@/modules/cohorts/types'

defineProps<{
  visible: boolean
  cohort: Cohort | null
  loading: boolean
  assigned: CohortAdmin[]
  available: TrackAdminCandidate[]
  mutatingStaffId: number | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'assign', candidate: TrackAdminCandidate): void
  (e: 'unassign', admin: CohortAdmin): void
}>()
</script>

<template>
  <BaseModal
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    :title="cohort ? `Manage Admins — Intake #${cohort.number}` : 'Manage Admins'"
  >
    <div v-if="loading" class="py-6 flex items-center justify-center text-surface-400">
      <i class="pi pi-spin pi-spinner text-lg"></i>
    </div>

    <template v-else>
      <!-- Assigned -->
      <div>
        <h4 class="text-xs font-bold uppercase tracking-wider text-surface-500 mb-2">
          Assigned ({{ assigned.length }})
        </h4>
        <div v-if="assigned.length === 0" class="text-xs text-surface-400 italic py-2">
          No admins assigned to this cohort.
        </div>
        <ul v-else class="space-y-1.5">
          <li
            v-for="admin in assigned"
            :key="admin.staff_profile_id"
            class="flex items-center justify-between gap-2 rounded border border-surface-200 bg-white px-3 py-2"
          >
            <div class="min-w-0">
              <div class="text-sm font-medium text-surface-900 truncate">{{ admin.name }}</div>
              <div class="text-xs text-surface-500 truncate">{{ admin.email }}</div>
            </div>
            <button
              @click="emit('unassign', admin)"
              :disabled="mutatingStaffId === admin.staff_profile_id"
              class="text-danger hover:bg-danger/5 rounded px-2 py-1 text-xs font-medium transition-colors flex items-center gap-1 disabled:opacity-60"
            >
              <i
                v-if="mutatingStaffId === admin.staff_profile_id"
                class="pi pi-spin pi-spinner text-[10px]"
              ></i>
              <i v-else class="pi pi-times text-[10px]"></i>
              Remove
            </button>
          </li>
        </ul>
      </div>

      <!-- Available -->
      <div class="pt-2 border-t border-surface-100">
        <h4 class="text-xs font-bold uppercase tracking-wider text-surface-500 mb-2">
          Available ({{ available.length }})
        </h4>
        <div v-if="available.length === 0" class="text-xs text-surface-400 italic py-2">
          No further track admins available to assign.
        </div>
        <ul v-else class="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
          <li
            v-for="candidate in available"
            :key="candidate.id"
            class="flex items-center justify-between gap-2 rounded border border-surface-200 bg-surface-50 px-3 py-2"
          >
            <div class="min-w-0">
              <div class="text-sm font-medium text-surface-900 truncate">{{ candidate.name }}</div>
              <div class="text-xs text-surface-500 truncate">{{ candidate.email }}</div>
            </div>
            <button
              @click="emit('assign', candidate)"
              :disabled="mutatingStaffId === candidate.staff_profile.id"
              class="text-primary hover:bg-primary/5 rounded px-2 py-1 text-xs font-medium transition-colors flex items-center gap-1 disabled:opacity-60"
            >
              <i
                v-if="mutatingStaffId === candidate.staff_profile.id"
                class="pi pi-spin pi-spinner text-[10px]"
              ></i>
              <i v-else class="pi pi-plus text-[10px]"></i>
              Assign
            </button>
          </li>
        </ul>
      </div>
    </template>

    <template #footer>
      <button
        @click="emit('update:visible', false)"
        class="px-4 py-2 rounded text-sm font-medium text-surface-500 hover:bg-surface-100 transition-colors cursor-pointer"
      >
        Done
      </button>
    </template>
  </BaseModal>
</template>
