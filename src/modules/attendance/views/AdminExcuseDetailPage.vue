<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { attendanceApi } from '../api'
import type { ExcuseRequest } from '../types'
import ExcuseStatusTag from '../components/ExcuseStatusTag.vue'

const route = useRoute()
const router = useRouter()

const excuse = ref<ExcuseRequest | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const actionLoading = ref<'approve' | 'reject' | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    const res = await attendanceApi.excuseRequest(Number(route.params.id))
    excuse.value = res.data
  } catch (e: any) {
    error.value = e.message || 'Failed to load'
  } finally {
    loading.value = false
  }
}

async function approve() {
  if (!excuse.value) return
  actionLoading.value = 'approve'
  try {
    await attendanceApi.approveExcuse(excuse.value.id)
    await load()
  } catch (e: any) { error.value = e.message }
  finally { actionLoading.value = null }
}

async function reject() {
  if (!excuse.value) return
  actionLoading.value = 'reject'
  try {
    await attendanceApi.rejectExcuse(excuse.value.id)
    await load()
  } catch (e: any) { error.value = e.message }
  finally { actionLoading.value = null }
}

onMounted(load)

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8 space-y-6">
    <button @click="router.back()" class="text-xs text-zinc-400 hover:text-zinc-600 flex items-center gap-1 transition">
      <i class="pi pi-arrow-left" /> Back to Excuses
    </button>

    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div class="h-8 w-48 bg-zinc-100 rounded animate-pulse" />
      <div class="h-40 bg-zinc-100 rounded-xl animate-pulse" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <i class="pi pi-exclamation-triangle mr-2" />{{ error }}
    </div>

    <template v-else-if="excuse">
      <!-- Header -->
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold text-zinc-800">Excuse Request #{{ excuse.id }}</h1>
          <p class="text-sm text-zinc-400 mt-0.5">Submitted {{ formatDate(excuse.created_at) }}</p>
        </div>
        <ExcuseStatusTag :status="excuse.status" />
      </div>

      <!-- Detail cards -->
      <div class="rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-100">
        <div class="px-5 py-4 grid grid-cols-2 gap-4">
          <div>
            <p class="text-xs text-zinc-400 mb-1">Student</p>
            <p class="text-sm font-medium text-zinc-800">{{ excuse.student.name }}</p>
          </div>
          <div>
            <p class="text-xs text-zinc-400 mb-1">Session</p>
            <p class="text-sm text-zinc-800 capitalize">{{ excuse.engagement.type.replace('_', ' ') }}</p>
            <p class="text-xs text-zinc-400">{{ formatDate(excuse.engagement.starts_at) }}</p>
          </div>
        </div>

        <div class="px-5 py-4">
          <p class="text-xs text-zinc-400 mb-2">Reason</p>
          <p class="text-sm text-zinc-700 leading-relaxed">{{ excuse.reason }}</p>
        </div>

        <div v-if="excuse.attachment_url" class="px-5 py-4">
          <p class="text-xs text-zinc-400 mb-2">Attachment</p>
          <a :href="excuse.attachment_url" target="_blank"
            class="text-sm text-indigo-600 hover:underline flex items-center gap-1.5">
            <i class="pi pi-external-link" /> View file
          </a>
        </div>

        <div v-if="excuse.review" class="px-5 py-4 bg-zinc-50">
          <p class="text-xs text-zinc-400 mb-2">Review</p>
          <p class="text-sm text-zinc-700">
            By <span class="font-medium">{{ excuse.review.by.name }}</span>
            <span v-if="excuse.review.at"> on {{ formatDate(excuse.review.at) }}</span>
          </p>
          <p v-if="excuse.review.note" class="text-sm text-zinc-500 mt-1 italic">{{ excuse.review.note }}</p>
        </div>
      </div>

      <!-- Actions -->
      <div v-if="excuse.status === 'pending'" class="flex gap-3">
        <button @click="approve" :disabled="!!actionLoading"
          class="flex-1 py-2.5 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
          <i v-if="actionLoading === 'approve'" class="pi pi-spin pi-spinner" />
          <i v-else class="pi pi-check" />
          Approve
        </button>
        <button @click="reject" :disabled="!!actionLoading"
          class="flex-1 py-2.5 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
          <i v-if="actionLoading === 'reject'" class="pi pi-spin pi-spinner" />
          <i v-else class="pi pi-times" />
          Reject
        </button>
      </div>
    </template>
  </div>
</template>