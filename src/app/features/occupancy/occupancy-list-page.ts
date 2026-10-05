import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCalendarClock,
  lucideDoorOpen,
  lucideEye,
  lucideLayoutGrid,
  lucideLogIn,
  lucideLogOut,
  lucideRotateCcw,
  lucideSquarePen,
  lucideUsers,
} from '@ng-icons/lucide';
import { toast } from '@spartan-ng/brain/sonner';
import { BuildingService } from '../../domain/buildings/building.service';
import type { Space } from '../../domain/buildings/building.types';
import { BookingService } from '../../domain/bookings/booking.service';
import { OccupancyService } from '../../domain/occupancy/occupancy.service';
import type { OccupancyState, OccupancyStatus } from '../../domain/occupancy/occupancy.types';
import type { LocationRef, SelectOption } from '../../shared/types/canonical.types';
import { HasPermission } from '../../shared/directives/has-permission.directive';
import { DtStatusChip } from '../../shared/ui/badge/status-chip';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';
import { DtCellTemplate } from '../../shared/ui/data-table/cell-template.directive';
import { DtDataTable } from '../../shared/ui/data-table/data-table';
import type { DtTableColumn } from '../../shared/ui/data-table/data-table.types';
import { DtFilterBar } from '../../shared/ui/filter-bar/filter-bar';
import { DtKpiCard } from '../../shared/ui/cards/kpi-card';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { DtSearchInput } from '../../shared/ui/search-input/search-input';
import { selectOptionLabelFn } from '../../shared/utils/select-option-label';

interface OccupancyRow {
  id: string;
  space: Space;
  location: LocationRef;
  reading: OccupancyState;
}

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'occupied', label: 'Occupied' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'vacant', label: 'Vacant' },
];

@Component({
  selector: 'app-occupancy-list-page',
  imports: [
    PageHeader,
    DtFilterBar,
    DtSearchInput,
    DtKpiCard,
    DtDataTable,
    DtCellTemplate,
    DtStatusChip,
    HlmButton,
    HasPermission,
    RouterLink,
    DatePipe,
    NgIcon,
    ...HlmCardImports,
    ...HlmSelectImports,
    ...HlmTooltipImports,
  ],
  providers: [
    provideIcons({
      lucideLogIn,
      lucideLogOut,
      lucideEye,
      lucideSquarePen,
      lucideLayoutGrid,
      lucideUsers,
      lucideCalendarClock,
      lucideDoorOpen,
      lucideRotateCcw,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './occupancy-list-page.html',
})
export class OccupancyListPage {
  private readonly buildingService = inject(BuildingService);
  protected readonly occupancyService = inject(OccupancyService);
  protected readonly bookingService = inject(BookingService);
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

  private readonly allSpaces = computed<Space[]>(() =>
    this.buildingService.buildings().flatMap((b) => this.buildingService.spacesForBuilding(b.id)),
  );

  private readonly allRows = computed<OccupancyRow[]>(() =>
    this.allSpaces().map((space) => {
      const location: LocationRef = {
        buildingId: space.buildingId,
        floorId: space.floorId,
        spaceId: space.id,
      };
      const reading = this.occupancyService.reading(location);
      return { id: space.id, space, location, reading };
    }),
  );

  protected readonly kpiCounts = computed(() =>
    this.occupancyService.rollup(this.allRows().map((r) => r.reading)),
  );

  private percentOfTotal(count: number): number {
    const total = this.kpiCounts().total;
    return total > 0 ? Math.round((count / total) * 100) : 0;
  }
  protected readonly kpiOccupiedPercent = computed(() =>
    this.percentOfTotal(this.kpiCounts().occupied),
  );
  protected readonly kpiReservedPercent = computed(() =>
    this.percentOfTotal(this.kpiCounts().reserved),
  );
  protected readonly kpiVacantPercent = computed(() =>
    this.percentOfTotal(this.kpiCounts().vacant),
  );

  protected readonly rows = computed(() => {
    const search = this.search().trim().toLowerCase();
    const status = this.status() as OccupancyStatus | '';
    const buildingId = this.buildingId();
    return this.allRows().filter((row) => {
      if (search) {
        const haystack = `${row.space.name} ${row.reading.guestName ?? ''}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      if (status && row.reading.status !== status) return false;
      if (buildingId && row.space.buildingId !== buildingId) return false;
      return true;
    });
  });

  protected readonly columns: DtTableColumn<OccupancyRow>[] = [
    { id: 'space', label: 'Space', priority: 1, sortable: true, accessor: (r) => r.space.name },
    {
      id: 'location',
      label: 'Location',
      priority: 2,
      accessor: (r) =>
        [
          this.buildingService.building(r.space.buildingId)?.name,
          this.buildingService.floor(r.space.floorId)?.name,
        ]
          .filter(Boolean)
          .join(' / '),
    },
    { id: 'guest', label: 'Guest', priority: 2, accessor: (r) => r.reading.guestName ?? '' },
    {
      id: 'updated',
      label: 'Updated',
      priority: 3,
      sortable: true,
      accessor: (r) => r.reading.lastUpdatedAt,
    },
    {
      id: 'status',
      label: 'Status',
      priority: 1,
      sortable: true,
      accessor: (r) => r.reading.status,
    },
    { id: 'actions', label: 'Actions', priority: 2, align: 'end', accessor: () => '' },
  ];

  protected openSpace(row: OccupancyRow): void {
    this.router.navigate([
      '/buildings',
      row.space.buildingId,
      'floors',
      row.space.floorId,
      'spaces',
      row.space.id,
    ]);
  }

  protected async checkIn(row: OccupancyRow, event: Event): Promise<void> {
    event.stopPropagation();
    const bookingId = row.reading.bookingId;
    if (!bookingId) return;
    try {
      await this.bookingService.checkIn(bookingId);
      toast.success(`Checked in ${row.reading.guestName ?? 'guest'}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not check in.');
    }
  }

  protected async checkOut(row: OccupancyRow, event: Event): Promise<void> {
    event.stopPropagation();
    const bookingId = row.reading.bookingId;
    if (!bookingId) return;
    try {
      await this.bookingService.checkOut(bookingId);
      toast.success(`Checked out ${row.reading.guestName ?? 'guest'}`, {
        description: 'A cleaning ticket was created.',
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not check out.');
    }
  }
}
