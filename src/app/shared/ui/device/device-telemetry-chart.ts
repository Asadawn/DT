import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  resource,
} from '@angular/core';
import type { TimeRange } from '../../../shared/types/canonical.types';
import { TelemetryService } from '../../../domain/telemetry/telemetry.service';
import { DtChartCard } from '../chart/chart-card';
import { DtBarChart } from '../chart/bar-chart';
import { DtTimeSeriesChart } from '../chart/time-series-chart';

@Component({
  selector: 'dt-device-telemetry-chart',
  imports: [DtChartCard, DtTimeSeriesChart, DtBarChart],
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dt-chart-card
      class="h-full"
      [title]="title()"
      [loading]="telemetry.isLoading()"
      [error]="!!telemetry.error()"
      [noData]="!telemetry.isLoading() && (telemetry.value()?.series?.points?.length ?? 0) === 0"
    >
      @if (telemetry.value(); as result) {
        @if (chartType() === 'bar') {
          <dt-bar-chart
            [labels]="result.labels"
            [values]="values(result)"
            [label]="metric()"
            [unit]="result.series.unit ?? ''"
          />
        } @else {
          <dt-time-series-chart
            [labels]="result.labels"
            [values]="values(result)"
            [label]="metric()"
            [unit]="result.series.unit ?? ''"
          />
        }
      }
    </dt-chart-card>
  `,
})
export class DtDeviceTelemetryChart {
  readonly deviceId = input.required<string>();
  readonly metric = input.required<string>();
  readonly range = input.required<TimeRange>();
  readonly title = input<string>();
  readonly chartType = input<'line' | 'bar'>('line');

  private readonly telemetryService = inject(TelemetryService);

  protected readonly telemetry = resource({
    params: () => ({ deviceId: this.deviceId(), metric: this.metric(), range: this.range() }),
    loader: ({ params }) => this.telemetryService.loadSeries(params),
  });

  protected values(result: { series: { points: { value: number | null }[] } }): (number | null)[] {
    return result.series.points.map((p) => p.value);
  }
}
