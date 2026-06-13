<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import BaseModal from '@/components/BaseModal.vue'
import FormRow from '@/components/structural/FormRow.vue'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import { api } from '@/utils/api'
import type { StoreEngagementPayload, Engagement, EngagementType } from '../types'

interface Props {
  visible: boolean
  engagement: Engagement | null
  activeCohortId: number | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'save', payload: StoreEngagementPayload & { id?: number }): void
}>()

// UI State
const sessionCategory = ref<'course_session' | 'business_session'>('course_session')
const sessionType = ref<'lecture' | 'lab'>('lecture') // Only for course_session

// Selected IDs
const selectedBusinessSessionId = ref<number | null>(null)
const selectedCourseId = ref<number | null>(null)
const selectedLabId = ref<number | null>(null)
const selectedStaffId = ref<number | null>(null)

// Date and Time
const startsAt = ref<string>('')
const scheduledHours = ref<number>(2)

// Options Lists
const businessSessions = ref<{ id: number; title: string }[]>([])
const courses = ref<{ id: number; name: string }[]>([])
const labs = ref<{ id: number; name: string; lab_group?: any }[]>([])
const instructors = ref<{ id: number; name: string; staff_profile?: any }[]>([])

// Fetch options
async function fetchBusinessSessions() {
  if (!props.activeCohortId) return
  try {
    const res = await api.get<{ data: any[] }>('/business-sessions?per_page=100')
    // Filter to only sessions that include this cohort
    businessSessions.value = res.data.filter(bs => 
      bs.cohorts?.some((c: any) => c.id === props.activeCohortId)
    ).map(bs => ({
      id: bs.id,
      title: bs.title || `Session ${bs.id}`
    }))
  } catch (err) {
    console.error('Failed to load business sessions', err)
  }
}

async function fetchCourses() {
  if (!props.activeCohortId) return
  try {
    const res = await api.get<{ data: any[] }>(`/cohorts/${props.activeCohortId}/courses`)
    courses.value = res.data.map(c => ({ id: c.id, name: c.name }))
  } catch (err) {
    console.error('Failed to load courses', err)
  }
}

async function fetchLabs(courseId: number) {
  try {
    const res = await api.get<{ data: any[] }>(`/courses/${courseId}/labs`)
    labs.value = res.data.map(l => ({ id: l.id, name: l.name, lab_group: l.lab_group }))
  } catch (err) {
    console.error('Failed to load labs', err)
  }
}

async function fetchInstructors() {
  try {
    const res = await api.get<{ data: { data: any[] } }>('/users/instructors?per_page=100')
    instructors.value = (res.data?.data || []).map(i => ({
      id: i.staff_profile?.id || i.id, // Using staff_profile.id for engagements
      name: i.name
    }))
  } catch (err) {
    console.error('Failed to load instructors', err)
  }
}

// Watchers for cascading
watch(() => props.activeCohortId, () => {
  if (props.activeCohortId) {
    fetchBusinessSessions()
    fetchCourses()
  }
}, { immediate: true })

watch(selectedCourseId, (newId) => {
  if (newId) {
    fetchLabs(newId)
    selectedLabId.value = null
  } else {
    labs.value = []
  }
})

// Convert ISO strings into HTML local datetime formats safely
function convertToLocalInput(isoString: string): string {
  if (!isoString) return ''
  const date = new Date(isoString)
  const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000
  const localTime = new Date(date.getTime() - timezoneOffsetMs)
  return localTime.toISOString().slice(0, 16)
}

// Initialize form when modal opens or engagement prop changes
watch(
  () => props.engagement,
  async (newVal) => {
    if (instructors.value.length === 0) {
      await fetchInstructors()
    }
    
    if (newVal) {
      // Edit Mode Reverse Mapping
      if (newVal.type === 'business_session') {
        sessionCategory.value = 'business_session'
        selectedBusinessSessionId.value = newVal.engageable_id
      } else {
        sessionCategory.value = 'course_session'
        sessionType.value = newVal.type as 'lecture' | 'lab'
        
        if (newVal.type === 'lecture') {
          selectedCourseId.value = newVal.engageable_id
        } else if (newVal.type === 'lab') {
          selectedLabId.value = newVal.engageable_id
        }
      }
      
      selectedStaffId.value = newVal.staff_id
      startsAt.value = convertToLocalInput(newVal.starts_at)
      scheduledHours.value = newVal.scheduled_hours
    } else {
      // Create Mode Reset
      sessionCategory.value = 'course_session'
      sessionType.value = 'lecture'
      selectedBusinessSessionId.value = null
      selectedCourseId.value = null
      selectedLabId.value = null
      selectedStaffId.value = null
      startsAt.value = ''
      scheduledHours.value = 2
    }
  },
  { immediate: true },
)

