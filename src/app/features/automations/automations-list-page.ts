import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideRotateCcw } from '@ng-icons/lucide';
import { BuildingService } from '../../domain/buildings/building.service';
import { AutomationService } from '../../domain/automations/automation.service';
import { describeTrigger } from '../../domain/automations/automation-summary.util';
import type { Automation, AutomationStatus } from '../../domain/automations/automation.types';
import { DeviceService } from '../../domain/devices/device.service';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { DtStatusChip } from '../../shared/ui/badge/status-chip';
import { DtCellTemplate } from '../../shared/ui/data-table/cell-template.directive';
import { DtDataTable } from '../../shared/ui/data-table/data-table';
import type { DtTableColumn } from '../../shared/ui/data-table/data-table.types';
import { DtFilterBar } from '../../shared/ui/filter-bar/filter-bar';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { DtSearchInput } from '../../shared/ui/search-input/search-input';
import type { SelectOption } from '../../shared/types/canonical.types';
import { selectOptionLabelFn } from '../../shared/utils/select-option-label';
import { HasPermission } from '../../shared/directives/has-permission.directive';

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'enabled', label: 'Enabled' },
  { value: 'disabled', label: 'Disabled' },
];

@Component({
  selector: 'app-automations-list-page',
  imports: [
    PageHeader,
    DtFilterBar,
    DtSearchInput,
    DtDataTable,
    DtCellTemplate,
    DtStatusChip,
    HlmButton,
    DatePipe,
    RouterLink,
    HasPermission,
    NgIcon,
    ...HlmCardImports,
    ...HlmSelectImports,
  ],
  providers: [provideIcons({ lucideRotateCcw })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './automations-list-page.html',
})
export class AutomationsListPage {
  private readonly automationService = inject(AutomationService);
  private readonly buildingService = inject(BuildingService);
  private readonly deviceService = inject(DeviceService);
  private readonly router = inject(Router);

  protected readonly search = signal('');
  protected readonly status = signal('');
  protected readonly buildingId = signal('');

  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly statusLabel = selectOptionLabelFn(() => this.statusOptions);
  protected readonly buildingOptions = computed<SelectOption[]>(() =>
    this.buildingService.buildings().map((b) => ({ value: b.id, label: b.name })),
  );
  protected readonly buildingLabel = selectOptionLabelFn(this.buildingOptions);

  protected readonly activeFilterCount = computed(
    () => [this.status(), this.buildingId()].filter(Boolean).length,
  );
  protected readonly hasActiveFilters = computed(
    () => this.activeFilterCount() > 0 || this.search().length > 0,
  );

  protected resetFilters(): void {
    this.search.set('');
    this.status.set('');
    this.buildingId.set('');
  }

  protected readonly loading = this.automationService.automationsLoading;

  protected readonly rows = computed(() =>
    this.automationService.filtered({
      search: this.search(),
      status: (this.status() || undefined) as AutomationStatus | undefined,
      buildingId: this.buildingId() || undefined,
    }),
  );

  protected readonly columns: DtTableColumn<Automation>[] = [
    { id: 'name', label: 'Automation', priority: 1, sortable: true, accessor: (a) => a.name },
    {
      id: 'location',
      label: 'Location',
      priority: 2,
      accessor: (a) => this.buildingService.building(a.buildingId)?.name ?? '',
    },
    {
      id: 'trigger',
      label: 'Trigger',
      priority: 2,
      accessor: (a) => describeTrigger(a, this.deviceService),
    },
    { id: 'status', label: 'Status', priority: 1, sortable: true, accessor: (a) => a.status },
    { id: 'updated', label: 'Updated', priority: 3, sortable: true, accessor: (a) => a.updatedAt },
  ];

  protected readonly togglingId = signal<string | null>(null);

  protected openAutomation(automation: Automation): void {
    this.router.navigate(['/operations/automations', automation.id]);
  }

  protected async toggleStatus(automation: Automation, event: Event): Promise<void> {
    event.stopPropagation();
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
