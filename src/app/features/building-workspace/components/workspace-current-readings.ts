import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideClock,
  lucideDroplets,
  lucideThermometer,
  lucideWind,
  lucideZap,
} from '@ng-icons/lucide';
import { HlmCardImports } from '@spartan-ng/helm/card';
import type { Device } from '../../../domain/devices/device.types';
import type { DevicePropertyQuality } from '../../../shared/types/canonical.types';

interface ReadingTile {
  key: string;
  label: string;
  icon: string;
  value: number | null;
  unit: string;
  sourceName: string | null;
  quality: DevicePropertyQuality | null;
  updatedAt: string | null;
}

@Component({
  selector: 'app-workspace-current-readings',
  imports: [DatePipe, NgIcon, ...HlmCardImports],
  providers: [
    provideIcons({ lucideClock, lucideDroplets, lucideThermometer, lucideWind, lucideZap }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div hlmCard size="sm">
      <div hlmCardContent>
        <div class="mb-2 flex items-center justify-between">
          <h2 class="text-xs">Current Readings</h2>
          @if (latestUpdatedAt(); as time) {
            <span class="text-muted-foreground flex items-center gap-1 text-[10px]">
              <ng-icon name="lucideClock" size="10" />
              {{ time | date: 'shortTime' }}
            </span>
          }
        </div>
        <div class="divide-border flex divide-x">
          @for (tile of tiles(); track tile.key) {
            <div class="flex flex-1 items-center gap-3 px-4 first:pl-0 last:pr-0">
              <span
                class="bg-dashboard-accent/10 text-dashboard-accent flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              >
                <ng-icon [name]="tile.icon" size="15" />
              </span>
              <div class="min-w-0 flex-1">
                <div class="text-muted-foreground text-[11px]">{{ tile.label }}</div>
                @if (tile.value !== null) {
                  <span class="flex items-baseline gap-1" [title]="qualityLabel(tile.quality)">
                    <span class="text-base font-semibold">{{ tile.value }}</span>
                    @if (tile.unit) {
                      <span class="text-muted-foreground text-xs">{{ tile.unit }}</span>
                    }
                  </span>
                } @else {
                  <p class="text-muted-foreground text-xs">Not available</p>
                }
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class WorkspaceCurrentReadings {
  readonly devices = input.required<Device[]>();

  protected readonly tiles = computed<ReadingTile[]>(() => {
    const devices = this.devices();
    return [
      this.tileFor(
        'temperature',
        'Temperature',
        'lucideThermometer',
        devices,
        (d) => d.category === 'environment' || d.category === 'thermostat',
      ),
      this.tileFor(
        'humidity',
        'Humidity',
        'lucideDroplets',
        devices,
        (d) => d.category === 'environment' || d.category === 'thermostat',
      ),
      this.tileFor(
        'aqi',
        'Air Quality',
        'lucideWind',
        devices,
        (d) => d.category === 'air-quality',
      ),
      this.energyTile(devices),
    ];
  });

  protected readonly latestUpdatedAt = computed<string | null>(() => {
    const timestamps = this.tiles()
      .map((t) => t.updatedAt)
      .filter((v): v is string => !!v)
      .sort();
    return timestamps.at(-1) ?? null;
  });

  private tileFor(
    key: string,
    label: string,
    icon: string,
    devices: Device[],
    matchesCategory: (d: Device) => boolean,
  ): ReadingTile {
    const candidates = devices.filter(matchesCategory);
    const withValue = candidates.find(
      (d) => d.properties.find((p) => p.key === key)?.value != null,
    );
    const device = withValue ?? candidates[0];
    const property = device?.properties.find((p) => p.key === key);
    return {
      key,
      label,
      icon,
      value: typeof property?.value === 'number' ? property.value : null,
      unit: property?.unit ?? '',
      sourceName: device?.name ?? null,
      quality: property?.quality ?? null,
      updatedAt: property?.updatedAt ?? null,
    };
  }

  private energyTile(devices: Device[]): ReadingTile {
    const meter = devices.find((d) => d.category === 'energy-meter');
    if (meter) {
      const property = meter.properties.find((p) => p.key === 'energy');
      return {
        key: 'energy',
        label: 'Energy Usage',
        icon: 'lucideZap',
        value: typeof property?.value === 'number' ? property.value : null,
        unit: property?.unit ?? 'kWh',
        sourceName: meter.name,
        quality: property?.quality ?? null,
        updatedAt: property?.updatedAt ?? null,
      };
    }
    const metered = devices.filter(
      (d) => d.capabilities.energy && d.properties.some((p) => p.key === 'energy'),
    );
    if (metered.length === 0) {
      return {
        key: 'energy',
        label: 'Energy Usage',
        icon: 'lucideZap',
        value: null,
        unit: 'kWh',
        sourceName: null,
        quality: null,
        updatedAt: null,
      };
    }
    const sum = metered.reduce((acc, d) => {
      const value = d.properties.find((p) => p.key === 'energy')?.value;
      return acc + (typeof value === 'number' ? value : 0);
    }, 0);
    const latestUpdatedAt = metered
      .map((d) => d.properties.find((p) => p.key === 'energy')?.updatedAt)
      .filter((v): v is string => !!v)
      .sort()
      .at(-1);
    return {
      key: 'energy',
      label: 'Energy Usage',
      icon: 'lucideZap',
      value: Math.round(sum * 100) / 100,
      unit: 'kWh',
      sourceName: `${metered.length} device${metered.length === 1 ? '' : 's'}`,
      quality: null,
      updatedAt: latestUpdatedAt ?? null,
    };
  }

  protected qualityLabel(quality: DevicePropertyQuality | null): string {
    switch (quality) {
      case 'good':
        return 'Live';
      case 'stale':
        return 'Stale';
      case 'bad':
        return 'Bad reading';
      case 'unknown':
        return 'Unknown quality';
      default:
        return 'Live';
    }
  }
}
