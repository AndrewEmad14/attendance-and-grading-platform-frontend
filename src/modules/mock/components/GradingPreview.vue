<script setup lang="ts">
import { ref, computed } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'

// Grading Component Weights State
const weightAssignments = ref([
  { component: 'Lab Practicals', weight: 40 },
  { component: 'Midterm Assessment', weight: 20 },
  { component: 'Final Capstone Project', weight: 30 },
  { component: 'Attendance & Engagement', weight: 10 }
])

// Compute total weight dynamically to enforce the 100% mathematical validation rule
const totalWeight = computed(() => {
  return weightAssignments.value.reduce((sum, item) => sum + (item.weight || 0), 0)
})

// Grade Book Matrix State
interface StudentGradeRow {
  id: number
  name: string
  currentGrade: number
  isOverridden: boolean
  justification?: string
}

const studentGrades = ref<StudentGradeRow[]>([
  { id: 1, name: 'Jane Doe', currentGrade: 88, isOverridden: false },
  { id: 2, name: 'John Smith', currentGrade: 62, isOverridden: true, justification: 'Approved medical leave adjustment during midterms.' },
  { id: 3, name: 'Robert Johnson', currentGrade: 45, isOverridden: false },
  { id: 4, name: 'Emily Davis', currentGrade: 92, isOverridden: false }
])

// Override Modal Management Context
const isOverrideModalVisible = ref(false)
const selectedStudent = ref<StudentGradeRow | null>(null)
const tempGradeHolder = ref<number | null>(null)
const overrideJustification = ref('')

function openOverrideModal(student: StudentGradeRow) {
  selectedStudent.value = student
  tempGradeHolder.value = student.currentGrade
  overrideJustification.value = student.justification || ''
  isOverrideModalVisible.value = true
}

function commitOverrideChange() {
  if (!selectedStudent.value || tempGradeHolder.value === null || !overrideJustification.value) return
  
  const index = studentGrades.value.findIndex(s => s.id === selectedStudent.value?.id)
  if (index !== -1 && studentGrades.value[index]) {
    studentGrades.value[index].currentGrade = tempGradeHolder.value
    studentGrades.value[index].isOverridden = true
    studentGrades.value[index].justification = overrideJustification.value
  }
  
  isOverrideModalVisible.value = false
  selectedStudent.value = null
}
</script>

<template>
  <div class="card bg-white border border-surface-200 shadow-xs w-full overflow-hidden">
    <div class="p-4 bg-surface-50 border-b border-surface-200 flex flex-wrap justify-between items-center gap-2">
      <div>
        <h3 class="font-bold text-surface-900 text-sm">Module 2: Grading & Evaluation Matrix</h3>
        <p class="text-xs text-surface-500">Target Role Focus: Track Admins (Rules/Weights) & Instructors (Input/Overrides)</p>
      </div>
      <span class="text-[10px] font-mono bg-warning/10 text-warning-content border border-warning/20 px-2 py-0.5 rounded">
        Strict Validation Blueprint
      </span>
    </div>

    <div class="p-6 space-y-6">
      
      <div class="p-4 border border-surface-200 rounded-xl bg-surface-50/30 space-y-4">
        <div class="flex justify-between items-center flex-wrap gap-2">
          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-surface-700">Cohort Component Weighting Allocation</h4>
            <p class="text-[11px] text-surface-400">Total system sum configuration rules must equal exactly 100%</p>
          </div>
          <div :class="['badge font-mono text-xs font-bold px-2 py-1', totalWeight === 100 ? 'bg-success text-white' : 'bg-danger text-white']">
            Total: {{ totalWeight }}% / 100%
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div v-for="item in weightAssignments" :key="item.component" class="bg-white p-3 border border-surface-200 rounded-lg shadow-2xs flex flex-col justify-between gap-2">
            <span class="text-xs font-semibold text-surface-700 block truncate">{{ item.component }}</span>
            <div class="flex items-center gap-2">
              <InputNumber v-model="item.weight" suffix="%" :min="0" :max="100" fluid size="small" class="w-full text-xs" />
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-2">
        <h4 class="text-xs font-bold uppercase tracking-wider text-surface-500 px-1">Active Roster Grade Ledger</h4>
        
        <div class="w-full overflow-x-auto border border-surface-200 rounded-lg">
          <DataTable :value="studentGrades" class="text-xs min-w-[650px]" responsiveLayout="scroll">
            <Column field="name" header="Student Profile Name" class="font-medium text-surface-800"></Column>
            <Column field="currentGrade" header="Current Composite Score">
              <template #body="slotProps">
                <span class="font-mono font-semibold text-sm text-surface-700">{{ slotProps.data.currentGrade }}%</span>
              </template>
            </Column>
            <Column header="System Audit Flag">
              <template #body="slotProps">
                <div v-if="slotProps.data.isOverridden" class="flex flex-col gap-0.5">
                  <span class="badge bg-danger/10 border-danger/20 text-danger text-[10px] font-bold">Manual Override Active</span>
                  <span class="text-[10px] text-surface-400 italic truncate max-w-[250px]" :title="slotProps.data.justification">
                    "{{ slotProps.data.justification }}"
                  </span>
                </div>
                <span v-else class="text-surface-400 italic text-[11px]">System Standard Calculation</span>
              </template>
            </Column>
            <Column header="Actions" class="text-right">
              <template #body="slotProps">
                <button @click="openOverrideModal(slotProps.data)" class="btn btn-xs btn-outline border-surface-200 hover:bg-surface-100 text-surface-700 normal-case font-medium">
                  <i class="pi pi-pencil text-[10px]"></i> Override Score
                </button>
              </template>
            </Column>
          </DataTable>
        </div>
      </div>

    </div>

    <Dialog v-model:visible="isOverrideModalVisible" modal header="Manual Grade Override Authorization" :style="{ width: '450px' }" class="text-surface-800">
      <div class="space-y-4 pt-2">
        <div class="p-3 bg-surface-50 rounded-lg border border-surface-200 text-xs space-y-1">
          <p class="text-surface-500 font-medium">Target Student profile: <span class="text-surface-900 font-bold">{{ selectedStudent?.name }}</span></p>
          <p class="text-surface-500 font-medium">Current Calculated Value: <span class="text-surface-900 font-mono font-bold">{{ selectedStudent?.currentGrade }}%</span></p>
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-surface-600">Authorized Score Adjustment Value</label>
          <InputNumber v-model="tempGradeHolder" suffix="%" :min="0" :max="100" fluid />
        </div>

        <div class="flex flex-col gap-1">
          <label class="text-xs font-semibold text-surface-600">Mandatory Administrative Justification Note</label>
          <Textarea v-model="overrideJustification" rows="3" fluid placeholder="State explicit educational reasons or context validating this manual entry logic..." class="text-sm" />
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button @click="isOverrideModalVisible = false" class="btn btn-sm btn-ghost text-surface-500 font-medium normal-case">Cancel</button>
          <button @click="commitOverrideChange" :disabled="!overrideJustification || tempGradeHolder === null" class="btn btn-sm btn-primary text-white font-medium normal-case">
            Apply Audit Adjustments
          </button>
        </div>
      </div>
    </Dialog>
  </div>
</template>