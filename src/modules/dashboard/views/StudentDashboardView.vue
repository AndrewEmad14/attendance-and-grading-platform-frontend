<script setup lang="ts">
import NavigatorCard from '../components/NavigatorCard.vue'
import DashboardGrid from '@/components/structural/DashboardGrid.vue'

// Student: their own data only.
const cards = [
  {
    label: 'My Deliverables',
    description: 'Submit assignments and track late penalties.',
    icon: 'pi pi-upload',
    to: '/submissions',
  },
  {
    label: 'Gradebook',
    description: 'View your score breakdown by component.',
    icon: 'pi pi-book',
    to: '/grades',
  },
  {
    label: 'Engagement Calendar',
    description: 'See your upcoming sessions.',
    icon: 'pi pi-calendar',
    to: '/schedule',
  },
  {
    label: 'Announcements',
    description: 'Read posts from your cohort.',
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
