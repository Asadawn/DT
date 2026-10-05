import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBuilding2,
  lucideChevronRight,
  lucideFileWarning,
  lucideHash,
  lucideLayers,
  lucideLink2,
  lucideMapPin,
  lucideTriangleAlert,
  lucideWrench,
} from '@ng-icons/lucide';
import { BuildingService } from '../../domain/buildings/building.service';
import { DeviceService } from '../../domain/devices/device.service';
import { MaintenanceService } from '../../domain/maintenance/maintenance.service';
import {
  MAINTENANCE_CATEGORY_LABELS,
  type MaintenanceStatus,
} from '../../domain/maintenance/maintenance.types';
import { HlmButton } from '@spartan-ng/helm/button';
import { DtStatusChip } from '../../shared/ui/badge/status-chip';
import { DtEmptyState } from '../../shared/ui/state/empty-state';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { DtTimeline } from '../../shared/ui/timeline/timeline';
import { MaintenanceVendorPanel } from './components/maintenance-vendor-panel';

@Component({
  selector: 'app-maintenance-detail-page',
  imports: [
    PageHeader,
    DtStatusChip,
    HlmButton,
    DtTimeline,
    DtEmptyState,
    MaintenanceVendorPanel,
    NgIcon,
    RouterLink,
  ],
  providers: [
    provideIcons({
      lucideFileWarning,
      lucideTriangleAlert,
      lucideWrench,
      lucideMapPin,
      lucideBuilding2,
      lucideLayers,
      lucideLink2,
      lucideHash,
      lucideChevronRight,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './maintenance-detail-page.html',
})
export class MaintenanceDetailPage {
  readonly maintenanceId = input.required<string>();

  private readonly maintenanceService = inject(MaintenanceService);
  private readonly buildingService = inject(BuildingService);
  private readonly deviceService = inject(DeviceService);

  protected readonly request = computed(() =>
    this.maintenanceService.request(this.maintenanceId()),
  );
  protected readonly building = computed(() =>
    this.buildingService.building(this.request()?.buildingId),
  );
  protected readonly floor = computed(() => this.buildingService.floor(this.request()?.floorId));
  protected readonly space = computed(() => this.buildingService.space(this.request()?.spaceId));
  protected readonly device = computed(() => this.deviceService.device(this.request()?.deviceId));
  protected readonly deviceTypeLabel = computed(() => {
    const req = this.request();
    if (!req) return '';
    return this.device()?.name ?? MAINTENANCE_CATEGORY_LABELS[req.category];
  });
  protected readonly updating = signal(false);

  protected readonly nextActions = computed<
    { label: string; status: MaintenanceStatus; danger?: boolean }[]
  >(() => {
    const status = this.request()?.status;
    switch (status) {
      case 'created':
        return [
          { label: 'Triage', status: 'triage' },
          { label: 'Reject', status: 'rejected', danger: true },
        ];
      case 'triage':
        return [
          { label: 'Assign', status: 'assigned' },
          { label: 'Reject', status: 'rejected', danger: true },
        ];
      case 'assigned':
        return [{ label: 'Start Work', status: 'in-progress' }];
      case 'in-progress':
        return [{ label: 'Mark Complete', status: 'complete' }];
      case 'complete':
        return [
          { label: 'Verify & Close', status: 'closed' },
          { label: 'Reopen', status: 'in-progress' },
        ];
      case 'verify':
        return [
          { label: 'Pass — Close', status: 'closed' },
          { label: 'Fail — Reopen', status: 'in-progress' },
        ];
      default:
        return [];
    }
  });

  protected async setStatus(status: MaintenanceStatus): Promise<void> {
    const request = this.request();
    if (!request) return;
    this.updating.set(true);
    try {
      await this.maintenanceService.updateStatus(request.id, status);
    } finally {
      this.updating.set(false);
    }
  }
}
