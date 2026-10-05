import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePlay, lucideZap } from '@ng-icons/lucide';
import { HlmSwitchImports } from '@spartan-ng/helm/switch';
import { AutomationService } from '../../../domain/automations/automation.service';
import type { Automation } from '../../../domain/automations/automation.types';
import { DeviceCommandService } from '../../../domain/devices/device-command.service';
import type { Device } from '../../../domain/devices/device.types';
import { PermissionService } from '../../../core/permissions/permission.service';
import type { DeviceProperty } from '../../../shared/types/canonical.types';

const MAX_DEVICE_ACTIONS = 4;
const MAX_AUTOMATION_ACTIONS = 2;

interface DeviceQuickAction {
  device: Device;
  property: DeviceProperty;
}

@Component({
  selector: 'app-quick-interactions',
  imports: [NgIcon, ...HlmSwitchImports],
  providers: [provideIcons({ lucidePlay, lucideZap })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @if (deviceActions().length > 0 || automationActions().length > 0) {
      <div>
        <h3 class="text-muted-foreground mb-1.5 text-xs uppercase tracking-wide">
          Quick Interactions
        </h3>
        <div class="flex flex-col gap-1">
          @for (action of deviceActions(); track action.property.id) {
            <div
              class="border-border rounded-control flex items-center justify-between gap-3 border px-2.5 py-1.5"
            >
              <span class="min-w-0 flex-1 truncate text-xs"
                >{{ action.device.name }} — {{ action.property.label }}</span
              >
              <hlm-switch
                [checked]="!!action.property.value"
                [disabled]="commandService.isPending(action.device.id, action.property.id)"
                [attr.aria-label]="action.device.name + ' ' + action.property.label"
                (checkedChange)="toggleDevice(action, $event)"
              />
            </div>
          }
          @for (automation of automationActions(); track automation.id) {
            <div
              class="border-border rounded-control flex items-center justify-between gap-3 border px-2.5 py-1.5"
            >
              <span class="min-w-0 flex-1 truncate text-xs">
                <ng-icon name="lucideZap" size="12" class="text-muted-foreground mr-1 inline" />{{
                  automation.name
                }}
              </span>
              <button
                type="button"
                class="hover:bg-accent flex shrink-0 cursor-pointer items-center gap-1 rounded px-2 py-1 text-xs disabled:opacity-50"
                [disabled]="runningId() === automation.id"
                (click)="runAutomation(automation.id)"
              >
                <ng-icon name="lucidePlay" size="11" />
                Run
              </button>
            </div>
          }
        </div>
        @if (lastRunMessage()) {
          <p class="text-muted-foreground mt-1.5 text-xs italic">{{ lastRunMessage() }}</p>
        }
      </div>
    }
  `,
})
export class QuickInteractions {
  readonly devices = input.required<Device[]>();
  readonly automations = input.required<Automation[]>();

  protected readonly commandService = inject(DeviceCommandService);
  private readonly automationService = inject(AutomationService);
  private readonly permissionService = inject(PermissionService);

  protected readonly runningId = signal<string | null>(null);
  protected readonly lastRunMessage = signal<string | null>(null);

  protected readonly deviceActions = computed<DeviceQuickAction[]>(() => {
    if (!this.permissionService.hasPermission('devices', 'edit')) return [];
    const actions: DeviceQuickAction[] = [];
    for (const device of this.devices()) {
      if (!device.capabilities.commands) continue;
      for (const property of device.properties) {
        if (!property.writable || property.valueType !== 'boolean' || property.key === 'locked')
          continue;
        actions.push({ device, property });
        if (actions.length >= MAX_DEVICE_ACTIONS) return actions;
      }
    }
    return actions;
  });

  protected readonly automationActions = computed<Automation[]>(() => {
    if (!this.permissionService.hasPermission('automations', 'edit')) return [];
    return this.automations()
      .filter((a) => a.status === 'enabled')
      .slice(0, MAX_AUTOMATION_ACTIONS);
  });

  protected toggleDevice(action: DeviceQuickAction, checked: boolean): void {
    this.lastRunMessage.set(null);
    void this.commandService.sendCommand(action.device.id, action.property, checked);
  }

  protected async runAutomation(id: string): Promise<void> {
    this.runningId.set(id);
    this.lastRunMessage.set(null);
    try {
      await this.automationService.runNow(id);
      this.lastRunMessage.set('Demo execution completed — no physical devices were controlled.');
    } finally {
      this.runningId.set(null);
    }
  }
}
