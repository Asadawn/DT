import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideAlertTriangle,
  lucideCpu,
  lucideRotateCcw,
  lucideWifi,
  lucideWifiOff,
} from '@ng-icons/lucide';
import { BuildingService } from '../../domain/buildings/building.service';
import { DEVICE_CATEGORY_CONFIG } from '../../domain/devices/device-registry';
import { DeviceService } from '../../domain/devices/device.service';
import type { Device } from '../../domain/devices/device.types';
import type { SelectOption } from '../../shared/types/canonical.types';
import { DtStatusChip } from '../../shared/ui/badge/status-chip';
import { DtKpiCard } from '../../shared/ui/cards/kpi-card';
import { DtCellTemplate } from '../../shared/ui/data-table/cell-template.directive';
import { DtDataTable } from '../../shared/ui/data-table/data-table';
import type { DtTableColumn } from '../../shared/ui/data-table/data-table.types';
import { DtFilterBar } from '../../shared/ui/filter-bar/filter-bar';
import { PageHeader } from '../../shared/ui/page-header/page-header';
import { DtSearchInput } from '../../shared/ui/search-input/search-input';
import { selectOptionLabelFn } from '../../shared/utils/select-option-label';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmSelectImports } from '@spartan-ng/helm/select';

@Component({
  selector: 'app-devices-page',
  imports: [
    PageHeader,
    DtFilterBar,
    DtSearchInput,
    DtKpiCard,
    DtDataTable,
    DtCellTemplate,
    DtStatusChip,
    DatePipe,
    NgIcon,
    ...HlmCardImports,
    ...HlmSelectImports,
  ],
  providers: [
    provideIcons({ lucideCpu, lucideWifi, lucideWifiOff, lucideAlertTriangle, lucideRotateCcw }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './devices-page.html',
})
export class DevicesPage {
  private readonly deviceService = inject(DeviceService);
  private readonly buildingService = inject(BuildingService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly search = signal('');
  protected readonly buildingId = signal(this.route.snapshot.queryParamMap.get('buildingId') ?? '');
  protected readonly category = signal('');
  protected readonly connectivity = signal('');

  protected readonly buildingOptions = computed<SelectOption[]>(() =>
    this.buildingService.buildings().map((b) => ({ value: b.id, label: b.name })),
  );
  protected readonly buildingLabel = selectOptionLabelFn(this.buildingOptions);

  protected readonly categoryOptions: SelectOption[] = Object.entries(DEVICE_CATEGORY_CONFIG).map(
    ([value, config]) => ({ value, label: config.label }),
  );
  protected readonly categoryLabel = selectOptionLabelFn(() => this.categoryOptions);

  protected readonly connectivityOptions: SelectOption[] = [
    { value: 'online', label: 'Online' },
    { value: 'offline', label: 'Offline' },
    { value: 'stale', label: 'Stale' },
    { value: 'warning', label: 'Warning' },
    { value: 'error', label: 'Error' },
    { value: 'unknown', label: 'Unknown' },
  ];
  protected readonly connectivityLabel = selectOptionLabelFn(() => this.connectivityOptions);

  protected readonly activeFilterCount = computed(
    () => [this.buildingId(), this.category(), this.connectivity()].filter(Boolean).length,
  );
  protected readonly hasActiveFilters = computed(
    () => this.activeFilterCount() > 0 || this.search().length > 0,
  );

  protected resetFilters(): void {
    this.search.set('');
    this.buildingId.set('');
    this.category.set('');
    this.connectivity.set('');
  }

  protected readonly rows = computed(() =>
    this.deviceService.filtered({
      search: this.search(),
      buildingId: this.buildingId() || undefined,
      category: (this.category() || undefined) as Device['category'] | undefined,
      connectivity: (this.connectivity() || undefined) as Device['connectivity'] | undefined,
    }),
  );

  protected readonly loading = this.deviceService.devicesLoading;

  protected readonly kpiTotal = computed(() => this.deviceService.devices().length);
  protected readonly kpiOnline = computed(
    () => this.deviceService.devices().filter((d) => d.connectivity === 'online').length,
  );
  protected readonly kpiOffline = computed(
    () => this.deviceService.devices().filter((d) => d.connectivity === 'offline').length,
  );
  protected readonly kpiNeedsAttention = computed(
    () =>
      this.deviceService
        .devices()
        .filter(
          (d) =>
            d.connectivity === 'stale' ||
            d.connectivity === 'warning' ||
            d.connectivity === 'error',
        ).length,
  );

  private percentOfTotal(count: number): number {
    const total = this.kpiTotal();
    return total > 0 ? Math.round((count / total) * 100) : 0;
  }
  protected readonly kpiOnlinePercent = computed(() => this.percentOfTotal(this.kpiOnline()));
  protected readonly kpiOfflinePercent = computed(() => this.percentOfTotal(this.kpiOffline()));
  protected readonly kpiNeedsAttentionPercent = computed(() =>
    this.percentOfTotal(this.kpiNeedsAttention()),
  );

  protected readonly columns: DtTableColumn<Device>[] = [
    { id: 'name', label: 'Device', priority: 1, sortable: true, accessor: (d) => d.name },
    {
      id: 'category',
      label: 'Type',
      priority: 2,
      accessor: (d) => DEVICE_CATEGORY_CONFIG[d.category].label,
    },
    { id: 'location', label: 'Location', priority: 2, accessor: (d) => this.locationLabel(d) },
    { id: 'status', label: 'Status', priority: 1, sortable: true, accessor: (d) => d.connectivity },
    { id: 'reading', label: 'Key Reading', priority: 3, accessor: (d) => this.keyReading(d) },
    { id: 'lastSeen', label: 'Last Seen', priority: 3, accessor: (d) => d.lastSeenAt },
  ];

  protected locationLabel(device: Device): string {
    const building = this.buildingService.building(device.buildingId);
    const floor = this.buildingService.floor(device.floorId);
    return [building?.name, floor?.name].filter(Boolean).join(' / ');
  }

  protected keyReading(device: Device): string {
    const first = device.properties[0];
    if (!first) return '—';
    return `${first.value ?? '—'}${first.unit ? ' ' + first.unit : ''}`;
  }

  protected openDevice(device: Device): void {
    this.router.navigate(['/devices', device.id]);
  }
}
