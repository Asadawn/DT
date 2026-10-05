import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideRotateCcw } from '@ng-icons/lucide';
import { BuildingService } from '../../../domain/buildings/building.service';
import { BookingService } from '../../../domain/bookings/booking.service';
import { OccupancyService } from '../../../domain/occupancy/occupancy.service';
import { DEVICE_CATEGORY_CONFIG } from '../../../domain/devices/device-registry';
import { DeviceService } from '../../../domain/devices/device.service';
import { connectivityBreakdown } from '../../../domain/devices/device.fixtures';
import type {
  DeviceCategory,
  LocationRef,
  SelectOption,
} from '../../../shared/types/canonical.types';
import { currentTimeRange } from '../../../domain/telemetry/telemetry.service';
import { DtStatusSummary, type StatusSummaryItem } from '../../../shared/ui/cards/status-summary';
import { DtDeviceTelemetryChart } from '../../../shared/ui/device/device-telemetry-chart';
import { DtEmptyState } from '../../../shared/ui/state/empty-state';
import { selectOptionLabelFn } from '../../../shared/utils/select-option-label';
import { DtChartCard } from '../../../shared/ui/chart/chart-card';
import { DtBarChart } from '../../../shared/ui/chart/bar-chart';
import { DtGauge } from '../../../shared/ui/chart/gauge';
import { dashboardAccentColor } from '../../../shared/ui/chart/chart-colors';
import { ElectricalParametersGrid } from './electrical-parameters-grid';
import { EnvironmentalParametersGrid } from './environmental-parameters-grid';
import { AqiSensorParameters } from './aqi-sensor-parameters';
import { aqiBand } from '../aqi-band.util';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmToggleGroupImports } from '@spartan-ng/helm/toggle-group';

export type AnalyticsSection =
  'energy' | 'electrical' | 'environment' | 'aqi' | 'occupancy' | 'devices';

interface RangeSegment {
  id: string;
  label: string;
}

const SECTION_CONFIG: Record<
  Exclude<AnalyticsSection, 'devices' | 'occupancy'>,
  {
    label: string;
    category: DeviceCategory;
    extraCategories?: DeviceCategory[];
    description: string;
  }
> = {
  energy: { label: 'Energy', category: 'energy-meter', description: 'Consumption trends by meter' },
  electrical: {
    label: 'Electrical',
    category: 'energy-meter',
    description: 'Active power comparison across meters',
  },
  environment: {
    label: 'Environment',
    category: 'environment',
    extraCategories: ['thermostat'],
    description: 'Temperature and humidity trends',
  },
  aqi: { label: 'AQI', category: 'air-quality', description: 'Air quality index and particulates' },
};

const RANGE_SEGMENTS: RangeSegment[] = [
  { id: '6h', label: '6H' },
  { id: '24h', label: '24H' },
  { id: '7d', label: '7D' },
  { id: '30d', label: '30D' },
  { id: '6m', label: '6M' },
];

