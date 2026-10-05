import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideActivity,
  lucideCamera,
  lucideDoorOpen,
  lucideDroplets,
  lucideFan,
  lucideFlame,
  lucideGauge,
  lucideLamp,
  lucideLightbulb,
  lucideLock,
  lucidePlug,
  lucideScanFace,
  lucideThermometer,
  lucideWaves,
  lucideWifi,
  lucideWind,
  lucideZap,
} from '@ng-icons/lucide';
import { HlmSliderImports } from '@spartan-ng/helm/slider';
import { HlmSwitchImports } from '@spartan-ng/helm/switch';
import { DEVICE_CARD_ICON } from '../../../domain/devices/device-registry';
import { DeviceCommandService } from '../../../domain/devices/device-command.service';
import type { Device } from '../../../domain/devices/device.types';
import { HasPermission } from '../../../shared/directives/has-permission.directive';
import type { DeviceProperty } from '../../../shared/types/canonical.types';

interface ControlRow {
  device: Device;
  icon: string;
  toggleProperty: DeviceProperty | null;
  stepperProperty: DeviceProperty | null;
  controlType: 'stepper' | 'slider';
  subtitle: string;
}

@Component({
  selector: 'app-space-device-controls',
  imports: [NgIcon, HasPermission, ...HlmSliderImports, ...HlmSwitchImports],
  providers: [
    provideIcons({
      lucideActivity,
      lucideCamera,
      lucideDoorOpen,
      lucideDroplets,
      lucideFan,
      lucideFlame,
      lucideGauge,
      lucideLamp,
      lucideLightbulb,
      lucideLock,
      lucidePlug,
      lucideScanFace,
      lucideThermometer,
      lucideWaves,
      lucideWifi,
      lucideWind,
      lucideZap,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @if (rows().length > 0) {
      <div>
        <h3 class="text-muted-foreground mb-2 text-[11px] tracking-wider uppercase">
          Device Controls
        </h3>
        <div class="border-border rounded-control border">
          @for (row of rows(); track row.device.id; let last = $last) {
            <div class="p-3">
              <div class="flex items-center gap-3">
                <span
                  class="bg-dashboard-accent/10 text-dashboard-accent flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                >
                  <ng-icon [name]="row.icon" size="16" />
                </span>
                <div class="min-w-0 flex-1">
                  <div class="truncate text-xs font-medium">{{ row.device.name }}</div>
                  <div class="text-muted-foreground truncate text-xs">{{ row.subtitle }}</div>
                </div>
                @if (row.toggleProperty; as toggle) {
                  <hlm-switch
                    *hasPermission="'devices'; action: 'edit'"
                    [checked]="!!toggle.value"
                    [disabled]="commandService.isPending(row.device.id, toggle.id)"
                    [attr.aria-label]="row.device.name + ' ' + toggle.label"
                    (checkedChange)="toggleDevice(row.device.id, toggle, $event)"
                  />
                }
              </div>

              @if (row.stepperProperty; as stepper) {
                @if (row.controlType === 'slider') {
                  <div class="mt-2 flex items-center gap-3 pl-12">
                    <hlm-slider
                      *hasPermission="'devices'; action: 'edit'"
                      class="flex-1"
                      [value]="sliderValue(stepper)"
                      [min]="stepper.min ?? 0"
                      [max]="stepper.max ?? 100"
                      [step]="1"
                      [disabled]="commandService.isPending(row.device.id, stepper.id)"
                      [attr.aria-label]="stepper.label"
                      (valueChange)="onSliderChange(row.device.id, stepper, $event)"
                    />
                    <span class="w-12 shrink-0 text-right text-xs font-semibold tabular-nums">
                      {{ stepper.value }}{{ stepper.unit ? ' ' + stepper.unit : '' }}
                    </span>
                  </div>
                } @else {
                  <div class="mt-2 flex items-center justify-between gap-3 pl-12">
                    <button
                      *hasPermission="'devices'; action: 'edit'"
                      type="button"
                      class="border-border hover:bg-accent flex h-7 w-7 cursor-pointer items-center justify-center rounded border text-base font-bold leading-none disabled:cursor-not-allowed disabled:opacity-40"
                      [disabled]="
                        commandService.isPending(row.device.id, stepper.id) || atMin(stepper)
                      "
                      (click)="stepDown(row.device.id, stepper)"
                      [attr.aria-label]="'Decrease ' + stepper.label"
                    >
                      −
                    </button>
                    <span class="min-w-12 text-center text-xs font-semibold tabular-nums">
                      {{ stepper.value }}{{ stepper.unit ? ' ' + stepper.unit : '' }}
                    </span>
                    <button
                      *hasPermission="'devices'; action: 'edit'"
                      type="button"
                      class="border-border hover:bg-accent flex h-7 w-7 cursor-pointer items-center justify-center rounded border text-base font-bold leading-none disabled:cursor-not-allowed disabled:opacity-40"
                      [disabled]="
                        commandService.isPending(row.device.id, stepper.id) || atMax(stepper)
                      "
                      (click)="stepUp(row.device.id, stepper)"
                      [attr.aria-label]="'Increase ' + stepper.label"
                    >
                      +
                    </button>
                  </div>
                }
              }
            </div>
            @if (!last) {
              <div class="bg-border mx-auto h-px w-[90%]"></div>
            }
          }
        </div>
      </div>
    }
  `,
})
export class SpaceDeviceControls {
  readonly devices = input.required<Device[]>();

  protected readonly commandService = inject(DeviceCommandService);

  protected readonly rows = computed<ControlRow[]>(() =>
    this.devices()
      .filter((d) => d.capabilities.commands)
      .map((device) => this.toRow(device)),
  );

  private toRow(device: Device): ControlRow {
    const toggleProperty =
      device.properties.find((p) => p.writable && p.valueType === 'boolean') ?? null;
    const numericProperty =
      device.properties.find((p) => p.writable && p.valueType === 'number') ?? null;
    const stepperProperty =
      numericProperty && toggleProperty?.value === true ? numericProperty : null;

    return {
      device,
      icon: DEVICE_CARD_ICON[device.category],
      toggleProperty,
      stepperProperty,
      controlType: numericProperty?.key === 'brightness' ? 'slider' : 'stepper',
      subtitle: this.subtitleFor(device, toggleProperty, numericProperty),
    };
  }

  private subtitleFor(
    device: Device,
    toggleProperty: DeviceProperty | null,
    numericProperty: DeviceProperty | null,
  ): string {
    if (toggleProperty?.key === 'locked') {
      return toggleProperty.value ? 'Locked' : 'Unlocked';
    }
    if (numericProperty) {
      return `${numericProperty.label} ${numericProperty.value}${numericProperty.unit ? ' ' + numericProperty.unit : ''}`;
    }
    const energyProperty = device.properties.find(
      (p) => p.key === 'energy' && typeof p.value === 'number',
    );
    if (energyProperty) {
      return `${energyProperty.value} ${energyProperty.unit ?? 'kWh'}`;
    }
    return toggleProperty?.value ? 'On' : 'Off';
  }

  protected toggleDevice(deviceId: string, property: DeviceProperty, checked: boolean): void {
    void this.commandService.sendCommand(deviceId, property, checked);
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

  protected stepDown(deviceId: string, property: DeviceProperty): void {
    const current = typeof property.value === 'number' ? property.value : 0;
    const floor = property.min ?? 0;
    const next = Math.max(current - 1, floor);
    if (next === current) return;
    void this.commandService.sendCommand(deviceId, property, next);
  }

  protected stepUp(deviceId: string, property: DeviceProperty): void {
    const current = typeof property.value === 'number' ? property.value : 0;
    const next = property.max !== undefined ? Math.min(current + 1, property.max) : current + 1;
    if (next === current) return;
    void this.commandService.sendCommand(deviceId, property, next);
  }

  protected sliderValue(property: DeviceProperty): number[] {
    return [typeof property.value === 'number' ? property.value : 0];
  }

  private readonly sliderCommitTimers = new Map<string, ReturnType<typeof setTimeout>>();

  protected onSliderChange(deviceId: string, property: DeviceProperty, value: number[]): void {
    const next = value[0];
    if (typeof next !== 'number') return;
    const key = `${deviceId}:${property.id}`;
    const pending = this.sliderCommitTimers.get(key);
    if (pending) clearTimeout(pending);
    this.sliderCommitTimers.set(
      key,
      setTimeout(() => {
        this.sliderCommitTimers.delete(key);
        if (next === property.value) return;
        void this.commandService.sendCommand(deviceId, property, next);
      }, 250),
    );
  }
}
