import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  resource,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideActivity,
  lucideArrowDown,
  lucideArrowRight,
  lucideArrowUp,
  lucideBell,
  lucideBuilding2,
  lucideCalendarDays,
  lucideCpu,
  lucideLayers,
  lucideTriangleAlert,
  lucideUsers,
  lucideWrench,
  lucideZap,
} from '@ng-icons/lucide';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { BuildingService } from '../../domain/buildings/building.service';
import { connectivityBreakdown } from '../../domain/devices/device.fixtures';
import { DeviceService } from '../../domain/devices/device.service';
import type { DeviceCategory } from '../../shared/types/canonical.types';
import { LocationContextService } from '../../domain/locations/location-context.service';
import { MaintenanceService } from '../../domain/maintenance/maintenance.service';
import type { MaintenanceRequest } from '../../domain/maintenance/maintenance.types';
import { OccupancyService } from '../../domain/occupancy/occupancy.service';
import { currentTimeRange, TelemetryService } from '../../domain/telemetry/telemetry.service';
import { DtGauge } from '../../shared/ui/chart/gauge';
import { DtKpiCard, type KpiBarSegment } from '../../shared/ui/cards/kpi-card';
import { DtEmptyState } from '../../shared/ui/state/empty-state';
import type { SelectOption } from '../../shared/types/canonical.types';
import { selectOptionLabelFn } from '../../shared/utils/select-option-label';
import { toneClasses, type StatusTone } from '../../shared/utils/status-tone';
import { HlmSelectImports } from '@spartan-ng/helm/select';

type Severity = 'critical' | 'high' | 'medium';

const SEVERITY_LABEL: Record<Severity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
};
const SEVERITY_TONE: Record<Severity, StatusTone> = {
  critical: 'danger',
  high: 'warning',
  medium: 'info',
};
const SEVERITY_RANK: Record<Severity, number> = { critical: 0, high: 1, medium: 2 };

const MAX_VISIBLE_ATTENTION_ITEMS = 6;

const ENERGY_BUCKET: Partial<Record<DeviceCategory, 'HVAC' | 'Lighting' | 'Plug Loads'>> = {
  thermostat: 'HVAC',
  fan: 'HVAC',
  'light-switch': 'Lighting',
  lamp: 'Lighting',
  socket: 'Plug Loads',
};

const DATE_RANGE_OPTIONS: SelectOption[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
];

const MOCK_BUILDINGS_SPARK = [
  18, 20, 24, 22, 28, 26, 30, 34, 32, 38, 36, 40, 44, 42, 48, 46, 52, 50, 56, 60, 58, 64, 68, 66,
];
const MOCK_DEVICES_SPARK = [
  25, 28, 26, 30, 34, 32, 38, 36, 42, 46, 44, 48, 52, 50, 56, 54, 58, 62, 60, 64, 68, 66, 70, 68,
];
const MOCK_ALERTS_SPARK = [
  20, 22, 18, 24, 20, 26, 22, 28, 24, 30, 26, 22, 28, 24, 20, 26, 22, 28, 32, 28, 24, 30, 38, 46,
];

