import { Injectable, Injector, inject, resource } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, firstValueFrom } from 'rxjs';
import type { PermissionAction } from '../../core/permissions/permission.service';
import { simulateLatency } from '../../shared/utils/simulate-latency';
import { ROLE_FIXTURES } from './role.fixtures';
import type { Role } from './access.types';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly injector = inject(Injector);

  private readonly rolesResource = resource({
    defaultValue: [] as Role[],
    loader: async () => {
      await simulateLatency();
      return ROLE_FIXTURES;
    },
  });

  readonly roles = this.rolesResource.value;
  readonly rolesLoading = this.rolesResource.isLoading;

  role(id: string | null | undefined): Role | undefined {
    if (!id) return undefined;
    return this.roles().find((r) => r.id === id);
  }

  async ready(): Promise<void> {
    if (!this.rolesLoading()) return;
    await firstValueFrom(
      toObservable(this.rolesLoading, { injector: this.injector }).pipe(
        filter((loading) => !loading),
      ),
    );
  }

  hasAction(role: Role | undefined, resourceName: string, action: PermissionAction): boolean {
    return !!role?.permissions.find((p) => p.resource === resourceName)?.actions.includes(action);
  }

  async save(id: string | null, input: Omit<Role, 'id'>): Promise<Role> {
    await simulateLatency(400);
    if (id) {
      let updated: Role | undefined;
      this.rolesResource.update((list) =>
        list.map((r) => {
          if (r.id !== id) return r;
          updated = { ...r, ...input };
          return updated;
        }),
      );
      return updated!;
    }
    const created: Role = { id: `r${Date.now().toString(36)}`, ...input };
    this.rolesResource.update((list) => [...list, created]);
    return created;
  }
}
