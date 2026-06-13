import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore, type UserRole } from '@/stores/auth'
import MainLayout from '@/layouts/MainLayout.vue'
declare module 'vue-router' {
  interface RouteMeta {
    title: string
    allowedRoles?: UserRole[]
    /** Routes that do NOT require authentication (login, password reset, etc.) */
    public?: boolean
  }
}

const routes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/modules/auth/views/LoginPage.vue'),
    meta: { title: 'Sign In', public: true },
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/modules/auth/views/ForgotPasswordPage.vue'),
    meta: { title: 'Forgot Password', public: true },
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('@/modules/auth/views/ResetPasswordPage.vue'),
    meta: { title: 'Reset Password', public: true },
  },
  {
    // Fallback 403 Page inside the App
    path: '/unauthorized',
    name: 'Unauthorized',
    component: () => import('@/components/UnauthorizedPage.vue'),
    meta: { title: 'Access Denied', public: true },
  },

  {
    path: '/',
    component: MainLayout,
    redirect: '/dashboard',
    children: [
      // {
      //   path: 'profile',
      //   name: 'MyProfile',
      //   component: () => import('@/modules/auth/views/ProfilePage.vue'),
      //   meta: {
      //     title: 'My Profile',
      //   },
      // },
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
        path: 'finance',
        name: 'BillingFinance',
        component: () => import('@/modules/finance/views/BillingSummaryPage.vue'),
        meta: { title: 'Finance', allowedRoles: ['branch_manager'] },
      },
      {
        path: 'finance/instructors/:staffProfileId',
        name: 'InstructorBillingDetail',
        component: () => import('@/modules/finance/views/InstructorBillingDetailPage.vue'),
        meta: { title: 'Instructor Billing Detail', allowedRoles: ['branch_manager'] },
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

      // Attendance Routes
      {
        path: 'attendance/scan/:engagementId',
        name: 'AttendanceScan',
        component: () => import('@/modules/attendance/views/AttendanceScanPage.vue'),
        meta: { title: 'Check In', allowedRoles: ['student'] },
      },
      {
        path: 'attendance/me',
        name: 'MyAttendanceLedger',
        component: () => import('@/modules/attendance/views/MyAttendanceLedgerPage.vue'),
        meta: { title: 'My Attendance', allowedRoles: ['student'] },
      },
      {
        path: 'attendance/me/excuses',
        name: 'MyExcuses',
        component: () => import('@/modules/attendance/views/MyExcusesPage.vue'),
        meta: { title: 'My Excuse Requests', allowedRoles: ['student'] },
      },
      {
        path: 'attendance/me/excuses/new',
        name: 'NewExcuseRequest',
        component: () => import('@/modules/attendance/views/ExcuseRequestFormPage.vue'),
        meta: { title: 'New Excuse Request', allowedRoles: ['student'] },
      },
      {
        path: 'attendance/me/excuses/:excuseId/edit',
        name: 'EditExcuseRequest',
        component: () => import('@/modules/attendance/views/ExcuseRequestFormPage.vue'),
        meta: { title: 'Edit Excuse Request', allowedRoles: ['student'] },
      },
      {
        path: 'attendance/sessions',
        name: 'SessionsList',
        component: () => import('@/modules/attendance/views/StaffSessionsList.vue'),
        meta: { title: 'Sessions List', allowedRoles: ['track_admin', 'instructor'] },
      },
      {
        path: 'attendance/sessions/:engagementId',
        name: 'SessionAttendance',
        component: () => import('@/modules/attendance/views/StaffSessionPage.vue'),
        meta: { title: 'Session Attendance', allowedRoles: ['track_admin', 'instructor'] },
      },
      {
        path: 'attendance/students/:studentId',
        name: 'StudentLedger',
        component: () => import('@/modules/attendance/views/AdminViewStudentLedgerPage.vue'),
        meta: { title: 'Student Attendance', allowedRoles: ['track_admin'] },
      },
      {
        path: 'attendance/excuses',
        name: 'AdminExcuses',
        component: () => import('@/modules/attendance/views/AdminExcusesPage.vue'),
        meta: { title: 'Excuse Requests', allowedRoles: ['track_admin'] },
      },
      {
        path: 'attendance/excuses/:excuseId',
        name: 'AdminExcuseDetail',
        component: () => import('@/modules/attendance/views/AdminExcuseDetailPage.vue'),
        meta: { title: 'Excuse Request', allowedRoles: ['track_admin'] },
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
      // {
      //   path: 'users',
      //   name: 'SystemUsers',
      //   component: () => import('@/modules/users/views/UserLifecyclePage.vue'),
      //   meta: { title: 'Account Expiry Console', allowedRoles: ['track_admin'] },
      // },
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
]

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_BASE_URL),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()

  // Allowed routes that dont require auth , the user is redirected tho if he is logged in
  if (to.meta.public) {
    if (to.name === 'Login' && auth.isAuthenticated) {
      return next({ path: '/' })
    }
    return next()
  }

  // 2. Not authenticated at all -> bounce to login, remember intended destination
  if (!auth.isAuthenticated) {
    return next({ name: 'Login', query: { redirect: to.fullPath } })
  }

  // 3. Session expired (client-side hint; server also enforces via 401)
  if (auth.isExpired) {
    await auth.logout()
    return next({ name: 'Login', query: { redirect: to.fullPath } })
  }

  // 4. Ensures that the full profile (staff_profile/student_profile etc.) is loaded
  //    before any guarded route renders, so components can rely on
  //    auth.profile / auth.staffProfileId / auth.studentProfileId being ready.
  if (!auth.currentUser) {
    try {
      await auth.fetchMe()
    } catch {
      // fetchMe failed redirect to login
      return next({ name: 'Login', query: { redirect: to.fullPath } })
    }
  }

  // 5. Role-based access check
  const allowedRoles = to.meta.allowedRoles
  if (allowedRoles && !auth.hasRole(allowedRoles)) {
    return next({ name: 'Unauthorized' })
  }

  next()
})

export default router
