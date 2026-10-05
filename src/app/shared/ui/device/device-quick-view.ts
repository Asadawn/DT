import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideActivity,
  lucideAlertCircle,
  lucideBatteryMedium,
  lucideDroplets,
  lucideFan,
  lucideFlame,
  lucideGauge,
  lucideKeyRound,
  lucideLamp,
  lucideLightbulb,
  lucideLock,
  lucidePlug,
  lucidePower,
  lucideScanFace,
  lucideSun,
  lucideThermometer,
  lucideUsers,
  lucideWaves,
  lucideWifi,
  lucideWind,
  lucideZap,
} from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmSwitchImports } from '@spartan-ng/helm/switch';
import { HlmToggleGroupImports } from '@spartan-ng/helm/toggle-group';
import { AutomationService } from '../../../domain/automations/automation.service';
import {
  DEVICE_CARD_ICON,
  DEVICE_CATEGORY_CONFIG,
  PROPERTY_ICON,
} from '../../../domain/devices/device-registry';
import { DeviceCommandService } from '../../../domain/devices/device-command.service';
import type { Device } from '../../../domain/devices/device.types';
import { ScheduleService } from '../../../domain/maintenance/schedule.service';
import { currentTimeRange } from '../../../domain/telemetry/telemetry.service';
import type { DeviceProperty } from '../../../shared/types/canonical.types';
import { HasPermission } from '../../directives/has-permission.directive';
import { DtStatusChip } from '../badge/status-chip';
import { DtMetricCard } from '../cards/metric-card';
import { DtCameraPanel } from './camera-panel';
import { DtDeviceTelemetryChart } from './device-telemetry-chart';
import { DtDoorContactCard } from './door-contact-card';
import { DtEnvironmentCard } from './environment-card';
import { DtMotionCard } from './motion-card';

@Component({
  selector: 'dt-device-quick-view',
  imports: [
    DatePipe,
    RouterLink,
    DtStatusChip,
    DtMetricCard,
    DtDeviceTelemetryChart,
    DtDoorContactCard,
    DtMotionCard,
    DtCameraPanel,
    DtEnvironmentCard,
    NgIcon,
    HasPermission,
    ...HlmToggleGroupImports,
    ...HlmButtonImports,
    ...HlmSwitchImports,
  ],
  providers: [
    provideIcons({
      lucideActivity,
      lucideAlertCircle,
      lucideBatteryMedium,
      lucideDroplets,
      lucideFan,
      lucideFlame,
      lucideGauge,
      lucideKeyRound,
      lucideLamp,
      lucideLightbulb,
      lucideLock,
      lucidePlug,
      lucidePower,
      lucideScanFace,
      lucideSun,
      lucideThermometer,
      lucideUsers,
      lucideWaves,
      lucideWifi,
      lucideWind,
      lucideZap,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block h-full' },
  templateUrl: './device-quick-view.html',
})
export class DtDeviceQuickView {
  readonly device = input.required<Device>();
  readonly breadcrumb = input<string>('');

  protected readonly commandService = inject(DeviceCommandService);
  private readonly scheduleService = inject(ScheduleService);
  private readonly automationService = inject(AutomationService);

  protected readonly categoryLabel = computed(
    () => DEVICE_CATEGORY_CONFIG[this.device().category].label,
  );
  protected readonly cardIcon = computed(() => DEVICE_CARD_ICON[this.device().category]);

  protected readonly subtitle = computed(() => {
    const category = this.categoryLabel();
    const breadcrumb = this.breadcrumb();
    const parts = category !== this.device().name ? [category, breadcrumb] : [breadcrumb];
    const text = parts.filter(Boolean).join(' · ');
    return text || null;
  });

  protected propertyIcon(property: DeviceProperty): string | undefined {
    if (this.device().category === 'energy-meter') return undefined;
    return PROPERTY_ICON[property.key];
  }
  protected readonly metrics = computed(
    () => DEVICE_CATEGORY_CONFIG[this.device().category].metrics,
  );
  protected readonly chartType = computed(
    () => DEVICE_CATEGORY_CONFIG[this.device().category].chartType ?? 'line',
  );
  protected readonly writableProperties = computed(() =>
    this.device().properties.filter((p) => p.writable),
  );
  protected readonly readOnlyProperties = computed(() =>
    this.device().properties.filter((p) => !p.writable),
  );

  protected readonly isMotion = computed(() => this.device().category === 'motion');
  protected readonly isContact = computed(() => this.device().category === 'contact');
  protected readonly isCamera = computed(() => this.device().category === 'camera');
  protected readonly isEnvironment = computed(() => this.device().category === 'environment');

  protected readonly schedules = computed(() =>
    this.scheduleService.schedulesForDevice(this.device().id),
  );

  protected readonly thresholds = computed(() => {
    const device = this.device();
    const entries: { automationId: string; automationName: string; text: string }[] = [];
    for (const automation of this.automationService.automations()) {
      const trigger = automation.trigger;
      if (
        trigger.type === 'device-property' &&
        trigger.deviceId === device.id &&
        trigger.propertyId
      ) {
        const property = device.properties.find((p) => p.id === trigger.propertyId);
        if (property) {
          entries.push({
            automationId: automation.id,
            automationName: automation.name,
            text: `${property.label} ${trigger.operator ?? ''} ${trigger.value ?? ''}${property.unit ? ' ' + property.unit : ''}`.trim(),
          });
        }
      }
      for (const condition of automation.conditions) {
        if (condition.deviceId !== device.id) continue;
        const property = device.properties.find((p) => p.id === condition.propertyId);
        if (!property) continue;
        entries.push({
          automationId: automation.id,
          automationName: automation.name,
          text: `${property.label} ${condition.operator} ${condition.value}${property.unit ? ' ' + property.unit : ''}`,
        });
      }
    }
    return entries;
  });

  protected readonly metricKey = signal('');
  protected readonly effectiveMetricKey = computed(
    () => this.metricKey() || this.metrics()[0]?.key || '',
  );
  protected readonly range = computed(() => currentTimeRange('24h'));

  protected selectMetric(key: string): void {
    this.metricKey.set(key);
  }

  protected toggle(property: DeviceProperty, checked: boolean): void {
    void this.commandService.sendCommand(this.device().id, property, checked);
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

  protected stepUp(property: DeviceProperty): void {
    const current = typeof property.value === 'number' ? property.value : 0;
    const next = property.max !== undefined ? Math.min(current + 1, property.max) : current + 1;
    if (next === current) return;
    void this.commandService.sendCommand(this.device().id, property, next);
  }

  protected stepDown(property: DeviceProperty): void {
    const current = typeof property.value === 'number' ? property.value : 0;
    const floor = property.min ?? 0;
    const next = Math.max(current - 1, floor);
    if (next === current) return;
    void this.commandService.sendCommand(this.device().id, property, next);
  }

  protected propertyValue(property: DeviceProperty): string | number {
    if (typeof property.value === 'boolean') {
      if (property.key === 'locked') return property.value ? 'Locked' : 'Unlocked';
      return property.value ? 'On' : 'Off';
    }
    return property.value ?? '—';
  }
}
