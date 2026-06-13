<script setup lang="ts">
import { ref } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

// Structured operational branch metrics interface
interface BranchPerformance {
  branch: string
  track: string
  attendanceRate: number
  gradeAverage: number
  passRate: number
  dropoutRate: number
}

const branchMetrics = ref<BranchPerformance[]>([
  {
    branch: 'Cairo Downtown',
    track: 'Fullstack Laravel/Vue',
    attendanceRate: 91.4,
    gradeAverage: 84.2,
    passRate: 92.0,
    dropoutRate: 4.5,
  },
  {
    branch: 'Cairo Downtown',
    track: 'Data Science & Analytics',
    attendanceRate: 88.7,
    gradeAverage: 79.5,
    passRate: 86.5,
    dropoutRate: 6.0,
  },
  {
    branch: 'Alexandria Hub',
    track: 'Fullstack Laravel/Vue',
    attendanceRate: 93.1,
    gradeAverage: 86.0,
    passRate: 95.2,
    dropoutRate: 2.1,
  },
  {
    branch: 'Alexandria Hub',
    track: 'Cybersecurity Operations',
    attendanceRate: 85.4,
    gradeAverage: 74.1,
    passRate: 81.0,
    dropoutRate: 9.4,
  },
])
</script>

<template>
  <div class="card bg-white border border-surface-200 shadow-xs w-full overflow-hidden">
    <!-- Component Documentation Header -->
    <div
      class="p-4 bg-surface-50 border-b border-surface-200 flex flex-wrap justify-between items-center gap-2"
    >
      <div>
        <h3 class="font-bold text-surface-900 text-sm">Module 1: Business Analytics</h3>
        <p class="text-xs text-surface-500">
          Target Role Focus: Branch Manager (Macro Metrics, Low Write Frequency)
        </p>
      </div>
      <span
        class="text-[10px] font-mono bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded"
      >
        High Data Density Blueprint
      </span>
    </div>

    <div class="p-6 space-y-6">
      <!-- High-Density Metric Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div class="p-4 border border-surface-200 rounded-lg bg-surface-50/50">
          <div class="text-xs font-semibold text-surface-400 uppercase tracking-wider">
            Gross Cost Per Student
          </div>
          <div class="text-xl font-bold text-surface-900 mt-1">
            $1,420 <span class="text-xs text-surface-400 font-normal">/ avg</span>
          </div>
          <div class="text-[11px] text-surface-500 mt-1">
            Based on global internal overhead splits
          </div>
        </div>

        <div class="p-4 border border-surface-200 rounded-lg bg-surface-50/50">
          <div class="text-xs font-semibold text-surface-400 uppercase tracking-wider">
            Instructor Cost Allocation
          </div>
          <div class="text-xl font-bold text-surface-900 mt-1">$48,250</div>
          <div class="mt-1 flex items-center justify-between text-[11px]">
            <span class="text-primary font-medium">Internal: 65%</span>
            <span class="text-surface-400">External: 35%</span>
          </div>
        </div>

        <div
          class="p-4 border border-surface-200 rounded-lg bg-surface-50/50 sm:col-span-2 lg:col-span-1"
        >
          <div class="text-xs font-semibold text-surface-400 uppercase tracking-wider">
            Cross-Track Passing Floor
          </div>
          <div class="text-xl font-bold text-success mt-1">88.67%</div>
          <progress
            class="progress progress-success w-full h-1 mt-2"
            value="88.67"
            max="100"
          ></progress>
        </div>
      </div>

      <!-- Cross-Track Performance Aggregation Grid -->
      <div class="space-y-2">
        <div class="flex justify-between items-center px-1">
          <h4 class="text-xs font-bold uppercase tracking-wider text-surface-500">
            Cross-Track Performance Comparisons
          </h4>
          <div class="flex gap-2">
            <button
              class="btn btn-xs bg-white border-surface-200 text-surface-700 hover:bg-surface-50 normal-case font-medium"
            >
              <i class="pi pi-file-excel text-success text-[11px]"></i> Export CSV
            </button>
            <button
              class="btn btn-xs bg-white border-surface-200 text-surface-700 hover:bg-surface-50 normal-case font-medium"
            >
              <i class="pi pi-file-pdf text-danger text-[11px]"></i> Export PDF
            </button>
          </div>
        </div>

        <!-- Preserving horizontal fluidity with a native scroll container wrapper -->
        <div class="w-full overflow-x-auto border border-surface-200 rounded-lg">
          <DataTable :value="branchMetrics" class="text-xs min-w-[700px]" responsiveLayout="scroll">
            <Column
              field="branch"
              header="Branch Site"
              class="font-medium text-surface-800"
            ></Column>
            <Column field="track" header="Academic Track Program" class="text-surface-600"></Column>
            <Column field="attendanceRate" header="Avg Attendance">
              <template #body="slotProps">
                <span class="font-mono">{{ slotProps.data.attendanceRate }}%</span>
              </template>
            </Column>
            <Column field="gradeAverage" header="Grade Mean">
              <template #body="slotProps">
                <span class="font-mono">{{ slotProps.data.gradeAverage }}%</span>
              </template>
            </Column>
            <Column field="passRate" header="Graduation Rate">
              <template #body="slotProps">
                <span class="text-success font-semibold font-mono"
                  >{{ slotProps.data.passRate }}%</span
                >
              </template>
            </Column>
            <Column field="dropoutRate" header="Attrition">
              <template #body="slotProps">
                <span
                  :class="
                    slotProps.data.dropoutRate > 5
                      ? 'text-danger font-semibold font-mono'
                      : 'text-surface-400 font-mono'
                  "
                >
                  {{ slotProps.data.dropoutRate }}%
                </span>
              </template>
            </Column>
          </DataTable>
        </div>
      </div>
    </div>
  </div>
</template>
