import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AccessAssignmentService } from '../../../domain/access/access-assignment.service';
import { MaintenanceService } from '../../../domain/maintenance/maintenance.service';
import { VendorService } from '../../../domain/vendors/vendor.service';
import type {
  VendorInvitation,
  VendorJobStatus,
  VendorQuotation,
} from '../../../domain/vendors/vendor.types';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { HlmDatePickerImports } from '@spartan-ng/helm/date-picker';
import { DtStatusChip } from '../../../shared/ui/badge/status-chip';
import { HasPermission } from '../../../shared/directives/has-permission.directive';
import { dateToIso, isoToDate } from '../../../shared/utils/date-only';

function blankQuotation(): VendorQuotation {
  return {
    arrivalWindow: '',
    durationHours: 1,
    laborCost: 0,
    materialCost: 0,
    notes: '',
    validUntil: '',
  };
}

@Component({
  selector: 'app-maintenance-vendor-panel',
  imports: [
    DtStatusChip,
    HlmButton,
    RouterLink,
    DatePipe,
    HasPermission,
    ...HlmCheckboxImports,
    ...HlmDatePickerImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './maintenance-vendor-panel.html',
})
export class MaintenanceVendorPanel {
  readonly maintenanceId = input.required<string>();
  readonly maintenanceCategory = input<string>();

  private readonly vendorService = inject(VendorService);
  private readonly maintenanceService = inject(MaintenanceService);
  private readonly accessAssignmentService = inject(AccessAssignmentService);

  protected readonly request = computed(() =>
    this.maintenanceService.request(this.maintenanceId()),
  );
  protected readonly invitations = computed(() =>
    this.vendorService.invitationsFor(this.maintenanceId()),
  );
  protected readonly activeVendorIds = computed(
    () => new Set(this.invitations().map((i) => i.vendorId)),
  );

  protected readonly eligibleVendors = computed(() => {
    const invited = this.activeVendorIds();
    const category = this.maintenanceCategory();
    return this.vendorService
      .vendors()
      .filter((v) => v.status === 'active' && !invited.has(v.id))
      .sort((a, b) => {
        const aMatch = category && a.specialties.includes(category as never) ? 0 : 1;
        const bMatch = category && b.specialties.includes(category as never) ? 0 : 1;
        return aMatch - bMatch;
      });
  });

  protected vendorName(vendorId: string): string {
    return this.vendorService.vendor(vendorId)?.name ?? vendorId;
  }

  protected readonly showInvitePanel = signal(false);
  protected readonly selectedVendorIds = signal<ReadonlySet<string>>(new Set());
  protected readonly inviting = signal(false);

  protected toggleInviteVendor(vendorId: string, checked: boolean): void {
    this.selectedVendorIds.update((set) => {
      const next = new Set(set);
      checked ? next.add(vendorId) : next.delete(vendorId);
      return next;
    });
  }

  protected async sendInvitations(): Promise<void> {
    const vendorIds = Array.from(this.selectedVendorIds());
    if (vendorIds.length === 0) return;
    this.inviting.set(true);
    try {
      await this.vendorService.inviteVendors(this.maintenanceId(), vendorIds);
      this.selectedVendorIds.set(new Set());
      this.showInvitePanel.set(false);
    } finally {
      this.inviting.set(false);
    }
  }

  protected readonly editingQuotationId = signal<string | null>(null);
  protected readonly quotationDraft = signal<VendorQuotation>(blankQuotation());
  protected readonly savingQuotation = signal(false);

  protected startQuotation(invitationId: string): void {
    this.editingQuotationId.set(invitationId);
    this.quotationDraft.set(blankQuotation());
  }

  protected cancelQuotation(): void {
    this.editingQuotationId.set(null);
  }

  protected updateQuotationDraft(patch: Partial<VendorQuotation>): void {
    this.quotationDraft.update((q) => ({ ...q, ...patch }));
  }

  protected readonly isoToDate = isoToDate;

  protected setQuotationValidUntil(date: Date | null): void {
    this.updateQuotationDraft({ validUntil: dateToIso(date) });
  }

  protected async submitQuotation(invitationId: string): Promise<void> {
    this.savingQuotation.set(true);
    try {
      await this.vendorService.submitQuotation(invitationId, this.quotationDraft());
      this.editingQuotationId.set(null);
    } finally {
      this.savingQuotation.set(false);
    }
  }

  protected async decline(invitationId: string): Promise<void> {
    await this.vendorService.declineInvitation(invitationId);
  }

  protected readonly selectingId = signal<string | null>(null);
  protected readonly technicianDraft = signal('');
  protected readonly selecting = signal(false);

  protected startSelect(invitationId: string): void {
    this.selectingId.set(invitationId);
    this.technicianDraft.set('');
  }

  protected async confirmSelect(invitationId: string): Promise<void> {
    const technicianName = this.technicianDraft().trim();
    if (!technicianName) return;
    this.selecting.set(true);
    try {
      await this.vendorService.selectInvitation(invitationId, technicianName);
      this.selectingId.set(null);
    } finally {
      this.selecting.set(false);
    }
  }

  protected readonly updatingJobId = signal<string | null>(null);
  protected readonly evidenceDraft = signal('');

  protected readonly nextJobStatus: Record<VendorJobStatus, VendorJobStatus | null> = {
    assigned: 'in-progress',
    'in-progress': 'complete',
    complete: null,
  };

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
    const note = this.evidenceDraft().trim();
    if (!note) return;
    await this.vendorService.addEvidence(invitationId, note);
    this.evidenceDraft.set('');
  }

  protected accessAssignmentFor(vendorId: string) {
    return this.accessAssignmentService.assignmentsForJob(this.maintenanceId(), vendorId).at(0);
  }

  protected accessAssignmentStatus(vendorId: string): string | undefined {
    const assignment = this.accessAssignmentFor(vendorId);
    return assignment ? this.accessAssignmentService.status(assignment) : undefined;
  }

  protected grantAccessQueryParams(invitation: VendorInvitation): Record<string, string> {
    const request = this.request();
    return {
      principalName: invitation.technicianName ?? '',
      roleLabel: `Vendor Technician — ${this.vendorName(invitation.vendorId)}`,
      buildingId: request?.buildingId ?? '',
      floorId: request?.floorId ?? '',
      spaceId: request?.spaceId ?? '',
      maintenanceId: this.maintenanceId(),
      vendorId: invitation.vendorId,
    };
  }
}
