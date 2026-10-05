import { Injectable, resource } from '@angular/core';
import { simulateLatency } from '../../shared/utils/simulate-latency';
import { USER_FIXTURES } from './user.fixtures';
import type { AppUser, UserStatus } from './access.types';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly usersResource = resource({
    defaultValue: [] as AppUser[],
    loader: async () => {
      await simulateLatency();
      return USER_FIXTURES;
    },
  });

  readonly users = this.usersResource.value;
  readonly usersLoading = this.usersResource.isLoading;

  user(id: string | null | undefined): AppUser | undefined {
    if (!id) return undefined;
    return this.users().find((u) => u.id === id);
  }

  async save(id: string | null, input: Omit<AppUser, 'id'>): Promise<AppUser> {
    await simulateLatency(400);
    if (id) {
      let updated: AppUser | undefined;
      this.usersResource.update((list) =>
        list.map((u) => {
          if (u.id !== id) return u;
          updated = { ...u, ...input };
          return updated;
        }),
      );
      return updated!;
    }
    const created: AppUser = { id: `u${Date.now().toString(36)}`, ...input };
    this.usersResource.update((list) => [...list, created]);
    return created;
  }

  async updateStatus(id: string, status: UserStatus): Promise<void> {
    await simulateLatency(300);
    this.usersResource.update((list) => list.map((u) => (u.id === id ? { ...u, status } : u)));
  }
}
