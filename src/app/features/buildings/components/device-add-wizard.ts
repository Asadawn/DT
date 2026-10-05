import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { required, form, FormField } from '@angular/forms/signals';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { BuildingService } from '../../../domain/buildings/building.service';
import { DEVICE_CATEGORY_CONFIG } from '../../../domain/devices/device-registry';
import { DeviceService } from '../../../domain/devices/device.service';
import type { Device, NewDeviceInput } from '../../../domain/devices/device.types';
import type {
  DeviceCapabilities,
  DeviceCategory,
  SelectOption,
} from '../../../shared/types/canonical.types';
import { selectOptionLabelFn } from '../../../shared/utils/select-option-label';
import { simulateLatency } from '../../../shared/utils/simulate-latency';

interface IdentityModel {
  name: string;
  externalId: string;
}

type VerifyOutcome = 'idle' | 'checking' | 'success' | 'failed' | 'deferred';

const STEP_TITLES = ['Identity', 'Capabilities', 'Location', 'Connectivity', 'Confirmation'];

const CAPABILITY_LABELS: Record<keyof DeviceCapabilities, string> = {
  telemetry: 'Telemetry (reports data)',
  commands: 'Commands (controllable)',
  scheduling: 'Scheduling',
  thresholds: 'Threshold alerts',
  battery: 'Battery-powered',
  signal: 'Signal strength reporting',
  environment: 'Environmental metrics',
  energy: 'Energy metering',
  occupancy: 'Occupancy detection',
};

const CAPABILITY_DEFAULTS: Record<Exclude<DeviceCategory, 'unknown'>, DeviceCapabilities> = {
  environment: {
    telemetry: true,
    commands: false,
    scheduling: false,
    thresholds: true,
    environment: true,
  },
  thermostat: {
    telemetry: true,
    commands: true,
    scheduling: false,
    thresholds: true,
    environment: true,
  },
  'energy-meter': {
    telemetry: true,
    commands: false,
    scheduling: false,
    thresholds: false,
    energy: true,
  },
  gas: { telemetry: true, commands: false, scheduling: false, thresholds: true },
  'air-quality': {
    telemetry: true,
    commands: false,
    scheduling: false,
    thresholds: true,
    environment: true,
  },
  motion: {
    telemetry: true,
    commands: false,
    scheduling: false,
    thresholds: false,
    battery: true,
    signal: true,
  },
  contact: {
    telemetry: true,
    commands: false,
    scheduling: false,
    thresholds: false,
    battery: true,
  },
  smoke: { telemetry: true, commands: false, scheduling: false, thresholds: true, battery: true },
  'water-leak': {
    telemetry: true,
    commands: false,
    scheduling: false,
    thresholds: false,
    battery: true,
  },
  'light-switch': { telemetry: false, commands: true, scheduling: true, thresholds: false },
  fan: { telemetry: false, commands: true, scheduling: true, thresholds: false },
  socket: { telemetry: false, commands: true, scheduling: true, thresholds: false },
  lamp: { telemetry: false, commands: true, scheduling: true, thresholds: false },
  'gateway-hub': { telemetry: true, commands: false, scheduling: false, thresholds: false },
  presence: {
    telemetry: true,
    commands: false,
    scheduling: false,
    thresholds: false,
    battery: true,
    occupancy: true,
  },
  'flow-meter': { telemetry: true, commands: false, scheduling: false, thresholds: false },
  camera: { telemetry: true, commands: true, scheduling: false, thresholds: false },
  lock: { telemetry: true, commands: true, scheduling: false, thresholds: false, battery: true },
  'generic-sensor': { telemetry: true, commands: false, scheduling: false, thresholds: false },
  'generic-actuator': { telemetry: false, commands: true, scheduling: false, thresholds: false },
};

