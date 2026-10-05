import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMapPin, lucidePlay, lucideZap } from '@ng-icons/lucide';
import { HasPermission } from '../../../shared/directives/has-permission.directive';
import { HlmSwitchImports } from '@spartan-ng/helm/switch';
import { AutomationService } from '../../../domain/automations/automation.service';
import {
  describeAction,
  describeCondition,
  describeTrigger,
} from '../../../domain/automations/automation-summary.util';
import type { Automation } from '../../../domain/automations/automation.types';
import { BuildingService } from '../../../domain/buildings/building.service';
import { DeviceService } from '../../../domain/devices/device.service';
import { DtStatusChip } from '../../../shared/ui/badge/status-chip';

@Component({
  selector: 'app-automation-details-card',
  imports: [DatePipe, NgIcon, HasPermission, DtStatusChip, ...HlmSwitchImports],
  providers: [provideIcons({ lucideMapPin, lucidePlay, lucideZap })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @if (automation(); as a) {
      <div class="flex flex-col gap-4">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-base">{{ a.name }}</h2>
            <dt-status-chip [status]="a.status" weight="normal" />
          </div>
          @if (a.description) {
            <p class="text-muted-foreground mt-0.5 text-xs">{{ a.description }}</p>
          }
        </div>

        <div>
          <h3 class="text-muted-foreground mb-1.5 text-xs uppercase tracking-wide">Ownership</h3>
          <p class="flex items-center gap-1 text-xs">
            <ng-icon name="lucideMapPin" size="13" class="text-muted-foreground shrink-0" />
            {{ ownershipLabel() }}
          </p>
        </div>

        <div>
          <h3 class="text-muted-foreground mb-1.5 text-xs uppercase tracking-wide">
            When (Trigger)
          </h3>
          <p class="text-xs">{{ triggerSummary() }}</p>
        </div>

        @if (conditionSummaries().length > 0) {
          <div>
            <h3 class="text-muted-foreground mb-1.5 text-xs uppercase tracking-wide">
              If (Conditions)
            </h3>
            <ul class="flex flex-col gap-0.5 text-xs">
              @for (condition of conditionSummaries(); track condition) {
                <li>{{ condition }}</li>
              }
            </ul>
          </div>
        }

        <div>
          <h3 class="text-muted-foreground mb-1.5 text-xs uppercase tracking-wide">
            Then (Actions)
          </h3>
          <ul class="flex flex-col gap-0.5 text-xs">
            @for (action of actionSummaries(); track action) {
              <li>{{ action }}</li>
            }
          </ul>
        </div>

        <div>
          <h3 class="text-muted-foreground mb-1.5 text-xs uppercase tracking-wide">Targets</h3>
          @if (targets().length === 0) {
            <p class="text-muted-foreground text-xs">No device targets.</p>
          } @else {
            <ul class="flex flex-col gap-0.5 text-xs">
              @for (target of targets(); track target.deviceId) {
                <li class="truncate">
                  {{ target.name
                  }}<span class="text-muted-foreground"> — {{ target.location }}</span>
                </li>
              }
            </ul>
          }
        </div>

        <div>
          <h3 class="text-muted-foreground mb-1.5 text-xs uppercase tracking-wide">Activity</h3>
          @if (executions().length === 0) {
            <p class="text-muted-foreground text-xs">No executions yet.</p>
          } @else {
            <ul class="flex flex-col gap-1.5 text-xs">
              @for (execution of executions().slice(0, 5); track execution.id) {
                <li class="border-border rounded-md border p-2">
                  <div class="flex items-center justify-between gap-2">
                    <span>{{ execution.triggerSource }}</span>
                    <dt-status-chip [status]="execution.finalState" weight="normal" />
                  </div>
                  <div class="text-muted-foreground">
                    {{ execution.triggeredAt | date: 'short' }}
                  </div>
                </li>
              }
            </ul>
          }
        </div>

        <div>
          <h3 class="text-muted-foreground mb-1.5 text-xs uppercase tracking-wide">Actions</h3>
          <div class="flex items-center gap-2">
            <button
              *hasPermission="'automations'; action: 'edit'"
              type="button"
              class="rounded-control border-border hover:bg-accent flex cursor-pointer items-center gap-1.5 border px-2.5 py-1.5 text-xs disabled:opacity-50"
              [disabled]="running()"
              (click)="runNow(a.id)"
            >
              <ng-icon name="lucidePlay" size="12" />
              Run Now
            </button>
            <label
              *hasPermission="'automations'; action: 'edit'"
              class="flex cursor-pointer items-center gap-1.5 text-xs"
            >
              <hlm-switch
                [checked]="a.status === 'enabled'"
                [disabled]="togglingStatus()"
                [attr.aria-label]="a.name + ' active'"
                (checkedChange)="toggleStatus(a)"
              />
              {{ a.status === 'enabled' ? 'Active' : 'Paused' }}
            </label>
          </div>
          @if (runMessage()) {
            <p class="text-muted-foreground mt-2 flex items-center gap-1 text-xs italic">
              <ng-icon name="lucideZap" size="12" />
              {{ runMessage() }}
            </p>
          }
        </div>
      </div>
    }
  `,
})
export class AutomationDetailsCard {
  readonly automation = input.required<Automation>();

  private readonly automationService = inject(AutomationService);
  private readonly buildingService = inject(BuildingService);
  private readonly deviceService = inject(DeviceService);

  protected readonly running = signal(false);
  protected readonly togglingStatus = signal(false);
  protected readonly runMessage = signal<string | null>(null);

  protected readonly ownershipLabel = computed(() => {
    const a = this.automation();
    const parts = [
      this.buildingService.building(a.buildingId)?.name,
      a.floorId ? this.buildingService.floor(a.floorId)?.name : undefined,
      a.spaceId ? this.buildingService.space(a.spaceId)?.name : undefined,
    ].filter((part): part is string => !!part);
    return parts.join(' / ') || 'Unassigned';
  });

  protected readonly triggerSummary = computed(() =>
    describeTrigger(this.automation(), this.deviceService),
  );

  protected readonly conditionSummaries = computed(() =>
    this.automation().conditions.map((c) => describeCondition(c, this.deviceService)),
  );

  protected readonly actionSummaries = computed(() =>
    this.automation().actions.map((action) => describeAction(action, this.deviceService)),
  );

  protected readonly targets = computed(() => {
    const a = this.automation();
    const deviceIds = new Set<string>();
    if (a.trigger.deviceId) deviceIds.add(a.trigger.deviceId);
    for (const c of a.conditions) deviceIds.add(c.deviceId);
    for (const action of a.actions) {
      if (action.deviceId) deviceIds.add(action.deviceId);
    }
    return [...deviceIds]
      .map((deviceId) => {
        const device = this.deviceService.device(deviceId);
        if (!device) return null;
        const location = [
          this.buildingService.building(device.buildingId)?.name,
          device.floorId ? this.buildingService.floor(device.floorId)?.name : undefined,
          device.spaceId ? this.buildingService.space(device.spaceId)?.name : undefined,
        ]
          .filter((part): part is string => !!part)
          .join(' / ');
        return { deviceId, name: device.name, location: location || 'Unassigned' };
      })
      .filter((t): t is { deviceId: string; name: string; location: string } => !!t);
  });

  protected readonly executions = computed(() =>
    this.automationService.executionsFor(this.automation().id),
  );

  protected async toggleStatus(automation: Automation): Promise<void> {
    this.togglingStatus.set(true);
    try {
      await this.automationService.setStatus(
        automation.id,
        automation.status === 'enabled' ? 'disabled' : 'enabled',
      );
    } finally {
      this.togglingStatus.set(false);
    }
  }

  protected async runNow(id: string): Promise<void> {
    this.running.set(true);
    this.runMessage.set(null);
    try {
      await this.automationService.runNow(id);
      this.runMessage.set('Demo execution completed — no physical devices were controlled.');
    } finally {
      this.running.set(false);
    }
  }
}
