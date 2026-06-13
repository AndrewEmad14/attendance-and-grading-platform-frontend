<script setup lang="ts">
import ContentCard from '@/components/structural/ContentCard.vue'
import type { LabGroup, CohortStudent } from '@/modules/cohorts/types'

defineProps<{
  labGroups: LabGroup[]
  unassignedStudents: CohortStudent[]
  loading: boolean
  // Student id currently being moved, for per-row spinners (optional).
  mutatingStudentId?: number | null
}>()

const emit = defineEmits<{
  (e: 'create-group'): void
  (e: 'delete-group', group: LabGroup): void
  // Assign an unassigned student into a target group.
  (e: 'assign', payload: { labGroupId: number; studentId: number }): void
  // Drop a student out of the group they're currently in.
  (e: 'drop', payload: { labGroupId: number; studentId: number }): void
}>()
</script>

<template>
  <ContentCard
    title="Lab Groups"
    subtitle="Split the cohort into groups of ~15. Each group's instructor grades only that group."
  >
    <template #headerAction>
      <button
        @click="emit('create-group')"
        class="px-3 py-2 rounded text-sm font-medium text-white bg-primary hover:bg-primary/90 transition-colors flex items-center gap-2"
      >
        <i class="pi pi-plus text-[10px]"></i>
        New Group
      </button>
    </template>

    <div v-if="loading" class="py-8 flex items-center justify-center text-surface-400">
      <i class="pi pi-spin pi-spinner text-xl"></i>
    </div>

    <div v-else class="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
      <!-- Unassigned pool -->
      <div class="rounded-lg border border-surface-200 bg-surface-50 overflow-hidden">
        <div
          class="px-3 py-2 border-b border-surface-200 bg-white flex items-center justify-between"
        >
          <h4 class="text-xs font-bold uppercase tracking-wider text-surface-500">Unassigned</h4>
          <span class="text-xs text-surface-400">{{ unassignedStudents.length }}</span>
        </div>

        <div
          v-if="unassignedStudents.length === 0"
          class="px-3 py-6 text-center text-xs text-surface-400 italic"
        >
          Every student is in a group.
        </div>

        <ul v-else class="p-2 space-y-1.5 max-h-96 overflow-y-auto scrollbar-thin">
          <li
            v-for="student in unassignedStudents"
            :key="student.student_profile_id"
            class="rounded border border-surface-200 bg-white px-3 py-2"
          >
            <div class="text-sm font-medium text-surface-900 truncate">{{ student.name }}</div>
            <div class="text-xs text-surface-500 truncate">{{ student.email }}</div>

            <!-- Assign target picker: one button per group keeps it dead-simple -->
            <div v-if="labGroups.length" class="mt-2 flex flex-wrap gap-1">
              <button
                v-for="group in labGroups"
                :key="group.id"
                @click="
                  emit('assign', { labGroupId: group.id, studentId: student.student_profile_id })
                "
                :disabled="mutatingStudentId === student.student_profile_id"
                class="text-primary hover:bg-primary/5 border border-primary/30 rounded px-2 py-0.5 text-[11px] font-medium transition-colors flex items-center gap-1 disabled:opacity-60"
              >
                <i
                  v-if="mutatingStudentId === student.student_profile_id"
                  class="pi pi-spin pi-spinner text-[9px]"
                ></i>
                <i v-else class="pi pi-arrow-right text-[9px]"></i>
                {{ group.name }}
              </button>
            </div>
            <p v-else class="mt-1 text-[11px] text-surface-400 italic">Create a group to assign.</p>
          </li>
        </ul>
      </div>

      <!-- Group cards -->
      <div
        v-if="labGroups.length === 0"
        class="xl:col-span-2 py-8 text-center text-sm text-surface-400 italic"
      >
        No lab groups yet. Create the first one to start assigning students.
      </div>

      <div
        v-for="group in labGroups"
        :key="group.id"
        class="rounded-lg border border-surface-200 bg-white overflow-hidden"
      >
        <div
          class="px-3 py-2 border-b border-surface-200 bg-surface-50 flex items-center justify-between gap-2"
        >
          <div class="min-w-0">
            <h4 class="text-sm font-bold text-surface-900 truncate">{{ group.name }}</h4>
            <span class="text-xs text-surface-500">
              {{ group.students?.length ?? group.student_count ?? 0 }} students
            </span>
          </div>
          <button
            @click="emit('delete-group', group)"
            class="text-danger hover:bg-danger/5 rounded px-2 py-1 text-xs font-medium transition-colors flex items-center gap-1 shrink-0"
            title="Delete group"
          >
            <i class="pi pi-trash text-[10px]"></i>
          </button>
        </div>

        <div
          v-if="!group.students || group.students.length === 0"
          class="px-3 py-6 text-center text-xs text-surface-400 italic"
        >
          No students assigned.
        </div>

        <ul v-else class="p-2 space-y-1.5 max-h-96 overflow-y-auto scrollbar-thin">
          <li
            v-for="student in group.students"
            :key="student.student_profile_id"
            class="flex items-center justify-between gap-2 rounded border border-surface-200 bg-white px-3 py-2"
          >
            <div class="min-w-0">
              <div class="text-sm font-medium text-surface-900 truncate">{{ student.name }}</div>
              <div class="text-xs text-surface-500 truncate">{{ student.email }}</div>
            </div>
            <button
              @click="emit('drop', { labGroupId: group.id, studentId: student.student_profile_id })"
              :disabled="mutatingStudentId === student.student_profile_id"
              class="text-danger hover:bg-danger/5 rounded px-2 py-1 text-xs font-medium transition-colors flex items-center gap-1 shrink-0 disabled:opacity-60"
            >
              <i
                v-if="mutatingStudentId === student.student_profile_id"
                class="pi pi-spin pi-spinner text-[10px]"
              ></i>
              <i v-else class="pi pi-times text-[10px]"></i>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </ContentCard>
</template>
