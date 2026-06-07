<script setup lang="ts">
import { ref } from 'vue'

interface StudentTimelineSession {
  id: number
  timeBlock: string
  title: string
  instructor: string
  type: 'Lecture' | 'Lab' | 'Review'
  location: string
  hours: number
  status: 'Upcoming' | 'Completed' | 'Canceled'
}

const studentSchedule = ref<StudentTimelineSession[]>([
  { id: 1, timeBlock: '09:00 - 12:00', title: 'Laravel Core Architecture: Service Containers & Providers', instructor: 'Prof. Alan Turing', type: 'Lecture', location: 'Auditorium Main A', hours: 3, status: 'Upcoming' },
  { id: 2, timeBlock: '13:00 - 15:00', title: 'Vue.js Advanced State Management & Component Composition', instructor: 'Dr. Grace Hopper', type: 'Lab', location: 'Computing Laboratory 04', hours: 2, status: 'Upcoming' },
  { id: 3, timeBlock: '15:30 - 16:30', title: 'Individual Capstone Milestone Review Block', instructor: 'Prof. Alan Turing', type: 'Review', location: 'Office Suite 202', hours: 1, status: 'Upcoming' }
])

const getTypeBadgeClass = (type: StudentTimelineSession['type']) => {
  switch (type) {
    case 'Lecture': return 'badge bg-primary/10 border-primary/20 text-primary font-medium text-[10px]'
    case 'Lab': return 'badge bg-success/10 border-success/20 text-success font-medium text-[10px]'
    case 'Review': return 'badge bg-warning/10 border-warning/20 text-surface-800 font-medium text-[10px]'
  }
}
</script>

<template>
  <div class="card bg-white border border-surface-200 shadow-xs w-full overflow-hidden">
    <div class="p-4 bg-surface-50 border-b border-surface-200 flex flex-wrap justify-between items-center gap-2">
      <div>
        <h3 class="font-bold text-surface-900 text-sm">Module 3B: Student Timetable Ledger View</h3>
        <p class="text-xs text-surface-500">Target Role Focus: Student Portal (Personal Progress & Track Schedule Deliverables)</p>
      </div>
      <span class="text-[10px] font-mono bg-success/10 text-success border border-success/20 px-2 py-0.5 rounded">
        Student Consumption Blueprint
      </span>
    </div>

    <div class="p-6">
      <div class="space-y-4">
        <h4 class="text-xs font-bold uppercase tracking-wider text-surface-500 px-1">Today's Academic Chronological Timeline</h4>
        
        <div class="relative border-l-2 border-surface-200 ml-4 pl-6 space-y-6">
          <div v-for="session in studentSchedule" :key="session.id" class="relative">
            <span class="absolute -left-[31px] top-1.5 bg-white border-2 border-primary w-4 h-4 rounded-full flex items-center justify-center shadow-2xs z-10"></span>
            
            <div class="p-4 border border-surface-200 rounded-lg bg-surface-50/40 hover:bg-surface-50 transition-colors duration-150 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div class="space-y-1 min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="font-mono text-xs font-bold text-primary">{{ session.timeBlock }}</span>
                  <span :class="getTypeBadgeClass(session.type)">{{ session.type }}</span>
                  <span class="text-[11px] text-surface-400 font-medium">({{ session.hours }} hrs delivered)</span>
                </div>
                <h5 class="text-sm font-bold text-surface-900 tracking-tight truncate" :title="session.title">
                  {{ session.title }}
                </h5>
                <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-surface-500">
                  <span class="flex items-center gap-1"><i class="pi pi-user text-[11px]"></i> {{ session.instructor }}</span>
                  <span class="flex items-center gap-1"><i class="pi pi-map-marker text-[11px]"></i> {{ session.location }}</span>
                </div>
              </div>
              
              <div class="shrink-0 self-start sm:self-center">
                <span class="badge border border-surface-200 bg-white text-surface-600 text-xs py-2 px-3 font-medium flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span> Track Active
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>