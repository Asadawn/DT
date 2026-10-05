import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCamera } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDatePickerImports } from '@spartan-ng/helm/date-picker';
import { HlmSwitchImports } from '@spartan-ng/helm/switch';
import { cameraRecordingsFor } from '../../../domain/devices/camera-recording.fixtures';
import type { CameraRecordingClip } from '../../../domain/devices/camera-recording.types';
import { DeviceCommandService } from '../../../domain/devices/device-command.service';
import type { Device } from '../../../domain/devices/device.types';
import { HasPermission } from '../../directives/has-permission.directive';
import { dateToIso } from '../../utils/date-only';
import { DtStatusChip } from '../badge/status-chip';

@Component({
  selector: 'dt-camera-panel',
  imports: [
    DatePipe,
    NgIcon,
    DtStatusChip,
    HasPermission,
    ...HlmSwitchImports,
    ...HlmDatePickerImports,
    ...HlmButtonImports,
  ],
  providers: [provideIcons({ lucideCamera })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './camera-panel.html',
})
export class DtCameraPanel {
  readonly device = input.required<Device>();
  readonly breadcrumb = input<string>('');

  protected readonly commandService = inject(DeviceCommandService);

  protected readonly powerProperty = computed(() =>
    this.device().properties.find((p) => p.key === 'power'),
  );
  protected readonly isOn = computed(() => !!this.powerProperty()?.value);

  protected readonly today = new Date();
  protected readonly selectedDate = signal(new Date());
  protected readonly selectedDateIso = computed(() => dateToIso(this.selectedDate()));

  protected readonly clips = computed(() =>
    cameraRecordingsFor(this.device().id, this.selectedDateIso()),
  );
  protected readonly selectedClip = signal<CameraRecordingClip | null>(null);

  protected setDate(date: Date | null): void {
    this.selectedDate.set(date ?? new Date());
    this.selectedClip.set(null);
  }

  protected playClip(clip: CameraRecordingClip): void {
    this.selectedClip.set(clip);
  }

  protected backToLive(): void {
    this.selectedClip.set(null);
  }

  protected togglePower(checked: boolean): void {
    const property = this.powerProperty();
    if (property) void this.commandService.sendCommand(this.device().id, property, checked);
  }
}
