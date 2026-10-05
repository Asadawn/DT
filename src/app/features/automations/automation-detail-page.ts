import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BuildingService } from '../../domain/buildings/building.service';
import { AutomationService } from '../../domain/automations/automation.service';
import { describeAction, describeTrigger } from '../../domain/automations/automation-summary.util';
import { DeviceService } from '../../domain/devices/device.service';
import { HlmButton } from '@spartan-ng/helm/button';
import { DtStatusChip } from '../../shared/ui/badge/status-chip';
import { DtEmptyState } from '../../shared/ui/state/empty-state';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { HasPermission } from '../../shared/directives/has-permission.directive';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

@Component({
  selector: 'app-automation-detail-page',
  imports: [PageHeader, DtStatusChip, HlmButton, DtEmptyState, RouterLink, DatePipe, HasPermission],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './automation-detail-page.html',
})
export class AutomationDetailPage {
  readonly automationId = input.required<string>();

  private readonly automationService = inject(AutomationService);
  private readonly buildingService = inject(BuildingService);
  private readonly deviceService = inject(DeviceService);

  protected readonly dayLabels = DAY_LABELS;

  protected readonly automation = computed(() =>
    this.automationService.automation(this.automationId()),
  );
  protected readonly building = computed(() =>
    this.buildingService.building(this.automation()?.buildingId),
  );
  protected readonly floor = computed(() => {
    const automation = this.automation();
    return automation?.floorId ? this.buildingService.floor(automation.floorId) : undefined;
  });
  protected readonly space = computed(() => {
    const automation = this.automation();
    return automation?.spaceId ? this.buildingService.space(automation.spaceId) : undefined;
  });

  protected readonly triggerSummary = computed(() => {
    const automation = this.automation();
    return automation ? describeTrigger(automation, this.deviceService) : '';
  });

  protected readonly actionSummaries = computed(() => {
    const automation = this.automation();
    if (!automation) return [];
    return automation.actions.map((action) => describeAction(action, this.deviceService));
  });

  protected readonly conditionSummaries = computed(() => {
    const automation = this.automation();
    if (!automation) return [];
    return automation.conditions.map((c) => {
      const device = this.deviceService.device(c.deviceId);
      const property = device?.properties.find((p) => p.id === c.propertyId);
      return `${device?.name ?? c.deviceId} — ${property?.label ?? c.propertyId} ${c.operator} ${c.value}`;
    });
  });

  protected readonly executions = computed(() =>
    this.automationService.executionsFor(this.automationId()),
  );

  protected readonly updatingStatus = signal(false);
  protected readonly running = signal(false);

  protected async toggleStatus(): Promise<void> {
    const automation = this.automation();
    if (!automation) return;
    this.updatingStatus.set(true);
    try {
      await this.automationService.setStatus(
        automation.id,
        automation.status === 'enabled' ? 'disabled' : 'enabled',
      );
    } finally {
      this.updatingStatus.set(false);
    }
  }

  protected async runNow(): Promise<void> {
    const automation = this.automation();
    if (!automation) return;
    this.running.set(true);
    try {
      await this.automationService.runNow(automation.id);
    } finally {
      this.running.set(false);
    }
  }
}
