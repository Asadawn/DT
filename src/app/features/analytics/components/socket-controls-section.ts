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
import { DtStatusChip } from '../../../shared/ui/badge/status-chip';
import {
  deviceNames,
  loadMultiDeviceSeries,
  matchesLocationScope,
  snapshotValues,
} from '../analytics-multi-series.util';

@Component({
  selector: 'app-socket-controls-section',
  imports: [DtChartCard, DtChartRangeToggle, DtBarChart, DtMultiSeriesChart, DtStatusChip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './socket-controls-section.html',
})
export class SocketControlsSection {
  readonly buildingId = input('');
  readonly floorId = input('');
  readonly spaceId = input('');

  private readonly deviceService = inject(DeviceService);
  private readonly telemetryService = inject(TelemetryService);
  private readonly buildingService = inject(BuildingService);

  protected readonly rangeId = signal('24h');

  protected readonly sockets = computed(() =>
    this.deviceService
      .devices()
      .filter(
        (d) =>
          d.category === 'socket' &&
          matchesLocationScope(d, this.buildingId(), this.floorId(), this.spaceId()),
      ),
  );

  protected readonly energyLabels = computed(() => deviceNames(this.sockets()));
  protected readonly energyValues = computed(() => snapshotValues(this.sockets(), 'energy'));

  private readonly voltageSeries = resource({
    params: () => ({
      deviceIds: this.sockets().map((d) => d.id),
      range: currentTimeRange(this.rangeId() as '6h' | '24h' | '7d' | '30d' | '6m'),
    }),
    loader: ({ params }) =>
      loadMultiDeviceSeries(
        this.telemetryService,
        this.deviceService,
        this.buildingService,
        params.deviceIds,
        'voltage',
        params.range,
      ),
  });

  protected readonly isLoading = computed(() => this.voltageSeries.isLoading());
  protected readonly voltage = computed(
    () => this.voltageSeries.value() ?? { labels: [], series: [] },
  );

  protected isOn(device: { properties: { key: string; value: unknown }[] }): boolean {
    return device.properties.find((p) => p.key === 'on')?.value === true;
  }
}
