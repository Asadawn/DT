import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideActivity,
  lucideLeaf,
  lucidePlug,
  lucideRotateCcw,
  lucideUserCheck,
  lucideWind,
  lucideZap,
} from '@ng-icons/lucide';
import { BuildingService } from '../../domain/buildings/building.service';
import type { SelectOption } from '../../shared/types/canonical.types';
import { PageHeader, type BreadcrumbItem } from '../../shared/ui/page-header/page-header';
import { selectOptionLabelFn } from '../../shared/utils/select-option-label';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { AnalyticsSectionPanel, type AnalyticsSection } from './components/analytics-section-panel';
import { DtSectionShell } from '../../shared/ui/section/section-shell';
import { ElectricalParametersGrid } from './components/electrical-parameters-grid';
import { EnvironmentalParametersGrid } from './components/environmental-parameters-grid';
import { SocketControlsSection } from './components/socket-controls-section';
import { AqiSensorParameters } from './components/aqi-sensor-parameters';
import { AnalyticsFilterStateService } from './analytics-filter-state.service';

type RouteSection = AnalyticsSection | 'all';

const SECTION_LABELS: Record<AnalyticsSection, string> = {
  energy: 'Energy',
  electrical: 'Electrical',
  environment: 'Environment',
  aqi: 'AQI',
  occupancy: 'Occupancy',
  devices: 'Device Health',
};

const SECTION_DESCRIPTIONS: Record<AnalyticsSection, string> = {
  energy: 'Consumption trends by meter',
  electrical: 'Active power comparison across meters',
  environment: 'Temperature and humidity trends',
  aqi: 'Air quality index and particulates',
  occupancy: 'Booking-driven occupancy status and occupancy rate',
  devices: 'Connectivity and health across devices',
};

const SECTION_TABS: { path: string; label: string; exact: boolean }[] = [
  { path: '/analytics', label: 'Overview', exact: true },
  { path: '/analytics/energy', label: 'Energy', exact: false },
  { path: '/analytics/electrical', label: 'Electrical', exact: false },
  { path: '/analytics/environment', label: 'Environment', exact: false },
  { path: '/analytics/aqi', label: 'AQI', exact: false },
  { path: '/analytics/occupancy', label: 'Occupancy', exact: false },
];

@Component({
  selector: 'app-analytics-page',
  imports: [
    PageHeader,
    RouterLink,
    RouterLinkActive,
    AnalyticsSectionPanel,
    DtSectionShell,
    ElectricalParametersGrid,
    EnvironmentalParametersGrid,
    SocketControlsSection,
    AqiSensorParameters,
    NgIcon,
    ...HlmButtonImports,
    ...HlmCardImports,
    ...HlmSelectImports,
  ],
  providers: [
    provideIcons({
      lucideRotateCcw,
      lucideZap,
      lucideLeaf,
      lucidePlug,
      lucideWind,
      lucideUserCheck,
      lucideActivity,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './analytics-page.html',
})
export class AnalyticsPage {
  protected readonly sectionTabs = SECTION_TABS;
  protected readonly sectionLabels = SECTION_LABELS;
  protected readonly breadcrumb: BreadcrumbItem[] = [
    { label: 'Home', link: '/dashboard' },
    'Analytics',
  ];

  private readonly routeData = toSignal(inject(ActivatedRoute).data, { initialValue: {} });
  private readonly buildingService = inject(BuildingService);
  private readonly filterState = inject(AnalyticsFilterStateService);

  constructor() {
    effect(() => {
      if (this.isAll()) return;
      if (this.buildingId()) return;
      const first = this.buildingOptions()[0]?.value;
      if (first) untracked(() => this.buildingId.set(first));
    });
  }

  protected readonly section = computed(
    () => ((this.routeData() as { section?: RouteSection }).section ?? 'all') as RouteSection,
  );
  protected readonly isAll = computed(() => this.section() === 'all');
  protected readonly singleSection = computed<AnalyticsSection>(() =>
    this.isAll() ? 'devices' : (this.section() as AnalyticsSection),
  );

  protected readonly title = computed(() =>
    this.isAll() ? 'Analytics — Overview' : `Analytics — ${SECTION_LABELS[this.singleSection()]}`,
  );
  protected readonly description = computed(() =>
    this.isAll()
      ? 'Real-time monitoring across electrical, environmental, socket and air-quality systems'
      : SECTION_DESCRIPTIONS[this.singleSection()],
  );

  protected readonly buildingOptions = computed<SelectOption[]>(() =>
    this.buildingService.buildings().map((b) => ({ value: b.id, label: b.name })),
  );
  protected readonly buildingLabel = selectOptionLabelFn(this.buildingOptions);
  protected readonly buildingId = this.filterState.buildingId;

  protected readonly floorOptions = computed<SelectOption[]>(() =>
    this.buildingId()
      ? this.buildingService
          .floorsForBuilding(this.buildingId())
          .map((f) => ({ value: f.id, label: f.name }))
      : [],
  );
  protected readonly floorLabel = selectOptionLabelFn(this.floorOptions);
  protected readonly floorId = this.filterState.floorId;

  protected readonly spaceOptions = computed<SelectOption[]>(() =>
    this.floorId()
      ? this.buildingService
          .spacesForFloor(this.floorId())
          .map((s) => ({ value: s.id, label: s.name }))
      : [],
  );
  protected readonly spaceLabel = selectOptionLabelFn(this.spaceOptions);
  protected readonly spaceId = this.filterState.spaceId;

  protected readonly scopeLabel = computed(() =>
    [
      this.buildingId() && this.buildingLabel(this.buildingId()),
      this.floorId() && this.floorLabel(this.floorId()),
      this.spaceId() && this.spaceLabel(this.spaceId()),
    ]
      .filter(Boolean)
      .join(' • '),
  );

  protected onBuildingChange(value: string | null | undefined): void {
    this.buildingId.set(value ?? '');
    this.floorId.set('');
    this.spaceId.set('');
  }

  protected onFloorChange(value: string | null | undefined): void {
    this.floorId.set(value ?? '');
    this.spaceId.set('');
  }

  protected readonly hasActiveGlobalFilters = computed(() => {
    const defaultBuilding = this.buildingOptions()[0]?.value ?? '';
    return this.buildingId() !== defaultBuilding || !!this.floorId() || !!this.spaceId();
  });

  protected resetFilters(): void {
    this.buildingId.set('');
    this.floorId.set('');
    this.spaceId.set('');
  }
}
