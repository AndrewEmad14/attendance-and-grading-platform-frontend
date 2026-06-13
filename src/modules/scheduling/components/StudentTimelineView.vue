<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useCalendarTimeline } from '../composables/useCalendarTimeline'
import ContentCard from '@/components/structural/ContentCard.vue'
import type { Engagement } from '../types'

const router = useRouter()
// cohortContext removed completely; we rely purely on token scoping
const { engagements, isLoading, error, loadTimeline } =
  useCalendarTimeline()

const today = new Date()
const viewYear = ref(today.getFullYear())
const viewMonth = ref(today.getMonth())
const selectedDate = ref(formatKey(today))
const todayKey = formatKey(today)

const showScanner = ref(false)
const scanError = ref<string | null>(null)
let scannerStream: MediaStream | null = null

function formatKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const monthLabel = computed(() =>
  new Date(viewYear.value, viewMonth.value, 1).toLocaleDateString([], { month: 'long', year: 'numeric' })
)

const calendarDays = computed(() => {
  const startOffset = new Date(viewYear.value, viewMonth.value, 1).getDay()
  const gridStart = new Date(viewYear.value, viewMonth.value, 1 - startOffset)
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart); d.setDate(gridStart.getDate() + i); return d
  })
})

const engagementsByDay = computed(() => {
  const map = new Map<string, Engagement[]>()
  engagements.value.forEach(e => {
    const key = formatKey(new Date(e.starts_at))
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(e)
  })
  map.forEach(list => list.sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()))
  return map
})

const selectedSessions = computed(() => engagementsByDay.value.get(selectedDate.value) ?? [])

async function loadMonth() {
  await loadTimeline({
    dateFrom: new Date(viewYear.value, viewMonth.value, 1).toISOString(),
    dateTo: new Date(viewYear.value, viewMonth.value + 1, 0, 23, 59, 59).toISOString(),
    page: 1,
  })
}

onMounted(loadMonth)
watch([viewYear, viewMonth], loadMonth)

function changeMonth(step: number) {
  const d = new Date(viewYear.value, viewMonth.value + step, 1)
  viewYear.value = d.getFullYear()
  viewMonth.value = d.getMonth()
}

function goToday() {
  viewYear.value = today.getFullYear(); viewMonth.value = today.getMonth(); selectedDate.value = todayKey
}

const themes: {
  [key: string]: { icon: string; bg: string; text: string; dot: string }
  default: { icon: string; bg: string; text: string; dot: string }
} = {
  lecture: { icon: 'pi-desktop', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  lab: { icon: 'pi-code', bg: 'bg-emerald-50', text: 'text-success', dot: 'bg-emerald-500' },
  business_session: { icon: 'pi-briefcase', bg: 'bg-amber-50', text: 'text-amber-500', dot: 'bg-amber-500' },
  default: { icon: 'pi-calendar', bg: 'bg-zinc-50', text: 'text-zinc-600', dot: 'bg-zinc-400' }
}
const getTheme = (t: string) => themes[t] || themes.default

function getTypeCountsForDay(dateKey: string) {
  const counts: Record<string, number> = {}
    ; (engagementsByDay.value.get(dateKey) || []).forEach(e => {
      const t = themes[e.type] ? e.type : 'default'
      counts[t] = (counts[t] || 0) + 1
    })
  return Object.entries(counts)
}

const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
const formatSelectedDate = computed(() => new Date(selectedDate.value + 'T00:00:00').toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }))

async function openScanner() {
  showScanner.value = true; scanError.value = null
  if (!('BarcodeDetector' in window)) return (scanError.value = 'QR scanning unsupported on this device. Open your camera and scan.')
  await nextTick()
  try {
    scannerStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    const v = document.getElementById('qr-video') as HTMLVideoElement
    if (v) { v.srcObject = scannerStream; await v.play(); scanLoop(v) }
  } catch (e: any) { scanError.value = e.message || 'Camera access denied.' }
}

function scanLoop(video: HTMLVideoElement) {
  // @ts-expect-error - BarcodeDetector may missing in local TS types
  const detector = new BarcodeDetector({ formats: ['qr_code'] })
  const tick = async () => {
    if (!showScanner.value) return
    try {
      const codes = await detector.detect(video)
      if (codes.length) {
        closeScanner()
        const url = new URL(codes[0].rawValue, window.location.origin)
        router.push({ path: url.pathname, query: Object.fromEntries(url.searchParams) })
        return
      }
    } catch { }
    requestAnimationFrame(tick)
  }
  tick()
}

function closeScanner() {
  showScanner.value = false; scannerStream?.getTracks().forEach(t => t.stop()); scannerStream = null
}
</script>

