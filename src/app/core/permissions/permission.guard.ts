import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { PermissionService, type PermissionAction } from './permission.service';

export function permissionGuard(resource: string, action: PermissionAction): CanActivateFn {
  return () => {
    const permissionService = inject(PermissionService);
    const router = inject(Router);

    if (permissionService.hasPermission(resource, action)) {
      return true;
    }

    return router.createUrlTree(['/no-permissions']);
  };
}
