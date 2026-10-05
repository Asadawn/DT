import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BuildingService } from '../../domain/buildings/building.service';
import { AccessAssignmentService } from '../../domain/access/access-assignment.service';
import { MaintenanceService } from '../../domain/maintenance/maintenance.service';
import { VendorService } from '../../domain/vendors/vendor.service';
import { HlmButton } from '@spartan-ng/helm/button';
import { DtStatusChip } from '../../shared/ui/badge/status-chip';
import { DtEmptyState } from '../../shared/ui/state/empty-state';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { HasPermission } from '../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-access-assignment-detail-page',
  imports: [PageHeader, DtStatusChip, HlmButton, DtEmptyState, RouterLink, DatePipe, HasPermission],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './access-assignment-detail-page.html',
})
export class AccessAssignmentDetailPage {
  readonly assignmentId = input.required<string>();

  private readonly assignmentService = inject(AccessAssignmentService);
  private readonly buildingService = inject(BuildingService);
  private readonly maintenanceService = inject(MaintenanceService);
  private readonly vendorService = inject(VendorService);

  protected readonly assignment = computed(() =>
    this.assignmentService.assignment(this.assignmentId()),
  );
  protected readonly status = computed(() => {
    const assignment = this.assignment();
    return assignment ? this.assignmentService.status(assignment) : undefined;
  });

  protected readonly building = computed(() =>
    this.buildingService.building(this.assignment()?.buildingId),
  );
  protected readonly floor = computed(() => {
    const floorId = this.assignment()?.floorId;
    return floorId ? this.buildingService.floor(floorId) : undefined;
  });
  protected readonly space = computed(() => {
    const spaceId = this.assignment()?.spaceId;
    return spaceId ? this.buildingService.space(spaceId) : undefined;
  });

  protected readonly maintenanceTitle = computed(() => {
    const maintenanceId = this.assignment()?.maintenanceId;
    return maintenanceId ? this.maintenanceService.request(maintenanceId)?.title : undefined;
  });
  protected readonly vendorName = computed(() => {
    const vendorId = this.assignment()?.vendorId;
    return vendorId ? this.vendorService.vendor(vendorId)?.name : undefined;
  });

  protected readonly revoking = signal(false);

  protected async revoke(): Promise<void> {
    const assignment = this.assignment();
    if (!assignment) return;
    this.revoking.set(true);
    try {
      await this.assignmentService.revoke(assignment.id);
    } finally {
      this.revoking.set(false);
    }
  }
}
