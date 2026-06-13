<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ContentCard from '@/components/structural/ContentCard.vue'
import { useBillingSummary } from '../composables/useBillingSummary'

const router = useRouter()

// ─── Composable State ────────────────────────────────────────────────────────
const { summary, staffRows, staffPagination, isLoading, error, loadPage } = useBillingSummary()

// ─── Pagination & Page Size ──────────────────────────────────────────────────
const currentPage = ref(1)
const perPage = ref(10)

async function goToPage(page: number) {
  currentPage.value = page
  await loadPage(page, perPage.value)
}

async function handlePerPageChange() {
  currentPage.value = 1
  await loadPage(1, perPage.value)
}

onMounted(() => loadPage(1, perPage.value))

// ─── Role & Search Filtering ──────────────────────────────────────────────────
const selectedRole = ref<'all' | 'internal' | 'external'>('all')
const searchQuery = ref('')

const filteredRows = computed(() => {
  let rows = staffRows.value

  // Filter by Role
  if (selectedRole.value !== 'all') {
    rows = rows.filter((r) => r.compensation_type === selectedRole.value)
  }

  // Filter by Search query
  const q = searchQuery.value.toLowerCase().trim()
  if (q) {
    rows = rows.filter((r) => r.name.toLowerCase().includes(q))
  }

  return rows
})

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function variance(row: typeof staffRows.value[0]): number {
  // TODO: delivered_hours is sourced from /billing/instructors/{id} per-engagement data.
  // If that request failed, delivered_hours falls back to scheduled_hours → variance = 0.
  return (row.delivered_hours ?? row.scheduled_hours) - row.scheduled_hours
}

const paginationLabel = computed(() => {
  if (!staffPagination.value) return ''
  const { current_page, per_page, total } = staffPagination.value
  const from = (current_page - 1) * per_page + 1
  const to = Math.min(current_page * per_page, total)
  return `Showing ${from}–${to} of ${total} instructors`
})
</script>

