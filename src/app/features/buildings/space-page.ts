import { TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideLayoutGrid, lucideMapPin } from '@ng-icons/lucide';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { AccessAssignmentService } from '../../domain/access/access-assignment.service';
import { AutomationService } from '../../domain/automations/automation.service';
import { BuildingService } from '../../domain/buildings/building.service';
import { DeviceService } from '../../domain/devices/device.service';
import type { Device } from '../../domain/devices/device.types';
import { MaintenanceService } from '../../domain/maintenance/maintenance.service';
import { HasPermission } from '../../shared/directives/has-permission.directive';
import { DtDeviceCard } from '../../shared/ui/device/device-card';
import { DtDeviceQuickView } from '../../shared/ui/device/device-quick-view';
import { DtEmptyState } from '../../shared/ui/state/empty-state';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { DeviceAddWizard } from './components/device-add-wizard';
import { RoomAccessControl } from './components/room-access-control';
import { RoomAssignedTo } from './components/room-assigned-to';
import { RoomAutomations } from './components/room-automations';
import { RoomDeviceStatus } from './components/room-device-status';
import { RoomEnergySummary } from './components/room-energy-summary';
import { RoomMaintenance } from './components/room-maintenance';
import { RoomOccupancySummary } from './components/room-occupancy-summary';
import { RoomRecentBookings } from './components/room-recent-bookings';

@Component({
  selector: 'app-space-page',
  imports: [
    TitleCasePipe,
    PageHeader,
    DtDeviceCard,
    DtDeviceQuickView,
    DtEmptyState,
    HasPermission,
    DeviceAddWizard,
    RoomAssignedTo,
    RoomDeviceStatus,
    RoomOccupancySummary,
    RoomAccessControl,
    RoomRecentBookings,
    RoomEnergySummary,
    RoomMaintenance,
    RoomAutomations,
    ...HlmDialogImports,
    ...HlmCardImports,
  ],
  providers: [provideIcons({ lucideLayoutGrid, lucideMapPin })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './space-page.html',
})
export class SpacePage {
  readonly buildingId = input.required<string>();
  readonly floorId = input.required<string>();
  readonly spaceId = input.required<string>();

  private readonly buildingService = inject(BuildingService);
  private readonly deviceService = inject(DeviceService);
  private readonly accessAssignmentService = inject(AccessAssignmentService);
  private readonly maintenanceService = inject(MaintenanceService);
  private readonly automationService = inject(AutomationService);

  protected readonly building = computed(() => this.buildingService.building(this.buildingId()));
  protected readonly floor = computed(() => this.buildingService.floor(this.floorId()));
  protected readonly space = computed(() => this.buildingService.space(this.spaceId()));
  protected readonly devices = computed(() =>
    this.deviceService.devices().filter((d) => d.spaceId === this.spaceId()),
  );

  protected readonly switches = computed(() =>
    this.devices().filter((d) => d.capabilities.commands),
  );
  protected readonly sensors = computed(() =>
    this.devices().filter((d) => !d.capabilities.commands),
  );

  protected readonly onlineCount = computed(
    () => this.devices().filter((d) => d.connectivity === 'online').length,
  );

  protected readonly roomAssignments = computed(() =>
    this.accessAssignmentService.assignments().filter((a) => a.spaceId === this.spaceId()),
  );
  protected readonly roomMaintenance = computed(() =>
    this.maintenanceService.requests().filter((r) => r.spaceId === this.spaceId()),
  );
  protected readonly roomAutomations = computed(() =>
    this.automationService.automations().filter((a) => a.spaceId === this.spaceId()),
  );

  protected readonly showAddDevice = signal(false);
  protected readonly selectedDeviceId = signal<string | null>(null);
  protected readonly selectedDevice = computed(
    () => this.devices().find((d) => d.id === this.selectedDeviceId()) ?? null,
  );

  protected onDeviceCreated(_device: Device): void {
    this.showAddDevice.set(false);
  }
}
