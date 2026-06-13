<script setup lang="ts">
import NavigatorCard from '../components/NavigatorCard.vue'
import DashboardGrid from '@/components/structural/DashboardGrid.vue'

// Branch Manager: branch-level analytics plus read-only drill-down into track features.
const cards = [
  {
    label: 'Branch Analytics',
    description: 'Cross-track comparison, attendance trends, and the billing rollup.',
    icon: 'pi pi-chart-bar',
    to: '/analytics',
  },
  {
    label: 'Cohort Settings',
    description: 'Inspect cohort configuration across every track.',
    icon: 'pi pi-sliders-h',
    to: '/cohorts',
  },
  {
    label: 'Gradebook',
    description: 'Drill into performance for any cohort.',
    icon: 'pi pi-book',
    to: '/grades',
  },
  {
    label: 'Attendance Ledger',
    description: 'Review attendance records branch-wide.',
    icon: 'pi pi-list',
    to: '/attendance',
  },
  {
    label: 'Announcements',
    description: 'See what is being posted to cohorts.',
    icon: 'pi pi-megaphone',
    to: '/announcements',
  },
]
</script>

<template>
  <DashboardGrid variant="uniform-four">
    <NavigatorCard v-for="card in cards" :key="card.to" v-bind="card" />
  </DashboardGrid>
</template>
