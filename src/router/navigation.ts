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
    roles: ['branch_manager', 'track_admin', 'instructor', 'student']
  },
  {
    label: 'Branch Insights',
    path: '/analytics',
    icon: 'pi pi-chart-bar',
    roles: ['branch_manager']
  },
  {
    label: 'Cohort Settings',
    path: '/cohorts',
    icon: 'pi pi-sliders-h',
    roles: ['track_admin']
  },
  {
    label: 'Engagement Calendar',
    path: '/schedule',
    icon: 'pi pi-calendar',
    roles: ['track_admin', 'instructor', 'student']
  },
  {
    label: 'Attendance Ledger',
    path: '/attendance',
    icon: 'pi pi-list',
    roles: ['track_admin', 'instructor']
  },
  {
    label: 'Kiosk Simulator',
    path: '/kiosk',
    icon: 'pi pi-qrcode',
    roles: ['track_admin']
  },
  {
    label: 'Gradebook',
    path: '/grades',
    icon: 'pi pi-book',
    roles: ['track_admin', 'instructor', 'student']
  },
  {
    label: 'My Deliverables',
    path: '/submissions',
    icon: 'pi pi-upload',
    roles: ['student']
  },
  {
    label: 'Announcements',
    path: '/announcements',
    icon: 'pi pi-megaphone',
    roles: ['track_admin', 'instructor', 'student']
  },
  {
    label: 'System Users',
    path: '/users',
    icon: 'pi pi-users',
    roles: ['track_admin']
  }
]