import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideActivity,
  lucideCamera,
  lucideEye,
  lucideEyeOff,
  lucideLightbulb,
  lucideLock,
  lucidePanelRight,
  lucideThermometer,
  lucideX,
} from '@ng-icons/lucide';
import { HlmDrawerImports } from '@spartan-ng/helm/drawer';
import { mediaQuerySignal } from '../../shared/utils/media-query.signal';
import { BuildingService } from '../../domain/buildings/building.service';
import { DEVICE_CARD_ICON } from '../../domain/devices/device-registry';
import { DeviceService } from '../../domain/devices/device.service';
import type { Device } from '../../domain/devices/device.types';
import { motionEventsFor } from '../../domain/devices/motion-event.fixtures';
import type { DeviceCategory } from '../../shared/types/canonical.types';
import { DtModelViewer, type ModelClickInfo } from '../../shared/ui/model-viewer/model-viewer';
import { BuildingContextHeader } from './components/building-context-header';
import { ContextualDetailsPanel } from './components/contextual-details-panel';
import { WorkspaceBreadcrumb } from './components/workspace-breadcrumb';
import { WorkspaceCurrentReadings } from './components/workspace-current-readings';
import { WorkspaceStatusPanel } from './components/workspace-status-panel';
import { BuildingWorkspaceStateService } from './building-workspace-state.service';

type ModelView = 'ground' | 'floor' | 'room';

const GROUND_MODEL_URL = '/assets/models/3d-models/Outer-2.glb';
const FLOOR_MODEL_URL = '/assets/models/3d-models/Without%20Furniture-4.glb';
const ROOM_MODEL_URL = '/assets/models/3d-models/Adeel%20Room%201.glb';

const ROOM_CAMERA_ORBIT = '20deg 60deg 1000m';
const ROOM_CAMERA_TARGET = '-15m 58m 0m';
const ROOM_MIN_CAMERA_ORBIT = 'auto auto 100m';
const ROOM_MAX_CAMERA_ORBIT = 'auto auto 1400m';
const ROOF_MATERIAL_PATTERN = /roofing/i;
const ROOF_MIN_NORMAL_Y = 0.7;
const ROOF_MIN_WORLD_Y = 12;

const GROUND_FLOOR_CAMERA_ORBIT = '45deg 60deg 520m';
const GROUND_FLOOR_CAMERA_TARGET = '0m 2m 0m';
const GROUND_FLOOR_MIN_CAMERA_ORBIT = 'auto auto 200m';
const GROUND_FLOOR_MAX_CAMERA_ORBIT = 'auto auto 4000m';

