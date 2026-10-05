import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  resource,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowDown,
  lucideArrowUp,
  lucideDroplets,
  lucideThermometer,
} from '@ng-icons/lucide';
import type { Device } from '../../../domain/devices/device.types';
import { currentTimeRange, TelemetryService } from '../../../domain/telemetry/telemetry.service';
import type { TimeRange } from '../../../shared/types/canonical.types';
import { DtStatusChip } from '../badge/status-chip';
import { DtMultiSeriesChart, type MultiSeriesLine } from '../chart/multi-series-chart';

const NORMAL_TEMP_RANGE_F: [number, number] = [68, 76];
const NORMAL_HUMIDITY_RANGE_PCT: [number, number] = [30, 60];

@Component({
  selector: 'dt-environment-card',
  imports: [NgIcon, DtStatusChip, DtMultiSeriesChart],
  providers: [provideIcons({ lucideArrowDown, lucideArrowUp, lucideDroplets, lucideThermometer })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4">
      <!-- Header -->
      <div class="flex items-start justify-between gap-2">
        <div class="flex items-center gap-2.5">
          <span
            class="bg-dashboard-accent/10 text-dashboard-accent flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          >
            <ng-icon name="lucideThermometer" size="17" />
          </span>
          <div>
            <h3 class="text-sm">{{ device().name }}</h3>
            @if (breadcrumb()) {
              <p class="text-muted-foreground text-xs">{{ breadcrumb() }}</p>
            }
          </div>
        </div>
        <dt-status-chip [status]="device().connectivity" />
      </div>

      <!-- Metric tiles -->
      <div class="grid grid-cols-2 gap-3">
        @if (temperatureProperty(); as temp) {
          <div class="bg-muted/40 rounded-xl p-3">
            <div class="mb-1 flex items-center gap-1.5">
              <ng-icon name="lucideThermometer" size="14" class="text-orange-500" />
              <span class="text-muted-foreground text-xs">Temperature</span>
            </div>
            <div class="flex items-baseline gap-1.5">
              <span class="text-lg">{{ temp.value }}{{ temp.unit }}</span>
              @if (temperatureDeltaPercent() !== null) {
                <span
                  class="flex items-center text-xs"
                  [class]="
                    temperatureDeltaPercent()! <= 0
                      ? 'text-dashboard-accent'
                      : 'text-dashboard-danger-strong'
                  "
                >
                  <ng-icon
                    [name]="temperatureDeltaPercent()! < 0 ? 'lucideArrowDown' : 'lucideArrowUp'"
                    size="11"
                  />
                  {{
                    temperatureDeltaPercent()! < 0
                      ? -temperatureDeltaPercent()!
                      : temperatureDeltaPercent()
                  }}%
                </span>
              }
            </div>
            <span
              class="mt-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[11px]"
              [class]="
                isTemperatureNormal()
                  ? 'bg-dashboard-accent/10 text-dashboard-accent'
                  : 'bg-dashboard-warning/15 text-dashboard-warning-strong'
              "
              >{{ isTemperatureNormal() ? 'Normal' : 'Out of range' }}</span
            >
          </div>
        }

        @if (humidityProperty(); as humidity) {
          <div class="bg-muted/40 rounded-xl p-3">
            <div class="mb-1 flex items-center gap-1.5">
              <ng-icon name="lucideDroplets" size="14" class="text-sky-600" />
              <span class="text-muted-foreground text-xs">Humidity</span>
            </div>
            <div class="flex items-baseline gap-1.5">
              <span class="text-lg">{{ humidity.value }}{{ humidity.unit }}</span>
              @if (humidityDeltaPercent() !== null) {
                <span
                  class="flex items-center text-xs"
                  [class]="
                    humidityDeltaPercent()! <= 0
                      ? 'text-dashboard-accent'
                      : 'text-dashboard-danger-strong'
                  "
                >
                  <ng-icon
                    [name]="humidityDeltaPercent()! < 0 ? 'lucideArrowDown' : 'lucideArrowUp'"
                    size="11"
                  />
                  {{
                    humidityDeltaPercent()! < 0 ? -humidityDeltaPercent()! : humidityDeltaPercent()
                  }}%
                </span>
              }
            </div>
            <span
              class="mt-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[11px]"
              [class]="
                isHumidityNormal()
                  ? 'bg-dashboard-accent/10 text-dashboard-accent'
                  : 'bg-dashboard-warning/15 text-dashboard-warning-strong'
              "
              >{{ isHumidityNormal() ? 'Normal' : 'Out of range' }}</span
            >
          </div>
        }
      </div>

      <!-- Overlaid Temperature/Humidity chart, real independent axes -->
      @if (chartLabels().length > 0) {
        <dt-multi-series-chart
          [labels]="chartLabels()"
          [series]="chartSeries()"
          [dualAxis]="true"
        />
      }
    </div>
  `,
})
export class DtEnvironmentCard {
  readonly device = input.required<Device>();
  readonly breadcrumb = input<string>('');

  private readonly telemetryService = inject(TelemetryService);

  protected readonly temperatureProperty = computed(() =>
    this.device().properties.find((p) => p.key === 'temperature'),
  );
  protected readonly humidityProperty = computed(() =>
    this.device().properties.find((p) => p.key === 'humidity'),
  );

  protected isTemperatureNormal(): boolean {
    const value = this.temperatureProperty()?.value;
    return (
      typeof value === 'number' &&
      value >= NORMAL_TEMP_RANGE_F[0] &&
      value <= NORMAL_TEMP_RANGE_F[1]
    );
  }

  protected isHumidityNormal(): boolean {
    const value = this.humidityProperty()?.value;
    return (
      typeof value === 'number' &&
      value >= NORMAL_HUMIDITY_RANGE_PCT[0] &&
      value <= NORMAL_HUMIDITY_RANGE_PCT[1]
    );
  }

  private readonly range = computed<TimeRange>(() => currentTimeRange('24h'));
  private readonly previousRange = computed<TimeRange>(() => {
    const current = this.range();
    const to = new Date(current.from);
    const from = new Date(to);
    from.setHours(from.getHours() - 24);
    return {
      from: from.toISOString(),
      to: to.toISOString(),
      timezone: current.timezone,
      granularity: current.granularity,
    };
  });

  private readonly temperatureSeries = resource({
    params: () => ({ deviceId: this.device().id, metric: 'temperature', range: this.range() }),
    loader: ({ params }) => this.telemetryService.loadSeries(params),
  });
  private readonly previousTemperatureSeries = resource({
    params: () => ({
      deviceId: this.device().id,
      metric: 'temperature',
      range: this.previousRange(),
    }),
    loader: ({ params }) => this.telemetryService.loadSeries(params),
  });
  private readonly humiditySeries = resource({
    params: () => ({ deviceId: this.device().id, metric: 'humidity', range: this.range() }),
    loader: ({ params }) => this.telemetryService.loadSeries(params),
  });
  private readonly previousHumiditySeries = resource({
    params: () => ({ deviceId: this.device().id, metric: 'humidity', range: this.previousRange() }),
    loader: ({ params }) => this.telemetryService.loadSeries(params),
  });

  private static averageOf(points: { value: number | null }[] | undefined): number | null {
    const real = (points ?? []).map((p) => p.value).filter((v): v is number => v != null);
    return real.length > 0 ? real.reduce((sum, v) => sum + v, 0) / real.length : null;
  }

  private static deltaPercent(current: number | null, previous: number | null): number | null {
    if (current === null || previous === null || previous === 0) return null;
    return Math.round(((current - previous) / previous) * 100);
  }

  protected readonly temperatureDeltaPercent = computed(() =>
    DtEnvironmentCard.deltaPercent(
      DtEnvironmentCard.averageOf(this.temperatureSeries.value()?.series.points),
      DtEnvironmentCard.averageOf(this.previousTemperatureSeries.value()?.series.points),
    ),
  );
  protected readonly humidityDeltaPercent = computed(() =>
    DtEnvironmentCard.deltaPercent(
      DtEnvironmentCard.averageOf(this.humiditySeries.value()?.series.points),
      DtEnvironmentCard.averageOf(this.previousHumiditySeries.value()?.series.points),
    ),
  );

  protected readonly chartLabels = computed(() => this.temperatureSeries.value()?.labels ?? []);
  protected readonly chartSeries = computed<MultiSeriesLine[]>(() => [
    {
      label: 'Temperature',
      values: (this.temperatureSeries.value()?.series.points ?? []).map((p) => p.value),
      color: '#16a34a',
      unit: '°F',
      axis: 'y',
    },
    {
      label: 'Humidity',
      values: (this.humiditySeries.value()?.series.points ?? []).map((p) => p.value),
      color: '#0284c7',
      unit: '%',
      axis: 'y1',
    },
  ]);
}
