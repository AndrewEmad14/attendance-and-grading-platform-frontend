<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'

import ContentCard from '@/components/structural/ContentCard.vue'
import DashboardGrid from '@/components/structural/DashboardGrid.vue'
import FormRow from '@/components/structural/FormRow.vue'

import { useGradingStore } from '@/stores/grading'
import {
  createCourse,
  updateCourse,
  deleteCourse as deleteCourseApi,
} from '@/modules/grading/services/gradingService'
import type { Course, CourseDeliverable } from '@/modules/grading/types'

const route = useRoute()
const store = useGradingStore()
const cohortId = Number(route.params.cohortId)

const toast = useToast()
const confirm = useConfirm()

const selectedCourse = ref<Course | null>(null)
const editingDelivs = ref<Partial<CourseDeliverable>[]>([])
const newCourseName = ref('')
const showAddForm = ref(false)
const saving = ref(false)
const searchQuery = ref('')

const weightSum = computed(() =>
  editingDelivs.value.reduce((s, d) => s + (Number(d.course_weight) || 0), 0),
)
const weightValid = computed(() => weightSum.value === 100)

const filtered = computed(() =>
  store.courses.filter((c) => c.name.toLowerCase().includes(searchQuery.value.toLowerCase())),
)

function selectCourse(course: Course) {
  selectedCourse.value = course
  editingDelivs.value = course.deliverables.map((d) => ({ ...d }))
}

function addDeliverable() {
  editingDelivs.value.push({
    name: '',
    type: 'lab',
    max_score: 100,
    course_weight: 0,
    due_date: '',
  })
}

function removeDeliverable(i: number) {
  editingDelivs.value.splice(i, 1)
}

function revert() {
  if (selectedCourse.value) selectCourse(selectedCourse.value)
}

async function saveWeights() {
  if (!weightValid.value || !selectedCourse.value) return
  saving.value = true
  try {
    await updateCourse(selectedCourse.value.id, {
      deliverables: editingDelivs.value as CourseDeliverable[],
    })
    await store.loadCourses(cohortId)
    const updated = store.courses.find((c) => c.id === selectedCourse.value!.id)
    if (updated) selectCourse(updated)
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Course configuration saved',
      life: 3000,
    })
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message || 'Failed to save',
      life: 3000,
    })
  } finally {
    saving.value = false
  }
}

async function handleAddCourse() {
  if (!newCourseName.value.trim()) return
  saving.value = true
  try {
    await createCourse(cohortId, { name: newCourseName.value, deliverables: [] })
    await store.loadCourses(cohortId)
    newCourseName.value = ''
    showAddForm.value = false
    toast.add({ severity: 'success', summary: 'Success', detail: 'Course created', life: 3000 })
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: err.message || 'Failed to create',
      life: 3000,
    })
  } finally {
    saving.value = false
  }
}

function handleDeleteCourse(id: number) {
  confirm.require({
    message: 'Are you sure you want to delete this course and all its deliverables?',
    header: 'Confirm Deletion',
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      try {
        await deleteCourseApi(id)
        await store.loadCourses(cohortId)
        if (selectedCourse.value?.id === id) {
          selectedCourse.value = null
          editingDelivs.value = []
        }
        toast.add({ severity: 'success', summary: 'Success', detail: 'Course deleted', life: 3000 })
      } catch (err: any) {
        toast.add({
          severity: 'error',
          summary: 'Error',
          detail: err.message || 'Failed to delete course',
          life: 3000,
        })
      }
    },
  })
}

onMounted(() => store.loadCourses(cohortId))
</script>

