import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideActivity,
  lucideAlertCircle,
  lucideBatteryMedium,
  lucideCalendarClock,
  lucideCamera,
  lucideDoorOpen,
  lucideDroplets,
  lucideFan,
  lucideFlame,
  lucideGauge,
  lucideHash,
  lucideHistory,
  lucideInfo,
  lucideKeyRound,
  lucideLamp,
  lucideLightbulb,
  lucideLock,
  lucideMapPin,
  lucidePlug,
  lucidePower,
  lucideScanFace,
  lucideSun,
  lucideThermometer,
  lucideToggleLeft,
  lucideUsers,
  lucideWaves,
  lucideWifi,
  lucideWind,
  lucideZap,
} from '@ng-icons/lucide';
import { DeviceCommandService } from '../../domain/devices/device-command.service';
import { DeviceEventService } from '../../domain/devices/device-event.service';
import type { DeviceEventType } from '../../domain/devices/device-event.types';
import {
  DEVICE_CARD_ICON,
  DEVICE_CATEGORY_CONFIG,
  PROPERTY_ICON,
} from '../../domain/devices/device-registry';
import { DeviceService } from '../../domain/devices/device.service';
import type { DeviceProperty } from '../../shared/types/canonical.types';
import type { BreadcrumbItem } from '../../shared/ui/page-header/page-header';
import { BuildingService } from '../../domain/buildings/building.service';
import { ScheduleService } from '../../domain/maintenance/schedule.service';
import { currentTimeRange } from '../../domain/telemetry/telemetry.service';
import { DtStatusChip } from '../../shared/ui/badge/status-chip';
import { HasPermission } from '../../shared/directives/has-permission.directive';
import { DtCameraPanel } from '../../shared/ui/device/camera-panel';
import { DtDeviceTelemetryChart } from '../../shared/ui/device/device-telemetry-chart';
import { DtEmptyState } from '../../shared/ui/state/empty-state';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { DtKpiCard } from '../../shared/ui/cards/kpi-card';
import { DtSectionShell } from '../../shared/ui/section/section-shell';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmSwitchImports } from '@spartan-ng/helm/switch';
import { HlmToggleGroupImports } from '@spartan-ng/helm/toggle-group';

interface RangeSegment {
  id: string;
  label: string;
}

const RANGE_SEGMENTS: RangeSegment[] = [
  { id: '6h', label: '6H' },
  { id: '24h', label: '24H' },
  { id: '7d', label: '7D' },
  { id: '30d', label: '30D' },
];