@Component({
  selector: 'app-analytics-section-panel',
  imports: [
    DtDeviceTelemetryChart,
    DtStatusSummary,
    DtEmptyState,
    DtChartCard,
    DtBarChart,
    DtGauge,
    ElectricalParametersGrid,
    EnvironmentalParametersGrid,
    AqiSensorParameters,
    NgIcon,
    ...HlmCardImports,
    ...HlmSelectImports,
    ...HlmToggleGroupImports,
  ],
  providers: [provideIcons({ lucideRotateCcw })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './analytics-section-panel.html',
})
export class AnalyticsSectionPanel {
  readonly section = input.required<AnalyticsSection>();
  readonly buildingId = model('');
  readonly buildingOptions = input<SelectOption[]>([]);
  readonly compact = input(false);

  private readonly deviceService = inject(DeviceService);
  private readonly buildingService = inject(BuildingService);
  private readonly bookingService = inject(BookingService);
  private readonly occupancyService = inject(OccupancyService);

  protected readonly buildingLabel = selectOptionLabelFn(this.buildingOptions);

  protected readonly floorOptions = computed<SelectOption[]>(() =>
    this.buildingId()
      ? this.buildingService
          .floorsForBuilding(this.buildingId())
          .map((f) => ({ value: f.id, label: f.name }))
      : [],
  );
  protected readonly floorLabel = selectOptionLabelFn(this.floorOptions);
  readonly floorId = model('');

  protected onBuildingChange(value: string | null | undefined): void {
    this.buildingId.set(value ?? '');
    this.floorId.set('');
    this.deviceId.set('');
  }

  protected onFloorChange(value: string | null | undefined): void {
    this.floorId.set(value ?? '');
    this.deviceId.set('');
  }

  protected readonly isDeviceHealth = computed(() => this.section() === 'devices');
  protected readonly isElectrical = computed(() => this.section() === 'electrical');
  protected readonly isOccupancy = computed(() => this.section() === 'occupancy');
  protected readonly sectionConfig = computed(() =>
    this.section() === 'devices' || this.section() === 'occupancy'
      ? undefined
      : SECTION_CONFIG[this.section() as Exclude<AnalyticsSection, 'devices' | 'occupancy'>],
  );
  protected readonly sectionLabel = computed(() => {
    if (this.isDeviceHealth()) return 'Device Health';
    if (this.isOccupancy()) return 'Occupancy';
    return this.sectionConfig()?.label ?? 'Device Health';
  });

  protected readonly occupancySpaces = computed(() => {
    const spaces = this.buildingId()
      ? this.buildingService.spacesForBuilding(this.buildingId())
      : this.buildingService
          .buildings()
          .flatMap((b) => this.buildingService.spacesForBuilding(b.id));
    return this.floorId() ? spaces.filter((s) => s.floorId === this.floorId()) : spaces;
  });
  protected readonly occupancyRollup = computed(() => {
    const readings = this.occupancySpaces().map((space) => {
      const location: LocationRef = {
        buildingId: space.buildingId,
        floorId: space.floorId,
        spaceId: space.id,
      };
      return this.occupancyService.reading(location);
    });
    return this.occupancyService.rollup(readings);
  });
  protected readonly occupancyStatusSummary = computed<StatusSummaryItem[]>(() => {
    const counts = this.occupancyRollup();
    return [
      { label: 'Occupied', count: counts.occupied, tone: 'success' },
      { label: 'Reserved', count: counts.reserved, tone: 'info' },
      { label: 'Vacant', count: counts.vacant, tone: 'neutral' },
    ];
  });
  private readonly occupancyDays = computed(() => {
    const days: string[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    return days;
  });
  protected readonly occupancyRateSeries = computed(() =>
    this.bookingService.occupancyRateSeries(this.buildingId(), this.occupancyDays()),
  );

  protected readonly candidateDevices = computed(() => {
    const config = this.sectionConfig();
    const devices = this.deviceService.devices();
    let scoped = this.buildingId()
      ? devices.filter((d) => d.buildingId === this.buildingId())
      : devices;
    if (this.floorId()) scoped = scoped.filter((d) => d.floorId === this.floorId());
    return config
      ? scoped.filter(
          (d) => d.category === config.category || config.extraCategories?.includes(d.category),
        )
      : scoped;
  });

  protected readonly deviceOptions = computed<SelectOption[]>(() =>
    this.candidateDevices().map((d) => ({
      value: d.id,
      label: `${d.name} — ${this.locationLabel(d)}`,
    })),
  );
  protected readonly deviceLabel = selectOptionLabelFn(this.deviceOptions);

  private locationLabel(device: { buildingId: string; floorId: string }): string {
    const building = this.buildingService.building(device.buildingId);
    const floor = this.buildingService.floor(device.floorId);
    return [building?.name, floor?.name].filter(Boolean).join(' / ');
  }
  protected readonly deviceId = signal('');

  protected readonly effectiveDeviceId = computed(
    () => this.deviceId() || this.candidateDevices()[0]?.id,
  );
  protected readonly effectiveDevice = computed(() =>
    this.deviceService.device(this.effectiveDeviceId()),
  );

  protected readonly metricOptions = computed<SelectOption[]>(() => {
    const config = this.sectionConfig();
    if (!config) return [];
    return DEVICE_CATEGORY_CONFIG[config.category].metrics.map((m) => ({
      value: m.key,
      label: m.label,
    }));
  });
  protected readonly metricLabel = selectOptionLabelFn(this.metricOptions);
  protected readonly metric = signal('');
  protected readonly effectiveMetric = computed(
    () => this.metric() || this.metricOptions()[0]?.value || '',
  );
  protected readonly chartTitle = computed(
    () => this.metricOptions().find((o) => o.value === this.effectiveMetric())?.label ?? '',
  );

  protected readonly rangeId = signal('24h');
  protected readonly rangeSegments = RANGE_SEGMENTS;
  protected readonly range = computed(() =>
    currentTimeRange(this.rangeId() as '6h' | '24h' | '7d' | '30d' | '6m'),
  );

  protected readonly hasActiveFilters = computed(
    () =>
      !!this.buildingId() ||
      !!this.floorId() ||
      !!this.deviceId() ||
      !!this.metric() ||
      this.rangeId() !== '24h',
  );

  protected resetFilters(): void {
    this.buildingId.set('');
    this.floorId.set('');
    this.deviceId.set('');
    this.metric.set('');
    this.rangeId.set('24h');
  }

  protected readonly connectivitySummary = computed<StatusSummaryItem[]>(() => {
    const breakdown = connectivityBreakdown(this.candidateDevices());
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

  protected readonly connectivityBarLabels = computed(() =>
    this.connectivitySummary().map((i) => i.label),
  );
  protected readonly connectivityBarValues = computed(() =>
    this.connectivitySummary().map((i) => i.count),
  );

  protected readonly energyByMeterLabels = computed(() =>
    this.candidateDevices().map((d) => d.name),
  );
  protected readonly energyByMeterValues = computed(() =>
    this.candidateDevices().map((d) => {
      const value = d.properties.find((p) => p.key === 'energy')?.value;
      return typeof value === 'number' ? value : 0;
    }),
  );

  protected readonly currentReadingValue = computed<number | null>(() => {
    const device = this.effectiveDevice();
    const property = device?.properties.find((p) => p.key === this.effectiveMetric());
    return typeof property?.value === 'number' ? property.value : null;
  });
  protected readonly currentReadingUnit = computed(
    () =>
      this.effectiveDevice()?.properties.find((p) => p.key === this.effectiveMetric())?.unit ?? '',
  );
  protected readonly gaugeRange = computed<{ min: number; max: number }>(() => {
    if (this.section() === 'aqi') return { min: 0, max: 150 };
    return { min: 50, max: 90 };
  });
  protected readonly gaugeColor = computed(() =>
    this.section() === 'aqi' && this.currentReadingValue() !== null
      ? aqiBand(this.currentReadingValue()!).color
      : dashboardAccentColor(),
  );
}