<template>
  <div class="h-full flex flex-col">
    <Toast />
    <ConfirmDialog />

    <DashboardGrid variant="main-with-sidebar">
      <!-- LEFT: Course List -->
      <ContentCard title="Courses">
        <template #headerAction>
          <button
            @click="showAddForm = !showAddForm"
            class="text-xs text-primary-600 hover:text-primary-800 flex items-center gap-1 font-medium"
          >
            <i class="pi pi-plus" style="font-size: 0.65rem" />
            New Course
          </button>
        </template>

        <div class="mb-3">
          <IconField>
            <InputIcon class="pi pi-search" />
            <InputText
              v-model="searchQuery"
              placeholder="Search courses..."
              size="small"
              class="w-full"
            />
          </IconField>
        </div>

        <div v-if="showAddForm" class="p-3 border rounded-lg border-surface-200 bg-surface-50 mb-3">
          <InputText
            v-model="newCourseName"
            placeholder="Course name"
            size="small"
            class="w-full mb-2"
            autofocus
          />
          <div class="flex justify-end gap-2">
            <Button
              label="Cancel"
              text
              size="small"
              severity="secondary"
              @click="showAddForm = false"
            />
            <Button
              label="Create"
              size="small"
              :disabled="!newCourseName.trim() || saving"
              :loading="saving"
              @click="handleAddCourse"
            />
          </div>
        </div>

        <div
          v-if="store.error"
          class="px-4 py-2 bg-red-50 text-red-600 text-xs border border-red-100 rounded-lg mb-3"
        >
          {{ store.error }}
        </div>

        <ul class="flex flex-col gap-1 max-h-[600px] overflow-y-auto pr-1">
          <li
            v-if="store.loading && store.courses.length === 0"
            class="p-4 text-center text-surface-500 text-sm"
          >
            Loading...
          </li>
          <li
            v-else-if="!store.loading && filtered.length === 0"
            class="p-4 text-center text-surface-500 text-sm"
          >
            No courses yet.
          </li>
          <li v-for="course in filtered" :key="course.id" class="group">
            <button
              @click="selectCourse(course)"
              class="w-full text-left px-4 py-3 transition-colors flex items-center justify-between rounded-lg border border-transparent"
              :class="
                selectedCourse?.id === course.id
                  ? 'bg-primary-50 border-primary-200 text-primary-900'
                  : 'hover:bg-surface-50 border-surface-100'
              "
            >
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">{{ course.name }}</p>
                <p class="text-xs opacity-70 mt-0.5">
                  {{ course.deliverables?.length ?? 0 }} deliverable(s)
                </p>
              </div>
              <div class="flex items-center gap-2 ml-2 flex-shrink-0">
                <button
                  @click.stop="handleDeleteCourse(course.id)"
                  class="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600"
                  title="Delete Course"
                >
                  <i class="pi pi-trash" style="font-size: 0.85rem" />
                </button>
                <i
                  class="pi pi-chevron-right"
                  :class="
                    selectedCourse?.id === course.id ? 'text-primary-500' : 'text-surface-400'
                  "
                  style="font-size: 0.65rem"
                />
              </div>
            </button>
          </li>
        </ul>
      </ContentCard>

      <!-- RIGHT: Weight Editor -->
      <ContentCard
        :isMainCanvas="true"
        :title="selectedCourse ? selectedCourse.name : 'Select a course'"
        :subtitle="
          selectedCourse
            ? 'Configure deliverable weights. All weights must sum to exactly 100%.'
            : 'Choose from the list on the left'
        "
      >
        <div
          v-if="!selectedCourse"
          class="flex flex-col items-center justify-center text-surface-400 gap-3 py-12"
        >
          <i class="pi pi-list-check" style="font-size: 2.5rem" />
          <p class="font-medium text-surface-600 text-sm">No course selected</p>
        </div>

        <template v-else>
          <div class="space-y-4">
            <!-- Weight Validator -->
            <div
              class="rounded-xl p-4 border flex items-center justify-between gap-4"
              :class="weightValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'"
            >
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-2">
                  <i
                    :class="
                      weightValid
                        ? 'pi pi-check-circle text-green-600'
                        : 'pi pi-exclamation-circle text-red-500'
                    "
                    style="font-size: 1rem"
                  />
                  <span
                    class="text-sm font-medium"
                    :class="weightValid ? 'text-green-700' : 'text-red-700'"
                  >
                    {{
                      weightValid
                        ? 'Allocation complete'
                        : weightSum > 100
                          ? `Exceeds total by ${weightSum - 100}%`
                          : `Shortfall of ${100 - weightSum}%`
                    }}
                  </span>
                </div>
                <div class="h-2 w-full rounded-full bg-white/70 overflow-hidden">
                  <div
                    class="h-full rounded-full transition-all duration-300"
                    :class="weightValid ? 'bg-green-500' : 'bg-red-400'"
                    :style="{ width: Math.min(weightSum, 100) + '%' }"
                  />
                </div>
              </div>
              <div class="text-right flex-shrink-0">
                <span
                  class="text-2xl font-bold tabular-nums"
                  :class="weightValid ? 'text-green-700' : 'text-red-600'"
                >
                  {{ weightSum }}%
                </span>
                <span class="text-xs text-surface-500 block">/ 100%</span>
              </div>
            </div>

            <!-- Deliverable Rows -->
            <div class="space-y-3">
              <div
                v-for="(d, i) in editingDelivs"
                :key="i"
                class="bg-surface-50 rounded-xl border border-surface-200 p-4"
              >
                <div class="grid grid-cols-12 gap-3 items-start">
                  <div class="col-span-3">
                    <FormRow label="Name">
                      <InputText
                        v-model="d.name"
                        placeholder="e.g. Lab 1"
                        size="small"
                        class="w-full"
                      />
                    </FormRow>
                  </div>

                  <div class="col-span-2">
                    <FormRow label="Type">
                      <Select
                        v-model="d.type"
                        :options="['lab', 'exam', 'project']"
                        size="small"
                        class="w-full"
                      />
                    </FormRow>
                  </div>

                  <div class="col-span-2">
                    <FormRow label="Max Score">
                      <InputNumber
                        v-model="d.max_score"
                        :min="1"
                        size="small"
                        class="w-full"
                        inputClass="w-full"
                      />
                    </FormRow>
                  </div>

                  <div class="col-span-2">
                    <FormRow label="Weight %">
                      <InputNumber
                        v-model="d.course_weight"
                        :min="0"
                        :max="100"
                        suffix="%"
                        size="small"
                        class="w-full"
                        inputClass="w-full"
                      />
                    </FormRow>
                  </div>

                  <div class="col-span-2">
                    <FormRow label="Due Date">
                      <InputText v-model="d.due_date" type="date" size="small" class="w-full" />
                    </FormRow>
                  </div>

                  <div class="col-span-1 flex justify-center pt-6">
                    <button
                      @click="removeDeliverable(i)"
                      class="text-red-400 hover:text-red-600 transition-colors"
                      title="Remove Deliverable"
                    >
                      <i class="pi pi-trash" style="font-size: 1rem" />
                    </button>
                  </div>
                </div>
              </div>

              <!-- Add Deliverable -->
              <button
                @click="addDeliverable"
                class="w-full py-3 rounded-xl border-2 border-dashed border-surface-200 text-surface-400 hover:border-primary-400 hover:text-primary-500 transition-colors text-sm flex items-center justify-center gap-2"
              >
                <i class="pi pi-plus" style="font-size: 0.75rem" />
                Add Deliverable
              </button>
            </div>

            <div class="flex justify-end gap-2 pt-4 mt-4 border-t border-surface-200">
              <Button label="Revert" severity="secondary" outlined size="small" @click="revert" />
              <Button
                :label="saving ? 'Saving...' : 'Save Configuration'"
                icon="pi pi-save"
                size="small"
                :disabled="!weightValid || saving"
                :loading="saving"
                @click="saveWeights"
              />
            </div>
          </div>
        </template>
      </ContentCard>
    </DashboardGrid>
  </div>
</template>
