import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BuildingService } from '../../domain/buildings/building.service';
import { ScheduleService } from '../../domain/maintenance/schedule.service';
import type { Schedule } from '../../domain/maintenance/schedule.types';
import { HlmButton } from '@spartan-ng/helm/button';
import { DtStatusChip } from '../../shared/ui/badge/status-chip';
import { DtCellTemplate } from '../../shared/ui/data-table/cell-template.directive';
import { DtDataTable } from '../../shared/ui/data-table/data-table';
import type { DtTableColumn } from '../../shared/ui/data-table/data-table.types';
import { PageHeader } from '../../shared/ui/page-header/page-header';

@Component({
  selector: 'app-schedules-page',
  imports: [PageHeader, DtDataTable, DtCellTemplate, DtStatusChip, HlmButton, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './schedules-page.html',
})
export class SchedulesPage {
  private readonly scheduleService = inject(ScheduleService);
  private readonly buildingService = inject(BuildingService);
  private readonly router = inject(Router);

  protected readonly loading = this.scheduleService.schedulesLoading;
  protected readonly rows = this.scheduleService.schedules;

  protected readonly columns: DtTableColumn<Schedule>[] = [
    { id: 'name', label: 'Schedule', priority: 1, sortable: true, accessor: (s) => s.name },
    { id: 'building', label: 'Location', priority: 2, accessor: (s) => this.buildingService.building(s.buildingId)?.name ?? '' },
    { id: 'devices', label: 'Devices', priority: 2, accessor: (s) => s.deviceIds.length },
    { id: 'status', label: 'Status', priority: 1, sortable: true, accessor: (s) => s.status },
  ];

  protected openSchedule(schedule: Schedule): void {
    this.router.navigate(['/operations/schedules', schedule.id]);
  }
}
