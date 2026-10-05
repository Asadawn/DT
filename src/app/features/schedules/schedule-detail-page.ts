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
import { BuildingService } from '../../domain/buildings/building.service';
import { DeviceService } from '../../domain/devices/device.service';
import { ScheduleService } from '../../domain/maintenance/schedule.service';
import { emptyWeeklyGrid } from '../../domain/maintenance/schedule.types';
import type { SelectOption } from '../../shared/types/canonical.types';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmCheckboxImports } from '@spartan-ng/helm/checkbox';
import { HlmDatePickerImports } from '@spartan-ng/helm/date-picker';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { dateToIso, isoToDate } from '../../shared/utils/date-only';
import { selectOptionLabelFn } from '../../shared/utils/select-option-label';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface ScheduleModel {
  name: string;
  buildingId: string;
  deviceIds: string[];
  weeklyGrid: boolean[][];
  endDate: string;
}

@Component({
  selector: 'app-schedule-detail-page',
  imports: [
    FormField,
    RouterLink,
    NgIcon,
    ...HlmButtonImports,
    ...HlmCardImports,
    ...HlmSelectImports,
    ...HlmCheckboxImports,
    ...HlmDatePickerImports,
    ...HlmInputImports,
  ],
  providers: [provideIcons({ lucideChevronLeft })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './schedule-detail-page.html',
})
export class ScheduleDetailPage {
  readonly scheduleId = input<string>();

  private readonly scheduleService = inject(ScheduleService);
  private readonly buildingService = inject(BuildingService);
  private readonly deviceService = inject(DeviceService);
  private readonly router = inject(Router);

  protected readonly dayLabels = DAY_LABELS;
  protected readonly hours = Array.from({ length: 24 }, (_, i) => i);

  protected readonly existing = computed(() => this.scheduleService.schedule(this.scheduleId()));

  protected readonly buildingOptions = computed<SelectOption[]>(() =>
    this.buildingService.buildings().map((b) => ({ value: b.id, label: b.name })),
  );
  protected readonly buildingLabel = selectOptionLabelFn(this.buildingOptions);

  protected readonly model = signal<ScheduleModel>({
    name: '',
    buildingId: '',
    deviceIds: [],
    weeklyGrid: emptyWeeklyGrid(),
    endDate: '',
  });

  protected readonly devicesInBuilding = computed(() =>
    this.model().buildingId
      ? this.deviceService.devices().filter((d) => d.buildingId === this.model().buildingId)
      : [],
  );

  protected readonly scheduleForm = form(this.model, (p) => {
    required(p.name, { message: 'Name is required' });
    required(p.buildingId, { message: 'Select a building' });
  });

  protected readonly submitting = signal(false);
  protected readonly submitAttempted = signal(false);

  private readonly hydrated = signal(false);

  constructor() {
    effect(() => {
      if (this.hydrated() || !this.scheduleId()) return;
      const existing = this.existing();
      if (!existing) return;
      untracked(() => {
        this.model.set({
          name: existing.name,
          buildingId: existing.buildingId,
          deviceIds: [...existing.deviceIds],
          weeklyGrid: existing.weeklyGrid.map((day) => [...day]),
          endDate: existing.endDate ?? '',
        });
        this.hydrated.set(true);
      });
    });
  }

  protected readonly isoToDate = isoToDate;

  protected setEndDate(date: Date | null): void {
    this.model.update((m) => ({ ...m, endDate: dateToIso(date) }));
  }

  protected toggleDevice(deviceId: string, checked: boolean): void {
    this.model.update((m) => ({
      ...m,
      deviceIds: checked ? [...m.deviceIds, deviceId] : m.deviceIds.filter((id) => id !== deviceId),
    }));
  }

  protected toggleCell(day: number, hour: number): void {
    this.model.update((m) => {
      const weeklyGrid = m.weeklyGrid.map((d) => [...d]);
      weeklyGrid[day][hour] = !weeklyGrid[day][hour];
      return { ...m, weeklyGrid };
    });
  }

  protected applyBusinessHours(): void {
    const grid = emptyWeeklyGrid();
    for (let day = 1; day <= 5; day++) {
      for (let hour = 8; hour < 18; hour++) grid[day][hour] = true;
    }
    this.model.update((m) => ({ ...m, weeklyGrid: grid }));
  }

  protected clearGrid(): void {
    this.model.update((m) => ({ ...m, weeklyGrid: emptyWeeklyGrid() }));
  }

  protected async onSubmit(): Promise<void> {
    this.submitAttempted.set(true);
    this.submitting.set(true);
    try {
      await submit(this.scheduleForm, async () => {
        const value = this.model();
        const saved = await this.scheduleService.save(this.scheduleId() ?? null, {
          name: value.name,
          buildingId: value.buildingId,
          deviceIds: value.deviceIds,
          weeklyGrid: value.weeklyGrid,
          endDate: value.endDate || null,
        });
        await this.router.navigate(['/operations/schedules', saved.id]);
      });
    } finally {
      this.submitting.set(false);
    }
  }
}
