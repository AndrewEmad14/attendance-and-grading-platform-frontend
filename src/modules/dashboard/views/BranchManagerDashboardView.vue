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
    label: 'Finance',
    description: 'View branch billing rollup.',
    icon: 'pi pi-wallet',
    to: '/finance',
  },
  {
    label: 'Cohort Settings',
    description: 'Inspect cohort configuration across every track.',
    icon: 'pi pi-sliders-h',
    to: '/cohorts',
  },
]
</script>

<template>
  <DashboardGrid variant="uniform-four">
    <NavigatorCard v-for="card in cards" :key="card.to" v-bind="card" />
  </DashboardGrid>
</template>