@Component({
  selector: 'app-dashboard-page',
  imports: [
    DtKpiCard,
    DtGauge,
    DtEmptyState,
    RouterLink,
    NgIcon,
    DecimalPipe,
    ...HlmCardImports,
    ...HlmSelectImports,
  ],
  providers: [
    provideIcons({
      lucideBuilding2,
      lucideCpu,
      lucideZap,
      lucideWrench,
      lucideLayers,
      lucideTriangleAlert,
      lucideActivity,
      lucideBell,
      lucideUsers,
      lucideArrowRight,
      lucideArrowUp,
      lucideArrowDown,
      lucideCalendarDays,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col lg:h-full lg:min-h-0' },
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
})
export class DashboardPage {
  protected readonly locationContext = inject(LocationContextService);
  private readonly buildingService = inject(BuildingService);
  private readonly deviceService = inject(DeviceService);
  private readonly maintenanceService = inject(MaintenanceService);
  private readonly occupancyService = inject(OccupancyService);
  private readonly telemetryService = inject(TelemetryService);

  protected readonly selectedBuilding = computed(() =>
    this.buildingService.building(this.locationContext.selectedBuildingId()),
  );

  protected readonly buildings = this.buildingService.buildings;
  protected readonly buildingOptions = computed<SelectOption[]>(() =>
    this.buildings().map((b) => ({ value: b.id, label: b.name })),
  );
  protected readonly buildingLabel = selectOptionLabelFn(this.buildingOptions);

  protected readonly selectedFloorId = signal('');
  protected readonly floorOptions = computed<SelectOption[]>(() => {
    const buildingId = this.locationContext.selectedBuildingId();
    if (!buildingId) return [];
    return this.buildingService
      .floorsForBuilding(buildingId)
      .map((f) => ({ value: f.id, label: f.name }));
  });
  protected readonly floorLabel = selectOptionLabelFn(this.floorOptions);

  protected readonly dateRangeOptions = DATE_RANGE_OPTIONS;
  protected readonly dateRangeLabel = selectOptionLabelFn(() => DATE_RANGE_OPTIONS);
  protected readonly selectedDateRange = signal('today');

  protected readonly gaugeColor = 'var(--dt-color-dashboard-accent)';

  protected readonly buildingsSparkMock = MOCK_BUILDINGS_SPARK;
  protected readonly devicesSparkMock = MOCK_DEVICES_SPARK;
  protected readonly alertsSparkMock = MOCK_ALERTS_SPARK;

  private readonly scopedDevices = computed(() => {
    const buildingId = this.locationContext.selectedBuildingId();
    const floorId = this.selectedFloorId();
    let devices = this.deviceService.devices();
    if (buildingId) devices = devices.filter((d) => d.buildingId === buildingId);
    if (floorId) devices = devices.filter((d) => d.floorId === floorId);
    return devices;
  });

  protected readonly deviceCount = computed(() => this.scopedDevices().length);

  private readonly scopedRequests = computed(() => {
    const buildingId = this.locationContext.selectedBuildingId();
    const floorId = this.selectedFloorId();
    let requests = this.maintenanceService.requests();
    if (buildingId) requests = requests.filter((r) => r.buildingId === buildingId);
    if (floorId) requests = requests.filter((r) => r.floorId === floorId);
    return requests;
  });

  private readonly openRequests = computed(() =>
    this.scopedRequests().filter((r) => !['closed', 'rejected'].includes(r.status)),
  );

  protected readonly openMaintenanceCount = computed(() => this.openRequests().length);

  protected readonly floors = computed(() => {
    const buildingId = this.locationContext.selectedBuildingId();
    return buildingId ? this.buildingService.floorsForBuilding(buildingId) : [];
  });

  protected readonly spaces = computed(() => {
    const buildingId = this.locationContext.selectedBuildingId();
    const floorId = this.selectedFloorId();
    const all = buildingId ? this.buildingService.spacesForBuilding(buildingId) : [];
    return floorId ? all.filter((s) => s.floorId === floorId) : all;
  });

  protected readonly connectivitySummary = computed(() => {
    const breakdown = connectivityBreakdown(this.scopedDevices());
    const online = breakdown.online;
    const offline = breakdown.offline;
    const fault = breakdown.error;
    const stale = breakdown.stale + breakdown.warning + breakdown.unknown + breakdown.disabled;
    const total = online + offline + fault + stale;
    return {
      total,
      items: [
        { label: 'Online', count: online, tone: 'success' as StatusTone },
        { label: 'Offline', count: offline, tone: 'warning' as StatusTone },
        { label: 'Fault', count: fault, tone: 'danger' as StatusTone },
        { label: 'Stale', count: stale, tone: 'neutral' as StatusTone },
      ],
    };
  });

  protected readonly onlinePercent = computed(() => {
    const devices = this.scopedDevices();
    if (devices.length === 0) return 0;
    return Math.round(
      (devices.filter((d) => d.connectivity === 'online').length / devices.length) * 100,
    );
  });

  protected readonly connectivityBarSegments = computed<KpiBarSegment[]>(() => {
    const { total, items } = this.connectivitySummary();
    if (total === 0) return [];
    const colors: Record<string, string> = {
      Online: 'bg-dashboard-accent',
      Offline: 'bg-dashboard-warning',
      Fault: 'bg-dashboard-danger',
      Stale: 'bg-dashboard-neutral',
    };
    return items.map((item) => ({
      value: (item.count / total) * 100,
      colorClass: colors[item.label],
    }));
  });

  private groupMaintenance(status: MaintenanceRequest['status'][]): number {
    return this.scopedRequests().filter((r) => status.includes(r.status)).length;
  }

  protected readonly maintenanceSummary = computed(() => ({
    open: this.groupMaintenance(['created', 'triage']),
    inProgress: this.groupMaintenance(['assigned', 'in-progress']),
    pending: this.groupMaintenance(['complete', 'verify']),
    completed: this.groupMaintenance(['closed', 'rejected']),
    total: this.scopedRequests().length,
  }));

  protected readonly highPriorityCount = computed(
    () =>
      this.openRequests().filter((r) => r.priority === 'urgent' || r.priority === 'high').length,
  );

  protected readonly criticalCount = computed(
    () =>
      this.openRequests().filter((r) => r.priority === 'urgent').length +
      this.scopedDevices().filter((d) => d.connectivity === 'error' || d.connectivity === 'offline')
        .length,
  );

  protected readonly warningCount = computed(
    () =>
      this.openRequests().filter((r) => r.priority === 'high').length +
      this.scopedDevices().filter((d) => d.connectivity === 'warning').length,
  );

  protected readonly needsAttentionCount = computed(
    () =>
      this.scopedDevices().filter((d) => d.connectivity === 'stale' || d.connectivity === 'unknown')
        .length + this.openRequests().filter((r) => r.status === 'verify').length,
  );

  protected readonly deviceAlertsCount = computed(
    () => this.criticalCount() + this.warningCount() + this.needsAttentionCount(),
  );

  protected readonly energyMeters = computed(() =>
    this.scopedDevices().filter((d) => d.category === 'energy-meter'),
  );

  protected readonly energyTodayKwh = computed(() =>
    this.energyMeters().reduce((sum, d) => {
      const energyProp = d.properties.find((p) => p.key === 'energy');
      return sum + (typeof energyProp?.value === 'number' ? energyProp.value : 0);
    }, 0),
  );

  protected readonly representativeMeterId = computed(() => this.energyMeters()[0]?.id);

  private readonly sparkRange = currentTimeRange('12h');
  private readonly previousSparkRange = (() => {
    const to = new Date(this.sparkRange.from);
    const from = new Date(to);
    from.setHours(from.getHours() - 12);
    return {
      from: from.toISOString(),
      to: to.toISOString(),
      timezone: this.sparkRange.timezone,
      granularity: this.sparkRange.granularity,
    };
  })();

  protected readonly energySpark = resource({
    params: () => {
      const deviceId = this.representativeMeterId();
      return deviceId ? { deviceId, metric: 'activePower', range: this.sparkRange } : undefined;
    },
    loader: ({ params }) =>
      params ? this.telemetryService.loadSeries(params) : Promise.resolve(undefined),
  });

  private readonly previousEnergySpark = resource({
    params: () => {
      const deviceId = this.representativeMeterId();
      return deviceId
        ? { deviceId, metric: 'activePower', range: this.previousSparkRange }
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
    const current = DashboardPage.averageOf(this.energySpark.value()?.series.points);
    const previous = DashboardPage.averageOf(this.previousEnergySpark.value()?.series.points);
    if (current === null || previous === null || previous === 0) return null;
    return Math.round(((current - previous) / previous) * 100);
  });

  protected readonly energyBreakdown = computed(() => {
    const buckets: Record<string, number> = { HVAC: 0, Lighting: 0, 'Plug Loads': 0, Other: 0 };
    for (const device of this.scopedDevices()) {
      if (!device.capabilities.energy || device.category === 'energy-meter') continue;
      const energyProp = device.properties.find((p) => p.key === 'energy');
      if (typeof energyProp?.value !== 'number') continue;
      const bucket = ENERGY_BUCKET[device.category] ?? 'Other';
      buckets[bucket] += energyProp.value;
    }
    const total = Object.values(buckets).reduce((sum, v) => sum + v, 0);
    return Object.entries(buckets)
      .map(([label, value]) => ({
        label,
        value,
        percent: total > 0 ? Math.round((value / total) * 100) : 0,
      }))
      .filter((b) => b.value > 0)
      .sort((a, b) => b.value - a.value);
  });

  protected readonly occupancyRollup = computed(() => {
    const readings = this.spaces().map((space) =>
      this.occupancyService.reading({
        buildingId: space.buildingId,
        floorId: space.floorId,
        spaceId: space.id,
      }),
    );
    return this.occupancyService.rollup(readings);
  });

  protected readonly occupiedPercent = computed(() => {
    const { occupied, total } = this.occupancyRollup();
    return total > 0 ? Math.round((occupied / total) * 100) : 0;
  });

  protected readonly meetingRoomsInUse = computed(
    () =>
      this.spaces().filter(
        (s) =>
          s.kind === 'meeting-room' &&
          this.occupancyService.reading({
            buildingId: s.buildingId,
            floorId: s.floorId,
            spaceId: s.id,
          }).status === 'occupied',
      ).length,
  );

  protected readonly meetingRoomsAvailable = computed(
    () =>
      this.spaces().filter(
        (s) =>
          s.kind === 'meeting-room' &&
          this.occupancyService.reading({
            buildingId: s.buildingId,
            floorId: s.floorId,
            spaceId: s.id,
          }).status === 'vacant',
      ).length,
  );

  private buildingNameFor(buildingId: string): string {
    return this.buildingService.building(buildingId)?.name ?? '';
  }

  private floorNameFor(buildingId: string, floorId: string | undefined): string | undefined {
    if (!floorId) return undefined;
    return this.buildingService.floorsForBuilding(buildingId).find((f) => f.id === floorId)?.name;
  }

  protected readonly attentionItems = computed(() => {
    const urgentMaintenance = this.openRequests()
      .filter((r) => r.priority === 'urgent' || r.priority === 'high')
      .map((r) => {
        const severity: Severity = r.priority === 'urgent' ? 'critical' : 'high';
        const floor = this.floorNameFor(r.buildingId, r.floorId);
        return {
          id: `m-${r.id}`,
          label: r.title,
          location: [floor, this.buildingNameFor(r.buildingId)].filter(Boolean).join(' - '),
          severity,
          link: ['/operations/maintenance', r.id],
        };
      });

    const problemDevices = this.scopedDevices()
      .filter(
        (d) =>
          d.connectivity === 'offline' ||
          d.connectivity === 'warning' ||
          d.connectivity === 'error',
      )
      .map((d) => {
        const severity: Severity = d.connectivity === 'warning' ? 'medium' : 'critical';
        const floor = this.floorNameFor(d.buildingId, d.floorId);
        return {
          id: `d-${d.id}`,
          label: d.name,
          location: [floor, this.buildingNameFor(d.buildingId)].filter(Boolean).join(' - '),
          severity,
          link: ['/devices', d.id],
        };
      });

    return [...urgentMaintenance, ...problemDevices];
  });

  protected readonly visibleAttentionItems = computed(() =>
    [...this.attentionItems()]
      .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])
      .slice(0, MAX_VISIBLE_ATTENTION_ITEMS),
  );

  protected severityLabel(severity: Severity): string {
    return SEVERITY_LABEL[severity];
  }

  protected severityToneClass(severity: Severity): string {
    return toneClasses(SEVERITY_TONE[severity]);
  }

  protected severityDotClass(severity: Severity): string {
    return {
      critical: 'bg-dashboard-danger',
      high: 'bg-dashboard-warning',
      medium: 'bg-dashboard-warning-soft',
    }[severity];
  }

  protected selectBuilding(buildingId: string): void {
    this.selectedFloorId.set('');
    this.locationContext.selectBuilding(buildingId);
  }
}
