<script setup lang="ts">
import NavigatorCard from '../components/NavigatorCard.vue'
import DashboardGrid from '@/components/structural/DashboardGrid.vue'

// Instructor: scoped to their assigned lab group(s).
const cards = [
  {
    label: 'Sessions Calendar',
    description: 'View your scheduled sessions and attendance for your groups.',
    icon: 'pi pi-calendar',
    to: '/schedule',
  },
  {
    label: 'Gradebook',
    description: 'Grade submissions and add notes/tags to students in your assigned lab group.',
    icon: 'pi pi-book',
    to: '/grades',
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
