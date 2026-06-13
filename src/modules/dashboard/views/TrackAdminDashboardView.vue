<script setup lang="ts">
import NavigatorCard from '../components/NavigatorCard.vue'
import DashboardGrid from '@/components/structural/DashboardGrid.vue'

// Track Admin: full control over their track's cohort.
const cards = [
  {
    label: 'Cohort Settings',
    description: 'Configure courses, grade weights, and lab groups.',
    icon: 'pi pi-sliders-h',
    to: '/cohorts',
  },
  {
    label: 'Course Configuration',
    description: 'Set component weights and deliverables per course.',
    icon: 'pi pi-cog',
    to: '/grades/config',
  },
  {
    label: 'Gradebook',
    description: 'Enter final grades and override evaluations.',
    icon: 'pi pi-book',
    to: '/grades',
  },
  {
    label: 'Engagement Calendar',
    description: 'Schedule sessions and assign instructors.',
    icon: 'pi pi-calendar',
    to: '/schedule',
  },
  {
    label: 'Attendance Ledger',
    description: 'Review attendance and approve excuse requests.',
    icon: 'pi pi-list',
    to: '/attendance',
  },
  {
    label: 'Kiosk Simulator',
    description: 'Open the QR/NFC check-in scanner.',
    icon: 'pi pi-qrcode',
    to: '/kiosk',
  },
  {
    label: 'Announcements',
    description: 'Post announcements to your cohort anytime.',
    icon: 'pi pi-megaphone',
    to: '/announcements',
  },
  {
    label: 'System Users',
    description: 'Provision accounts and manage expiry.',
    icon: 'pi pi-users',
    to: '/users',
  },
]
</script>

<template>
  <DashboardGrid variant="uniform-four">
    <NavigatorCard v-for="card in cards" :key="card.to" v-bind="card" />
  </DashboardGrid>
</template>