@Component({
  selector: 'app-device-add-wizard',
  imports: [
    FormField,
    ...HlmInputImports,
    ...HlmSelectImports,
    ...HlmCheckboxImports,
    ...HlmButtonImports,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './device-add-wizard.html',
})
export class DeviceAddWizard {
  readonly buildingId = input.required<string>();
  readonly floorId = input.required<string>();
  readonly spaceId = input.required<string>();

  readonly created = output<Device>();
  readonly cancelled = output<void>();

  private readonly buildingService = inject(BuildingService);
  private readonly deviceService = inject(DeviceService);

  protected readonly stepTitles = STEP_TITLES;
  protected readonly step = signal(1);

  protected readonly building = computed(() => this.buildingService.building(this.buildingId()));
  protected readonly floor = computed(() => this.buildingService.floor(this.floorId()));
  protected readonly space = computed(() => this.buildingService.space(this.spaceId()));

  protected readonly categoryOptions: SelectOption[] = Object.entries(DEVICE_CATEGORY_CONFIG)
    .filter(([value]) => value !== 'unknown')
    .map(([value, config]) => ({ value, label: config.label }));
  protected readonly categoryOptionLabel = selectOptionLabelFn(() => this.categoryOptions);

  protected readonly identityModel = signal<IdentityModel>({ name: '', externalId: '' });
  protected readonly identityForm = form(this.identityModel, (p) => {
    required(p.name, { message: 'Device name is required' });
  });

  protected readonly category = signal<DeviceCategory>('motion');
  protected readonly categoryLabel = computed(() => DEVICE_CATEGORY_CONFIG[this.category()].label);

  protected readonly capabilities = signal<DeviceCapabilities>(CAPABILITY_DEFAULTS.motion);

  protected onCategoryChange(value: string): void {
    const next = (value || 'motion') as DeviceCategory;
    this.category.set(next);
    this.capabilities.set(CAPABILITY_DEFAULTS[next as Exclude<DeviceCategory, 'unknown'>]);
  }

  protected toggleCapability(key: keyof DeviceCapabilities, checked: boolean): void {
    this.capabilities.update((c) => ({ ...c, [key]: checked }));
  }

  protected readonly capabilityRows = computed(() =>
    (Object.keys(this.capabilities()) as (keyof DeviceCapabilities)[]).map((key) => ({
      key,
      label: CAPABILITY_LABELS[key],
      value: this.capabilities()[key] ?? false,
    })),
  );

  protected readonly verifyOutcome = signal<VerifyOutcome>('idle');
  protected readonly canAdvanceFromVerification = computed(
    () => this.verifyOutcome() === 'success' || this.verifyOutcome() === 'deferred',
  );

  protected async checkSignal(): Promise<void> {
    this.verifyOutcome.set('checking');
    await simulateLatency(1200);
    this.verifyOutcome.set(Math.random() > 0.2 ? 'success' : 'failed');
  }

  protected deferVerification(): void {
    this.verifyOutcome.set('deferred');
  }

  protected readonly submitting = signal(false);

  protected canGoNext(): boolean {
    switch (this.step()) {
      case 1:
        return this.identityModel().name.trim().length > 0;
      case 4:
        return this.canAdvanceFromVerification();
      default:
        return true;
    }
  }

  protected next(): void {
    if (!this.canGoNext()) return;
    this.step.update((s) => Math.min(5, s + 1));
  }

  protected back(): void {
    this.step.update((s) => Math.max(1, s - 1));
  }

  protected async submit(): Promise<void> {
    this.submitting.set(true);
    try {
      const input: NewDeviceInput = {
        name: this.identityModel().name.trim(),
        externalId: this.identityModel().externalId.trim() || undefined,
        category: this.category(),
        buildingId: this.buildingId(),
        floorId: this.floorId(),
        spaceId: this.spaceId(),
        capabilities: this.capabilities(),
        connectivity: this.verifyOutcome() === 'success' ? 'online' : 'unknown',
      };
      const device = await this.deviceService.create(input);
      this.created.emit(device);
    } finally {
      this.submitting.set(false);
    }
  }
}
