import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowRight } from '@ng-icons/lucide';
import type { DeviceProperty } from '../../../shared/types/canonical.types';
import { DEVICE_CATEGORY_CONFIG } from '../../../domain/devices/device-registry';
import { DeviceCommandService } from '../../../domain/devices/device-command.service';
import type { Device } from '../../../domain/devices/device.types';
import { ScheduleService } from '../../../domain/maintenance/schedule.service';
import { HasPermission } from '../../directives/has-permission.directive';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmSwitchImports } from '@spartan-ng/helm/switch';
import { DtStatusChip } from '../badge/status-chip';
import { DtMetricCard } from '../cards/metric-card';

@Component({
  selector: 'dt-device-card',
  imports: [
    DtStatusChip,
    DtMetricCard,
    NgIcon,
    HasPermission,
    ...HlmSwitchImports,
    ...HlmCardImports,
  ],
  providers: [provideIcons({ lucideArrowRight })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  templateUrl: './device-card.html',
})
export class DtDeviceCard {
  readonly device = input.required<Device>();
  readonly select = output<Device>();

  protected readonly commandService = inject(DeviceCommandService);
  private readonly scheduleService = inject(ScheduleService);

  protected readonly schedules = computed(() =>
    this.scheduleService.schedulesForDevice(this.device().id),
  );

  protected readonly icon = computed(() => DEVICE_CATEGORY_CONFIG[this.device().category].icon);
  protected readonly categoryLabel = computed(
    () => DEVICE_CATEGORY_CONFIG[this.device().category].label,
  );
  protected readonly subtitle = computed(() => {
    const category = this.categoryLabel();
    return category !== this.device().name ? category : null;
  });

  protected readonly readOnlyProperties = computed(() =>
    this.device().properties.filter((p) => !p.writable),
  );
  protected readonly writableProperties = computed(() =>
    this.device().properties.filter((p) => p.writable),
  );

  protected readonly isOn = computed(() => this.writableProperties().some((p) => p.value === true));
  protected readonly ringClass = computed(() => (this.isOn() ? 'ring-2! ring-merik/40!' : ''));

  protected displayValue(value: DeviceProperty['value']): string | number | null {
    if (typeof value === 'boolean') return value ? 'On' : 'Off';
    return value;
  }

  protected booleanLabel(property: DeviceProperty): string {
    if (property.key === 'locked') return property.value ? 'Locked' : 'Unlocked';
    return property.value ? 'On' : 'Off';
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
}
