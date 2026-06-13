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
    label: 'Sessions Calendar',
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
    label: 'Manage Attendance',
    path: '/attendance',
    icon: 'pi pi-check-square',
    roles: ['track_admin'],
  },
  // {
  //   label: 'My Sessions',
  //   path: '/attendance/sessions',
  //   icon: 'pi pi-video',
  //   roles: ['track_admin', 'instructor'],
  // },

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
    path: '/grades/config/1',
    icon: 'pi pi-cog',
    roles: ['track_admin'],
  },
]

export const accountNavigationConfig = {
  profile: {
    label: 'My Profile',
    path: '/profile',
    icon: 'pi pi-user',
  },
  login: {
    label: 'Sign In',
    path: '/login',
    icon: 'pi pi-sign-in',
  },
}
