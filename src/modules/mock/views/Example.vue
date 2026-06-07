<script setup lang="ts">
import AnalyticsPreview from '../components/AnalyticsPreview.vue'
import GradingPreview from '../components/GradingPreview.vue'
import SchedulingAdminPreview from '../components/SchedulingAdminPreview.vue'
import SchedulingStudentPreview from '../components/SchedulingStudentPreview.vue'
</script>

<template>
  <div class="w-full max-w-full space-y-12 overflow-x-hidden pb-12">
    
    <div class="border-b border-surface-200 pb-4">
      <h2 class="text-lg font-bold text-surface-900 tracking-tight">Component Architecture Catalog Blueprint</h2>
      <p class="text-xs text-surface-500 mt-0.5">
        A vertical layout sheet mapping core reusable interface patterns to standard project specifications.
      </p>
    </div>

    <section class="space-y-2">
      <div class="text-xs font-mono text-surface-400 uppercase tracking-widest px-1">Slicing Target Matrix 01</div>
      <AnalyticsPreview />
    </section>

    <section class="space-y-2">
      <div class="text-xs font-mono text-surface-400 uppercase tracking-widest px-1">Slicing Target Matrix 02</div>
      <GradingPreview />
    </section>

    <section class="space-y-4">
      <div class="text-xs font-mono text-surface-400 uppercase tracking-widest px-1">Slicing Target Matrix 03</div>
      <SchedulingAdminPreview />
      <SchedulingStudentPreview />
    </section>

    <section class="space-y-2 opacity-50">
      <div class="text-xs font-mono text-surface-400 uppercase tracking-widest px-1">Slicing Target Matrix 04</div>
      <div class="p-6 border border-dashed border-surface-200 rounded-xl bg-white text-center text-xs text-surface-400">
        Attendance Kiosk and Logging Components Pending Implementation Sequences
      </div>
    </section>

  </div>
</template>