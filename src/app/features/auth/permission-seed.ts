import type { RoleService } from '../../domain/access/role.service';
import type { Permission, PermissionService } from '../../core/permissions/permission.service';

export async function seedPermissionsForRole(
  roleId: string,
  roleService: RoleService,
  permissionService: PermissionService,
): Promise<void> {
  await roleService.ready();
  const role = roleService.role(roleId);
  const permissions: Permission[] = (role?.permissions ?? []).flatMap((p) =>
    p.actions.map((action) => ({ resource: p.resource, action })),
  );
  permissionService.setGrantedPermissions(permissions);
}
