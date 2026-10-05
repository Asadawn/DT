import { Injectable, inject, resource } from '@angular/core';
import { DeviceService } from '../devices/device.service';
import { MaintenanceService } from '../maintenance/maintenance.service';
import { NotificationService } from '../notifications/notification.service';
import { simulateLatency } from '../../shared/utils/simulate-latency';
import { AUTOMATION_EXECUTION_FIXTURES, AUTOMATION_FIXTURES } from './automation.fixtures';
import type {
  Automation,
  AutomationExecution,
  AutomationExecutionActionResult,
  AutomationExecutionState,
  AutomationFilter,
  AutomationStatus,
  NewAutomationInput,
} from './automation.types';

function coerceValue(value: string | undefined): string | number | boolean | null {
  if (value === undefined || value === '') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  const num = Number(value);
  return Number.isNaN(num) ? value : num;
}

@Injectable({ providedIn: 'root' })
export class AutomationService {
  private readonly deviceService = inject(DeviceService);
  private readonly maintenanceService = inject(MaintenanceService);
  private readonly notificationService = inject(NotificationService);

  private readonly automationsResource = resource({
    defaultValue: [] as Automation[],
    loader: async () => {
      await simulateLatency();
      return AUTOMATION_FIXTURES;
    },
  });

  private readonly executionsResource = resource({
    defaultValue: [] as AutomationExecution[],
    loader: async () => {
      await simulateLatency();
      return AUTOMATION_EXECUTION_FIXTURES;
    },
  });

  readonly automations = this.automationsResource.value;
  readonly automationsLoading = this.automationsResource.isLoading;
  readonly executionsLoading = this.executionsResource.isLoading;

  automation(id: string | null | undefined): Automation | undefined {
    if (!id) return undefined;
    return this.automations().find((a) => a.id === id);
  }

  filtered(filters: AutomationFilter): Automation[] {
    const search = filters.search?.trim().toLowerCase();
    return this.automations().filter((a) => {
      if (search && !a.name.toLowerCase().includes(search)) return false;
      if (filters.status && a.status !== filters.status) return false;
      if (filters.buildingId && a.buildingId !== filters.buildingId) return false;
      return true;
    });
  }

  executionsFor(automationId: string): AutomationExecution[] {
    return this.executionsResource
      .value()
      .filter((e) => e.automationId === automationId)
      .sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime());
  }

  async save(id: string | null, input: NewAutomationInput): Promise<Automation> {
    await simulateLatency(400);
    const now = new Date().toISOString();
    if (id) {
      let updated: Automation | undefined;
      this.automationsResource.update((list) =>
        list.map((a) => {
          if (a.id !== id) return a;
          updated = { ...a, ...input, updatedAt: now };
          return updated;
        }),
      );
      return updated!;
    }
    const created: Automation = {
      id: `a${Date.now().toString(36)}`,
      status: 'disabled',
      createdAt: now,
      updatedAt: now,
      ...input,
    };
    this.automationsResource.update((list) => [created, ...list]);
    return created;
  }

  async setStatus(id: string, status: AutomationStatus): Promise<void> {
    await simulateLatency(250);
    this.automationsResource.update((list) =>
      list.map((a) => (a.id === id ? { ...a, status, updatedAt: new Date().toISOString() } : a)),
    );
  }

  async runNow(id: string): Promise<AutomationExecution> {
    const automation = this.automation(id);
    if (!automation) throw new Error(`Automation ${id} not found`);

    await simulateLatency(600);

    const actionResults: AutomationExecutionActionResult[] = [];
    for (const action of automation.actions) {
      const success = Math.random() > 0.12;
      switch (action.type) {
        case 'device-command': {
          const device = this.deviceService.device(action.deviceId);
          const label = `Set ${device?.name ?? action.deviceId ?? 'device'} to ${action.value}`;
          if (success && action.deviceId && action.propertyId) {
            this.deviceService.updateProperty(
              action.deviceId,
              action.propertyId,
              coerceValue(action.value),
            );
          }
          actionResults.push({
            action: label,
            success,
            detail: success ? undefined : 'Device did not acknowledge the command',
          });
          break;
        }
        case 'notification': {
          if (success) {
            this.notificationService.create({
              type: 'automation',
              title: automation.name,
              message: action.message ?? '',
              link: { route: ['/operations/automations', automation.id] },
            });
          }
          actionResults.push({
            action: `Send notification: ${action.message}`,
            success,
            detail: success ? undefined : 'Notification delivery failed',
          });
          break;
        }
        case 'maintenance': {
          if (success) {
            await this.maintenanceService.create({
              title: action.maintenanceTitle ?? automation.name,
              description: `Auto-created by automation "${automation.name}".`,
              buildingId: automation.buildingId,
              floorId: automation.floorId,
              spaceId: automation.spaceId,
              priority: action.maintenancePriority ?? 'medium',
              category: 'general',
            });
          }
          actionResults.push({
            action: `Create maintenance: ${action.maintenanceTitle}`,
            success,
            detail: success ? undefined : 'Maintenance service timeout',
          });
          break;
        }
      }
    }

    const failedCount = actionResults.filter((r) => !r.success).length;
    const finalState: AutomationExecutionState =
      failedCount === 0
        ? 'completed'
        : failedCount === actionResults.length
          ? 'failed'
          : 'partially-failed';

    const execution: AutomationExecution = {
      id: `ax${Date.now().toString(36)}`,
      automationId: id,
      triggeredAt: new Date().toISOString(),
      triggerSource: 'Manual run',
      finalState,
      actionResults,
    };
    this.executionsResource.update((list) => [execution, ...list]);

    if (finalState !== 'completed') {
      this.notificationService.create({
        type: 'automation',
        title: `Automation ${finalState === 'failed' ? 'failed' : 'partially failed'}: ${automation.name}`,
        message: 'One or more actions did not complete — check the execution history.',
        link: { route: ['/operations/automations', automation.id] },
      });
    }

    return execution;
  }
}
