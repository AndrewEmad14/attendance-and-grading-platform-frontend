<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref, watch } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar, Line } from 'vue-chartjs'
import ContentCard from '@/components/structural/ContentCard.vue'
import { useBranchAnalytics } from '../composables/useBranchAnalytics'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
)

// ─── Setup Composable State ──────────────────────────────────────────────────
const { analyticsData, isLoading, error, loadAnalytics } = useBranchAnalytics()

onMounted(() => {
  loadAnalytics()
  window.addEventListener('click', handleOutsideClick)
})

onUnmounted(() => {
  window.removeEventListener('click', handleOutsideClick)
})

// ─── Constants & Color System (Standard Light Theme) ─────────────────────────
const RED = '#C0392B'
const STEEL = '#4A6FA5'
const LIGHT_GRID = '#F1F5F9'
const TICK_COLOR = '#64748B'
const TEXT_COLOR = '#334155'
const TRACK_COLORS = [RED, STEEL, '#10B981', '#F59E0B', '#8B5CF6']

// ─── Filter Tracks Selection Logic (Attendance Chart) ────────────────────────
const selectedTrackIds = ref<number[]>([])
const isDropdownOpen = ref(false)

// ─── Filter Metrics & Tracks (Second Comparison Chart) ───────────────────────
const selectedMetric = ref<'student_count' | 'total_delivered_hours' | 'at_risk_count'>('student_count')
const selectedMetricTrackIds = ref<number[]>([])
const isMetricTrackDropdownOpen = ref(false)

const metricTitle = computed(() => {
  if (selectedMetric.value === 'student_count') return 'Track Metrics: Active Students'
  if (selectedMetric.value === 'total_delivered_hours') return 'Track Metrics: Delivered Hours'
  return 'Track Metrics: At-Risk (Critical)'
})

// Auto-select first 3 tracks when analytics data is loaded
watch(
  () => analyticsData.value,
  (newData) => {
    if (newData?.tracks) {
      const initialTracks = newData.tracks.slice(0, 3).map((t) => t.track_id)
      selectedTrackIds.value = [...initialTracks]
      selectedMetricTrackIds.value = [...initialTracks]
    }
  },
  { immediate: true },
)

function toggleTrackSelection(trackId: number) {
  const index = selectedTrackIds.value.indexOf(trackId)
  if (index > -1) {
    selectedTrackIds.value.splice(index, 1)
  } else if (selectedTrackIds.value.length < 3) {
    selectedTrackIds.value.push(trackId)
  }
}

function toggleMetricTrackSelection(trackId: number) {
  const index = selectedMetricTrackIds.value.indexOf(trackId)
  if (index > -1) {
    selectedMetricTrackIds.value.splice(index, 1)
  } else if (selectedMetricTrackIds.value.length < 3) {
    selectedMetricTrackIds.value.push(trackId)
  }
}

function handleOutsideClick(e: Event) {
  const target = e.target as HTMLElement
  if (!target.closest('.filter-dropdown-container')) {
    isDropdownOpen.value = false
  }
  if (!target.closest('.metric-track-dropdown-container')) {
    isMetricTrackDropdownOpen.value = false
  }
}

// ─── Custom Plugin for Horizontal Bar Labels ─────────────────────────────────
const datalabelsPlugin = {
  id: 'horizontal-datalabels',
  afterDatasetsDraw(chart: any) {
    const { ctx, data } = chart
    ctx.save()
    ctx.font = 'bold 11px sans-serif'
    ctx.fillStyle = '#475569'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'

    const meta = chart.getDatasetMeta(0)
    if (!meta || !meta.data) return

    meta.data.forEach((bar: any, index: number) => {
      const val = data.datasets[0].data[index]
      if (val !== null && val !== undefined) {
        ctx.fillText(`${val}%`, bar.x + 6, bar.y)
      }
    })
    ctx.restore()
  },
}

// ─── Chart: Horizontal Attendance Bar (Filtered to selected tracks) ──────────
const attendanceBarData = computed(() => {
  const tracks = analyticsData.value?.tracks ?? []
  const filteredTracks = tracks.filter((t) => selectedTrackIds.value.includes(t.track_id))
  return {
    labels: filteredTracks.map((t) => t.track_name),
    datasets: [
      {
        label: 'Attendance %',
        data: filteredTracks.map((t) => t.attendance_pct),
        backgroundColor: filteredTracks.map((_, i) => (i % 2 === 0 ? RED : STEEL)),
        borderRadius: 2,
        barThickness: 20,
      },
    ],
  }
})