<template>
  <div class="space-y-6">
    <!-- Breadcrumb -->
    <div>
      <div class="text-xs font-semibold tracking-wider text-surface-400 uppercase">
        FINANCE <span class="mx-1 text-surface-300">&rsaquo;</span>
        <span class="text-surface-600 font-bold">BILLING SUMMARY</span>
      </div>
      <h2 class="text-2xl font-bold text-surface-900 mt-1">Billing Summary</h2>
      <p class="text-sm text-surface-500 mt-0.5">
        Monthly instructor compensation rollup for branch management review.
      </p>
    </div>

    <!-- ── Loading Skeletons (Only on initial load when summary is null) ── -->
    <template v-if="isLoading && !summary">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          v-for="i in 3"
          :key="i"
          class="h-24 bg-surface-100 border border-surface-200 animate-pulse rounded-lg"
        ></div>
      </div>
      <div class="h-96 bg-surface-100 border border-surface-200 animate-pulse rounded-lg"></div>
    </template>

    <!-- ── Initial Load Error State ────────────────────────── -->
    <template v-else-if="error && !summary">
      <div
        class="flex items-center gap-3 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm"
      >
        <i class="pi pi-exclamation-triangle text-lg text-red-500"></i>
        <span>{{ error }}</span>
        <button class="ml-auto btn btn-xs btn-outline border-red-300 text-red-600" @click="loadPage(currentPage, perPage)">
          Retry
        </button>
      </div>
    </template>

    <!-- ── Main Content ───────────────────────────────────── -->
    <template v-else-if="summary">
      <!-- KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <!-- Total Billing Cost (with Faded Background Bank Icon) -->
        <div class="relative bg-white border border-surface-200 p-5 rounded-lg shadow-xs overflow-hidden">
          <i class="pi pi-building-columns absolute right-4 bottom-4 text-slate-300/40 pointer-events-none" 
             style="font-size: 5rem; line-height: 1;"></i>
          <div class="relative z-10">
            <div class="text-[11px] font-bold tracking-widest text-surface-500 uppercase">
              Total Billing Cost
            </div>
            <div class="text-3xl font-extrabold text-surface-900 mt-2">
              {{ formatCurrency(summary.total_cost) }}
            </div>
            <div class="text-xs text-surface-400 mt-1">All instructors this cycle</div>
          </div>
        </div>

        <!-- Internal Cost -->
        <div class="bg-white border border-surface-200 p-5 rounded-lg shadow-xs">
          <div class="text-[11px] font-bold tracking-widest text-surface-500 uppercase">
            Internal Instructors
          </div>
          <div class="text-3xl font-extrabold text-surface-900 mt-2">
            {{ formatCurrency(summary.internal_cost) }}
          </div>
          <div class="text-xs text-surface-400 mt-1">Salaried staff compensation</div>
        </div>

        <!-- External Cost -->
        <div class="bg-white border border-surface-200 p-5 rounded-lg shadow-xs">
          <div class="text-[11px] font-bold tracking-widest text-surface-500 uppercase">
            External Consultants
          </div>
          <div class="text-3xl font-extrabold text-surface-900 mt-2">
            {{ formatCurrency(summary.external_cost) }}
          </div>
          <div class="text-xs text-surface-400 mt-1">Freelance & contractor billings</div>
        </div>
      </div>

      <!-- Instructor Billing Table -->
      <ContentCard title="Instructor Billing Breakdown" :isTableContainer="true">
        <template #headerAction>
          <div class="flex items-center gap-2">
            <!-- Role Filter Select Box -->
            <select
              v-model="selectedRole"
              class="select select-bordered select-xs bg-white text-surface-800 border-surface-300 font-semibold"
            >
              <option value="all">All Roles</option>
              <option value="internal">Internal</option>
              <option value="external">External</option>
            </select>

            <!-- Search Input -->
            <div class="relative">
              <i
                class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 text-xs"
              ></i>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search instructor..."
                class="input input-bordered input-xs pl-7 w-56 bg-white text-surface-800 border-surface-300"
              />
            </div>
          </div>
        </template>

        <!-- Localized error alert inside the table card if sub-page load fails -->
        <div
          v-if="error && summary"
          class="mx-4 mt-3 alert alert-error bg-red-50 border border-red-200 text-red-700 text-xs py-2 px-3 rounded flex items-center gap-2"
        >
          <i class="pi pi-exclamation-triangle"></i>
          <span>{{ error }}</span>
          <button class="btn btn-xs btn-outline border-red-300 text-red-600 ml-auto font-semibold" @click="loadPage(currentPage, perPage)">
            Retry
          </button>
        </div>

        <!-- Table wrapper with relative layout for localized loading overlay -->
        <div class="relative overflow-x-auto min-h-[200px]">
          <!-- Localized Table Spinner Overlay -->
          <div
            v-if="isLoading && summary"
            class="absolute inset-0 bg-white/60 flex flex-col items-center justify-center z-20 gap-2 transition-all duration-200"
          >
            <span class="loading loading-spinner loading-md text-primary"></span>
            <span class="text-xs font-semibold text-slate-500">Updating Billing Breakdown...</span>
          </div>

          <table
            class="table table-sm w-full text-sm"
            :class="{ 'opacity-40 pointer-events-none': isLoading && summary }"
          >
            <thead>
              <tr class="bg-surface-50 text-surface-600 text-xs uppercase tracking-wider">
                <th class="font-semibold py-3 px-4">Instructor Name</th>
                <th class="font-semibold py-3 px-4">Role</th>
                <th class="font-semibold py-3 px-4 text-right">Scheduled / Delivered (hrs)</th>
                <th class="font-semibold py-3 px-4 text-right">Variance</th>
                <th class="font-semibold py-3 px-4 text-right">Billing Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="filteredRows.length === 0">
                <td colspan="5" class="text-center py-12 text-surface-400 italic text-sm">
                  No instructors match your search.
                </td>
              </tr>
              <tr
                v-for="row in filteredRows"
                :key="row.staff_profile_id"
                class="group border-b border-surface-100 hover:bg-slate-50 cursor-pointer transition-colors"
                @click="router.push(`/finance/instructors/${row.staff_profile_id}`)"
              >
                <!-- Name -->
                <td class="py-3 px-4 font-medium text-surface-800 group-hover:text-primary group-hover:underline transition-all duration-150">{{ row.name }}</td>

                <!-- Role badge -->
                <td class="py-3 px-4">
                  <span
                    class="badge badge-xs font-semibold uppercase tracking-wider px-2 py-1"
                    :class="
                      row.compensation_type === 'internal'
                        ? 'bg-blue-100 text-blue-700 border-blue-200'
                        : 'bg-amber-100 text-amber-700 border-amber-200'
                    "
                  >
                    {{ row.compensation_type }}
                  </span>
                </td>

                <!-- Scheduled / Delivered -->
                <td class="py-3 px-4 text-right font-mono text-surface-700">
                  {{ row.scheduled_hours }} / {{ row.delivered_hours ?? row.scheduled_hours }}
                </td>

                <!-- Variance -->
                <td class="py-3 px-4 text-right font-mono font-semibold">
                  <span
                    :class="
                      variance(row) > 0
                        ? 'text-emerald-600'
                        : variance(row) < 0
                          ? 'text-red-600'
                          : 'text-surface-400'
                    "
                  >
                    {{ variance(row) > 0 ? '+' : '' }}{{ variance(row) }}h
                  </span>
                </td>

                <!-- Billing Amount -->
                <td class="py-3 px-4 text-right font-semibold text-surface-900">
                  {{ formatCurrency(row.billing_amount) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Footer -->
        <div
          v-if="staffPagination"
          class="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-surface-100 bg-surface-50"
        >
          <!-- Left side info & perPage control -->
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <span class="text-xs text-surface-500">{{ paginationLabel }}</span>
            <div class="flex items-center gap-1 text-xs text-surface-500">
              <span>Show</span>
              <select
                v-model="perPage"
                @change="handlePerPageChange"
                class="select select-bordered select-xs bg-white text-surface-800 border-surface-300 font-semibold max-w-[70px]"
              >
                <option :value="2">2</option>
                <option :value="5">5</option>
                <option :value="10">10</option>
                <option :value="20">20</option>
              </select>
              <span>per page</span>
            </div>
          </div>

          <!-- Right side pagination page items -->
          <div class="flex items-center gap-1">
            <button
              class="btn btn-xs btn-outline border-surface-300 text-surface-600"
              :disabled="currentPage <= 1"
              @click="goToPage(currentPage - 1)"
            >
              <i class="pi pi-chevron-left text-[10px]"></i>
            </button>
            <button
              v-for="p in staffPagination.last_page"
              :key="p"
              class="btn btn-xs"
              :class="
                p === currentPage
                  ? 'btn-primary text-white'
                  : 'btn-outline border-surface-300 text-surface-600'
              "
              @click="goToPage(p)"
            >
              {{ p }}
            </button>
            <button
              class="btn btn-xs btn-outline border-surface-300 text-surface-600"
              :disabled="currentPage >= staffPagination.last_page"
              @click="goToPage(currentPage + 1)"
            >
              <i class="pi pi-chevron-right text-[10px]"></i>
            </button>
          </div>
        </div>
      </ContentCard>
    </template>
  </div>
</template>

<style scoped>
/* Theme consistent styles */
</style>
