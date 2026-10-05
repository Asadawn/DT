import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RoomStatCard } from './room-stat-card';

@Component({
  selector: 'app-room-device-status',
  imports: [RoomStatCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block h-full' },
  templateUrl: './room-device-status.html',
})
export class RoomDeviceStatus {
  readonly online = input.required<number>();
  readonly total = input.required<number>();

  protected scrollToDevices(): void {
    document.getElementById('devices')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