interface RoomFootprint {
  spaceId: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

const ROOM_FOOTPRINTS: RoomFootprint[] = [
  { spaceId: 'b1-f2-s3', minX: -13, maxX: 11, minZ: -146, maxZ: -114 },
];

function roomFootprintAt(position: { x: number; y: number; z: number }): RoomFootprint | undefined {
  return ROOM_FOOTPRINTS.find(
    (r) =>
      position.x >= r.minX && position.x <= r.maxX && position.z >= r.minZ && position.z <= r.maxZ,
  );
}

function isInAnyRoomFootprint(position: { x: number; y: number; z: number }): boolean {
  return !!roomFootprintAt(position);
}

const END_ROOM_FLOOR_ID = 'b1-f2';
const END_ROOM_SPACE_ID = 'b1-f2-s3';

interface FloorPlanRoomMarker {
  spaceId: string;
  name: string;
  markerPosition: string;
}

const FLOOR_PLAN_ROOM_MARKERS: FloorPlanRoomMarker[] = [
  { spaceId: END_ROOM_SPACE_ID, name: 'Manager Room', markerPosition: '-6.9m 4m -130m' },
  { spaceId: 'b1-f2-s1', name: 'Open Office', markerPosition: '19.9m 4m -130.6m' },
  { spaceId: 'b1-f2-s2', name: 'Meeting Room', markerPosition: '-30m 4m -106m' },
];

interface RoomDeviceMarkerConfig {
  category: DeviceCategory;
  markerPosition: string;
}

const MANAGER_ROOM_DEVICE_MARKERS: RoomDeviceMarkerConfig[] = [
  { category: 'thermostat', markerPosition: '-3.15m 186.75m -100.66m' },
  { category: 'light-switch', markerPosition: '-137.3m 180.2m 30.6m' },
  { category: 'motion', markerPosition: '2.3m 97m -111.2m' },
  { category: 'camera', markerPosition: '-125.1m 170m 158.8m' },
  { category: 'lock', markerPosition: '135m 140m 158.8m' },
];

@Component({
  selector: 'app-building-workspace-page',
  imports: [
    NgTemplateOutlet,
    NgIcon,
    DtModelViewer,
    BuildingContextHeader,
    WorkspaceStatusPanel,
    WorkspaceBreadcrumb,
    WorkspaceCurrentReadings,
    ContextualDetailsPanel,
    ...HlmDrawerImports,
  ],
  providers: [
    provideIcons({
      lucideActivity,
      lucideCamera,
      lucideEye,
      lucideEyeOff,
      lucideLightbulb,
      lucideLock,
      lucidePanelRight,
      lucideThermometer,
      lucideX,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex h-full min-h-0 flex-col md:-m-5 md:h-[calc(100%+2.5rem)]' },
  templateUrl: './building-workspace-page.html',
  styleUrl: './building-workspace-page.scss',
})
export class BuildingWorkspacePage {
  protected readonly workspace = inject(BuildingWorkspaceStateService);
  private readonly buildingService = inject(BuildingService);
  private readonly deviceService = inject(DeviceService);

  readonly buildingId = input.required<string>();
  readonly floorId = input<string | undefined>(undefined);
  readonly spaceId = input<string | undefined>(undefined);

  protected readonly groundModelUrl = GROUND_MODEL_URL;
  protected readonly floorModelUrl = FLOOR_MODEL_URL;
  protected readonly roomModelUrl = ROOM_MODEL_URL;
  protected readonly roomCameraOrbit = ROOM_CAMERA_ORBIT;
  protected readonly roomCameraTarget = ROOM_CAMERA_TARGET;
  protected readonly roomMinCameraOrbit = ROOM_MIN_CAMERA_ORBIT;
  protected readonly roomMaxCameraOrbit = ROOM_MAX_CAMERA_ORBIT;
  protected readonly groundCameraOrbit = GROUND_FLOOR_CAMERA_ORBIT;
  protected readonly groundCameraTarget = GROUND_FLOOR_CAMERA_TARGET;
  protected readonly groundFloorMinCameraOrbit = GROUND_FLOOR_MIN_CAMERA_ORBIT;
  protected readonly groundFloorMaxCameraOrbit = GROUND_FLOOR_MAX_CAMERA_ORBIT;
  protected readonly roofMaterialPattern = ROOF_MATERIAL_PATTERN;
  protected readonly roofMinNormalY = ROOF_MIN_NORMAL_Y;
  protected readonly roofMinWorldY = ROOF_MIN_WORLD_Y;
  protected readonly endRoomHoverTest = isInAnyRoomFootprint;
  protected readonly showFloorPlanRoomMarkers = computed(() => this.buildingId() === 'b1');

  protected readonly floorPlanRoomMarkers = FLOOR_PLAN_ROOM_MARKERS;

  protected readonly roomDevices = computed(() =>
    this.deviceService.filtered({ spaceId: END_ROOM_SPACE_ID }),
  );

  protected readonly roomDeviceMarkers = computed(() => {
    const devices = this.roomDevices();
    return MANAGER_ROOM_DEVICE_MARKERS.map((config) => {
      const device = devices.find((d) => d.category === config.category);
      return device
        ? {
            ...config,
            device,
            icon: DEVICE_CARD_ICON[config.category],
            subtitle: this.markerSubtitle(device),
          }
        : null;
    }).filter((marker): marker is NonNullable<typeof marker> => marker !== null);
  });

  private markerSubtitle(device: Device): string {
    if (device.category === 'camera') {
      return device.connectivity === 'online' ? 'Online' : 'Offline';
    }
    if (device.category === 'lock') {
      const locked = device.properties.find((p) => p.key === 'locked')?.value;
      return locked ? 'Locked' : 'Unlocked';
    }
    if (device.category === 'motion') {
      const latest = motionEventsFor(device.id)[0];
      return latest?.state === 'detected' ? 'Detected' : 'Clear';
    }
    if (device.category === 'thermostat') {
      const temp = device.properties.find((p) => p.key === 'targetTemperature');
      return typeof temp?.value === 'number' ? `${temp.value}${temp.unit ?? ''}` : 'On';
    }
    const toggle = device.properties.find((p) => p.writable && p.valueType === 'boolean');
    return toggle?.value ? 'On' : 'Off';
  }

  protected readonly modelView = signal<ModelView>('ground');
  protected readonly modelLoaded = signal(false);
  protected readonly capturedCameraOrbit = signal<string | null>(null);
  protected readonly floorCameraOrbit = computed(
    () => this.capturedCameraOrbit() ?? GROUND_FLOOR_CAMERA_ORBIT,
  );

  protected readonly isCompact = mediaQuerySignal('(max-width: 1279px)', inject(DestroyRef));
  protected readonly openDrawer = signal<'status' | 'details' | null>(null);
  private hasSeenFirstRealSelection = false;

  constructor() {
    effect(() => {
      const sel = this.workspace.selectedObject();
      untracked(() => {
        if (!sel) return;
        if (!this.hasSeenFirstRealSelection) {
          this.hasSeenFirstRealSelection = true;
          return;
        }
        if (this.isCompact()) this.openDrawer.set('details');
      });
    });

    effect(() => {
      const id = this.buildingId();
      const floorId = this.floorId();
      const spaceId = this.spaceId();

      untracked(() => {
        this.workspace.resetForBuilding(id);
        this.setModelView('ground');

        if (spaceId && floorId) {
          this.workspace.enterSpace(floorId, spaceId);
        } else if (floorId) {
          this.workspace.enterFloor(floorId);
        }
      });
    });

    effect(() => {
      const sel = this.workspace.selectedObject();
      untracked(() => {
        if (sel?.type === 'device' || sel?.type === 'automation') return;
        if (sel?.type === 'space' && ROOM_FOOTPRINTS.some((r) => r.spaceId === sel.id)) {
          if (this.modelView() !== 'room') this.setModelView('room');
          return;
        }
        const onGroundFloor =
          (sel?.type === 'floor' && sel.id === END_ROOM_FLOOR_ID) ||
          (sel?.type === 'space' &&
            this.buildingService.space(sel.id)?.floorId === END_ROOM_FLOOR_ID);
        if (onGroundFloor) {
          if (this.modelView() !== 'floor') this.setModelView('floor');
        } else if (this.modelView() !== 'ground') {
          this.setModelView('ground');
        }
      });
    });
  }

  protected setModelView(mode: ModelView, cameraOrbit: string | null = null): void {
    if (mode !== this.modelView()) this.modelLoaded.set(false);
    this.capturedCameraOrbit.set(cameraOrbit);
    this.modelView.set(mode);
  }

  protected onGroundModelClicked(info: ModelClickInfo): void {
    if (!info.materialName || !ROOF_MATERIAL_PATTERN.test(info.materialName)) return;
    if (info.normalY === null || info.normalY < ROOF_MIN_NORMAL_Y) return;
    if (!info.position || info.position.y < ROOF_MIN_WORLD_Y) return;
    this.setModelView('floor', info.cameraOrbit);
  }

  protected onFloorModelClicked(info: ModelClickInfo): void {
    const room = info.position && roomFootprintAt(info.position);
    if (!room) return;
    this.setModelView('room');
    this.workspace.enterSpace(END_ROOM_FLOOR_ID, room.spaceId);
  }

  protected onDrawerClosed(which: 'status' | 'details'): void {
    if (this.openDrawer() === which) this.openDrawer.set(null);
  }
}
