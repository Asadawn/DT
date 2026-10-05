import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, viewChild } from '@angular/core';
import type { ElementRef } from '@angular/core';
import { dashboardAccentColor } from './chart-colors';
import { Chart } from './chartjs-setup';

@Component({
  selector: 'dt-bar-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="h-56 w-full sm:h-64"><canvas #canvas></canvas></div>`,
})
export class DtBarChart {
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
      const unit = this.unit();
      const canvas = this.canvasRef().nativeElement;

      if (!this.chart) {
        this.chart = new Chart(canvas, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              { label: this.label(), data: values, backgroundColor: this.color(), borderRadius: 4, maxBarThickness: 28 },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 200 },
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx: { parsed: { y: number | null } }) =>
                    ctx.parsed.y === null ? 'No data' : `${ctx.parsed.y}${unit ? ' ' + unit : ''}`,
                },
              },
            },
            scales: { x: { ticks: { maxTicksLimit: 10 } }, y: { beginAtZero: true } },
          },
        });
      } else {
        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = values;
        this.chart.update();
      }
    });

    inject(DestroyRef).onDestroy(() => this.chart?.destroy());
  }
}
