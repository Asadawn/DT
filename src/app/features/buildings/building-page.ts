import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  resource,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideClock,
  lucideCpu,
  lucideLayers,
  lucideLayoutGrid,
  lucideRadio,
  lucideWrench,
} from '@ng-icons/lucide';
import { BuildingService } from '../../domain/buildings/building.service';
import { DeviceCommandService } from '../../domain/devices/device-command.service';
import { connectivityBreakdown } from '../../domain/devices/device.fixtures';
import { DeviceService } from '../../domain/devices/device.service';
import type { Device } from '../../domain/devices/device.types';
import { LocationContextService } from '../../domain/locations/location-context.service';
import { MaintenanceService } from '../../domain/maintenance/maintenance.service';
import { OccupancySummary } from './components/occupancy-summary';
import { currentTimeRange } from '../../domain/telemetry/telemetry.service';
import { WeatherService } from '../../domain/weather/weather.service';
import { DtStatusChip } from '../../shared/ui/badge/status-chip';
import { DtKpiCard } from '../../shared/ui/cards/kpi-card';
import { DtStatusSummary, type StatusSummaryItem } from '../../shared/ui/cards/status-summary';
import { DtDeviceControlTile } from '../../shared/ui/device/device-control-tile';
import { DtDeviceTelemetryChart } from '../../shared/ui/device/device-telemetry-chart';
import { DtDeviceSensorTile } from '../../shared/ui/device/device-sensor-tile';
import { DtModelViewer, type ModelClickInfo } from '../../shared/ui/model-viewer/model-viewer';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { DtSearchInput } from '../../shared/ui/search-input/search-input';
import { DtEmptyState } from '../../shared/ui/state/empty-state';
import { DtSkeleton } from '../../shared/ui/state/skeleton';
import { DtTimeline, type TimelineEntry } from '../../shared/ui/timeline/timeline';
import { selectOptionLabelFn } from '../../shared/utils/select-option-label';
import { DtWeatherWidget } from '../../shared/ui/weather/weather-widget';
import { HlmAlertDialogImports } from '@spartan-ng/helm/alert-dialog';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmSelectImports } from '@spartan-ng/helm/select';

type ViewMode = 'ground' | 'floor' | 'control' | 'room';

interface SensorTileConfig {
  device: Device;
  metricKey: string;
}

const GROUND_MODEL_URL = '/assets/models/3d-models/Outer-2.glb';
const FLOOR_MODEL_URL = '/assets/models/3d-models/Without%20Furniture-4.glb';
const ROOM_MODEL_URL = '/assets/models/3d-models/Adeel%20Room%201.glb';
const ROOM_CAMERA_ORBIT = '20deg 60deg 1000m';
const ROOM_CAMERA_TARGET = '-15m 56m 0m';
const ROOM_MIN_CAMERA_ORBIT = 'auto auto 100m';
const ROOM_MAX_CAMERA_ORBIT = 'auto auto 1400m';
const DEFAULT_CAMERA_ORBIT = '45deg 67deg 10m';
const ROOF_MATERIAL_PATTERN = /roofing/i;
const ROOF_MIN_NORMAL_Y = 0.7;

function isInEndRoomFootprint(position: { x: number; y: number; z: number }): boolean {
  return position.z <= -114 && position.z >= -146 && position.x >= -13 && position.x <= 11;
}

