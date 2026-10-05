import { Injectable, resource } from '@angular/core';
import { simulateLatency } from '../../shared/utils/simulate-latency';
import { VENDOR_FIXTURES, VENDOR_INVITATION_FIXTURES } from './vendor.fixtures';
import type {
  NewVendorInput,
  Vendor,
  VendorFilter,
  VendorInvitation,
  VendorJobStatus,
  VendorQuotation,
} from './vendor.types';

@Injectable({ providedIn: 'root' })
export class VendorService {
  private readonly vendorsResource = resource({
    defaultValue: [] as Vendor[],
    loader: async () => {
      await simulateLatency();
      return VENDOR_FIXTURES;
    },
  });

  private readonly invitationsResource = resource({
    defaultValue: [] as VendorInvitation[],
    loader: async () => {
      await simulateLatency();
      return VENDOR_INVITATION_FIXTURES;
    },
  });

  readonly vendors = this.vendorsResource.value;
  readonly vendorsLoading = this.vendorsResource.isLoading;
  readonly invitationsLoading = this.invitationsResource.isLoading;

  vendor(id: string | null | undefined): Vendor | undefined {
    if (!id) return undefined;
    return this.vendors().find((v) => v.id === id);
  }

  filtered(filters: VendorFilter): Vendor[] {
    const search = filters.search?.trim().toLowerCase();
    return this.vendors().filter((v) => {
      if (search && !v.name.toLowerCase().includes(search)) return false;
      if (filters.specialty && !v.specialties.includes(filters.specialty)) return false;
      if (filters.status && v.status !== filters.status) return false;
      return true;
    });
  }

  async create(input: NewVendorInput): Promise<Vendor> {
    await simulateLatency(400);
    const created: Vendor = { id: `v${Date.now().toString(36)}`, status: 'active', ...input };
    this.vendorsResource.update((list) => [created, ...list]);
    return created;
  }

  async update(id: string, input: NewVendorInput): Promise<Vendor> {
    await simulateLatency(400);
    let updated: Vendor | undefined;
    this.vendorsResource.update((list) =>
      list.map((v) => {
        if (v.id !== id) return v;
        updated = { ...v, ...input };
        return updated;
      }),
    );
    return updated!;
  }

  invitationsFor(maintenanceId: string): VendorInvitation[] {
    return this.invitationsResource
      .value()
      .filter((i) => i.maintenanceId === maintenanceId)
      .sort((a, b) => new Date(b.invitedAt).getTime() - new Date(a.invitedAt).getTime());
  }

  invitationsForVendor(vendorId: string): VendorInvitation[] {
    return this.invitationsResource
      .value()
      .filter((i) => i.vendorId === vendorId)
      .sort((a, b) => new Date(b.invitedAt).getTime() - new Date(a.invitedAt).getTime());
  }

  async inviteVendors(maintenanceId: string, vendorIds: string[]): Promise<void> {
    await simulateLatency(350);
    const now = new Date().toISOString();
    const created: VendorInvitation[] = vendorIds.map((vendorId) => ({
      id: `vi${Date.now().toString(36)}${vendorId}`,
      maintenanceId,
      vendorId,
      status: 'invited',
      invitedAt: now,
      evidence: [],
    }));
    this.invitationsResource.update((list) => [...created, ...list]);
  }

  async submitQuotation(invitationId: string, quotation: VendorQuotation): Promise<void> {
    await simulateLatency(350);
    const now = new Date().toISOString();
    this.invitationsResource.update((list) =>
      list.map((i) =>
        i.id === invitationId ? { ...i, status: 'quoted', respondedAt: now, quotation } : i,
      ),
    );
  }

  async declineInvitation(invitationId: string): Promise<void> {
    await simulateLatency(300);
    const now = new Date().toISOString();
    this.invitationsResource.update((list) =>
      list.map((i) => (i.id === invitationId ? { ...i, status: 'declined', respondedAt: now } : i)),
    );
  }

  async selectInvitation(invitationId: string, technicianName: string): Promise<void> {
    await simulateLatency(400);
    const now = new Date().toISOString();
    const invitation = this.invitationsResource.value().find((i) => i.id === invitationId);
    if (!invitation) return;
    this.invitationsResource.update((list) =>
      list.map((i) => {
        if (i.id === invitationId) {
          return {
            ...i,
            status: 'selected',
            technicianName,
            jobStatus: 'assigned',
            respondedAt: i.respondedAt ?? now,
          };
        }
        if (
          i.maintenanceId === invitation.maintenanceId &&
          (i.status === 'invited' || i.status === 'viewed' || i.status === 'quoted')
        ) {
          return { ...i, status: 'not-selected' };
        }
        return i;
      }),
    );
  }

  async updateJobStatus(invitationId: string, jobStatus: VendorJobStatus): Promise<void> {
    await simulateLatency(300);
    this.invitationsResource.update((list) =>
      list.map((i) => (i.id === invitationId ? { ...i, jobStatus } : i)),
    );
  }

  async addEvidence(invitationId: string, note: string): Promise<void> {
    await simulateLatency(250);
    const now = new Date().toISOString();
    this.invitationsResource.update((list) =>
      list.map((i) =>
        i.id === invitationId
          ? {
              ...i,
              evidence: [
                ...i.evidence,
                { id: `${invitationId}-e${Date.now().toString(36)}`, at: now, note },
              ],
            }
          : i,
      ),
    );
  }
}
