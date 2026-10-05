import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  resource,
  signal,
} from '@angular/core';
import { BuildingService } from '../../../domain/buildings/building.service';
import { DeviceService } from '../../../domain/devices/device.service';
import { currentTimeRange, TelemetryService } from '../../../domain/telemetry/telemetry.service';
import { DtBarChart } from '../../../shared/ui/chart/bar-chart';
import { DtChartCard } from '../../../shared/ui/chart/chart-card';
import { DtChartRangeToggle } from '../../../shared/ui/chart/chart-range-toggle';
import { DtMultiSeriesChart } from '../../../shared/ui/chart/multi-series-chart';
import {
  deviceNames,
  loadMultiMetricSeries,
  matchesLocationScope,
  snapshotValues,
} from '../analytics-multi-series.util';

const LINE_METRICS = ['voltage', 'current', 'powerFactor', 'frequency', 'activePower'] as const;

@Component({
  selector: 'app-electrical-parameters-grid',
  imports: [DtChartCard, DtChartRangeToggle, DtBarChart, DtMultiSeriesChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './electrical-parameters-grid.html',
})
export class ElectricalParametersGrid {
  readonly buildingId = input('');
  readonly floorId = input('');
  readonly spaceId = input('');
  readonly range = input<string>();

  private readonly deviceService = inject(DeviceService);
  private readonly telemetryService = inject(TelemetryService);
  private readonly buildingService = inject(BuildingService);

  protected readonly internalRangeId = signal('24h');
  protected readonly rangeId = computed(() => this.range() ?? this.internalRangeId());

  protected readonly meters = computed(() =>
    this.deviceService
      .devices()
      .filter(
        (d) =>
          d.category === 'energy-meter' &&
          matchesLocationScope(d, this.buildingId(), this.floorId(), this.spaceId()),
      ),
  );

  protected readonly energyLabels = computed(() => deviceNames(this.meters()));
  protected readonly energyValues = computed(() => snapshotValues(this.meters(), 'energy'));
  protected readonly reactiveValues = computed(() =>
    snapshotValues(this.meters(), 'reactivePower'),
  );
  protected readonly apparentValues = computed(() =>
    snapshotValues(this.meters(), 'apparentPower'),
  );

  private readonly series = resource({
    params: () => ({
      deviceIds: this.meters().map((d) => d.id),
      range: currentTimeRange(this.rangeId() as '6h' | '24h' | '7d' | '30d' | '6m'),
    }),
    loader: ({ params }) =>
      loadMultiMetricSeries(
        this.telemetryService,
        this.deviceService,
        this.buildingService,
        params.deviceIds,
        [...LINE_METRICS],
        params.range,
      ),
  });

  protected readonly isLoading = computed(() => this.series.isLoading());
  protected readonly hasError = computed(() => !!this.series.error());
  private readonly result = computed(() => this.series.value());

  protected readonly voltage = computed(
    () => this.result()?.['voltage'] ?? { labels: [], series: [] },
  );
  protected readonly current = computed(
    () => this.result()?.['current'] ?? { labels: [], series: [] },
  );
  protected readonly powerFactor = computed(
    () => this.result()?.['powerFactor'] ?? { labels: [], series: [] },
  );
  protected readonly frequency = computed(
    () => this.result()?.['frequency'] ?? { labels: [], series: [] },
  );
  protected readonly activePower = computed(
    () => this.result()?.['activePower'] ?? { labels: [], series: [] },
  );

  protected noData(metric: { series: unknown[] }): boolean {
    return !this.isLoading() && metric.series.length === 0;
  }
}
