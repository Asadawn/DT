import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { FormField, form, required, submit } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronLeft } from '@ng-icons/lucide';
import { AutomationService } from '../../domain/automations/automation.service';
import {
  AUTOMATION_ACTION_TYPE_LABELS,
  AUTOMATION_TRIGGER_TYPE_LABELS,
  COMPARISON_OPERATOR_LABELS,
  emptyAutomationSchedule,
  type AutomationAction,
  type AutomationActionType,
  type AutomationCondition,
  type AutomationSchedule,
  type AutomationTriggerType,
  type ComparisonOperator,
} from '../../domain/automations/automation.types';
import { BuildingService } from '../../domain/buildings/building.service';
import { DeviceService } from '../../domain/devices/device.service';
import { LocationContextService } from '../../domain/locations/location-context.service';
import type { MaintenancePriority } from '../../domain/maintenance/maintenance.types';
import type { SelectOption } from '../../shared/types/canonical.types';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { selectOptionLabelFn } from '../../shared/utils/select-option-label';
import { statusLabel } from '../../shared/utils/status-tone';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 25 }, (_, i) => i);

const TRIGGER_TYPE_OPTIONS: SelectOption[] = (
  Object.keys(AUTOMATION_TRIGGER_TYPE_LABELS) as AutomationTriggerType[]
).map((t) => ({ value: t, label: AUTOMATION_TRIGGER_TYPE_LABELS[t] }));
const ACTION_TYPE_OPTIONS: SelectOption[] = (
  Object.keys(AUTOMATION_ACTION_TYPE_LABELS) as AutomationActionType[]
).map((t) => ({ value: t, label: AUTOMATION_ACTION_TYPE_LABELS[t] }));
const OPERATOR_OPTIONS: SelectOption[] = (
  Object.keys(COMPARISON_OPERATOR_LABELS) as ComparisonOperator[]
).map((o) => ({
  value: o,
  label: `${o} (${COMPARISON_OPERATOR_LABELS[o]})`,
}));
const PRIORITY_OPTIONS: SelectOption[] = ['low', 'medium', 'high', 'urgent'].map((p) => ({
  value: p,
  label: statusLabel(p),
}));

interface AutomationModel {
  name: string;
  description: string;
  buildingId: string;
  floorId: string;
  spaceId: string;
  triggerType: AutomationTriggerType;
  triggerDeviceId: string;
  triggerPropertyId: string;
  triggerOperator: ComparisonOperator;
  triggerValue: string;
  triggerTimeOfDay: string;
  triggerOccupancyStatus: 'occupied' | 'vacant';
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  schedule: AutomationSchedule | null;
}

function blankCondition(): AutomationCondition {
  return { deviceId: '', propertyId: '', operator: '==', value: '' };
}

function blankAction(): AutomationAction {
  return { type: 'notification', message: '' };
}

