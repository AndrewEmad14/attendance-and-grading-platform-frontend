<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ContentCard from '@/components/structural/ContentCard.vue'
import { useInstructorBillingDetail } from '../composables/useInstructorBillingDetail'

const route = useRoute()
const router = useRouter()

const staffProfileId = Number(route.params.staffProfileId)

// ─── Composable State ────────────────────────────────────────────────────────
const { detail, isLoading, error, loadDetail } = useInstructorBillingDetail()

// ─── Pagination ──────────────────────────────────────────────────────────────
const currentPage = ref(1)
const perPage = ref(15)

async function goToPage(page: number) {
  currentPage.value = page
  await loadDetail(staffProfileId, page, perPage.value)
}

onMounted(() => loadDetail(staffProfileId, 1, perPage.value))

// ─── Client-side Type Filter ─────────────────────────────────────────────────
const selectedType = ref<'all' | 'lecture' | 'lab' | 'business_session'>('all')

const filteredEngagements = computed(() => {
  const rows = detail.value?.engagements.data ?? []
  if (selectedType.value === 'all') return rows
  return rows.filter((e) => e.type === selectedType.value)
})

// ─── Pagination Label ─────────────────────────────────────────────────────────
const paginationLabel = computed(() => {
  const eng = detail.value?.engagements
  if (!eng) return ''
  const from = (eng.current_page - 1) * eng.per_page + 1
  const to = Math.min(eng.current_page * eng.per_page, eng.total)
  return `Showing ${from}–${to} of ${eng.total} engagements`
})

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const TYPE_LABELS: Record<string, string> = {
  lecture: 'Lecture',
  lab: 'Lab',
  business_session: 'Business Session',
}

const TYPE_CLASSES: Record<string, string> = {
  lecture: 'bg-info text-info-content border-info-border',
  lab: 'bg-success text-success border-success-border',
  business_session: 'bg-purple-100 text-purple-700 border-purple-200',
}

const STATUS_CLASSES: Record<string, string> = {
  forwarded: 'bg-success text-success border-success-border',
  pending: 'bg-warning text-warning-content border-warning-border',
  in_progress: 'bg-surface-100 text-surface-600 border-surface-200',
}

const STATUS_LABELS: Record<string, string> = {
  forwarded: 'Forwarded',
  pending: 'Pending',
  in_progress: 'In Progress',
}
</script>

