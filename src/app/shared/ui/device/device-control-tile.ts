import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import {
  DEVICE_CATEGORY_CONFIG,
  DEVICE_INDICATOR_ICON,
} from '../../../domain/devices/device-registry';
import type { Device } from '../../../domain/devices/device.types';
import { DtStatusChip } from '../badge/status-chip';

@Component({
  selector: 'dt-device-control-tile',
  host: { class: 'block' },
  imports: [DtStatusChip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="rounded-card border-border hover:border-merik/40 hover:bg-merik/5 flex h-full w-full flex-col gap-2.5 border bg-white p-3.5 text-left transition-colors"
      (click)="opened.emit()"
    >
      <div class="flex items-start justify-between gap-2">
        <span class="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
          @if (indicatorIcon(); as icon) {
            <img [src]="icon" alt="" class="h-5 w-5" />
          } @else {
            <span class="text-sm">{{ textIcon() }}</span>
          }
        </span>
        <dt-status-chip [status]="device().connectivity" />
      </div>
      <div class="min-w-0">
        <div class="truncate text-sm font-medium">{{ device().name }}</div>
        <div class="text-muted-foreground truncate text-xs">{{ keyReading() }}</div>
      </div>
    </button>
  `,
})
export class DtDeviceControlTile {
  readonly device = input.required<Device>();
  readonly opened = output<void>();

  protected readonly indicatorIcon = computed(() => DEVICE_INDICATOR_ICON[this.device().category]);
  protected readonly textIcon = computed(() => DEVICE_CATEGORY_CONFIG[this.device().category].icon);

  protected readonly keyReading = computed(() => {
    const first = this.device().properties[0];
    if (!first) return 'No properties';
    return `${first.label}: ${first.value ?? '—'}${first.unit ? ' ' + first.unit : ''}`;
  });
}
