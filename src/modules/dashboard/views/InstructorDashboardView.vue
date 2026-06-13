<script setup lang="ts">
import NavigatorCard from '../components/NavigatorCard.vue'
import DashboardGrid from '@/components/structural/DashboardGrid.vue'

// Instructor: scoped to their assigned lab group(s).
const cards = [
  {
    label: 'Gradebook',
    description: 'Grade students in your assigned lab group.',
    icon: 'pi pi-book',
    to: '/grades',
  },
  {
    label: 'Attendance Ledger',
    description: 'Take and review attendance for your group.',
    icon: 'pi pi-list',
    to: '/attendance',
  },
  {
    label: 'Engagement Calendar',
    description: 'View your scheduled sessions.',
    icon: 'pi pi-calendar',
    to: '/schedule',
  },
  {
    label: 'Announcements',
    description: 'Post during your active engagement window.',
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
