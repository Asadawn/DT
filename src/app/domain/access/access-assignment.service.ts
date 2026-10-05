import { Injectable, resource } from '@angular/core';
import { simulateLatency } from '../../shared/utils/simulate-latency';
import { ACCESS_ASSIGNMENT_FIXTURES } from './access-assignment.fixtures';
import type {
  AccessAssignment,
  AccessAssignmentFilter,
  AccessAssignmentStatus,
  NewAccessAssignmentInput,
} from './access-assignment.types';

@Injectable({ providedIn: 'root' })
export class AccessAssignmentService {
  private readonly assignmentsResource = resource({
    defaultValue: [] as AccessAssignment[],
    loader: async () => {
      await simulateLatency();
      return ACCESS_ASSIGNMENT_FIXTURES;
    },
  });

  readonly assignments = this.assignmentsResource.value;
  readonly assignmentsLoading = this.assignmentsResource.isLoading;

  assignment(id: string | null | undefined): AccessAssignment | undefined {
    if (!id) return undefined;
    return this.assignments().find((a) => a.id === id);
  }

  status(assignment: AccessAssignment): AccessAssignmentStatus {
    if (assignment.revokedAt) return 'revoked';
    const now = Date.now();
    if (now < new Date(assignment.validFrom).getTime()) return 'scheduled';
    if (now > new Date(assignment.validUntil).getTime()) return 'expired';
    return 'active';
  }

  filtered(filters: AccessAssignmentFilter): AccessAssignment[] {
    const search = filters.search?.trim().toLowerCase();
    return this.assignments().filter((a) => {
      if (
        search &&
        !a.principalName.toLowerCase().includes(search) &&
        !a.roleLabel.toLowerCase().includes(search)
      ) {
        return false;
      }
      if (filters.buildingId && a.buildingId !== filters.buildingId) return false;
      if (filters.status && this.status(a) !== filters.status) return false;
      return true;
    });
  }

  assignmentsForJob(maintenanceId: string, vendorId: string): AccessAssignment[] {
    return this.assignments().filter(
      (a) => a.maintenanceId === maintenanceId && a.vendorId === vendorId,
    );
  }

  async create(input: NewAccessAssignmentInput): Promise<AccessAssignment> {
    await simulateLatency(400);
    const created: AccessAssignment = {
      id: `aa${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      ...input,
    };
    this.assignmentsResource.update((list) => [created, ...list]);
    return created;
  }

  async revoke(id: string): Promise<void> {
    await simulateLatency(300);
    const now = new Date().toISOString();
    this.assignmentsResource.update((list) =>
      list.map((a) => (a.id === id ? { ...a, revokedAt: now } : a)),
    );
  }
}
