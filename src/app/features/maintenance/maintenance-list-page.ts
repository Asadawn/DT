import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideAlertTriangle,
  lucideCircleCheck,
  lucideClock,
  lucideRotateCcw,
  lucideWrench,
} from '@ng-icons/lucide';
import { BuildingService } from '../../domain/buildings/building.service';
import { MaintenanceService } from '../../domain/maintenance/maintenance.service';
import type { MaintenanceRequest } from '../../domain/maintenance/maintenance.types';
import { HlmButton } from '@spartan-ng/helm/button';
import { DtStatusChip } from '../../shared/ui/badge/status-chip';
import { DtKpiCard } from '../../shared/ui/cards/kpi-card';
import { DtCellTemplate } from '../../shared/ui/data-table/cell-template.directive';
import { DtDataTable } from '../../shared/ui/data-table/data-table';
import type { DtTableColumn } from '../../shared/ui/data-table/data-table.types';
import { DtFilterBar } from '../../shared/ui/filter-bar/filter-bar';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { DtSearchInput } from '../../shared/ui/search-input/search-input';
import type { SelectOption } from '../../shared/types/canonical.types';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { selectOptionLabelFn } from '../../shared/utils/select-option-label';
import { statusLabel as toStatusLabel } from '../../shared/utils/status-tone';

const STATUS_OPTIONS: SelectOption[] = [
  'created',
  'triage',
  'assigned',
  'in-progress',
  'complete',
  'verify',
  'closed',
  'rejected',
].map((s) => ({ value: s, label: toStatusLabel(s) }));

const PRIORITY_OPTIONS: SelectOption[] = ['low', 'medium', 'high', 'urgent'].map((p) => ({
  value: p,
  label: toStatusLabel(p),
}));

@Component({
  selector: 'app-maintenance-list-page',
  imports: [
    PageHeader,
    DtFilterBar,
    DtSearchInput,
    DtKpiCard,
    DtDataTable,
    DtCellTemplate,
    DtStatusChip,
    HlmButton,
    DatePipe,
    RouterLink,
    NgIcon,
    ...HlmCardImports,
    ...HlmSelectImports,
  ],
  providers: [
    provideIcons({
      lucideWrench,
      lucideClock,
      lucideAlertTriangle,
      lucideCircleCheck,
      lucideRotateCcw,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './maintenance-list-page.html',
})
export class MaintenanceListPage {
  private readonly maintenanceService = inject(MaintenanceService);
  private readonly buildingService = inject(BuildingService);
  private readonly router = inject(Router);

  protected readonly search = signal('');
  protected readonly status = signal('');
  protected readonly priority = signal('');
  protected readonly buildingId = signal('');

  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly statusLabel = selectOptionLabelFn(() => this.statusOptions);
  protected readonly priorityOptions = PRIORITY_OPTIONS;
  protected readonly priorityLabel = selectOptionLabelFn(() => this.priorityOptions);
  protected readonly buildingOptions = computed<SelectOption[]>(() =>
    this.buildingService.buildings().map((b) => ({ value: b.id, label: b.name })),
  );
  protected readonly buildingLabel = selectOptionLabelFn(this.buildingOptions);

  protected readonly activeFilterCount = computed(
    () => [this.status(), this.priority(), this.buildingId()].filter(Boolean).length,
  );
  protected readonly hasActiveFilters = computed(
    () => this.activeFilterCount() > 0 || this.search().length > 0,
  );

  protected resetFilters(): void {
    this.search.set('');
    this.status.set('');
    this.priority.set('');
    this.buildingId.set('');
  }

  protected readonly loading = this.maintenanceService.requestsLoading;

  protected readonly kpiTotal = computed(() => this.maintenanceService.requests().length);
  protected readonly kpiOpen = computed(
    () =>
      this.maintenanceService.requests().filter((r) => !['closed', 'rejected'].includes(r.status))
        .length,
  );
  protected readonly kpiUrgent = computed(
    () => this.maintenanceService.requests().filter((r) => r.priority === 'urgent').length,
  );
  protected readonly kpiClosed = computed(
    () => this.maintenanceService.requests().filter((r) => r.status === 'closed').length,
  );

  private percentOfTotal(count: number): number {
    const total = this.kpiTotal();
    return total > 0 ? Math.round((count / total) * 100) : 0;
  }
  protected readonly kpiOpenPercent = computed(() => this.percentOfTotal(this.kpiOpen()));
  protected readonly kpiUrgentPercent = computed(() => this.percentOfTotal(this.kpiUrgent()));
  protected readonly kpiClosedPercent = computed(() => this.percentOfTotal(this.kpiClosed()));

  protected readonly rows = computed(() =>
    this.maintenanceService.filtered({
      search: this.search(),
      status: (this.status() || undefined) as MaintenanceRequest['status'] | undefined,
      priority: (this.priority() || undefined) as MaintenanceRequest['priority'] | undefined,
      buildingId: this.buildingId() || undefined,
    }),
  );

  protected readonly columns: DtTableColumn<MaintenanceRequest>[] = [
    { id: 'title', label: 'Request', priority: 1, sortable: true, accessor: (r) => r.title },
    {
      id: 'location',
      label: 'Location',
      priority: 2,
      accessor: (r) => this.buildingService.building(r.buildingId)?.name ?? '',
    },
    { id: 'priority', label: 'Priority', priority: 1, sortable: true, accessor: (r) => r.priority },
    { id: 'status', label: 'Status', priority: 1, sortable: true, accessor: (r) => r.status },
    { id: 'category', label: 'Category', priority: 3, accessor: (r) => r.category },
    { id: 'assigned', label: 'Assigned', priority: 3, accessor: (r) => r.assignee ?? 'Unassigned' },
    { id: 'updated', label: 'Updated', priority: 2, sortable: true, accessor: (r) => r.updatedAt },
  ];

  protected readonly selectedIds = signal<ReadonlySet<string>>(new Set());
  protected readonly selectedCount = computed(() => this.selectedIds().size);
  protected readonly bulkPending = signal(false);

  protected openRequest(request: MaintenanceRequest): void {
    this.router.navigate(['/operations/maintenance', request.id]);
  }

  protected clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  protected async bulkSetStatus(status: MaintenanceRequest['status']): Promise<void> {
    this.bulkPending.set(true);
    try {
      await Promise.all(
        Array.from(this.selectedIds()).map((id) =>
          this.maintenanceService.updateStatus(id, status),
        ),
      );
      this.clearSelection();
    } finally {
      this.bulkPending.set(false);
    }
  }
}
