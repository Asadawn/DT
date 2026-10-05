import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  resource,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { HlmCardImports } from '@spartan-ng/helm/card';
import {
  lucideAlertTriangle,
  lucideArrowDown,
  lucideArrowRight,
  lucideArrowUp,
  lucideCalendarClock,
  lucideCpu,
  lucideWorkflow,
  lucideWrench,
  lucideZap,
} from '@ng-icons/lucide';
import { BuildingService } from '../../../domain/buildings/building.service';
import { DeviceService } from '../../../domain/devices/device.service';
import { MaintenanceService } from '../../../domain/maintenance/maintenance.service';
import { currentTimeRange, TelemetryService } from '../../../domain/telemetry/telemetry.service';
import type { DeviceConnectivityStatus, LocationRef } from '../../../shared/types/canonical.types';
import { OccupancySummary } from '../../buildings/components/occupancy-summary';
import { RoomEnergySummary } from '../../buildings/components/room-energy-summary';
import { RoomOccupancySummary } from '../../buildings/components/room-occupancy-summary';
import { BuildingWorkspaceStateService } from '../building-workspace-state.service';

@Component({
  selector: 'app-workspace-status-panel',
  imports: [
    NgTemplateOutlet,
    RouterLink,
    NgIcon,
    ...HlmCardImports,
    OccupancySummary,
    RoomOccupancySummary,
    RoomEnergySummary,
  ],
  providers: [
    provideIcons({
      lucideAlertTriangle,
      lucideArrowDown,
      lucideArrowRight,
      lucideArrowUp,
      lucideCalendarClock,
      lucideCpu,
      lucideWorkflow,
      lucideWrench,
      lucideZap,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block p-3 pr-px' },
  templateUrl: './workspace-status-panel.html',
})
export class WorkspaceStatusPanel {
  private readonly buildingService = inject(BuildingService);
  private readonly deviceService = inject(DeviceService);
  private readonly maintenanceService = inject(MaintenanceService);
  private readonly telemetryService = inject(TelemetryService);
  protected readonly workspace = inject(BuildingWorkspaceStateService);

  readonly buildingId = input.required<string>();

  protected readonly scopeType = computed<'building' | 'floor' | 'space'>(() => {
    const ctx = this.workspace.spatialContext();
    if (ctx.spaceId) return 'space';
    if (ctx.floorId) return 'floor';
    return 'building';
  });

  protected readonly building = computed(() =>
    this.buildingService.building(this.workspace.activeBuildingId()),
  );
  protected readonly floor = computed(() => {
    const floorId = this.workspace.spatialContext().floorId;
    return floorId ? this.buildingService.floor(floorId) : undefined;
  });
  protected readonly space = computed(() => {
    const spaceId = this.workspace.spatialContext().spaceId;
    return spaceId ? this.buildingService.space(spaceId) : undefined;
  });

  protected readonly spacesOnFloor = computed(() => {
    const floor = this.floor();
    return floor ? this.buildingService.spacesForFloor(floor.id) : [];
  });
  protected readonly spacesForBuildingScope = computed(() => {
    const building = this.building();
    return building ? this.buildingService.spacesForBuilding(building.id) : [];
  });
  protected readonly spaceLocationRef = computed<LocationRef>(() => {
    const space = this.space();
    return space ? { buildingId: space.buildingId, floorId: space.floorId, spaceId: space.id } : {};
  });

  protected readonly scopedDevices = computed(() => {
    const scope = this.scopeType();
    if (scope === 'building') {
      const b = this.building();
      return b ? this.deviceService.filtered({ buildingId: b.id }) : [];
    }
    if (scope === 'floor') {
      const f = this.floor();
      return f ? this.deviceService.filtered({ buildingId: f.buildingId, floorId: f.id }) : [];
    }
    const s = this.space();
    return s ? this.deviceService.filtered({ buildingId: s.buildingId, spaceId: s.id }) : [];
  });

  protected readonly deviceCount = computed(() => this.scopedDevices().length);
  protected readonly onlineDeviceCount = computed(
    () => this.scopedDevices().filter((d) => d.connectivity === 'online').length,
  );
  protected readonly faultDeviceCount = computed(
    () =>
      this.scopedDevices().filter((d) => d.connectivity === 'error' || d.connectivity === 'offline')
        .length,
  );

  protected readonly offlineDeviceCount = computed(
    () => this.deviceCount() - this.onlineDeviceCount(),
  );

  protected readonly unassignedFloorDevices = computed(() =>
    this.scopedDevices().filter((d) => !d.spaceId),
  );

  protected connectivityLabel(status: DeviceConnectivityStatus): string {
    switch (status) {
      case 'online':
        return 'Online';
      case 'offline':
        return 'Offline';
      case 'stale':
        return 'Stale';
      case 'warning':
        return 'Warning';
      case 'error':
        return 'Error';
      case 'disabled':
        return 'Disabled';
      default:
        return 'Unknown';
    }
  }

  private readonly openMaintenanceRequests = computed(() => {
    const building = this.building();
    if (!building) return [];
    return this.maintenanceService
      .filtered({ buildingId: building.id })
      .filter((r) => !['closed', 'rejected'].includes(r.status));
  });
  protected readonly openMaintenanceCount = computed(() => this.openMaintenanceRequests().length);

  private readonly energyMeterDevice = computed(() =>
    this.scopedDevices().find((d) => d.category === 'energy-meter'),
  );
  private readonly energyMeteredDevices = computed(() =>
    this.scopedDevices().filter((d) => d.capabilities.energy && d.category !== 'energy-meter'),
  );
  protected readonly energyHasData = computed(
    () => !!this.energyMeterDevice() || this.energyMeteredDevices().length > 0,
  );

  protected readonly energyTotalKwh = computed(() => {
    const meter = this.energyMeterDevice();
    const energyOf = (deviceId: string, properties: { key: string; value: unknown }[]) => {
      const prop = properties.find((p) => p.key === 'energy');
      return typeof prop?.value === 'number' ? prop.value : 0;
    };
    if (meter) return Math.round(energyOf(meter.id, meter.properties) * 100) / 100;
    const sum = this.energyMeteredDevices().reduce(
      (total, d) => total + energyOf(d.id, d.properties),
      0,
    );
    return Math.round(sum * 100) / 100;
  });

  private readonly energyRepresentativeDeviceId = computed(
    () => this.energyMeterDevice()?.id ?? this.energyMeteredDevices()[0]?.id,
  );

  private readonly energySparkRange = currentTimeRange('7d');
  private readonly energyPreviousSparkRange = (() => {
    const to = new Date(this.energySparkRange.from);
    const from = new Date(to);
    from.setDate(from.getDate() - 7);
    return {
      from: from.toISOString(),
      to: to.toISOString(),
      timezone: this.energySparkRange.timezone,
      granularity: this.energySparkRange.granularity,
    };
  })();

  private readonly energySpark = resource({
    params: () => {
      const deviceId = this.energyRepresentativeDeviceId();
      return deviceId
        ? { deviceId, metric: 'activePower', range: this.energySparkRange }
        : undefined;
    },
    loader: ({ params }) =>
      params ? this.telemetryService.loadSeries(params) : Promise.resolve(undefined),
  });

  private readonly energyPreviousSpark = resource({
    params: () => {
      const deviceId = this.energyRepresentativeDeviceId();
      return deviceId
        ? { deviceId, metric: 'activePower', range: this.energyPreviousSparkRange }
        : undefined;
    },
    loader: ({ params }) =>
      params ? this.telemetryService.loadSeries(params) : Promise.resolve(undefined),
  });

  protected readonly energySparkValues = computed<number[]>(() =>
    (this.energySpark.value()?.series.points ?? []).map((p) => p.value ?? 0),
  );

  private static averageOf(points: { value: number | null }[] | undefined): number | null {
    const real = (points ?? []).map((p) => p.value).filter((v): v is number => v != null);
    return real.length > 0 ? real.reduce((sum, v) => sum + v, 0) / real.length : null;
  }

  protected readonly energyDeltaPercent = computed<number | null>(() => {
    const current = WorkspaceStatusPanel.averageOf(this.energySpark.value()?.series.points);
    const previous = WorkspaceStatusPanel.averageOf(
      this.energyPreviousSpark.value()?.series.points,
    );
    if (current === null || previous === null || previous === 0) return null;
    return Math.round(((current - previous) / previous) * 100);
  });

  private readonly energySparkMax = computed(() => Math.max(1, ...this.energySparkValues()));

  protected sparkHeight(value: number): number {
    return Math.max(6, Math.round((value / this.energySparkMax()) * 100));
  }
}
