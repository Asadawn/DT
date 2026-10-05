import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { permissionGuard } from './core/permissions/permission.guard';
import { AppShell } from './shared/layout/app-shell/app-shell';

export const routes: Routes = [
  {
    path: 'auth',
    children: [
      {
        path: 'sign-in',
        loadComponent: () => import('./features/auth/sign-in-page').then((m) => m.SignInPage),
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./features/auth/forgot-password-page').then((m) => m.ForgotPasswordPage),
      },
      {
        path: 'check-email',
        loadComponent: () =>
          import('./features/auth/check-email-page').then((m) => m.CheckEmailPage),
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./features/auth/reset-password-page').then((m) => m.ResetPasswordPage),
      },
    ],
  },
  {
    path: 'vendor-portal/:vendorId',
    loadComponent: () =>
      import('./features/vendor-portal/vendor-portal-page').then((m) => m.VendorPortalPage),
  },
  {
    path: '',
    component: AppShell,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard-page').then((m) => m.DashboardPage),
      },

      {
        path: 'buildings',
        loadComponent: () =>
          import('./features/buildings/buildings-page').then((m) => m.BuildingsPage),
      },
      {
        path: 'buildings/:buildingId',
        loadComponent: () =>
          import('./features/building-workspace/building-workspace-page').then(
            (m) => m.BuildingWorkspacePage,
          ),
      },
      {
        path: 'buildings/:buildingId/floors/:floorId',
        loadComponent: () => import('./features/buildings/floor-page').then((m) => m.FloorPage),
      },
      {
        path: 'buildings/:buildingId/floors/:floorId/spaces/:spaceId',
        loadComponent: () => import('./features/buildings/space-page').then((m) => m.SpacePage),
      },

      {
        path: 'spaces',
        loadComponent: () => import('./features/buildings/spaces-page').then((m) => m.SpacesPage),
      },
      {
        path: 'spaces/:spaceId',
        loadComponent: () =>
          import('./features/buildings/global-space-detail-page').then(
            (m) => m.GlobalSpaceDetailPage,
          ),
      },

      {
        path: 'devices',
        loadComponent: () => import('./features/devices/devices-page').then((m) => m.DevicesPage),
      },
      {
        path: 'devices/:deviceId',
        loadComponent: () => import('./features/devices/device-page').then((m) => m.DevicePage),
      },

      {
        path: 'operations/occupancy',
        canActivate: [permissionGuard('occupancy', 'view')],
        loadComponent: () =>
          import('./features/occupancy/occupancy-list-page').then((m) => m.OccupancyListPage),
      },
      {
        path: 'operations/occupancy/bookings/new',
        canActivate: [permissionGuard('bookings', 'create')],
        loadComponent: () =>
          import('./features/occupancy/booking-form-page').then((m) => m.BookingFormPage),
      },
      {
        path: 'operations/occupancy/bookings/:bookingId/edit',
        canActivate: [permissionGuard('bookings', 'edit')],
        loadComponent: () =>
          import('./features/occupancy/booking-form-page').then((m) => m.BookingFormPage),
      },
      {
        path: 'operations/occupancy/bookings/:bookingId',
        canActivate: [permissionGuard('bookings', 'view')],
        loadComponent: () =>
          import('./features/occupancy/booking-detail-page').then((m) => m.BookingDetailPage),
      },

      {
        path: 'operations/automations',
        canActivate: [permissionGuard('automations', 'view')],
        loadComponent: () =>
          import('./features/automations/automations-list-page').then((m) => m.AutomationsListPage),
      },
      {
        path: 'operations/automations/new',
        canActivate: [permissionGuard('automations', 'create')],
        loadComponent: () =>
          import('./features/automations/automation-form-page').then((m) => m.AutomationFormPage),
      },
      {
        path: 'operations/automations/:automationId/edit',
        canActivate: [permissionGuard('automations', 'edit')],
        loadComponent: () =>
          import('./features/automations/automation-form-page').then((m) => m.AutomationFormPage),
      },
      {
        path: 'operations/automations/:automationId',
        canActivate: [permissionGuard('automations', 'view')],
        loadComponent: () =>
          import('./features/automations/automation-detail-page').then(
            (m) => m.AutomationDetailPage,
          ),
      },

      {
        path: 'operations/vendors',
        canActivate: [permissionGuard('vendors', 'view')],
        loadComponent: () =>
          import('./features/vendors/vendors-list-page').then((m) => m.VendorsListPage),
      },
      {
        path: 'operations/vendors/new',
        canActivate: [permissionGuard('vendors', 'create')],
        loadComponent: () =>
          import('./features/vendors/vendor-form-page').then((m) => m.VendorFormPage),
      },
      {
        path: 'operations/vendors/:vendorId/edit',
        canActivate: [permissionGuard('vendors', 'edit')],
        loadComponent: () =>
          import('./features/vendors/vendor-form-page').then((m) => m.VendorFormPage),
      },
      {
        path: 'operations/vendors/:vendorId',
        canActivate: [permissionGuard('vendors', 'view')],
        loadComponent: () =>
          import('./features/vendors/vendor-detail-page').then((m) => m.VendorDetailPage),
      },

      {
        path: 'operations/access-assignments',
        canActivate: [permissionGuard('access-assignments', 'view')],
        loadComponent: () =>
          import('./features/access/access-assignments-page').then((m) => m.AccessAssignmentsPage),
      },
      {
        path: 'operations/access-assignments/new',
        canActivate: [permissionGuard('access-assignments', 'create')],
        loadComponent: () =>
          import('./features/access/access-assignment-form-page').then(
            (m) => m.AccessAssignmentFormPage,
          ),
      },
      {
        path: 'operations/access-assignments/:assignmentId',
        canActivate: [permissionGuard('access-assignments', 'view')],
        loadComponent: () =>
          import('./features/access/access-assignment-detail-page').then(
            (m) => m.AccessAssignmentDetailPage,
          ),
      },

      {
        path: 'operations/maintenance',
        loadComponent: () =>
          import('./features/maintenance/maintenance-list-page').then((m) => m.MaintenanceListPage),
      },
      {
        path: 'operations/maintenance/new',
        loadComponent: () =>
          import('./features/maintenance/maintenance-new-page').then((m) => m.MaintenanceNewPage),
      },
      {
        path: 'operations/maintenance/:maintenanceId',
        loadComponent: () =>
          import('./features/maintenance/maintenance-detail-page').then(
            (m) => m.MaintenanceDetailPage,
          ),
      },
      {
        path: 'operations/schedules',
        loadComponent: () =>
          import('./features/schedules/schedules-page').then((m) => m.SchedulesPage),
      },
      {
        path: 'operations/schedules/new',
        loadComponent: () =>
          import('./features/schedules/schedule-detail-page').then((m) => m.ScheduleDetailPage),
      },
      {
        path: 'operations/schedules/:scheduleId',
        loadComponent: () =>
          import('./features/schedules/schedule-detail-page').then((m) => m.ScheduleDetailPage),
      },

      {
        path: 'analytics',
        loadComponent: () =>
          import('./features/analytics/analytics-page').then((m) => m.AnalyticsPage),
      },
      {
        path: 'analytics/energy',
        data: { section: 'energy' },
        loadComponent: () =>
          import('./features/analytics/analytics-page').then((m) => m.AnalyticsPage),
      },
      {
        path: 'analytics/electrical',
        data: { section: 'electrical' },
        loadComponent: () =>
          import('./features/analytics/analytics-page').then((m) => m.AnalyticsPage),
      },
      {
        path: 'analytics/environment',
        data: { section: 'environment' },
        loadComponent: () =>
          import('./features/analytics/analytics-page').then((m) => m.AnalyticsPage),
      },
      {
        path: 'analytics/aqi',
        data: { section: 'aqi' },
        loadComponent: () =>
          import('./features/analytics/analytics-page').then((m) => m.AnalyticsPage),
      },
      {
        path: 'analytics/occupancy',
        data: { section: 'occupancy' },
        loadComponent: () =>
          import('./features/analytics/analytics-page').then((m) => m.AnalyticsPage),
      },
      {
        path: 'analytics/devices',
        data: { section: 'devices' },
        loadComponent: () =>
          import('./features/analytics/analytics-page').then((m) => m.AnalyticsPage),
      },

      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/notifications/notifications-page').then((m) => m.NotificationsPage),
      },

      {
        path: 'access/users',
        canActivate: [permissionGuard('users', 'view')],
        loadComponent: () => import('./features/access/users-page').then((m) => m.UsersPage),
      },
      {
        path: 'access/users/new',
        canActivate: [permissionGuard('users', 'create')],
        loadComponent: () => import('./features/access/user-form-page').then((m) => m.UserFormPage),
      },
      {
        path: 'access/users/:userId',
        canActivate: [permissionGuard('users', 'edit')],
        loadComponent: () => import('./features/access/user-form-page').then((m) => m.UserFormPage),
      },
      {
        path: 'access/roles',
        canActivate: [permissionGuard('roles', 'view')],
        loadComponent: () => import('./features/access/roles-page').then((m) => m.RolesPage),
      },
      {
        path: 'access/roles/new',
        canActivate: [permissionGuard('roles', 'create')],
        loadComponent: () => import('./features/access/role-form-page').then((m) => m.RoleFormPage),
      },
      {
        path: 'access/roles/:roleId',
        canActivate: [permissionGuard('roles', 'edit')],
        loadComponent: () => import('./features/access/role-form-page').then((m) => m.RoleFormPage),
      },

      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings-page').then((m) => m.SettingsPage),
      },
      {
        path: 'no-permissions',
        loadComponent: () =>
          import('./features/no-permissions/no-permissions-page').then((m) => m.NoPermissionsPage),
      },

      { path: 'space-management', redirectTo: 'spaces' },
      { path: 'device-management', redirectTo: 'devices' },
      { path: 'device-setting', redirectTo: 'devices' },
      { path: 'real-time-data', redirectTo: 'analytics' },
      { path: 'maintenance', redirectTo: 'operations/maintenance' },
      { path: 'role-management', redirectTo: 'access/roles' },
      { path: 'user-management', redirectTo: 'access/users' },
      { path: 'building-management', redirectTo: 'buildings' },

      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];