<template>
  <div class="w-full">
    <ContentCard title="My Academic Schedule"
      subtitle="Personal calendar of lectures, lab sessions, and cross-track events">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div class="flex items-center gap-2">
          <button @click="changeMonth(-1)"
            class="cursor-pointer w-8 h-8 rounded-lg border border-zinc-200 hover:bg-zinc-50 flex items-center justify-center text-zinc-600"><i
              class="pi pi-chevron-left text-xs" /></button>
          <h2 class="text-sm font-semibold text-zinc-700 w-36 text-center">{{ monthLabel }}</h2>
          <button @click="changeMonth(1)"
            class="cursor-pointer w-8 h-8 rounded-lg border border-zinc-200 hover:bg-zinc-50 flex items-center justify-center text-zinc-600"><i
              class="pi pi-chevron-right text-xs" /></button>
          <button @click="goToday"
            class="cursor-pointer w-8 h-8 rounded-lg border border-zinc-200 hover:bg-zinc-50 flex items-center justify-center text-zinc-600"><i
              class="pi pi-calendar text-sm" /></button>
        </div>
        <button @click="openScanner"
          class="cursor-pointer flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition"><i
            class="pi pi-qrcode" /> Record Attendance</button>
      </div>

      <div v-if="error" class="p-3 bg-red-50 text-red-700 rounded-lg text-xs mb-4">{{ error }}</div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div class="lg:col-span-2">
          <div v-if="isLoading" class="flex justify-center py-10"><i
              class="pi pi-spin pi-spinner text-zinc-400 text-xl" /></div>
          <div v-else class="rounded-xl border border-zinc-200 overflow-hidden grid grid-cols-7 text-center">
            <div v-for="d in ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']" :key="d"
              class="bg-zinc-50 border-b border-zinc-200 text-xs font-semibold text-zinc-400 py-2">{{ d }}</div>
            <button v-for="date in calendarDays" :key="formatKey(date)" @click="selectedDate = formatKey(date)"
              :class="['cursor-pointer aspect-square border-b border-r border-zinc-100 p-1 flex flex-col items-center justify-between transition', date.getMonth() !== viewMonth ? 'text-zinc-300 bg-zinc-50/20' : 'text-zinc-700 hover:bg-zinc-50', formatKey(date) === selectedDate ? 'bg-indigo-50/60 ring-1 ring-inset ring-indigo-200' : '']">
              <span
                :class="['text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mt-1', formatKey(date) === todayKey ? 'bg-indigo-600 text-white' : '']">{{
                  date.getDate() }}</span>
              <div class="flex gap-1 justify-center w-full pb-1">
                <div v-for="[type, count] in getTypeCountsForDay(formatKey(date))" :key="type"
                  class="flex items-center gap-0.5 text-[9px] text-zinc-400">
                  <span>{{ count }}</span><span class="w-1.5 h-1.5 rounded-full" :class="getTheme(type).dot" />
                </div>
              </div>
            </button>
          </div>
        </div>

        <div class="lg:col-span-2 space-y-3">
          <p class="text-xs font-semibold uppercase tracking-wider text-zinc-400">{{ formatSelectedDate }}</p>
          <div v-if="!selectedSessions.length"
            class="rounded-xl border border-zinc-200 bg-zinc-50 p-8 text-center text-sm text-zinc-400">No sessions
            scheduled.</div>
          <div v-for="s in selectedSessions" :key="s.id"
            class="rounded-xl border border-zinc-200 bg-white p-4 flex items-start gap-3">
            <div class="rounded-md p-2 w-9 h-9 flex items-center justify-center shrink-0"
              :class="`${getTheme(s.type).bg} ${getTheme(s.type).text}`"><i :class="`pi ${getTheme(s.type).icon}`" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold text-zinc-800 truncate">{{ s.display_title }}</p>
              <p class="text-xs text-zinc-500 mt-0.5 truncate">{{ s.display_context }}</p>
              <div class="flex items-center gap-3 mt-2 text-xs text-zinc-400">
                <span class="flex justify-center items-center "><i class="pi pi-clock mr-1" />{{ formatTime(s.starts_at)
                }}–{{ formatTime(s.ends_at) }}</span>
                <span class="flex justify-center items-centertruncate"><i class="pi pi-id-card mr-1" />{{ s.staff_name
                  || 'Unassigned' }}</span>
              </div>
            </div>
            <span class="text-xs font-medium text-zinc-400 shrink-0">{{ s.scheduled_hours }}h</span>
          </div>
        </div>
      </div>
    </ContentCard>

    <div v-if="showScanner" @click="closeScanner"
      class="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fade-in">
      <div @click.stop class="bg-white rounded-xl p-5 w-full max-w-sm space-y-3 shadow-xl">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-zinc-800">Scan QR Code</h3><button @click="closeScanner"
            class="cursor-pointer text-zinc-400 hover:text-zinc-600"><i class="pi pi-times" /></button>
        </div>
        <div v-if="scanError" class="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{{ scanError
        }}</div>
        <video v-else id="qr-video" class="w-full rounded-lg bg-zinc-950 aspect-square object-cover" muted
          playsinline />
        <p class="text-xs text-zinc-400 text-center">Center the QR code in the frame to record attendance</p>
      </div>
    </div>
  </div>
</template>
