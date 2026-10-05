import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideRotateCcw } from '@ng-icons/lucide';
import { BuildingService } from '../../domain/buildings/building.service';
import { AccessAssignmentService } from '../../domain/access/access-assignment.service';
import type {
  AccessAssignment,
  AccessAssignmentStatus,
} from '../../domain/access/access-assignment.types';
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
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'active', label: 'Active' },
  { value: 'expired', label: 'Expired' },
  { value: 'revoked', label: 'Revoked' },
];

@Component({
  selector: 'app-access-assignments-page',
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
  templateUrl: './access-assignments-page.html',
})
export class AccessAssignmentsPage {
  private readonly assignmentService = inject(AccessAssignmentService);
  private readonly buildingService = inject(BuildingService);
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
  protected readonly loading = this.assignmentService.assignmentsLoading;

  protected resetFilters(): void {
    this.search.set('');
    this.status.set('');
    this.buildingId.set('');
  }

  protected readonly rows = computed(() =>
    this.assignmentService.filtered({
      search: this.search(),
      status: (this.status() || undefined) as AccessAssignmentStatus | undefined,
      buildingId: this.buildingId() || undefined,
    }),
  );

  protected readonly columns: DtTableColumn<AccessAssignment>[] = [
    {
      id: 'principal',
      label: 'Principal',
      priority: 1,
      sortable: true,
      accessor: (a) => a.principalName,
    },
    { id: 'roleLabel', label: 'Purpose', priority: 2, accessor: (a) => a.roleLabel },
    {
      id: 'location',
      label: 'Location',
      priority: 2,
      accessor: (a) => this.buildingService.building(a.buildingId)?.name ?? '',
    },
    {
      id: 'status',
      label: 'Status',
      priority: 1,
      sortable: true,
      accessor: (a) => this.assignmentService.status(a),
    },
    {
      id: 'validUntil',
      label: 'Valid Until',
      priority: 3,
      sortable: true,
      accessor: (a) => a.validUntil,
    },
  ];

  protected readonly statusOf = (assignment: AccessAssignment) =>
    this.assignmentService.status(assignment);

  protected openAssignment(assignment: AccessAssignment): void {
    this.router.navigate(['/operations/access-assignments', assignment.id]);
  }
}
