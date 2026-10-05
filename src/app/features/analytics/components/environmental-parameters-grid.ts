import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  resource,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { BuildingService } from '../../../domain/buildings/building.service';
import { DeviceService } from '../../../domain/devices/device.service';
import { currentTimeRange, TelemetryService } from '../../../domain/telemetry/telemetry.service';
import { DtBarChart } from '../../../shared/ui/chart/bar-chart';
import { DtChartCard } from '../../../shared/ui/chart/chart-card';
import { DtChartRangeToggle } from '../../../shared/ui/chart/chart-range-toggle';
import { DtMultiSeriesChart } from '../../../shared/ui/chart/multi-series-chart';
import { DtStatusChip } from '../../../shared/ui/badge/status-chip';
import {
  deviceNames,
  loadMultiDeviceSeries,
  matchesLocationScope,
  snapshotValues,
} from '../analytics-multi-series.util';

@Component({
  selector: 'app-environmental-parameters-grid',
  imports: [
    DtChartCard,
    DtChartRangeToggle,
    DtBarChart,
    DtMultiSeriesChart,
    DtStatusChip,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './environmental-parameters-grid.html',
})
export class EnvironmentalParametersGrid {
  readonly buildingId = input('');
  readonly floorId = input('');
  readonly spaceId = input('');

  private readonly deviceService = inject(DeviceService);
  private readonly telemetryService = inject(TelemetryService);
  private readonly buildingService = inject(BuildingService);

  protected readonly rangeId = signal('24h');

  private readonly scoped = computed(
    () => (category: string) =>
      this.deviceService
        .devices()
        .filter(
          (d) =>
            d.category === category &&
            matchesLocationScope(d, this.buildingId(), this.floorId(), this.spaceId()),
        ),
  );

  protected readonly envDevices = computed(() =>
    this.deviceService
      .devices()
      .filter(
        (d) =>
          (d.category === 'environment' || d.category === 'thermostat') &&
          matchesLocationScope(d, this.buildingId(), this.floorId(), this.spaceId()),
      ),
  );
  protected readonly gasDevices = computed(() => this.scoped()('gas'));
  protected readonly smokeDevices = computed(() => this.scoped()('smoke'));
  protected readonly motionDevices = computed(() => this.scoped()('motion'));
  protected readonly contactDevices = computed(() => this.scoped()('contact'));
  protected readonly aqiDevices = computed(() => this.scoped()('air-quality'));

  protected readonly co2Labels = computed(() => deviceNames(this.gasDevices()));
  protected readonly co2Values = computed(() => snapshotValues(this.gasDevices(), 'co2'));

  private readonly tempSeries = resource({
    params: () => ({
      deviceIds: this.envDevices().map((d) => d.id),
      range: currentTimeRange(this.rangeId() as '6h' | '24h' | '7d' | '30d' | '6m'),
    }),
    loader: ({ params }) =>
      loadMultiDeviceSeries(
        this.telemetryService,
        this.deviceService,
        this.buildingService,
        params.deviceIds,
        'temperature',
        params.range,
      ),
  });
  private readonly humiditySeries = resource({
    params: () => ({
      deviceIds: this.envDevices().map((d) => d.id),
      range: currentTimeRange(this.rangeId() as '6h' | '24h' | '7d' | '30d' | '6m'),
    }),
    loader: ({ params }) =>
      loadMultiDeviceSeries(
        this.telemetryService,
        this.deviceService,
        this.buildingService,
        params.deviceIds,
        'humidity',
        params.range,
      ),
  });

  protected readonly isLoading = computed(
    () => this.tempSeries.isLoading() || this.humiditySeries.isLoading(),
  );
  protected readonly temperature = computed(
    () => this.tempSeries.value() ?? { labels: [], series: [] },
  );
  protected readonly humidity = computed(
    () => this.humiditySeries.value() ?? { labels: [], series: [] },
  );

  protected readonly averageAqi = computed(() => {
    const values = this.aqiDevices()
      .map((d) => d.properties.find((p) => p.key === 'aqi')?.value)
      .filter((v): v is number => typeof v === 'number');
    if (values.length === 0) return null;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  });

  private propertyValue(
    device: { properties: { key: string; value: unknown }[] },
    key: string,
  ): unknown {
    return device.properties.find((p) => p.key === key)?.value;
  }

  protected stateOf(device: { properties: { key: string; value: unknown }[] }): string {
    const v = this.propertyValue(device, 'state');
    return typeof v === 'string' ? v : 'unknown';
  }

  protected detectionsOf(device: { properties: { key: string; value: unknown }[] }): number {
    const v = this.propertyValue(device, 'detections');
    return typeof v === 'number' ? v : 0;
  }
}
