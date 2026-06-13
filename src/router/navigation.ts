import { type UserRole } from '@/stores/auth'

export interface NavigationItem {
  label: string
  path: string
  icon: string
  roles: UserRole[]
}

export const navigationConfig: NavigationItem[] = [
  {
    label: 'Example',
    path: '/example',
    icon: 'pi pi-question-circle',
    roles: ['branch_manager', 'track_admin', 'instructor', 'student'],
  },
  {
    label: 'Branch Insights',
    path: '/analytics',
    icon: 'pi pi-chart-bar',
    roles: ['branch_manager'],
  },
  {
    label: 'Cohort Settings',
    path: '/cohorts',
    icon: 'pi pi-sliders-h',
    roles: ['track_admin'],
  },
  {
    label: 'Engagement Calendar',
    path: '/schedule',
    icon: 'pi pi-calendar',
    roles: ['track_admin', 'instructor', 'student'],
  },

  // Attendance Navigation
  {
    label: 'My Attendance',
    path: '/attendance/me',
    icon: 'pi pi-check-square',
    roles: ['student'],
  },
  {
    label: 'My Sessions',
    path: '/attendance/sessions',
    icon: 'pi pi-id-card',
    roles: ['instructor', 'track_admin'],
  },
  {
    label: 'Excuse Requests',
    path: '/attendance/excuses',
    icon: 'pi pi-inbox',
    roles: ['track_admin'],
  },

  {
    label: 'Gradebook',
    path: '/grades',
    icon: 'pi pi-book',
    roles: ['track_admin', 'instructor', 'student'],
  },
  {
    label: 'My Deliverables',
    path: '/submissions',
    icon: 'pi pi-upload',
    roles: ['student'],
  },
  {
    label: 'Announcements',
    path: '/announcements',
    icon: 'pi pi-megaphone',
    roles: ['track_admin', 'instructor', 'student'],
  },
  {
    label: 'System Users',
    path: '/users',
    icon: 'pi pi-users',
    roles: ['track_admin'],
  },
  {
    label: 'Course Configuration',
    path: '/grades/config',
    icon: 'pi pi-cog',
    roles: ['track_admin'],
  },
]
