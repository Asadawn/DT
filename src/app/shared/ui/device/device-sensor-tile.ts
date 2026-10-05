import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import {
  DEVICE_CATEGORY_CONFIG,
  DEVICE_INDICATOR_ICON,
} from '../../../domain/devices/device-registry';
import type { Device } from '../../../domain/devices/device.types';

@Component({
  selector: 'dt-device-sensor-tile',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="rounded-card border-border hover:border-merik/40 hover:bg-merik/5 flex w-full flex-col items-start gap-2.5 border bg-white p-4 text-left transition-colors @container"
      (click)="opened.emit()"
    >
      <div class="flex w-full items-start justify-between gap-2">
        <span class="text-muted-foreground text-xs font-medium tracking-wide uppercase">{{
          label()
        }}</span>
        <span class="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
          @if (indicatorIcon(); as icon) {
            <img [src]="icon" alt="" class="h-5 w-5" />
          } @else {
            <span class="text-sm">{{ textIcon() }}</span>
          }
        </span>
      </div>
      <span class="text-xl font-semibold tracking-tight">{{ displayValue() }}</span>
    </button>
  `,
})
export class DtDeviceSensorTile {
  readonly device = input.required<Device>();
  readonly metricKey = input<string>();
  readonly opened = output<void>();

  protected readonly indicatorIcon = computed(() => DEVICE_INDICATOR_ICON[this.device().category]);
  protected readonly textIcon = computed(() => DEVICE_CATEGORY_CONFIG[this.device().category].icon);

  protected readonly label = computed(() => {
    const config = DEVICE_CATEGORY_CONFIG[this.device().category];
    const metric = config.metrics.find((m) => m.key === this.metricKey());
    return metric?.label ?? config.label;
  });

  protected readonly displayValue = computed(() => {
    const key = this.metricKey();
    const property = key
      ? this.device().properties.find((p) => p.key === key)
      : this.device().properties[0];
    if (!property) return '—';
    return `${property.value ?? '—'}${property.unit ? ' ' + property.unit : ''}`;
  });
}
