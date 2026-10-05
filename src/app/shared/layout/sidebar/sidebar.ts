import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { filter, map } from 'rxjs';
import {
  PermissionService,
  type PermissionAction,
} from '../../../core/permissions/permission.service';
import {
  lucideBarChart3,
  lucideBuilding2,
  lucideCalendarClock,
  lucideCpu,
  lucideLayoutDashboard,
  lucideLayoutGrid,
  lucideSettings,
  lucideShieldCheck,
  lucideHandshake,
  lucideKeyRound,
  lucideUserCheck,
  lucideUsers,
  lucideWrench,
  lucideZap,
} from '@ng-icons/lucide';
import { HlmSidebarImports } from '@spartan-ng/helm/sidebar';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  permission?: { resource: string; action: PermissionAction };
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', path: '/dashboard', icon: 'lucideLayoutDashboard' }],
  },
  {
    label: 'Portfolio',
    items: [
      {
        label: 'Buildings',
        path: '/buildings',
        icon: 'lucideBuilding2',
        permission: { resource: 'buildings', action: 'view' },
      },
      {
        label: 'Spaces',
        path: '/spaces',
        icon: 'lucideLayoutGrid',
        permission: { resource: 'buildings', action: 'view' },
      },
    ],
  },
  {
    label: 'Operations',
    items: [
      {
        label: 'Devices',
        path: '/devices',
        icon: 'lucideCpu',
        permission: { resource: 'devices', action: 'view' },
      },
      {
        label: 'Occupancy',
        path: '/operations/occupancy',
        icon: 'lucideUserCheck',
        permission: { resource: 'occupancy', action: 'view' },
      },
      {
        label: 'Automations',
        path: '/operations/automations',
        icon: 'lucideZap',
        permission: { resource: 'automations', action: 'view' },
      },
      {
        label: 'Maintenances',
        path: '/operations/maintenance',
        icon: 'lucideWrench',
        permission: { resource: 'maintenance', action: 'view' },
      },
      {
        label: 'Vendors',
        path: '/operations/vendors',
        icon: 'lucideHandshake',
        permission: { resource: 'vendors', action: 'view' },
      },
      {
        label: 'Temporary Access',
        path: '/operations/access-assignments',
        icon: 'lucideKeyRound',
        permission: { resource: 'access-assignments', action: 'view' },
      },
      {
        label: 'Schedules',
        path: '/operations/schedules',
        icon: 'lucideCalendarClock',
        permission: { resource: 'schedules', action: 'view' },
      },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      {
        label: 'Analytics',
        path: '/analytics',
        icon: 'lucideBarChart3',
        permission: { resource: 'analytics', action: 'view' },
      },
    ],
  },
  {
    label: 'Administration',
    items: [
      {
        label: 'Users',
        path: '/access/users',
        icon: 'lucideUsers',
        permission: { resource: 'users', action: 'view' },
      },
      {
        label: 'Roles',
        path: '/access/roles',
        icon: 'lucideShieldCheck',
        permission: { resource: 'roles', action: 'view' },
      },
      { label: 'Settings', path: '/settings', icon: 'lucideSettings' },
    ],
  },
];

@Component({
  selector: 'dt-sidebar',
  imports: [RouterLink, RouterLinkActive, NgIcon, ...HlmSidebarImports],
  providers: [
    provideIcons({
      lucideLayoutDashboard,
      lucideBuilding2,
      lucideLayoutGrid,
      lucideCpu,
      lucideUserCheck,
      lucideWrench,
      lucideHandshake,
      lucideKeyRound,
      lucideZap,
      lucideCalendarClock,
      lucideBarChart3,
      lucideUsers,
      lucideShieldCheck,
      lucideSettings,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar.html',
})
export class Sidebar {
  private readonly permissionService = inject(PermissionService);
  private readonly router = inject(Router);

  protected readonly navGroups = NAV_GROUPS;

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  private readonly isSpaceDetailRoute = computed(() =>
    /^\/buildings\/[^/]+\/floors\/[^/]+\/spaces\/[^/]+/.test(this.currentUrl()),
  );

  protected isVisible(item: NavItem): boolean {
    return (
      !item.permission ||
      this.permissionService.hasPermission(item.permission.resource, item.permission.action)
    );
  }

  protected isActive(item: NavItem, defaultActive: boolean): boolean {
    if (item.path === '/buildings' && this.isSpaceDetailRoute()) return false;
    if (item.path === '/spaces' && this.isSpaceDetailRoute()) return true;
    return defaultActive;
  }
}