@Component({
  selector: 'app-automation-form-page',
  imports: [
    FormField,
    RouterLink,
    NgIcon,
    ...HlmButtonImports,
    ...HlmCardImports,
    ...HlmSelectImports,
    ...HlmCheckboxImports,
    ...HlmInputImports,
  ],
  providers: [provideIcons({ lucideChevronLeft })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './automation-form-page.html',
})
export class AutomationFormPage {
  readonly automationId = input<string>();

  private readonly automationService = inject(AutomationService);
  private readonly buildingService = inject(BuildingService);
  private readonly deviceService = inject(DeviceService);
  private readonly locationContext = inject(LocationContextService);
  private readonly router = inject(Router);

  protected readonly dayLabels = DAY_LABELS;
  protected readonly hours = HOURS;
  protected readonly triggerTypeOptions = TRIGGER_TYPE_OPTIONS;
  protected readonly triggerTypeLabel = selectOptionLabelFn(() => this.triggerTypeOptions);
  protected readonly actionTypeOptions = ACTION_TYPE_OPTIONS;
  protected readonly actionTypeLabel = selectOptionLabelFn(() => this.actionTypeOptions);
  protected readonly operatorOptions = OPERATOR_OPTIONS;
  protected readonly operatorLabel = selectOptionLabelFn(() => this.operatorOptions);
  protected readonly priorityOptions = PRIORITY_OPTIONS;
  protected readonly priorityLabel = selectOptionLabelFn(() => this.priorityOptions);

  protected readonly existing = computed(() =>
    this.automationService.automation(this.automationId()),
  );

  protected readonly buildingOptions = computed<SelectOption[]>(() =>
    this.buildingService.buildings().map((b) => ({ value: b.id, label: b.name })),
  );
  protected readonly buildingLabel = selectOptionLabelFn(this.buildingOptions);

  protected readonly model = signal<AutomationModel>({
    name: '',
    description: '',
    buildingId: '',
    floorId: '',
    spaceId: '',
    triggerType: 'device-property',
    triggerDeviceId: '',
    triggerPropertyId: '',
    triggerOperator: '>',
    triggerValue: '',
    triggerTimeOfDay: '09:00',
    triggerOccupancyStatus: 'occupied',
    conditions: [],
    actions: [],
    schedule: null,
  });

  protected readonly floorOptions = computed<SelectOption[]>(() =>
    this.model().buildingId
      ? this.buildingService
          .floorsForBuilding(this.model().buildingId)
          .map((f) => ({ value: f.id, label: f.name }))
      : [],
  );
  protected readonly floorLabel = selectOptionLabelFn(this.floorOptions);

  protected readonly spaceOptions = computed<SelectOption[]>(() =>
    this.model().floorId
      ? this.buildingService
          .spacesForFloor(this.model().floorId)
          .map((s) => ({ value: s.id, label: s.name }))
      : [],
  );
  protected readonly spaceLabel = selectOptionLabelFn(this.spaceOptions);

  protected readonly devicesInScope = computed(() =>
    this.model().buildingId
      ? this.deviceService.devices().filter((d) => d.buildingId === this.model().buildingId)
      : [],
  );
  protected readonly deviceOptions = computed<SelectOption[]>(() =>
    this.devicesInScope().map((d) => ({ value: d.id, label: d.name })),
  );
  protected readonly deviceLabel = selectOptionLabelFn(this.deviceOptions);

  protected propertyOptionsFor(deviceId: string): SelectOption[] {
    const device = this.deviceService.device(deviceId);
    return device?.properties.map((p) => ({ value: p.id, label: p.label })) ?? [];
  }

  protected propertyLabelFor(deviceId: string): (value: string) => string {
    const options = this.propertyOptionsFor(deviceId);
    return (value: string) => options.find((o) => o.value === value)?.label ?? value;
  }

  protected readonly triggerPropertyOptions = computed(() =>
    this.propertyOptionsFor(this.model().triggerDeviceId),
  );
  protected readonly triggerPropertyLabel = computed(() =>
    this.propertyLabelFor(this.model().triggerDeviceId),
  );

  protected readonly automationForm = form(this.model, (p) => {
    required(p.name, { message: 'Name is required' });
    required(p.buildingId, { message: 'Select a building' });
  });

  protected readonly submitting = signal(false);
  protected readonly submitAttempted = signal(false);

  private readonly hydrated = signal(false);

  constructor() {
    effect(() => {
      if (this.hydrated() || !this.automationId()) return;
      const existing = this.existing();
      if (!existing) return;
      untracked(() => {
        this.model.set({
          name: existing.name,
          description: existing.description,
          buildingId: existing.buildingId,
          floorId: existing.floorId ?? '',
          spaceId: existing.spaceId ?? '',
          triggerType: existing.trigger.type,
          triggerDeviceId: existing.trigger.deviceId ?? '',
          triggerPropertyId: existing.trigger.propertyId ?? '',
          triggerOperator: existing.trigger.operator ?? '>',
          triggerValue: existing.trigger.value ?? '',
          triggerTimeOfDay: existing.trigger.timeOfDay ?? '09:00',
          triggerOccupancyStatus: existing.trigger.occupancyStatus ?? 'occupied',
          conditions: existing.conditions.map((c) => ({ ...c })),
          actions: existing.actions.map((a) => ({ ...a })),
          schedule: existing.schedule
            ? { ...existing.schedule, days: [...existing.schedule.days] }
            : null,
        });
        this.hydrated.set(true);
      });
    });

    effect(() => {
      if (this.automationId() || this.model().buildingId) return;
      const buildingId = this.locationContext.selectedBuildingId();
      if (!buildingId) return;
      untracked(() => this.model.update((m) => ({ ...m, buildingId })));
    });
  }

  protected addCondition(): void {
    this.model.update((m) => ({ ...m, conditions: [...m.conditions, blankCondition()] }));
  }

  protected removeCondition(index: number): void {
    this.model.update((m) => ({ ...m, conditions: m.conditions.filter((_, i) => i !== index) }));
  }

  protected updateCondition(index: number, patch: Partial<AutomationCondition>): void {
    this.model.update((m) => ({
      ...m,
      conditions: m.conditions.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    }));
  }

  protected addAction(): void {
    this.model.update((m) => ({ ...m, actions: [...m.actions, blankAction()] }));
  }

  protected removeAction(index: number): void {
    this.model.update((m) => ({ ...m, actions: m.actions.filter((_, i) => i !== index) }));
  }

  protected updateAction(index: number, patch: Partial<AutomationAction>): void {
    this.model.update((m) => ({
      ...m,
      actions: m.actions.map((a, i) => (i === index ? { ...a, ...patch } : a)),
    }));
  }

  protected readonly scheduleEnabled = computed(() => this.model().schedule !== null);

  protected toggleScheduleEnabled(checked: boolean): void {
    this.model.update((m) => ({ ...m, schedule: checked ? emptyAutomationSchedule() : null }));
  }

  protected setScheduleHour(field: 'startHour' | 'endHour', value: string): void {
    this.model.update((m) =>
      m.schedule ? { ...m, schedule: { ...m.schedule, [field]: Number(value) } } : m,
    );
  }

  protected toggleScheduleDay(day: number, checked: boolean): void {
    this.model.update((m) => {
      if (!m.schedule) return m;
      const days = checked
        ? [...m.schedule.days, day].sort()
        : m.schedule.days.filter((d) => d !== day);
      return { ...m, schedule: { ...m.schedule, days } };
    });
  }

  protected async onSubmit(): Promise<void> {
    this.submitAttempted.set(true);
    this.submitting.set(true);
    try {
      await submit(this.automationForm, async () => {
        const value = this.model();
        const saved = await this.automationService.save(this.automationId() ?? null, {
          name: value.name,
          description: value.description,
          buildingId: value.buildingId,
          floorId: value.floorId || undefined,
          spaceId: value.spaceId || undefined,
          trigger:
            value.triggerType === 'device-property'
              ? {
                  type: 'device-property',
                  deviceId: value.triggerDeviceId,
                  propertyId: value.triggerPropertyId,
                  operator: value.triggerOperator,
                  value: value.triggerValue,
                }
              : value.triggerType === 'time'
                ? { type: 'time', timeOfDay: value.triggerTimeOfDay }
                : value.triggerType === 'occupancy-changed'
                  ? { type: 'occupancy-changed', occupancyStatus: value.triggerOccupancyStatus }
                  : { type: 'manual' },
          conditions: value.conditions,
          actions: value.actions,
          schedule: value.schedule,
        });
        await this.router.navigate(['/operations/automations', saved.id]);
      });
    } finally {
      this.submitting.set(false);
    }
  }

  protected readonly maintenancePriorityValue = (action: AutomationAction): MaintenancePriority =>
    action.maintenancePriority ?? 'medium';
}
