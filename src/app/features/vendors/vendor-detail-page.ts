import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MAINTENANCE_CATEGORY_LABELS } from '../../domain/maintenance/maintenance.types';
import { MaintenanceService } from '../../domain/maintenance/maintenance.service';
import { VendorService } from '../../domain/vendors/vendor.service';
import { HlmButton } from '@spartan-ng/helm/button';
import { DtStatusChip } from '../../shared/ui/badge/status-chip';
import { DtEmptyState } from '../../shared/ui/state/empty-state';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { HasPermission } from '../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-vendor-detail-page',
  imports: [PageHeader, DtStatusChip, HlmButton, DtEmptyState, RouterLink, DatePipe, HasPermission],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './vendor-detail-page.html',
})
export class VendorDetailPage {
  readonly vendorId = input.required<string>();

  private readonly vendorService = inject(VendorService);
  private readonly maintenanceService = inject(MaintenanceService);

  protected readonly categoryLabels = MAINTENANCE_CATEGORY_LABELS;
  protected readonly vendor = computed(() => this.vendorService.vendor(this.vendorId()));
  protected readonly invitations = computed(() =>
    this.vendorService.invitationsForVendor(this.vendorId()),
  );

  protected maintenanceTitle(maintenanceId: string): string {
    return this.maintenanceService.request(maintenanceId)?.title ?? maintenanceId;
  }
}
