import type { PermissionAction } from '../../core/permissions/permission.service';

export interface RolePermission {
  resource: string;
  actions: PermissionAction[];
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: RolePermission[];
}

export type UserStatus = 'active' | 'invited' | 'disabled';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  roleId: string;
  buildingScope: string[];
  status: UserStatus;
  avatarUrl?: string;
}

export const PERMISSION_RESOURCES = [
  'buildings',
  'devices',
  'automations',
  'maintenance',
  'vendors',
  'access-assignments',
  'schedules',
  'analytics',
  'occupancy',
  'bookings',
  'users',
  'roles',
] as const;
