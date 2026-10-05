import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideRotateCcw } from '@ng-icons/lucide';
import { VendorService } from '../../domain/vendors/vendor.service';
import {
  MAINTENANCE_CATEGORY_LABELS,
  type MaintenanceCategory,
} from '../../domain/maintenance/maintenance.types';
import type { Vendor, VendorStatus } from '../../domain/vendors/vendor.types';
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

const SPECIALTY_OPTIONS: SelectOption[] = (
  Object.keys(MAINTENANCE_CATEGORY_LABELS) as MaintenanceCategory[]
).map((c) => ({
  value: c,
  label: MAINTENANCE_CATEGORY_LABELS[c],
}));
const STATUS_OPTIONS: SelectOption[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

@Component({
  selector: 'app-vendors-list-page',
  imports: [
    PageHeader,
    DtFilterBar,
    DtSearchInput,
    DtDataTable,
    DtCellTemplate,
    DtStatusChip,
    HlmButton,
    RouterLink,
    HasPermission,
    NgIcon,
    ...HlmCardImports,
    ...HlmSelectImports,
  ],
  providers: [provideIcons({ lucideRotateCcw })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './vendors-list-page.html',
})
export class VendorsListPage {
  private readonly vendorService = inject(VendorService);
  private readonly router = inject(Router);

  protected readonly search = signal('');
  protected readonly specialty = signal('');
  protected readonly status = signal('');

  protected readonly specialtyOptions = SPECIALTY_OPTIONS;
  protected readonly specialtyLabel = selectOptionLabelFn(() => this.specialtyOptions);
  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly statusLabel = selectOptionLabelFn(() => this.statusOptions);

  protected readonly activeFilterCount = computed(
    () => [this.specialty(), this.status()].filter(Boolean).length,
  );
  protected readonly hasActiveFilters = computed(
    () => this.activeFilterCount() > 0 || this.search().length > 0,
  );
  protected readonly loading = this.vendorService.vendorsLoading;

  protected resetFilters(): void {
    this.search.set('');
    this.specialty.set('');
    this.status.set('');
  }

  protected readonly rows = computed(() =>
    this.vendorService.filtered({
      search: this.search(),
      specialty: (this.specialty() || undefined) as MaintenanceCategory | undefined,
      status: (this.status() || undefined) as VendorStatus | undefined,
    }),
  );

  protected readonly columns: DtTableColumn<Vendor>[] = [
    { id: 'name', label: 'Vendor', priority: 1, sortable: true, accessor: (v) => v.name },
    {
      id: 'contact',
      label: 'Contact',
      priority: 2,
      accessor: (v) => `${v.contactName} · ${v.contactEmail}`,
    },
    {
      id: 'specialties',
      label: 'Specialties',
      priority: 2,
      accessor: (v) => v.specialties.join(', '),
    },
    { id: 'status', label: 'Status', priority: 1, sortable: true, accessor: (v) => v.status },
  ];

  protected categoryLabel(specialty: MaintenanceCategory): string {
    return MAINTENANCE_CATEGORY_LABELS[specialty];
  }

  protected openVendor(vendor: Vendor): void {
    this.router.navigate(['/operations/vendors', vendor.id]);
  }
}