const attendanceBarOptions = {
  indexAxis: 'y' as const,
  responsive: true,
  maintainAspectRatio: false,
  // Reserve space on the right so the custom datalabel plugin (bar.x + 6)
  // never clips or overflows when a bar reaches 100%.
  layout: {
    padding: {
      right: 40,
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (c: any) => ` ${c.raw}%` } },
  },
  scales: {
    x: {
      min: 0,
      max: 100,
      ticks: { color: TICK_COLOR, callback: (v: any) => `${v}%` },
      grid: { color: LIGHT_GRID },
      border: { color: LIGHT_GRID },
    },
    y: {
      ticks: { color: TEXT_COLOR, font: { size: 12 } },
      grid: { display: false },
      border: { color: LIGHT_GRID },
    },
  },
}

// ─── Chart: Dynamic Metrics Bar (Filtered & Customizable) ─────────────────────
const passRateBarData = computed(() => {
  const tracks = analyticsData.value?.tracks ?? []
  const filteredTracks = tracks.filter((t) => selectedMetricTrackIds.value.includes(t.track_id))
  const isDanger = selectedMetric.value === 'at_risk_count'
  return {
    labels: filteredTracks.map((t) => t.track_name.split(' ').slice(0, 2).join(' ')),
    datasets: [
      {
        label:
          selectedMetric.value === 'student_count'
            ? 'Active Students'
            : selectedMetric.value === 'total_delivered_hours'
              ? 'Delivered Hours'
              : 'At-Risk Students (Action Required)',
        data: filteredTracks.map((t) => t[selectedMetric.value]),
        backgroundColor: isDanger ? RED : STEEL,
        borderRadius: 2,
        barThickness: 32,
      },
    ],
  }
})

