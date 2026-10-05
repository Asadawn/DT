import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AutomationService } from '../../../domain/automations/automation.service';
import { describeTrigger } from '../../../domain/automations/automation-summary.util';
import type { Automation } from '../../../domain/automations/automation.types';
import { DeviceService } from '../../../domain/devices/device.service';
import { HasPermission } from '../../../shared/directives/has-permission.directive';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmSwitchImports } from '@spartan-ng/helm/switch';

@Component({
  selector: 'app-room-automations',
  imports: [RouterLink, DatePipe, HasPermission, ...HlmCardImports, ...HlmSwitchImports],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './room-automations.html',
})
export class RoomAutomations {
  readonly automations = input.required<Automation[]>();

  private readonly automationService = inject(AutomationService);
  private readonly deviceService = inject(DeviceService);

  protected readonly togglingId = signal<string | null>(null);

  protected describe(automation: Automation): string {
    return describeTrigger(automation, this.deviceService);
  }

  protected lastRunAt(automation: Automation): string | null {
    return this.automationService.executionsFor(automation.id)[0]?.triggeredAt ?? null;
  }

  protected async toggleStatus(automation: Automation): Promise<void> {
    this.togglingId.set(automation.id);
    try {
      await this.automationService.setStatus(
        automation.id,
        automation.status === 'enabled' ? 'disabled' : 'enabled',
      );
    } finally {
      this.togglingId.set(null);
    }
  }
}
