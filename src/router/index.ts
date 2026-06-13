import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore, type UserRole } from '@/stores/auth'
import MainLayout from '@/layouts/MainLayout.vue'

declare module 'vue-router' {
  interface RouteMeta {
    title: string
    allowedRoles?: UserRole[]
  }
}

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/modules/dashboard/views/DashboardPage.vue'),
        meta: {
          title: 'Dashboard',
          allowedRoles: ['branch_manager', 'track_admin', 'instructor', 'student'],
        },
      },
      {
        path: 'example',
        name: 'ComponentPlayground',
        component: () => import('@/modules/mock/views/Example.vue'),
        meta: {
          title: 'Component Blueprint Playground',
          allowedRoles: ['branch_manager', 'track_admin', 'instructor', 'student'],
        },
      },
      {
        path: 'analytics',
        name: 'BranchInsights',
        component: () => import('@/modules/analytics/views/BranchAnalyticsPage.vue'),
        meta: { title: 'Branch Analytics', allowedRoles: ['branch_manager'] },
      },
      {
        path: 'cohorts',
        name: 'CohortSettings',
        component: () => import('@/modules/cohorts/views/CohortConfigPage.vue'),
        meta: {
          title: 'Cohort Configurations',
          allowedRoles: ['branch_manager', 'track_admin', 'instructor', 'student'],
        }, //['track_admin'] }
      },
      {
        path: 'schedule',
        name: 'EngagementCalendar',
        component: () => import('@/modules/scheduling/views/CalendarPage.vue'),
        meta: {
          title: 'Engagement Calendar',
          allowedRoles: ['track_admin', 'instructor', 'student'],
        },
      },
      {
        path: 'attendance',
        name: 'AttendanceLedger',
        component: () => import('@/modules/attendance/views/AttendanceLogPage.vue'),
        meta: { title: 'Attendance Ledger', allowedRoles: ['track_admin', 'instructor'] },
      },
      {
        path: 'kiosk',
        name: 'KioskSimulator',
        component: () => import('@/modules/attendance/views/KioskPage.vue'),
        meta: { title: 'QR/NFC Kiosk Scanner', allowedRoles: ['track_admin'] },
      },
      {
        path: 'grades',
        name: 'Gradebook',
        component: () => import('@/modules/grading/views/GradebookPage.vue'),
        meta: {
          title: 'Performance Gradebook',
          allowedRoles: ['track_admin', 'instructor', 'student'],
        },
      },
      {
        path: 'submissions',
        name: 'MyDeliverables',
        component: () => import('@/modules/submission/views/deliverable-page/DeliverablesPage.vue'),
        meta: { title: 'My Homework Deliverables', allowedRoles: ['student'] },
      },
      {
        path: 'announcements',
        name: 'AnnouncementsFeed',
        component: () => import('@/modules/announcements/views/AnnouncementsPage.vue'),
        meta: {
          title: 'Cohort Announcements',
          allowedRoles: ['track_admin', 'instructor', 'student'],
        },
      },
      {
        path: 'users',
        name: 'SystemUsers',
        component: () => import('@/modules/auth/views/UserLifecyclePage.vue'),
        meta: { title: 'Account Expiry Console', allowedRoles: ['track_admin'] },
      },
      {
        path: 'grades/config/:cohortId?',
        name: 'CourseConfig',
        component: () => import('@/modules/grading/views/CourseConfigPage.vue'),
        meta: { title: 'Course Configuration', allowedRoles: ['track_admin'] },
      },
      {
        path: 'grades/students/:studentId/tags',
        name: 'StudentTags',
        component: () => import('@/modules/grading/views/StudentTagsPage.vue'),
        meta: { title: 'Student Tags & Notes', allowedRoles: ['track_admin', 'instructor'] },
      },
    ],
  },
  {
    // Fallback 403 Page inside the App
    path: '/unauthorized',
    name: 'Unauthorized',
    component: () => import('@/components/UnauthorizedPage.vue'),
    meta: { title: 'Access Denied' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()
  const allowedRoles = to.meta.allowedRoles

  if (allowedRoles && !auth.hasRole(allowedRoles)) {
    return next({ name: 'Unauthorized' })
  }

  next()
})

export default router
