import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import type { ElementRef } from '@angular/core';
import { dashboardAccentColor } from './chart-colors';
import { Chart } from './chartjs-setup';

@Component({
  selector: 'dt-time-series-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="h-56 w-full sm:h-64"><canvas #canvas></canvas></div>`,
})
export class DtTimeSeriesChart {
  readonly labels = input.required<string[]>();
  readonly values = input.required<(number | null)[]>();
  readonly label = input('Value');
  readonly unit = input('');
  readonly color = input(dashboardAccentColor());

  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private chart?: Chart;

  constructor() {
    effect(() => {
      const labels = this.labels();
      const values = this.values();
      const label = this.label();
      const unit = this.unit();
      const color = this.color();
      const canvas = this.canvasRef().nativeElement;

      if (!this.chart) {
        this.chart = new Chart(canvas, {
          type: 'line',
          data: {
            labels,
            datasets: [
              {
                label,
                data: values,
                borderColor: color,
                backgroundColor: `${color}22`,
                fill: false,
                tension: 0.3,
                pointRadius: 0,
                pointHoverRadius: 4,
                pointHoverBackgroundColor: color,
                spanGaps: false,
              },
            ],
          },
          options: chartOptions(unit),
        });
      } else {
        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = values;
        this.chart.data.datasets[0].label = label;
        this.chart.update();
      }
    });

    inject(DestroyRef).onDestroy(() => this.chart?.destroy());
  }
}

export function chartOptions(unit: string) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 200 },
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { parsed: { y: number | null } }) =>
            ctx.parsed.y === null ? 'No data' : `${ctx.parsed.y}${unit ? ' ' + unit : ''}`,
        },
      },
    },
    scales: {
      x: { ticks: { maxTicksLimit: 8 } },
      y: { beginAtZero: false },
    },
  };
}