@Component({
  selector: 'app-building-page',
  imports: [
    PageHeader,
    DtKpiCard,
    DtStatusSummary,
    DtStatusChip,
    DtEmptyState,
    DtSkeleton,
    DtModelViewer,
    DtDeviceSensorTile,
    DtDeviceControlTile,
    DtDeviceTelemetryChart,
    DtWeatherWidget,
    DtTimeline,
    DtSearchInput,
    OccupancySummary,
    RouterLink,
    NgIcon,
    ...HlmDialogImports,
    ...HlmAlertDialogImports,
    ...HlmSelectImports,
  ],
  providers: [
    provideIcons({
      lucideRadio,
      lucideClock,
      lucideLayers,
      lucideWrench,
      lucideCpu,
      lucideLayoutGrid,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './building-page.html',
})
export class BuildingPage {
  readonly buildingId = input.required<string>();

  private readonly buildingService = inject(BuildingService);
  private readonly deviceService = inject(DeviceService);
  private readonly maintenanceService = inject(MaintenanceService);
  private readonly locationContext = inject(LocationContextService);
  private readonly weatherService = inject(WeatherService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly commandService = inject(DeviceCommandService);

  protected readonly building = computed(() => this.buildingService.building(this.buildingId()));
  protected readonly floors = computed(() =>
    this.buildingService.floorsForBuilding(this.buildingId()),
  );
  protected readonly spaces = computed(() =>
    this.buildingService.spacesForBuilding(this.buildingId()),
  );

  protected readonly buildingOptions = computed(() =>
    this.buildingService.buildings().map((b) => ({ value: b.id, label: b.name })),
  );
  protected readonly buildingLabel = selectOptionLabelFn(this.buildingOptions);

  protected switchBuilding(buildingId: string): void {
    if (buildingId && buildingId !== this.buildingId()) {
      this.router.navigate(['/buildings', buildingId]);
    }
  }

  protected readonly devices = computed(() =>
    this.deviceService.devices().filter((d) => d.buildingId === this.buildingId()),
  );

  protected readonly maintenanceRequests = computed(() =>
    this.maintenanceService
      .requests()
      .filter(
        (r) => r.buildingId === this.buildingId() && !['closed', 'rejected'].includes(r.status),
      ),
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

  protected readonly energyTodayKwh = computed(() =>
    this.devices()
      .filter((d) => d.category === 'energy-meter')
      .reduce((sum, d) => {
        const prop = d.properties.find((p) => p.key === 'energy');
        return sum + (typeof prop?.value === 'number' ? prop.value : 0);
      }, 0),
  );

  protected readonly activePowerNowKw = computed(() =>
    this.devices()
      .filter((d) => d.category === 'energy-meter')
      .reduce((sum, d) => {
        const prop = d.properties.find((p) => p.key === 'activePower');
        return sum + (typeof prop?.value === 'number' ? prop.value : 0);
      }, 0),
  );

  protected readonly metersOnline = computed(() => {
    const meters = this.devices().filter((d) => d.category === 'energy-meter');
    return `${meters.filter((d) => d.connectivity === 'online').length}/${meters.length}`;
  });

  protected readonly viewMode = signal<ViewMode>('ground');
  protected readonly groundModelUrl = GROUND_MODEL_URL;
  protected readonly floorModelUrl = FLOOR_MODEL_URL;
  protected readonly roomModelUrl = ROOM_MODEL_URL;
  protected readonly roomCameraOrbit = ROOM_CAMERA_ORBIT;
  protected readonly roomCameraTarget = ROOM_CAMERA_TARGET;
  protected readonly roomMinCameraOrbit = ROOM_MIN_CAMERA_ORBIT;
  protected readonly roomMaxCameraOrbit = ROOM_MAX_CAMERA_ORBIT;
  protected readonly modelLoaded = signal(false);
  protected readonly roofMaterialPattern = ROOF_MATERIAL_PATTERN;
  protected readonly roofMinNormalY = ROOF_MIN_NORMAL_Y;
  protected readonly endRoomHoverTest = isInEndRoomFootprint;
  protected readonly roomEntryMode = signal<ViewMode>('floor');

  protected readonly capturedCameraOrbit = signal<string | null>(null);
  protected readonly floorCameraOrbit = computed(
    () => this.capturedCameraOrbit() ?? DEFAULT_CAMERA_ORBIT,
  );

  protected setViewMode(mode: ViewMode, cameraOrbit: string | null = null): void {
    if (mode !== this.viewMode()) this.modelLoaded.set(false);
    this.capturedCameraOrbit.set(cameraOrbit);
    this.viewMode.set(mode);
  }

  protected onGroundModelClicked(info: ModelClickInfo): void {
    if (!info.materialName || !ROOF_MATERIAL_PATTERN.test(info.materialName)) return;
    if (info.normalY === null || info.normalY < ROOF_MIN_NORMAL_Y) return;
    this.setViewMode('floor', info.cameraOrbit);
  }

  protected onFloorModelClicked(info: ModelClickInfo): void {
    if (!info.position || !isInEndRoomFootprint(info.position)) return;
    this.roomEntryMode.set('floor');
    this.setViewMode('room');
  }

  protected readonly sensorTiles = computed<SensorTileConfig[]>(() => {
    const devices = this.devices();
    const tiles: SensorTileConfig[] = [];

    const envDevice = devices.find(
      (d) => d.category === 'environment' || d.category === 'thermostat',
    );
    if (envDevice?.properties.some((p) => p.key === 'temperature')) {
      tiles.push({ device: envDevice, metricKey: 'temperature' });
    }
    if (envDevice?.properties.some((p) => p.key === 'humidity')) {
      tiles.push({ device: envDevice, metricKey: 'humidity' });
    }
    const gasDevice = devices.find((d) => d.category === 'gas');
    if (gasDevice) tiles.push({ device: gasDevice, metricKey: 'co2' });

    const aqiDevice = devices.find((d) => d.category === 'air-quality');
    if (aqiDevice) tiles.push({ device: aqiDevice, metricKey: 'aqi' });

    const motionDevice = devices.find((d) => d.category === 'motion');
    if (motionDevice) tiles.push({ device: motionDevice, metricKey: 'detections' });

    return tiles;
  });

  protected readonly selectedSensor = signal<SensorTileConfig | null>(null);
  protected readonly sensorRange = currentTimeRange('24h');

  protected openSensor(tile: SensorTileConfig): void {
    this.selectedSensor.set(tile);
  }

  protected readonly weather = resource({
    params: () => ({ buildingId: this.buildingId(), city: this.building()?.city ?? '' }),
    loader: ({ params }) => this.weatherService.getForecast(params.buildingId, params.city),
  });

  protected readonly activityFeed = computed<TimelineEntry[]>(() => {
    const deviceEvents: TimelineEntry[] = this.devices().map((d) => ({
      id: `device-${d.id}`,
      label: `${d.name} — ${d.connectivity}`,
      at: d.lastSeenAt,
    }));
    const maintenanceEvents: TimelineEntry[] = this.maintenanceService
      .requests()
      .filter((r) => r.buildingId === this.buildingId())
      .flatMap((r) =>
        r.timeline.map((t) => ({
          id: `${r.id}-${t.id}`,
          label: `${r.title}: ${t.label}`,
          at: t.at,
          actor: t.actor,
        })),
      );

    return [...deviceEvents, ...maintenanceEvents]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 8);
  });

  protected readonly spaceSearch = signal('');
  protected readonly filteredFloors = computed(() => {
    const search = this.spaceSearch().trim().toLowerCase();
    return this.floors()
      .map((floor) => ({
        floor,
        spaces: this.buildingService
          .spacesForFloor(floor.id)
          .filter((s) => !search || s.name.toLowerCase().includes(search)),
      }))
      .filter((entry) => !search || entry.spaces.length > 0);
  });

  protected openDevice(device: Device): void {
    this.router.navigate(['/devices', device.id]);
  }

  protected readonly emergencyDialogOpen = signal(false);
  protected readonly emergencyTriggered = signal(false);

  protected confirmEmergency(): void {
    this.emergencyDialogOpen.set(false);
    this.emergencyTriggered.set(true);
    const timeoutId = setTimeout(() => this.emergencyTriggered.set(false), 4000);
    this.destroyRef.onDestroy(() => clearTimeout(timeoutId));
  }

  constructor() {
    effect(() => {
      this.locationContext.selectBuilding(this.buildingId());
    });
  }
}
