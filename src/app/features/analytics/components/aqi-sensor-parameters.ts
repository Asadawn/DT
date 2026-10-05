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
import { DtChartCard } from '../../../shared/ui/chart/chart-card';
import { DtChartRangeToggle } from '../../../shared/ui/chart/chart-range-toggle';
import { DtGauge } from '../../../shared/ui/chart/gauge';
import { DtMultiSeriesChart } from '../../../shared/ui/chart/multi-series-chart';
import { aqiBand } from '../aqi-band.util';
import { loadMultiMetricSeries, matchesLocationScope } from '../analytics-multi-series.util';

const AQI_METRICS = ['aqi', 'iaq', 'tvoc', 'eco2', 'pm1', 'pm25', 'pm10'] as const;

@Component({
  selector: 'app-aqi-sensor-parameters',
  imports: [DtChartCard, DtChartRangeToggle, DtGauge, DtMultiSeriesChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './aqi-sensor-parameters.html',
})
export class AqiSensorParameters {
  readonly buildingId = input('');
  readonly floorId = input('');
  readonly spaceId = input('');

  private readonly deviceService = inject(DeviceService);
  private readonly telemetryService = inject(TelemetryService);
  private readonly buildingService = inject(BuildingService);

  protected readonly rangeId = signal('24h');

  protected readonly sensors = computed(() =>
    this.deviceService
      .devices()
      .filter(
        (d) =>
          d.category === 'air-quality' &&
          matchesLocationScope(d, this.buildingId(), this.floorId(), this.spaceId()),
      ),
  );

  private readonly series = resource({
    params: () => ({
      deviceIds: this.sensors().map((d) => d.id),
      range: currentTimeRange(this.rangeId() as '6h' | '24h' | '7d' | '30d' | '6m'),
    }),
    loader: ({ params }) =>
      loadMultiMetricSeries(
        this.telemetryService,
        this.deviceService,
        this.buildingService,
        params.deviceIds,
        [...AQI_METRICS],
        params.range,
      ),
  });

  protected readonly isLoading = computed(() => this.series.isLoading());
  private readonly result = computed(() => this.series.value());

  protected readonly aqi = computed(() => this.result()?.['aqi'] ?? { labels: [], series: [] });
  protected readonly iaq = computed(() => this.result()?.['iaq'] ?? { labels: [], series: [] });
  protected readonly tvoc = computed(() => this.result()?.['tvoc'] ?? { labels: [], series: [] });
  protected readonly eco2 = computed(() => this.result()?.['eco2'] ?? { labels: [], series: [] });
  protected readonly pm1 = computed(() => this.result()?.['pm1'] ?? { labels: [], series: [] });
  protected readonly pm25 = computed(() => this.result()?.['pm25'] ?? { labels: [], series: [] });
  protected readonly pm10 = computed(() => this.result()?.['pm10'] ?? { labels: [], series: [] });

  protected readonly currentAqi = computed<number | null>(() => {
    const values = this.sensors()
      .map((d) => d.properties.find((p) => p.key === 'aqi')?.value)
      .filter((v): v is number => typeof v === 'number');
    if (values.length === 0) return null;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  });

  protected readonly band = computed(() =>
    this.currentAqi() !== null ? aqiBand(this.currentAqi()!) : null,
  );

  protected readonly trend = computed<'Rising' | 'Falling' | 'Stable'>(() => {
    const points = this.aqi().series[0]?.values ?? [];
    const numeric = points.filter((v): v is number => typeof v === 'number');
    if (numeric.length < 2) return 'Stable';
    const delta = numeric[numeric.length - 1] - numeric[0];
    if (Math.abs(delta) < 3) return 'Stable';
    return delta > 0 ? 'Rising' : 'Falling';
  });
}