@Component({
  selector: 'app-device-page',
  imports: [
    PageHeader,
    DtDeviceTelemetryChart,
    DtCameraPanel,
    DtStatusChip,
    DtEmptyState,
    RouterLink,
    DatePipe,
    NgIcon,
    HasPermission,
    DtKpiCard,
    DtSectionShell,
    ...HlmToggleGroupImports,
    ...HlmCardImports,
    ...HlmSwitchImports,
  ],
  providers: [
    provideIcons({
      lucideInfo,
      lucideActivity,
      lucideToggleLeft,
      lucideHistory,
      lucideCalendarClock,
      lucideHash,
      lucideThermometer,
      lucideZap,
      lucideWind,
      lucideDoorOpen,
      lucideFlame,
      lucideDroplets,
      lucideLightbulb,
      lucideFan,
      lucidePlug,
      lucideLamp,
      lucideWifi,
      lucideScanFace,
      lucideWaves,
      lucideCamera,
      lucideLock,
      lucideGauge,
      lucideMapPin,
      lucideBatteryMedium,
      lucideAlertCircle,
      lucidePower,
      lucideSun,
      lucideUsers,
      lucideKeyRound,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './device-page.html',
})
export class DevicePage {
  readonly deviceId = input.required<string>();

  private readonly deviceService = inject(DeviceService);
  private readonly buildingService = inject(BuildingService);
  private readonly scheduleService = inject(ScheduleService);
  private readonly deviceEventService = inject(DeviceEventService);
  protected readonly commandService = inject(DeviceCommandService);

  protected readonly device = computed(() => this.deviceService.device(this.deviceId()));
  protected readonly categoryConfig = computed(() => {
    const device = this.device();
    return device ? DEVICE_CATEGORY_CONFIG[device.category] : undefined;
  });

  protected readonly building = computed(() =>
    this.buildingService.building(this.device()?.buildingId),
  );
  protected readonly floor = computed(() => this.buildingService.floor(this.device()?.floorId));
  protected readonly space = computed(() => this.buildingService.space(this.device()?.spaceId));

  protected readonly cardIcon = computed(() => {
    const device = this.device();
    return device ? DEVICE_CARD_ICON[device.category] : undefined;
  });

  protected readonly breadcrumb = computed<BreadcrumbItem[]>(() => {
    const crumbs: BreadcrumbItem[] = [{ label: 'Devices', link: '/devices' }];
    const building = this.building();
    if (!building) return crumbs;
    crumbs.push({ label: building.name, link: ['/buildings', building.id] });
    const floor = this.floor();
    if (!floor) return crumbs;
    crumbs.push({ label: floor.name, link: ['/buildings', building.id, 'floors', floor.id] });
    const space = this.space();
    if (space) {
      crumbs.push({
        label: space.name,
        link: ['/buildings', building.id, 'floors', floor.id, 'spaces', space.id],
      });
    }
    return crumbs;
  });

  protected readonly readOnlyProperties = computed(
    () => this.device()?.properties.filter((p) => !p.writable) ?? [],
  );

  protected propertyIcon(property: DeviceProperty): string {
    return PROPERTY_ICON[property.key] ?? this.cardIcon() ?? 'lucideGauge';
  }

  protected kpiValue(property: DeviceProperty): string | number {
    if (property.value === null) return '—';
    if (typeof property.value === 'boolean') return property.value ? 'On' : 'Off';
    return property.value;
  }

  protected readonly rangeId = signal('24h');
  protected readonly rangeSegments = RANGE_SEGMENTS;
  protected readonly range = computed(() =>
    currentTimeRange(this.rangeId() as '6h' | '24h' | '7d' | '30d'),
  );

  protected readonly schedulesForDevice = computed(() =>
    this.scheduleService.schedulesForDevice(this.deviceId()),
  );

  protected readonly events = computed(() => this.deviceEventService.eventsFor(this.deviceId()));

  protected eventDotClass(type: DeviceEventType): string {
    switch (type) {
      case 'online':
      case 'command-confirmed':
        return 'bg-emerald-500';
      case 'offline':
      case 'command-failed':
        return 'bg-red-500';
      case 'command-sent':
        return 'bg-amber-400';
    }
  }

  protected async toggleProperty(property: DeviceProperty, checked: boolean): Promise<void> {
    const device = this.device();
    if (!device || !property.writable) return;
    await this.commandService.sendCommand(device.id, property, checked);
  }

  protected booleanLabel(property: DeviceProperty): string {
    if (property.key === 'locked') return property.value ? 'Locked' : 'Unlocked';
    return property.value ? 'On' : 'Off';
  }

  protected atMin(property: DeviceProperty): boolean {
    return (
      typeof property.value === 'number' &&
      property.min !== undefined &&
      property.value <= property.min
    );
  }

  protected atMax(property: DeviceProperty): boolean {
    return (
      typeof property.value === 'number' &&
      property.max !== undefined &&
      property.value >= property.max
    );
  }

  protected async stepUp(property: DeviceProperty): Promise<void> {
    const device = this.device();
    if (!device || !property.writable) return;
    const current = typeof property.value === 'number' ? property.value : 0;
    const next = property.max !== undefined ? Math.min(current + 1, property.max) : current + 1;
    if (next === current) return;
    await this.commandService.sendCommand(device.id, property, next);
  }

  protected async stepDown(property: DeviceProperty): Promise<void> {
    const device = this.device();
    if (!device || !property.writable) return;
    const current = typeof property.value === 'number' ? property.value : 0;
    const floor = property.min ?? 0;
    const next = Math.max(current - 1, floor);
    if (next === current) return;
    await this.commandService.sendCommand(device.id, property, next);
  }
}
