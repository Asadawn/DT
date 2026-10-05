import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { required, form, FormField } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideRotateCcw } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { AutomationService } from '../../domain/automations/automation.service';
import { BuildingService } from '../../domain/buildings/building.service';
import type { Space, SpaceKind } from '../../domain/buildings/building.types';
import { DeviceService } from '../../domain/devices/device.service';
import type { SelectOption } from '../../shared/types/canonical.types';
import { HasPermission } from '../../shared/directives/has-permission.directive';
import { DtDataTable } from '../../shared/ui/data-table/data-table';
import type { DtTableColumn } from '../../shared/ui/data-table/data-table.types';
import { DtFilterBar } from '../../shared/ui/filter-bar/filter-bar';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { DtSearchInput } from '../../shared/ui/search-input/search-input';
import { selectOptionLabelFn } from '../../shared/utils/select-option-label';
import { seedSmartRoom } from './smart-room-seeder';

interface SpaceRow extends Space {
  buildingName: string;
  floorName: string;
}

const KIND_OPTIONS: SelectOption[] = [
  { value: 'office', label: 'Office' },
  { value: 'meeting-room', label: 'Meeting Room' },
  { value: 'common-area', label: 'Common Area' },
  { value: 'mechanical', label: 'Mechanical' },
  { value: 'retail', label: 'Retail' },
];

@Component({
  selector: 'app-spaces-page',
  imports: [
    PageHeader,
    DtDataTable,
    DtFilterBar,
    DtSearchInput,
    HasPermission,
    FormField,
    NgIcon,
    ...HlmButtonImports,
    ...HlmCardImports,
    ...HlmDialogImports,
    ...HlmInputImports,
    ...HlmSelectImports,
  ],
  providers: [provideIcons({ lucideRotateCcw })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './spaces-page.html',
})
export class SpacesPage {
  private readonly buildingService = inject(BuildingService);
  private readonly deviceService = inject(DeviceService);
  private readonly automationService = inject(AutomationService);
  private readonly router = inject(Router);

  protected readonly allRows = computed<SpaceRow[]>(() =>
    this.buildingService.buildings().flatMap((building) =>
      this.buildingService.spacesForBuilding(building.id).map((space) => ({
        ...space,
        buildingName: building.name,
        floorName: this.buildingService.floor(space.floorId)?.name ?? space.floorId,
      })),
    ),
  );

  protected readonly search = signal('');
  protected readonly filterBuildingId = signal('');
  protected readonly filterFloorId = signal('');
  protected readonly filterKind = signal('');

  protected readonly filterKindOptions = KIND_OPTIONS;
  protected readonly filterKindLabel = selectOptionLabelFn(() => KIND_OPTIONS);

  protected readonly filterFloorOptions = computed<SelectOption[]>(() => {
    const buildingId = this.filterBuildingId();
    if (buildingId) {
      return this.buildingService
        .floorsForBuilding(buildingId)
        .map((f) => ({ value: f.id, label: f.name }));
    }
    return this.buildingService
      .buildings()
      .flatMap((building) =>
        this.buildingService
          .floorsForBuilding(building.id)
          .map((f) => ({ value: f.id, label: `${f.name} — ${building.name}` })),
      );
  });
  protected readonly filterFloorLabel = selectOptionLabelFn(this.filterFloorOptions);

  protected readonly activeFilterCount = computed(
    () => [this.filterBuildingId(), this.filterFloorId(), this.filterKind()].filter(Boolean).length,
  );
  protected readonly hasActiveFilters = computed(
    () => this.activeFilterCount() > 0 || this.search().length > 0,
  );

  protected onFilterBuildingChange(value: string): void {
    this.filterBuildingId.set(value);
    this.filterFloorId.set('');
  }

  protected resetFilters(): void {
    this.search.set('');
    this.filterBuildingId.set('');
    this.filterFloorId.set('');
    this.filterKind.set('');
  }

  protected readonly rows = computed<SpaceRow[]>(() => {
    const search = this.search().trim().toLowerCase();
    const buildingId = this.filterBuildingId();
    const floorId = this.filterFloorId();
    const kind = this.filterKind();
    return this.allRows().filter((row) => {
      if (search && !row.name.toLowerCase().includes(search)) return false;
      if (buildingId && row.buildingId !== buildingId) return false;
      if (floorId && row.floorId !== floorId) return false;
      if (kind && row.kind !== kind) return false;
      return true;
    });
  });

  protected readonly columns: DtTableColumn<SpaceRow>[] = [
    { id: 'name', label: 'Space', priority: 1, sortable: true, accessor: (r) => r.name },
    {
      id: 'building',
      label: 'Building',
      priority: 1,
      sortable: true,
      accessor: (r) => r.buildingName,
    },
    { id: 'floor', label: 'Floor', priority: 2, sortable: true, accessor: (r) => r.floorName },
    { id: 'kind', label: 'Type', priority: 2, accessor: (r) => this.kindLabelFor(r.kind) },
  ];

  private kindLabelFor(kind: SpaceKind): string {
    return KIND_OPTIONS.find((o) => o.value === kind)?.label ?? kind;
  }

  protected openSpace(row: SpaceRow): void {
    this.router.navigate(['/spaces', row.id]);
  }

  protected readonly showAddSpace = signal(false);
  protected readonly submitting = signal(false);

  protected readonly identityModel = signal({ name: '' });
  protected readonly identityForm = form(this.identityModel, (p) => {
    required(p.name, { message: 'Space name is required' });
  });

  protected readonly buildingOptions = computed<SelectOption[]>(() =>
    this.buildingService.buildings().map((b) => ({ value: b.id, label: b.name })),
  );
  protected readonly buildingLabel = selectOptionLabelFn(this.buildingOptions);
  protected readonly buildingId = signal('');

  protected readonly floorOptions = computed<SelectOption[]>(() =>
    this.buildingId()
      ? this.buildingService
          .floorsForBuilding(this.buildingId())
          .map((f) => ({ value: f.id, label: f.name }))
      : [],
  );
  protected readonly floorLabel = selectOptionLabelFn(this.floorOptions);
  protected readonly floorId = signal('');

  protected readonly kindOptions = KIND_OPTIONS;
  protected readonly kindLabel = selectOptionLabelFn(() => KIND_OPTIONS);
  protected readonly kind = signal<SpaceKind>('office');

  protected onBuildingChange(value: string): void {
    this.buildingId.set(value);
    this.floorId.set('');
  }

  protected canSubmit(): boolean {
    return this.identityModel().name.trim().length > 0 && !!this.buildingId() && !!this.floorId();
  }

  protected async createSmartRoom(): Promise<void> {
    if (!this.canSubmit()) return;
    this.submitting.set(true);
    try {
      const space = await this.buildingService.createSpace({
        name: this.identityModel().name.trim(),
        buildingId: this.buildingId(),
        floorId: this.floorId(),
        kind: this.kind(),
      });

      await seedSmartRoom(this.deviceService, this.automationService, space);

      this.showAddSpace.set(false);
      await this.router.navigate([
        '/buildings',
        space.buildingId,
        'floors',
        space.floorId,
        'spaces',
        space.id,
      ]);
    } finally {
      this.submitting.set(false);
    }
  }
}
