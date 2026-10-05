import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { RoleService } from '../../domain/access/role.service';
import type { Role } from '../../domain/access/access.types';
import { HlmButton } from '@spartan-ng/helm/button';
import { DtDataTable } from '../../shared/ui/data-table/data-table';
import type { DtTableColumn } from '../../shared/ui/data-table/data-table.types';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { HasPermission } from '../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-roles-page',
  imports: [PageHeader, DtDataTable, HlmButton, RouterLink, HasPermission],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './roles-page.html',
})
export class RolesPage {
  private readonly roleService = inject(RoleService);
  private readonly router = inject(Router);

  protected readonly loading = this.roleService.rolesLoading;
  protected readonly rows = this.roleService.roles;

  protected readonly columns: DtTableColumn<Role>[] = [
    { id: 'name', label: 'Role', priority: 1, sortable: true, accessor: (r) => r.name },
    { id: 'description', label: 'Description', priority: 2, accessor: (r) => r.description },
    {
      id: 'permissions',
      label: 'Grants',
      priority: 3,
      accessor: (r) => r.permissions.filter((p) => p.actions.length > 0).length,
    },
  ];

  protected openRole(role: Role): void {
    this.router.navigate(['/access/roles', role.id]);
  }
}
