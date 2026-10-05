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
import { Chart } from './chartjs-setup';
import { chartOptions } from './time-series-chart';

export interface MultiSeriesLine {
  label: string;
  values: (number | null)[];
  color: string;
  axis?: 'y' | 'y1';
  unit?: string;
}

@Component({
  selector: 'dt-multi-series-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="h-56 w-full sm:h-64"><canvas #canvas></canvas></div>`,
})
export class DtMultiSeriesChart {
  readonly labels = input.required<string[]>();
  readonly series = input.required<MultiSeriesLine[]>();
  readonly unit = input('');
  readonly dualAxis = input(false);

  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private chart?: Chart;

  constructor() {
    effect(() => {
      const labels = this.labels();
      const series = this.series();
      const unit = this.unit();
      const dualAxis = this.dualAxis();
      const canvas = this.canvasRef().nativeElement;

      const datasets = series.map((s) => ({
        label: s.label,
        data: s.values,
        borderColor: s.color,
        backgroundColor: `${s.color}22`,
        tension: 0.3,
        pointRadius: 0,
        spanGaps: false,
        ...(dualAxis ? { yAxisID: s.axis ?? 'y' } : {}),
      }));

      const unitFor = (datasetLabel: string) =>
        series.find((s) => s.label === datasetLabel)?.unit ?? unit;

      const options = dualAxis
        ? {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 200 },
            interaction: { mode: 'index' as const, intersect: false },
            plugins: {
              legend: {
                display: true,
                position: 'bottom' as const,
                labels: {
                  usePointStyle: true,
                  pointStyle: 'circle' as const,
                  boxHeight: 7,
                  boxWidth: 7,
                  padding: 16,
                },
              },
              tooltip: {
                callbacks: {
                  label: (ctx: { parsed: { y: number | null }; dataset: { label?: string } }) => {
                    const label = ctx.dataset.label ?? '';
                    if (ctx.parsed.y === null) return `${label}: No data`;
                    const u = unitFor(label);
                    return `${label}: ${ctx.parsed.y}${u ? ' ' + u : ''}`;
                  },
                },
              },
            },
            scales: {
              x: { ticks: { maxTicksLimit: 8 } },
              y: { beginAtZero: false, position: 'left' as const },
              y1: {
                beginAtZero: false,
                position: 'right' as const,
                grid: { drawOnChartArea: false },
              },
            },
          }
        : {
            ...chartOptions(unit),
            plugins: {
              ...chartOptions(unit).plugins,
              legend: {
                display: true,
                position: 'bottom' as const,
                labels: {
                  usePointStyle: true,
                  pointStyle: 'circle' as const,
                  boxHeight: 7,
                  boxWidth: 7,
                  padding: 16,
                },
              },
            },
          };

      if (!this.chart) {
        this.chart = new Chart(canvas, { type: 'line', data: { labels, datasets }, options });
      } else {
        this.chart.data.labels = labels;
        this.chart.data.datasets = datasets;
        this.chart.options = options;
        this.chart.update();
      }
    });

    inject(DestroyRef).onDestroy(() => this.chart?.destroy());
  }
}
