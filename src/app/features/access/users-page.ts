import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { RoleService } from '../../domain/access/role.service';
import { UserService } from '../../domain/access/user.service';
import type { AppUser } from '../../domain/access/access.types';
import { HlmButton } from '@spartan-ng/helm/button';
import { DtStatusChip } from '../../shared/ui/badge/status-chip';
import { DtDataTable } from '../../shared/ui/data-table/data-table';
import { DtCellTemplate } from '../../shared/ui/data-table/cell-template.directive';
import type { DtTableColumn } from '../../shared/ui/data-table/data-table.types';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { HasPermission } from '../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-users-page',
  imports: [
    PageHeader,
    DtDataTable,
    DtCellTemplate,
    DtStatusChip,
    HlmButton,
    RouterLink,
    HasPermission,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './users-page.html',
})
export class UsersPage {
  private readonly userService = inject(UserService);
  private readonly roleService = inject(RoleService);
  private readonly router = inject(Router);

  protected readonly loading = this.userService.usersLoading;
  protected readonly rows = this.userService.users;

  protected readonly columns: DtTableColumn<AppUser>[] = [
    { id: 'name', label: 'User', priority: 1, sortable: true, accessor: (u) => u.name },
    { id: 'email', label: 'Email', priority: 2, accessor: (u) => u.email },
    {
      id: 'role',
      label: 'Role',
      priority: 1,
      accessor: (u) => this.roleService.role(u.roleId)?.name ?? '',
    },
    { id: 'status', label: 'Status', priority: 1, sortable: true, accessor: (u) => u.status },
  ];

  protected readonly selectedIds = signal<ReadonlySet<string>>(new Set());
  protected readonly selectedCount = computed(() => this.selectedIds().size);
  protected readonly bulkPending = signal(false);

  protected openUser(user: AppUser): void {
    this.router.navigate(['/access/users', user.id]);
  }

  protected clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  protected async bulkSetStatus(status: AppUser['status']): Promise<void> {
    this.bulkPending.set(true);
    try {
      await Promise.all(
        Array.from(this.selectedIds()).map((id) => this.userService.updateStatus(id, status)),
      );
      this.clearSelection();
    } finally {
      this.bulkPending.set(false);
    }
  }
}
