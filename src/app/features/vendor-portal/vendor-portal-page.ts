import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BuildingService } from '../../domain/buildings/building.service';
import { MaintenanceService } from '../../domain/maintenance/maintenance.service';
import { VendorService } from '../../domain/vendors/vendor.service';
import type { VendorInvitation, VendorJobStatus } from '../../domain/vendors/vendor.types';
import { HlmButton } from '@spartan-ng/helm/button';
import { DtEmptyState } from '../../shared/ui/state/empty-state';
import { DtStatusChip } from '../../shared/ui/badge/status-chip';

@Component({
  selector: 'app-vendor-portal-page',
  imports: [DtStatusChip, DtEmptyState, HlmButton, RouterLink, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './vendor-portal-page.html',
})
export class VendorPortalPage {
  readonly vendorId = input.required<string>();

  private readonly vendorService = inject(VendorService);
  private readonly maintenanceService = inject(MaintenanceService);
  private readonly buildingService = inject(BuildingService);

  protected readonly vendor = computed(() => this.vendorService.vendor(this.vendorId()));
  protected readonly invitations = computed(() =>
    this.vendorService.invitationsForVendor(this.vendorId()),
  );

  protected readonly activeJobs = computed(() =>
    this.invitations().filter((i) => i.status === 'selected'),
  );
  protected readonly pastInvitations = computed(() =>
    this.invitations().filter((i) => i.status !== 'selected'),
  );

  protected maintenanceTitle(maintenanceId: string): string {
    return this.maintenanceService.request(maintenanceId)?.title ?? maintenanceId;
  }

  protected maintenanceLocation(maintenanceId: string): string {
    const request = this.maintenanceService.request(maintenanceId);
    if (!request) return '';
    const parts = [
      this.buildingService.building(request.buildingId)?.name,
      request.floorId ? this.buildingService.floor(request.floorId)?.name : undefined,
      request.spaceId ? this.buildingService.space(request.spaceId)?.name : undefined,
    ].filter((part): part is string => !!part);
    return parts.join(' · ');
  }

  protected readonly nextJobStatus: Record<VendorJobStatus, VendorJobStatus | null> = {
    assigned: 'in-progress',
    'in-progress': 'complete',
    complete: null,
  };

  protected readonly updatingJobId = signal<string | null>(null);
  protected readonly evidenceDraft = signal<Record<string, string>>({});

  protected evidenceValue(invitationId: string): string {
    return this.evidenceDraft()[invitationId] ?? '';
  }

  protected setEvidenceValue(invitationId: string, value: string): void {
    this.evidenceDraft.update((draft) => ({ ...draft, [invitationId]: value }));
  }

  protected async advanceJob(invitation: VendorInvitation): Promise<void> {
    const next = invitation.jobStatus ? this.nextJobStatus[invitation.jobStatus] : null;
    if (!next) return;
    this.updatingJobId.set(invitation.id);
    try {
      await this.vendorService.updateJobStatus(invitation.id, next);
    } finally {
      this.updatingJobId.set(null);
    }
  }

  protected async addEvidence(invitationId: string): Promise<void> {
    const note = this.evidenceValue(invitationId).trim();
    if (!note) return;
    await this.vendorService.addEvidence(invitationId, note);
    this.setEvidenceValue(invitationId, '');
  }
}
