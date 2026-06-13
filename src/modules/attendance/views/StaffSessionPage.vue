<script setup lang="ts">
import { ref } from 'vue'
import type { Engagement } from '../types'
import MySessionsList from '../components/MySessionsList.vue'
import QrCodeDisplay from '../components/QrCodeDisplay.vue'
import SessionAttendanceTable from '../components/SessionAttendanceTable.vue'

const selected = ref<Engagement | null>(null)
const showQr = ref(false)
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <h1 class="text-xl font-semibold text-zinc-800 mb-6">My Sessions</h1>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Sessions list -->
      <div class="lg:col-span-1 space-y-3">
        <p class="text-xs font-semibold uppercase tracking-widest text-zinc-400">Sessions</p>
        <MySessionsList
          :selected-id="selected?.id"
          @select="
            (session) => {
              selected = session
              showQr = false
            }
          "
        />
      </div>

      <!-- Right panel -->
      <div class="lg:col-span-2 space-y-4">
        <template v-if="selected">
          <!-- Session header -->
          <div class="rounded-xl border border-zinc-200 bg-white p-5">
            <div class="flex items-start justify-between gap-4">
              <div>
                <p class="text-xs uppercase tracking-widest text-zinc-400 mb-1">
                  {{ selected.display_context }}
                </p>
                <h2 class="text-lg font-semibold text-zinc-800">{{ selected.display_title }}</h2>
                <p class="text-sm text-zinc-500 mt-1">
                  <i class="pi pi-user mr-1" />{{ selected.staff_name }}
                  <span class="mx-2 text-zinc-300">·</span>
                  <i class="pi pi-clock mr-1" />{{ selected.scheduled_hours }}h
                </p>
              </div>
              <button
                @click="showQr = !showQr"
                :class="[
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition',
                  showQr
                    ? 'border-indigo-300 bg-indigo-50 text-indigo-600'
                    : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50',
                ]"
              >
                <i class="pi pi-qrcode" />
                {{ showQr ? 'Hide QR' : 'Show QR' }}
              </button>
            </div>
          </div>

          <!-- QR code -->
          <QrCodeDisplay v-if="showQr" :engagement-id="selected.id" />

          <!-- Roster -->
          <div class="space-y-3">
            <p class="text-xs font-semibold uppercase tracking-widest text-zinc-400">Roster</p>
            <SessionAttendanceTable :engagement-id="selected.id" />
          </div>
        </template>

        <!-- Empty state -->
        <div
          v-else
          class="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-16 text-center text-sm text-zinc-400"
        >
          <i class="pi pi-arrow-left block text-2xl mb-2 text-zinc-300" />
          Select a session to view its roster and QR code
        </div>
      </div>
    </div>
  </div>
</template>
