<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from '@/components/BaseModal.vue'
import FormRow from '@/components/structural/FormRow.vue'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import type { StoreEngagementPayload, Engagement, EngagementType, EngageableType } from '../types'

interface Props {
  visible: boolean
  engagement: Engagement | null // Null means "Create Mode"
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'save', payload: StoreEngagementPayload & { id?: number }): void
}>()

const formState = ref<StoreEngagementPayload>({
  type: 'lecture',
  engageable_type: 'App\\Models\\Course',
  engageable_id: 1,
  staff_id: 1,
  starts_at: '',
  ends_at: '',
  scheduled_hours: 2,
})

const typeOptions = ref<EngagementType[]>(['lecture', 'lab', 'business_session'])
const modelOptions = ref<EngageableType[]>([
  'App\\Models\\Course',
  'App\\Models\\Lab',
  'App\\Models\\BusinessSession',
])

// Convert ISO strings into HTML local datetime formats safely
function convertToLocalInput(isoString: string): string {
  if (!isoString) return ''
  const date = new Date(isoString)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

watch(
  () => props.engagement,
  (newVal) => {
    if (newVal) {
      formState.value = {
        type: newVal.type,
        engageable_type: newVal.engageable_type,
        engageable_id: newVal.engageable_id,
        staff_id: newVal.staff_id,
        starts_at: convertToLocalInput(newVal.starts_at),
        ends_at: convertToLocalInput(newVal.ends_at),
        scheduled_hours: newVal.scheduled_hours,
      }
    } else {
      formState.value = {
        type: 'lecture',
        engageable_type: 'App\\Models\\Course',
        engageable_id: 1,
        staff_id: 1,
        starts_at: '',
        ends_at: '',
        scheduled_hours: 2,
      }
    }
  },
  { immediate: true }
)

function handleSubmit() {
  const payload = { ...formState.value }
  payload.ends_at = payload.starts_at // Maintain single-day boundary constraints
  
  emit('save', props.engagement ? { ...payload, id: props.engagement.id } : payload)
}
</script>

<template>
  <BaseModal 
    :visible="visible" 
    @update:visible="emit('update:visible', $event)" 
    :title="engagement ? 'Modify Active Engagement Parameters' : 'Book New Cohort Engagement'"
  >
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <FormRow label="Engagement Type">
        <Select v-model="formState.type" :options="typeOptions" class="w-full" />
      </FormRow>

      <FormRow label="Engageable Target Architecture">
        <Select v-model="formState.engageable_type" :options="modelOptions" class="w-full" />
      </FormRow>

      <FormRow label="Assigned Staff Faculty ID">
        <InputNumber v-model="formState.staff_id" :useGrouping="false" class="w-full" fluid />
      </FormRow>

      <FormRow label="Session Date & Starting Time">
        <input 
          type="datetime-local" 
          v-model="formState.starts_at" 
          required
          class="input input-bordered bg-white border border-surface-300 rounded-lg p-2 text-sm w-full focus:outline-none focus:border-primary"
        />
      </FormRow>

      <FormRow label="Scheduled Duration (Hours)">
        <InputNumber v-model="formState.scheduled_hours" :min="1" :max="12" class="w-full" fluid />
      </FormRow>

      <div class="flex justify-end gap-2 pt-2">
        <button type="button" @click="emit('update:visible', false)" class="btn btn-sm btn-ghost">Cancel</button>
        <button type="submit" class="btn btn-sm bg-primary text-white border-none">
          {{ engagement ? 'Apply Shift Overrides' : 'Commit Engagement' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>