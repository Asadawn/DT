import { DatePipe } from '@angular/common';
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
import {
  lucideArrowDown,
  lucideArrowUp,
  lucideCamera,
  lucideDoorOpen,
  lucideDroplets,
  lucideFan,
  lucideFlame,
  lucideGauge,
  lucideLamp,
  lucideLightbulb,
  lucideLock,
  lucidePlug,
  lucideScanFace,
  lucideThermometer,
  lucideWaves,
  lucideWifi,
  lucideWind,
  lucideZap,
} from '@ng-icons/lucide';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { DEVICE_CARD_ICON } from '../../../domain/devices/device-registry';
import type { Device } from '../../../domain/devices/device.types';
import { currentTimeRange, TelemetryService } from '../../../domain/telemetry/telemetry.service';
import type { DeviceCategory } from '../../../shared/types/canonical.types';

type EnergyState = 'metered' | 'partial' | 'unavailable';

@Component({
  selector: 'app-room-energy-summary',
  imports: [DatePipe, RouterLink, NgIcon, ...HlmCardImports],
  providers: [
    provideIcons({
      lucideArrowDown,
      lucideArrowUp,
      lucideZap,
      lucideCamera,
      lucideDoorOpen,
      lucideDroplets,
      lucideFan,
      lucideFlame,
      lucideGauge,
      lucideLamp,
      lucideLightbulb,
      lucideLock,
      lucidePlug,
      lucideScanFace,
      lucideThermometer,
      lucideWaves,
      lucideWifi,
      lucideWind,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block h-full' },
  templateUrl: './room-energy-summary.html',
})
export class RoomEnergySummary {
  readonly devices = input.required<Device[]>();
  readonly scopeLabel = input<'room' | 'floor' | 'building'>('room');
  readonly compact = input(false);

  private readonly telemetryService = inject(TelemetryService);

  protected readonly heading = computed(() => {
    const scope = this.scopeLabel();
    if (scope === 'floor') return 'Floor Energy';
    if (scope === 'building') return 'Building Energy';
    return 'Room Energy';
  });

  protected readonly emptyStatePhrase = computed(() => {
    const scope = this.scopeLabel();
    if (scope === 'floor') return 'on this floor';
    if (scope === 'building') return 'in this building';
    return 'in this room';
  });

  protected readonly roomMeter = computed(() =>
    this.devices().find((d) => d.category === 'energy-meter'),
  );

  protected readonly meteredDevices = computed(() =>
    this.devices().filter(
      (d) => d.capabilities.energy && d.properties.some((p) => p.key === 'energy'),
    ),
  );

  protected readonly state = computed<EnergyState>(() => {
    if (this.roomMeter()) return 'metered';
    if (this.meteredDevices().length > 0) return 'partial';
    return 'unavailable';
  });

  protected readonly total = computed<number | null>(() => {
    if (this.state() === 'metered') {
      const value = this.roomMeter()!.properties.find((p) => p.key === 'energy')?.value;
      return typeof value === 'number' ? value : null;
    }
    if (this.state() === 'partial') {
      const sum = this.meteredDevices().reduce((acc, d) => {
        const value = d.properties.find((p) => p.key === 'energy')?.value;
        return acc + (typeof value === 'number' ? value : 0);
      }, 0);
      return Math.round(sum * 100) / 100;
    }
    return null;
  });

  protected readonly deviceNames = computed(() =>
    this.meteredDevices()
      .map((d) => d.name)
      .join(', '),
  );

  protected readonly individuallyMeteredDevices = computed(() =>
    this.meteredDevices().filter((d) => d.category !== 'energy-meter'),
  );

  protected readonly breakdown = computed(() => {
    const state = this.state();
    if (state !== 'partial' && state !== 'metered') return [];
    const list = state === 'metered' ? this.individuallyMeteredDevices() : this.meteredDevices();
    const values = list.map((d) => {
      const onProperty = d.properties.find((p) => p.key === 'on');
      return {
        name: d.name,
        category: d.category,
        value: (d.properties.find((p) => p.key === 'energy')?.value as number | undefined) ?? 0,
        on: onProperty ? onProperty.value === true : true,
      };
    });
    const max = Math.max(...values.map((v) => v.value), 0.0001);
    return values.map((v) => ({ ...v, percent: (v.value / max) * 100 }));
  });

  protected deviceIcon(category: DeviceCategory): string {
    return DEVICE_CARD_ICON[category];
  }

  protected readonly representativeDevice = computed(
    () => this.roomMeter() ?? this.meteredDevices()[0],
  );
  protected readonly isLive = computed(
    () => this.representativeDevice()?.connectivity === 'online',
  );
  protected readonly lastSeenAt = computed(() => this.representativeDevice()?.lastSeenAt);

  private readonly energyRepresentativeDeviceId = computed(() => this.representativeDevice()?.id);

  private readonly energyRange = currentTimeRange('24h');
  private readonly previousEnergyRange = (() => {
    const to = new Date(this.energyRange.from);
    const from = new Date(to);
    from.setHours(from.getHours() - 24);
    return {
      from: from.toISOString(),
      to: to.toISOString(),
      timezone: this.energyRange.timezone,
      granularity: this.energyRange.granularity,
    };
  })();

  private readonly energySeries = resource({
    params: () => {
      const deviceId = this.energyRepresentativeDeviceId();
      return deviceId ? { deviceId, metric: 'activePower', range: this.energyRange } : undefined;
    },
    loader: ({ params }) =>
      params ? this.telemetryService.loadSeries(params) : Promise.resolve(undefined),
  });

  private readonly previousEnergySeries = resource({
    params: () => {
      const deviceId = this.energyRepresentativeDeviceId();
      return deviceId
        ? { deviceId, metric: 'activePower', range: this.previousEnergyRange }
        : undefined;
    },
    loader: ({ params }) =>
      params ? this.telemetryService.loadSeries(params) : Promise.resolve(undefined),
  });

  private static averageOf(points: { value: number | null }[] | undefined): number | null {
    const real = (points ?? []).map((p) => p.value).filter((v): v is number => v != null);
    return real.length > 0 ? real.reduce((sum, v) => sum + v, 0) / real.length : null;
  }

  protected readonly deltaPercent = computed<number | null>(() => {
    const current = RoomEnergySummary.averageOf(this.energySeries.value()?.series.points);
    const previous = RoomEnergySummary.averageOf(this.previousEnergySeries.value()?.series.points);
    if (current === null || previous === null || previous === 0) return null;
    return Math.round(((current - previous) / previous) * 100);
  });
}
