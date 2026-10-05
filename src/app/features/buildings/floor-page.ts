import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { required, form, FormField } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { AutomationService } from '../../domain/automations/automation.service';
import { BuildingService } from '../../domain/buildings/building.service';
import type { SpaceKind } from '../../domain/buildings/building.types';
import { connectivityBreakdown } from '../../domain/devices/device.fixtures';
import { DeviceService } from '../../domain/devices/device.service';
import { MaintenanceService } from '../../domain/maintenance/maintenance.service';
import type { SelectOption } from '../../shared/types/canonical.types';
import { HasPermission } from '../../shared/directives/has-permission.directive';
import { DtStatusChip } from '../../shared/ui/badge/status-chip';
import { DtStatusSummary, type StatusSummaryItem } from '../../shared/ui/cards/status-summary';
import { DtEmptyState } from '../../shared/ui/state/empty-state';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { selectOptionLabelFn } from '../../shared/utils/select-option-label';
import { OccupancySummary } from './components/occupancy-summary';
import { RoomEnergySummary } from './components/room-energy-summary';
import { RoomMaintenance } from './components/room-maintenance';
import { seedSmartRoom } from './smart-room-seeder';

const KIND_OPTIONS: SelectOption[] = [
  { value: 'office', label: 'Office' },
  { value: 'meeting-room', label: 'Meeting Room' },
  { value: 'common-area', label: 'Common Area' },
  { value: 'mechanical', label: 'Mechanical' },
  { value: 'retail', label: 'Retail' },
];

@Component({
  selector: 'app-floor-page',
  imports: [
    PageHeader,
    DtStatusChip,
    DtStatusSummary,
    DtEmptyState,
    RouterLink,
    OccupancySummary,
    RoomEnergySummary,
    RoomMaintenance,
    HasPermission,
    FormField,
    ...HlmButtonImports,
    ...HlmCardImports,
    ...HlmDialogImports,
    ...HlmInputImports,
    ...HlmSelectImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './floor-page.html',
})
export class FloorPage {
  readonly buildingId = input.required<string>();
  readonly floorId = input.required<string>();

  private readonly buildingService = inject(BuildingService);
  private readonly deviceService = inject(DeviceService);
  private readonly maintenanceService = inject(MaintenanceService);
  private readonly automationService = inject(AutomationService);
  private readonly router = inject(Router);

  protected readonly building = computed(() => this.buildingService.building(this.buildingId()));
  protected readonly floor = computed(() => this.buildingService.floor(this.floorId()));
  protected readonly spaces = computed(() => this.buildingService.spacesForFloor(this.floorId()));
  protected readonly devices = computed(() =>
    this.deviceService.devices().filter((d) => d.floorId === this.floorId()),
  );

  protected devicesForSpace(spaceId: string) {
    return this.devices().filter((d) => d.spaceId === spaceId);
  }

  protected readonly unassignedDevices = computed(() => this.devices().filter((d) => !d.spaceId));

  protected readonly deviceCount = computed(() => this.devices().length);
  protected readonly onlineDeviceCount = computed(
    () => this.devices().filter((d) => d.connectivity === 'online').length,
  );

  protected readonly connectivitySummary = computed<StatusSummaryItem[]>(() => {
    const breakdown = connectivityBreakdown(this.devices());
    return [
      { label: 'Online', count: breakdown.online, tone: 'success' },
      { label: 'Offline', count: breakdown.offline, tone: 'danger' },
      { label: 'Stale', count: breakdown.stale + breakdown.warning, tone: 'warning' },
      {
        label: 'Unknown',
        count: breakdown.unknown + breakdown.disabled + breakdown.error,
        tone: 'neutral',
      },
    ];
  });

  protected readonly floorMaintenance = computed(() =>
    this.maintenanceService.requests().filter((r) => r.floorId === this.floorId()),
  );

  protected readonly showAddSpace = signal(false);
  protected readonly submitting = signal(false);

  protected readonly identityModel = signal({ name: '' });
  protected readonly identityForm = form(this.identityModel, (p) => {
    required(p.name, { message: 'Space name is required' });
  });

  protected readonly kindOptions = KIND_OPTIONS;
  protected readonly kindLabel = selectOptionLabelFn(() => KIND_OPTIONS);
  protected readonly kind = signal<SpaceKind>('office');

  protected canSubmit(): boolean {
    return this.identityModel().name.trim().length > 0;
  }

  protected async createSmartRoom(): Promise<void> {
    if (!this.canSubmit()) return;
    this.submitting.set(true);
    try {
      const space = await this.buildingService.createSpace({
        name: this.identityModel().name.trim(),
        buildingId: this.buildingId(),
        floorId: this.floorId(),
        kind: this.kind(),
      });

      await seedSmartRoom(this.deviceService, this.automationService, space);

      this.showAddSpace.set(false);
      await this.router.navigate([
        '/buildings',
        space.buildingId,
        'floors',
        space.floorId,
        'spaces',
        space.id,
      ]);
    } finally {
      this.submitting.set(false);
    }
  }
}
