import { Injectable, computed, signal } from '@angular/core';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

export interface Permission {
  resource: string;
  action: PermissionAction;
}

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly grantedSignal = signal<ReadonlySet<string>>(new Set());

  readonly granted = computed(() => this.grantedSignal());

  setGrantedPermissions(permissions: Permission[]): void {
    this.grantedSignal.set(new Set(permissions.map((p) => this.key(p.resource, p.action))));
  }

  hasPermission(resource: string, action: PermissionAction): boolean {
    return this.grantedSignal().has(this.key(resource, action));
  }

  private key(resource: string, action: PermissionAction): string {
    return `${resource}:${action}`;
  }
}