function handleSubmit() {
  let engageableType = ''
  let engageableId = 0
  let finalType = ''

  if (sessionCategory.value === 'business_session') {
    if (!selectedBusinessSessionId.value) return alert('Please select a business session')
    engageableType = 'App\\Models\\BusinessSession'
    engageableId = selectedBusinessSessionId.value
    finalType = 'business_session'
  } else {
    if (!selectedCourseId.value) return alert('Please select a course')
    
    if (sessionType.value === 'lecture') {
      engageableType = 'App\\Models\\Course'
      engageableId = selectedCourseId.value
      finalType = 'lecture'
    } else {
      if (!selectedLabId.value) return alert('Please select a lab')
      engageableType = 'App\\Models\\Lab'
      engageableId = selectedLabId.value
      finalType = 'lab'
    }
  }

  if (!selectedStaffId.value) return alert('Please select an instructor')
  if (!startsAt.value) return alert('Please select a start time')
  if (scheduledHours.value > 12) return alert('Maximum duration is 12 hours')

  const startDate = new Date(startsAt.value)
  const millisecondsToAdd = scheduledHours.value * 60 * 60 * 1000
  const endDate = new Date(startDate.getTime() + millisecondsToAdd)

  const payload: StoreEngagementPayload = {
    type: finalType as EngagementType,
    engageable_type: engageableType as any,
    engageable_id: engageableId,
    staff_id: selectedStaffId.value,
    starts_at: startDate.toISOString(),
    ends_at: endDate.toISOString(),
    scheduled_hours: scheduledHours.value,
  }
  
  emit('save', props.engagement ? { ...payload, id: props.engagement.id } : payload)
}
</script>

<template>
  <BaseModal
    :visible="visible"
    @update:visible="emit('update:visible', $event)"
    :title="engagement ? 'Modify Active Engagement Parameters' : 'Book New Cohort Engagement'"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4 overflow-y-auto max-h-[80vh] p-1">
      
      <!-- Session Category -->
      <FormRow label="Session Category">
        <div class="flex gap-4">
          <label class="flex items-center gap-2 cursor-pointer text-sm" :class="{'opacity-50': !!engagement}">
            <input type="radio" v-model="sessionCategory" value="course_session" class="radio radio-primary radio-sm" :disabled="!!engagement" />
            Course Session
          </label>
          <label class="flex items-center gap-2 cursor-pointer text-sm" :class="{'opacity-50': !!engagement}">
            <input type="radio" v-model="sessionCategory" value="business_session" class="radio radio-primary radio-sm" :disabled="!!engagement" />
            Business Session
          </label>
        </div>
      </FormRow>

      <!-- Cascading Options -->
      <template v-if="sessionCategory === 'business_session'">
        <FormRow label="Select Business Session">
          <Select 
            v-model="selectedBusinessSessionId" 
            :options="businessSessions" 
            optionLabel="title" 
            optionValue="id" 
            placeholder="Choose Business Session"
            class="w-full" 
            filter
            :disabled="!!engagement"
          />
        </FormRow>
      </template>

      <template v-if="sessionCategory === 'course_session'">
        <FormRow label="Select Course">
          <Select 
            v-model="selectedCourseId" 
            :options="courses" 
            optionLabel="name" 
            optionValue="id" 
            placeholder="Choose Course"
            class="w-full" 
            filter
            :disabled="!!engagement"
          />
        </FormRow>

        <FormRow label="Course Session Type" v-if="selectedCourseId">
          <div class="flex gap-4">
            <label class="flex items-center gap-2 cursor-pointer text-sm" :class="{'opacity-50': !!engagement}">
              <input type="radio" v-model="sessionType" value="lecture" class="radio radio-primary radio-sm" :disabled="!!engagement" />
              Lecture
            </label>
            <label class="flex items-center gap-2 cursor-pointer text-sm" :class="{'opacity-50': !!engagement}">
              <input type="radio" v-model="sessionType" value="lab" class="radio radio-primary radio-sm" :disabled="!!engagement" />
              Lab
            </label>
          </div>
        </FormRow>

        <FormRow label="Select Lab" v-if="selectedCourseId && sessionType === 'lab'">
          <Select 
            v-model="selectedLabId" 
            :options="labs" 
            optionValue="id" 
            placeholder="Choose Lab"
            class="w-full" 
            :disabled="!!engagement"
          >
            <template #option="slotProps">
              <div>
                <span class="font-medium">{{ slotProps.option.name }}</span>
                <span class="text-xs text-surface-500 ml-2">({{ slotProps.option.lab_group?.name || 'No Group' }})</span>
              </div>
            </template>
            <template #value="slotProps">
              <div v-if="slotProps.value">
                {{ labs.find(l => l.id === slotProps.value)?.name }}
              </div>
              <span v-else>Choose Lab</span>
            </template>
          </Select>
        </FormRow>
      </template>

      <FormRow label="Assigned Instructor">
        <Select 
          v-model="selectedStaffId" 
          :options="instructors" 
          optionLabel="name" 
          optionValue="id" 
          placeholder="Choose Instructor"
          class="w-full" 
          filter
        />
      </FormRow>

      <FormRow label="Session Date & Starting Time">
        <input
          type="datetime-local"
          v-model="startsAt"
          required
          class="input input-bordered bg-white border border-surface-300 rounded-lg p-2 text-sm w-full focus:outline-none focus:border-primary"
        />
      </FormRow>

      <FormRow label="Scheduled Duration (Hours)">
        <InputNumber 
          v-model="scheduledHours" 
          :min="1" 
          :max="12" 
          class="w-full" 
          fluid 
          :class="{'p-invalid': scheduledHours > 12}"
        />
        <small v-if="scheduledHours > 12" class="text-danger mt-1 block">Maximum duration is 12 hours.</small>
      </FormRow>

      <div class="flex justify-end gap-2 pt-2">
        <button type="button" @click="emit('update:visible', false)" class="btn btn-sm btn-ghost">
          Cancel
        </button>
        <button type="submit" class="btn btn-sm bg-primary text-white border-none" :disabled="scheduledHours > 12 || !startsAt || !selectedStaffId">
          {{ engagement ? 'Apply Shift Overrides' : 'Commit Engagement' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>