const passRateBarOptions = computed(() => {
  const isDanger = selectedMetric.value === 'at_risk_count'
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (c: any) => ` ${c.raw}${isDanger ? ' (At-Risk)' : ''}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: TICK_COLOR },
        grid: { color: LIGHT_GRID },
        border: { color: LIGHT_GRID },
      },
      x: {
        ticks: { color: TEXT_COLOR, font: { size: 11 } },
        grid: { display: false },
        border: { color: LIGHT_GRID },
      },
    },
  }
})

// ─── Chart: Attendance Trend Line ────────────────────────────────────────────
const trendLineData = computed(() => {
  const trend = analyticsData.value?.attendance_trend ?? []
  const tracks = analyticsData.value?.tracks ?? []
  const labels = trend.map((_, i) => `W${i + 1}`)
  const datasets = tracks.map((track, idx) => {
    const color = TRACK_COLORS[idx % TRACK_COLORS.length]
    return {
      label: track.track_name,
      data: trend.map((w) => w.by_track.find((bt) => bt.track_id === track.track_id)?.pct ?? null),
      borderColor: color,
      backgroundColor: color + '15',
      pointBackgroundColor: color,
      pointRadius: 4,
      pointHoverRadius: 6,
      borderWidth: 2,
      tension: 0.3,
      spanGaps: false,
    }
  })
  return { labels, datasets }
})

const trendLineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  // 1. Add layout padding to give point circles room to render at the top boundary
  layout: {
    padding: {
      top: 12, // Prevents the top half of the point circle from being clipped
    }
  },
  plugins: {
    legend: {
      position: 'top' as const,
      align: 'end' as const,
      labels: { color: TEXT_COLOR, boxWidth: 12, font: { size: 11 } },
    },
    tooltip: { callbacks: { label: (c: any) => ` ${c.dataset.label}: ${c.raw ?? 'N/A'}%` } },
  },
  scales: {
    y: {
      min: 70,
      // 2. Change max to suggestedMax so data points can breathe
      suggestedMax: 100,
      ticks: { color: TICK_COLOR, callback: (v: any) => `${v}%` },
      grid: { color: LIGHT_GRID },
      border: { color: LIGHT_GRID },
    },
    x: {
      ticks: { color: TEXT_COLOR },
      grid: { display: false },
      border: { color: LIGHT_GRID },
    },
  },
}

// ─── Chart: Grouped Pass vs At-Risk ──────────────────────────────────────────
const outcomesBarData = computed(() => {
  const tracks = analyticsData.value?.tracks ?? []
  return {
    labels: tracks.map((t) => t.track_name.split(' ').slice(0, 2).join(' ')),
    datasets: [
      {
        label: 'Passed %',
        data: tracks.map((t) => t.pass_rate_pct),
        backgroundColor: '#475569',
        borderRadius: 2,
        barThickness: 20,
      },
      {
        label: 'Dropout / At-Risk %',
        data: tracks.map((t) =>
          t.student_count > 0 ? Math.round((t.at_risk_count / t.student_count) * 100) : 0,
        ),
        backgroundColor: RED,
        borderRadius: 2,
        barThickness: 20,
      },
    ],
  }
})

const outcomesBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      align: 'end' as const,
      labels: { color: TEXT_COLOR, boxWidth: 12, font: { size: 11 } },
    },
    tooltip: { callbacks: { label: (c: any) => ` ${c.dataset.label}: ${c.raw}%` } },
  },
  scales: {
    y: {
      min: 0,
      max: 100,
      ticks: { color: TICK_COLOR, callback: (v: any) => `${v}%` },
      grid: { color: LIGHT_GRID },
      border: { color: LIGHT_GRID },
    },
    x: {
      ticks: { color: TEXT_COLOR, font: { size: 11 } },
      grid: { display: false },
      border: { color: LIGHT_GRID },
    },
  },
}
</script>

<template>
  <div class="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 bg-surface-50 min-h-screen">
    <!-- Header Configuration & Global Filters -->
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div class="text-xs font-semibold tracking-wider text-slate-500 uppercase">
          BRANCH OVERVIEW <span class="mx-1 text-slate-300">&rsaquo;</span>
          <span class="text-slate-700 font-bold">CROSS-TRACK ANALYTICS</span>
        </div>
        <h2 class="text-2xl font-bold text-slate-900 mt-1">Cross-Track Analytics</h2>
        <p class="text-sm text-slate-500 mt-0.5">
          Comparing performance metrics across all active cohorts.
        </p>
      </div>
      <button class="btn btn-outline btn-sm font-semibold text-slate-700 bg-white border-slate-300 cursor-pointer">
        Q2 2026 &nbsp;▾
      </button>
    </div>

    <!-- ── Loading State ──────────────────────────────── -->
    <template v-if="isLoading">
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
        <div v-for="i in 4" :key="i" class="h-24 bg-white border border-slate-200 animate-pulse rounded-lg"></div>
      </div>
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full">
        <div class="h-80 bg-white border border-slate-200 animate-pulse rounded-lg"></div>
        <div class="h-80 bg-white border border-slate-200 animate-pulse rounded-lg"></div>
      </div>
      <div class="h-80 bg-white border border-slate-200 animate-pulse rounded-lg"></div>
      <div class="h-80 bg-white border border-slate-200 animate-pulse rounded-lg"></div>
    </template>

    <!-- ── Error State ────────────────────────────────── -->
    <template v-else-if="error">
      <div
        class="alert alert-error bg-danger border border-danger-border text-danger-content p-4 rounded-lg flex items-center gap-3">
        <i class="pi pi-exclamation-triangle text-xl text-danger-content"></i>
        <span>{{ error }}</span>
      </div>
    </template>

    <!-- ── Main Dashboard Content ─────────────────────── -->
    <template v-else-if="analyticsData">
      <!-- KPI Row (4 Cards matching API fields) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
        <div class="bg-white border border-slate-200 p-5 shadow-sm rounded-lg">
          <div class="text-[11px] font-bold tracking-widest text-slate-500 uppercase">
            TOTAL ACTIVE STUDENTS
          </div>
          <div class="text-3xl font-extrabold text-slate-900 mt-2">
            {{ analyticsData.kpis.total_active_students }}
          </div>
        </div>
        <div class="bg-white border border-slate-200 p-5 shadow-sm rounded-lg">
          <div class="text-[11px] font-bold tracking-widest text-slate-500 uppercase">
            TOTAL ACTIVE TRACKS
          </div>
          <div class="text-3xl font-extrabold text-slate-900 mt-2">
            {{ analyticsData.kpis.total_active_tracks }}
          </div>
        </div>
        <div class="bg-white border border-slate-200 p-5 shadow-sm rounded-lg">
          <div class="text-[11px] font-bold tracking-widest text-slate-500 uppercase">
            BRANCH ATTENDANCE
          </div>
          <div class="text-3xl font-extrabold text-slate-900 mt-2">
            {{ analyticsData.kpis.branch_attendance_pct ?? 0
            }}<span class="text-lg font-semibold text-slate-500">%</span>
          </div>
        </div>
        <div class="bg-white border border-slate-200 p-5 shadow-sm rounded-lg">
          <div class="text-[11px] font-bold tracking-widest text-slate-500 uppercase">
            OVERALL PASS RATE
          </div>
          <div class="text-3xl font-extrabold text-slate-900 mt-2">
            {{ analyticsData.kpis.pass_rate_pct ?? 0
            }}<span class="text-lg font-semibold text-slate-500">%</span>
          </div>
        </div>
      </div>

      <!-- Two-Column Chart Layout -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full">
        <!-- Attendance by Track (Dropdown Filter without Clipping) -->
        <div class="card bg-white border border-slate-200 shadow-sm w-full min-w-0">
          <div class="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap justify-between items-center gap-2">
            <h3 class="font-bold text-slate-900 text-sm tracking-tight">
              Attendance % by Track Module
            </h3>
            <div class="relative filter-dropdown-container">
              <button @click="isDropdownOpen = !isDropdownOpen"
                class="btn btn-outline btn-xs bg-white text-slate-700 border-slate-300 hover:bg-slate-50 flex items-center gap-1 font-semibold animate-none cursor-pointer">
                <i class="pi pi-filter text-[10px]"></i>
                Filter Tracks ({{ selectedTrackIds.length }}/3) &nbsp;▾
              </button>

              <!-- Dropdown Menu -->
              <div v-if="isDropdownOpen"
                class="absolute right-0 z-30 mt-1 bg-white border border-slate-200 shadow-lg rounded-md p-2 w-64 max-h-56 overflow-y-auto space-y-1">
                <div
                  class="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 pb-1 border-b border-slate-100">
                  Select up to 3 Tracks:
                </div>
                <div v-for="t in analyticsData.tracks" :key="t.track_id"
                  class="flex items-center gap-2 px-1 py-1 hover:bg-slate-50 rounded cursor-pointer"
                  @click.stop="toggleTrackSelection(t.track_id)">
                  <input type="checkbox" :checked="selectedTrackIds.includes(t.track_id)" :disabled="!selectedTrackIds.includes(t.track_id) && selectedTrackIds.length >= 3
                    " class="checkbox checkbox-xs checkbox-primary pointer-events-none" />
                  <span class="text-xs text-slate-600 font-medium select-none truncate">
                    {{ t.track_name }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="p-4">
            <div class="h-64 relative">
              <Bar :data="attendanceBarData" :options="attendanceBarOptions" :plugins="[datalabelsPlugin]" />
            </div>
          </div>
        </div>

        <!-- Dynamic Track Metrics comparison graph -->
        <div class="card bg-white border border-slate-200 shadow-sm w-full min-w-0">
          <div
            class="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 class="font-bold text-slate-900 text-sm tracking-tight truncate">
              {{ metricTitle }}
            </h3>
            <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
              <!-- Metric Selector -->
              <select v-model="selectedMetric"
                class="select select-bordered select-xs bg-white text-slate-700 border-slate-300 font-semibold max-w-[140px] sm:max-w-none">
                <option value="student_count">Active Students</option>
                <option value="total_delivered_hours">Delivered Hours</option>
                <option value="at_risk_count">At-Risk Count</option>
              </select>

              <!-- Track selector dropdown -->
              <div class="relative metric-track-dropdown-container">
                <button @click="isMetricTrackDropdownOpen = !isMetricTrackDropdownOpen"
                  class="btn btn-outline btn-xs bg-white text-slate-700 border-slate-300 hover:bg-slate-50 flex items-center gap-1 font-semibold whitespace-nowrap cursor-pointer">
                  <i class="pi pi-filter text-[10px]"></i>
                  <span class="hidden sm:inline">Filter Tracks</span>
                  <span class="sm:hidden">Tracks</span>
                  ({{ selectedMetricTrackIds.length }}/3) &nbsp;▾
                </button>

                <!-- Dropdown Menu -->
                <div v-if="isMetricTrackDropdownOpen"
                  class="absolute right-0 z-30 mt-1 bg-white border border-slate-200 shadow-lg rounded-md p-2 w-64 max-h-56 overflow-y-auto space-y-1">
                  <div
                    class="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 pb-1 border-b border-slate-100">
                    Select up to 3 Tracks:
                  </div>
                  <div v-for="t in analyticsData.tracks" :key="t.track_id"
                    class="flex items-center gap-2 px-1 py-1 hover:bg-slate-50 rounded cursor-pointer"
                    @click.stop="toggleMetricTrackSelection(t.track_id)">
                    <input type="checkbox" :checked="selectedMetricTrackIds.includes(t.track_id)" :disabled="!selectedMetricTrackIds.includes(t.track_id) &&
                      selectedMetricTrackIds.length >= 3
                      " class="checkbox checkbox-xs checkbox-primary pointer-events-none" />
                    <span class="text-xs text-slate-600 font-medium select-none truncate">
                      {{ t.track_name }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="p-4">
            <div class="h-64 relative">
              <Bar :data="passRateBarData" :options="passRateBarOptions" />
            </div>
          </div>
        </div>
      </div>

      <!-- Cohort Attendance Trend (Rolling Weeks) -->
      <ContentCard title="Cohort Attendance Trend (Rolling Weeks)">
        <div class="h-80 relative">
          <Line :data="trendLineData" :options="trendLineOptions" />
        </div>
      </ContentCard>
    </template>
  </div>
</template>

<style scoped>
/* Scoped styles are minimal now since we leverage standard Tailwind classes */
</style>
