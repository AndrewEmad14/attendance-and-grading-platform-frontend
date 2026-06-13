<script setup lang="ts">
import NavigatorCard from '../components/NavigatorCard.vue'
import DashboardGrid from '@/components/structural/DashboardGrid.vue'

// Track Admin: full control over their track's cohort.
const cards = [

  {
    label: 'Course Configuration',
    description: 'Configure courses, course deliverables, and grade weights.',
    icon: 'pi pi-cog',
    roles: ['track_admin'],
    to: '/grades/config',
  },
  {
    label: 'Assign Labs & Sessions',
    description: 'Configure lab groups and business sessions.',
    icon: 'pi pi-sitemap',
    to: '/assigned-cohorts',
  },
  {
    label: 'Sessions Calendar',
    description: 'Schedule sessions and assign instructors.',
    icon: 'pi pi-calendar',
    to: '/schedule',
  },
  {
    label: 'Manage Attendance',
    description: 'View assigned students attendance ledger & excuse requests.',
    icon: 'pi pi-check-square',
    to: '/attendance',
  },
  {
    label: 'Gradebook',
    description: 'Enter notes/tags, final grades and override evaluations.',
    icon: 'pi pi-book',
    to: '/grades',
  },
  {
    label: 'Announcements',
    description: 'Post announcements to your cohort anytime.',
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
