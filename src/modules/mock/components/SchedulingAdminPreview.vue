<script setup lang="ts">
import { ref } from 'vue'
import DatePicker from 'primevue/datepicker'
import Select from 'primevue/select'
import InputNumber from 'primevue/inputnumber'

const isBookingModalVisible = ref(false)

// Mock Session State Inputs
const sessionType = ref(null)
const assignedInstructor = ref(null)
const scheduledDate = ref<Date | null>(new Date())
const allocatedHours = ref<number | null>(3)

const sessionTypeOptions = ref([
  { label: 'Technical Lecture', code: 'LEC' },
  { label: 'Practical Lab Session', code: 'LAB' },
  { label: '1-on-1 Code Review Evaluation', code: 'REV' }
])

const instructorOptions = ref([
  { label: 'Prof. Alan Turing', id: 'inst-01' },
  { label: 'Dr. Grace Hopper', id: 'inst-02' }
])
</script>

<template>
  <div class="card bg-white border border-surface-200 shadow-xs w-full overflow-hidden">
    <div class="p-4 bg-surface-50 border-b border-surface-200 flex flex-wrap justify-between items-center gap-2">
      <div>
        <h3 class="font-bold text-surface-900 text-sm">Module 3A: Engagement Calendar (Admin Interface)</h3>
        <p class="text-xs text-surface-500">Target Role Focus: Track Admins (Session Booking, Collision Checks)</p>
      </div>
      <span class="text-[10px] font-mono bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded">
        Time Logic Blueprint
      </span>
    </div>

    <div class="p-6 space-y-6">
      <div class="p-4 rounded-xl border border-danger/20 bg-danger/5 text-danger flex items-start gap-3">
        <i class="pi pi-exclamation-triangle text-lg shrink-0 mt-0.5"></i>
        <div class="text-xs space-y-1">
          <span class="font-bold block">Automated Collision Detection Triggered</span>
          <p class="text-surface-600">
            Dr. Grace Hopper is already booked for <span class="font-semibold text-surface-900">Fullstack Laravel - Cohort 4</span> during the requested hours (13:00 - 16:00) on the selected calendar baseline block.
          </p>
        </div>
      </div>

      <div class="flex items-center justify-between p-4 border border-surface-200 rounded-lg bg-surface-50/30">
        <div class="min-w-0">
          <h4 class="text-xs font-bold text-surface-800">Master Track Calendar Booking Console</h4>
          <p class="text-[11px] text-surface-400 truncate">Create, track, and assign distinct hourly engagement matrices</p>
        </div>
        <button @click="isBookingModalVisible = true" class="btn btn-sm btn-primary text-white normal-case font-medium shrink-0">
          <i class="pi pi-plus text-[10px]"></i> Schedule Session
        </button>
      </div>

      <div v-if="isBookingModalVisible" class="p-4 border border-surface-200 bg-white rounded-xl shadow-xs space-y-4 max-w-md mx-auto">
        <div class="text-xs font-bold text-surface-800 border-b border-surface-100 pb-2 flex justify-between items-center">
          <span>Configure Session Engagement</span>
          <button @click="isBookingModalVisible = false" class="text-surface-400 hover:text-surface-600"><i class="pi pi-times"></i></button>
        </div>

        <div class="space-y-3 text-xs">
          <div class="flex flex-col gap-1">
            <label class="font-semibold text-surface-600">Session Type Blueprint</label>
            <Select v-model="sessionType" :options="sessionTypeOptions" optionLabel="label" placeholder="Select type" fluid />
          </div>

          <div class="flex flex-col gap-1">
            <label class="font-semibold text-surface-600">Assigned Delivery Instructor</label>
            <Select v-model="assignedInstructor" :options="instructorOptions" optionLabel="label" placeholder="Select faculty" fluid />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1">
              <label class="font-semibold text-surface-600">Calendar Date</label>
              <DatePicker v-model="scheduledDate" dateFormat="yy-mm-dd" fluid />
            </div>
            <div class="flex flex-col gap-1">
              <label class="font-semibold text-surface-600">Duration Allocation</label>
              <InputNumber v-model="allocatedHours" suffix=" Hours" :min="1" :max="8" fluid />
            </div>
          </div>
          
          <button @click="isBookingModalVisible = false" class="btn btn-xs btn-primary w-full text-white mt-2">
            Commit Calendar Entry
          </button>
        </div>
      </div>

    </div>
  </div>
</template>