<template>
  <div class="space-y-6">
    <!-- Back navigation -->
    <div>
      <button
        class="flex items-center gap-1.5 text-xs font-semibold text-surface-500 hover:text-primary transition-colors mb-3"
        @click="router.push('/finance')">
        <i class="pi pi-chevron-left text-[10px]"></i>
        Back to Billing Summary
      </button>

      <!-- ── Initial Load Skeleton ── -->
      <template v-if="isLoading && !detail">
        <div class="h-8 w-64 bg-surface-100 animate-pulse rounded mb-2"></div>
        <div class="h-4 w-32 bg-surface-100 animate-pulse rounded"></div>
      </template>

      <!-- ── Instructor Identity ── -->
      <template v-else-if="detail">
        <div class="flex flex-wrap items-center gap-3">
          <h2 class="text-2xl font-bold text-surface-900">{{ detail.name }}</h2>
          <span class="badge badge-sm font-semibold uppercase tracking-wider px-2 py-1" :class="detail.compensation_type === 'internal'
              ? 'bg-info text-info-content border-info-border'
              : 'bg-warning text-warning-content border-warning-border'
            ">
            {{ detail.compensation_type }}
          </span>
        </div>
        <p class="text-sm text-surface-500 mt-0.5">
          Hourly Rate: {{ formatCurrency(detail.hourly_rate) }}/hr
          <span v-if="detail.compensation_type === 'internal'" class="ml-3">
            · Fixed Salary: {{ formatCurrency(detail.fixed_salary) }}
          </span>
        </p>
      </template>
    </div>

    <!-- ── Initial Error ── -->
    <template v-if="error && !detail">
      <div class="flex items-center gap-3 p-4 bg-danger border border-danger-border text-danger-content rounded-lg text-sm">
        <i class="pi pi-exclamation-triangle text-lg text-danger-content"></i>
        <span>{{ error }}</span>
        <button class="ml-auto btn btn-xs btn-outline border-danger-border text-danger-content"
          @click="loadDetail(staffProfileId, currentPage, perPage)">
          Retry
        </button>
      </div>
    </template>

    <!-- ── Main Content ── -->
    <template v-if="detail">
      <!-- Payout Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <!-- Total Delivered Hours -->
        <div class="bg-white border border-surface-200 p-5 rounded-lg shadow-xs">
          <div class="text-[11px] font-bold tracking-widest text-surface-500 uppercase">
            Total Delivered Hours
          </div>
          <div class="text-3xl font-extrabold text-surface-900 mt-2">
            {{ detail.payout_summary.total_delivered_hours }}
            <span class="text-base font-semibold text-surface-400">hrs</span>
          </div>
        </div>

        <!-- Base Salary — only shown for internal -->
        <div v-if="detail.compensation_type === 'internal'"
          class="bg-white border border-surface-200 p-5 rounded-lg shadow-xs">
          <div class="text-[11px] font-bold tracking-widest text-surface-500 uppercase">
            Base Salary
          </div>
          <div class="text-3xl font-extrabold text-surface-900 mt-2">
            {{ formatCurrency(detail.payout_summary.base_salary_component) }}
          </div>
          <div class="text-xs text-surface-400 mt-1">Fixed salary component</div>
        </div>

        <!-- Hourly Component -->
        <div class="bg-white border border-surface-200 p-5 rounded-lg shadow-xs">
          <div class="text-[11px] font-bold tracking-widest text-surface-500 uppercase">
            Hourly Component
          </div>
          <div class="text-3xl font-extrabold text-surface-900 mt-2">
            {{ formatCurrency(detail.payout_summary.hourly_component) }}
          </div>
          <div class="text-xs text-surface-400 mt-1">Delivered hours × hourly rate</div>
        </div>

        <!-- Total Payout -->
        <div class="relative bg-white border border-surface-200 p-5 rounded-lg shadow-xs overflow-hidden">
          <i class="pi pi-wallet absolute right-4 bottom-3 text-slate-300/40 pointer-events-none"
            style="font-size: 4rem; line-height: 1;"></i>
          <div class="relative z-10">
            <div class="text-[11px] font-bold tracking-widest text-surface-500 uppercase">
              Total Payout
            </div>
            <div class="text-3xl font-extrabold text-surface-900 mt-2">
              {{ formatCurrency(detail.payout_summary.total_calculated_payout) }}
            </div>
            <div class="text-xs text-surface-400 mt-1">This billing cycle</div>
          </div>
        </div>
      </div>

      <!-- Engagement Breakdown Table -->
      <ContentCard title="Engagement Breakdown" :isTableContainer="true">
        <template #headerAction>
          <!-- Type Filter -->
          <select v-model="selectedType"
            class="select select-bordered select-xs bg-white text-surface-800 border-surface-300 font-semibold">
            <option value="all">All Types</option>
            <option value="lecture">Lecture</option>
            <option value="lab">Lab</option>
            <option value="business_session">Business Session</option>
          </select>
        </template>

        <!-- Localized error if a sub-page load fails -->
        <div v-if="error && detail"
          class="mx-4 mt-3 p-3 bg-danger border border-danger-border text-danger-content text-xs rounded flex items-center gap-2">
          <i class="pi pi-exclamation-triangle"></i>
          <span>{{ error }}</span>
          <button class="btn btn-xs btn-outline border-danger-border text-danger-content ml-auto"
            @click="loadDetail(staffProfileId, currentPage, perPage)">
            Retry
          </button>
        </div>

        <!-- Table wrapper with localized loading overlay -->
        <div class="relative overflow-x-auto min-h-[200px]">
          <!-- Spinner overlay on page changes -->
          <div v-if="isLoading && detail"
            class="absolute inset-0 bg-white/60 flex flex-col items-center justify-center z-20 gap-2">
            <span class="loading loading-spinner loading-md text-primary"></span>
            <span class="text-xs font-semibold text-slate-500">Loading engagements…</span>
          </div>

          <table class="table table-sm w-full text-sm"
            :class="{ 'opacity-40 pointer-events-none': isLoading && detail }">
            <thead>
              <tr class="bg-surface-50 text-surface-600 text-xs uppercase tracking-wider">
                <th class="font-semibold py-3 px-4">Title</th>
                <th class="font-semibold py-3 px-4">Type</th>
                <th class="font-semibold py-3 px-4">Date</th>
                <th class="font-semibold py-3 px-4 text-right">Duration (hrs)</th>
                <th class="font-semibold py-3 px-4 text-right">Est. Payout</th>
                <th class="font-semibold py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredEngagements.length === 0">
                <td colspan="6" class="text-center py-12 text-surface-400 italic text-sm">
                  No engagements match the selected filter.
                </td>
              </tr>
              <tr v-for="eng in filteredEngagements" :key="eng.engagement_id"
                class="border-b border-surface-100 hover:bg-surface-50 transition-colors">
                <!-- Title -->
                <td class="py-3 px-4 font-medium text-surface-800">{{ eng.title }}</td>

                <!-- Type badge -->
                <td class="py-3 px-4">
                  <span class="badge badge-xs font-semibold px-2 py-1"
                    :class="TYPE_CLASSES[eng.type] ?? 'bg-surface-100 text-surface-600 border-surface-200'">
                    {{ TYPE_LABELS[eng.type] ?? eng.type }}
                  </span>
                </td>

                <!-- Date -->
                <td class="py-3 px-4 text-surface-600 whitespace-nowrap">
                  {{ formatDate(eng.starts_at) }}
                </td>

                <!-- Duration -->
                <td class="py-3 px-4 text-right font-mono text-surface-700">
                  {{ eng.scheduled_hours }}h
                </td>

                <!-- Estimated Payout -->
                <td class="py-3 px-4 text-right font-semibold text-surface-900">
                  {{ formatCurrency(eng.estimated_payout) }}
                </td>

                <!-- Status badge -->
                <td class="py-3 px-4">
                  <span class="badge badge-xs font-semibold px-2 py-1"
                    :class="STATUS_CLASSES[eng.status] ?? 'bg-surface-100 text-surface-600 border-surface-200'">
                    {{ STATUS_LABELS[eng.status] ?? eng.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Footer -->
        <div
          v-if="detail.engagements.last_page > 1"
          class="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-surface-100 bg-surface-50"
        >
          <span class="text-xs text-surface-500">{{ paginationLabel }}</span>
          <div class="flex items-center gap-1">
            <button class="btn btn-xs btn-outline border-surface-300 text-surface-600" :disabled="currentPage <= 1"
              @click="goToPage(currentPage - 1)">
              <i class="pi pi-chevron-left text-[10px]"></i>
            </button>
            <button v-for="p in detail.engagements.last_page" :key="p" class="btn btn-xs" :class="p === currentPage
                ? 'btn-primary text-white'
                : 'btn-outline border-surface-300 text-surface-600'
              " @click="goToPage(p)">
              {{ p }}
            </button>
            <button class="btn btn-xs btn-outline border-surface-300 text-surface-600"
              :disabled="currentPage >= detail.engagements.last_page" @click="goToPage(currentPage + 1)">
              <i class="pi pi-chevron-right text-[10px]"></i>
            </button>
          </div>
        </div>

        <!-- Single-page summary label (no nav needed) -->
        <div v-else-if="detail.engagements.total > 0" class="px-4 py-3 border-t border-surface-100 bg-surface-50">
          <span class="text-xs text-surface-500">{{ paginationLabel }}</span>
        </div>
      </ContentCard>
    </template>
  </div>
</template>
