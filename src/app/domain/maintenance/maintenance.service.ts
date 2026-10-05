import { Injectable, resource } from '@angular/core';
import { simulateLatency } from '../../shared/utils/simulate-latency';
import { MAINTENANCE_FIXTURES } from './maintenance.fixtures';
import type {
  MaintenanceFilter,
  MaintenanceRequest,
  MaintenanceStatus,
  NewMaintenanceInput,
} from './maintenance.types';

@Injectable({ providedIn: 'root' })
export class MaintenanceService {
  private readonly requestsResource = resource({
    defaultValue: [] as MaintenanceRequest[],
    loader: async () => {
      await simulateLatency();
      return MAINTENANCE_FIXTURES;
    },
  });

  readonly requests = this.requestsResource.value;
  readonly requestsLoading = this.requestsResource.isLoading;

  request(id: string | null | undefined): MaintenanceRequest | undefined {
    if (!id) return undefined;
    return this.requests().find((r) => r.id === id);
  }

  filtered(filters: MaintenanceFilter): MaintenanceRequest[] {
    const search = filters.search?.trim().toLowerCase();
    return this.requests().filter((r) => {
      if (search && !r.title.toLowerCase().includes(search)) return false;
      if (filters.status && r.status !== filters.status) return false;
      if (filters.priority && r.priority !== filters.priority) return false;
      if (filters.buildingId && r.buildingId !== filters.buildingId) return false;
      return true;
    });
  }

  async create(input: NewMaintenanceInput): Promise<MaintenanceRequest> {
    await simulateLatency(400);
    const now = new Date().toISOString();
    const requester = input.requester?.trim() || 'You';
    const newRequest: MaintenanceRequest = {
      ...input,
      id: `m${this.requestsResource.value().length + 1}-${Date.now().toString(36)}`,
      status: 'created',
      requester,
      createdAt: now,
      updatedAt: now,
      timeline: [{ id: `${now}-created`, at: now, label: 'Request created', actor: requester }],
    };
    this.requestsResource.update((list) => [newRequest, ...list]);
    return newRequest;
  }

  async updateStatus(id: string, status: MaintenanceStatus): Promise<void> {
    await simulateLatency(300);
    const now = new Date().toISOString();
    this.requestsResource.update((list) =>
      list.map((r) =>
        r.id !== id
          ? r
          : {
              ...r,
              status,
              updatedAt: now,
              timeline: [
                ...r.timeline,
                { id: `${now}-${status}`, at: now, label: `Status changed to "${status}"` },
              ],
            },
      ),
    );
  }
}
