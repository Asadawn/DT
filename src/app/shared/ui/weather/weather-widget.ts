import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { WEATHER_ICON } from '../../../domain/weather/weather.service';
import type { WeatherSnapshot } from '../../../domain/weather/weather.types';

@Component({
  selector: 'dt-weather-widget',
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rounded-card border-border flex h-full flex-col gap-4 border bg-white p-4">
      <div
        class="from-sky-50 rounded-control flex items-center justify-between bg-gradient-to-br to-white p-3.5"
      >
        <div>
          <div class="text-muted-foreground mb-1 flex items-center gap-1.5 text-xs font-medium">
            <img src="/assets/icons/location-05.svg" alt="" class="h-3.5 w-3.5 opacity-60" />
            {{ city() }}
          </div>
          <div class="flex items-baseline gap-2">
            <span class="text-3xl font-semibold tracking-tight"
              >{{ snapshot().current.tempF }}°</span
            >
            <span class="text-muted-foreground text-sm capitalize">{{
              conditionLabel(snapshot().current.condition)
            }}</span>
          </div>
        </div>
        <img [src]="iconFor(snapshot().current.condition)" alt="" class="h-11 w-11" />
      </div>

      <div class="grid grid-cols-7 gap-1">
        @for (day of snapshot().daily; track day.date; let i = $index) {
          <button
            type="button"
            class="rounded-control flex flex-col items-center gap-1 border px-1 py-2 text-xs transition-colors"
            [class]="
              i === selectedDayIndex()
                ? 'border-merik/30 bg-merik/10 text-foreground'
                : 'border-transparent hover:bg-accent text-muted-foreground'
            "
            (click)="selectedDayIndex.set(i)"
          >
            <span class="font-medium">{{ day.date | date: 'EEE' }}</span>
            <img [src]="iconFor(day.condition)" alt="" class="h-5 w-5" />
            <span class="text-foreground">{{ day.highF }}°</span>
          </button>
        }
      </div>

      @if (selectedDay(); as day) {
        <div
          class="border-border text-muted-foreground flex items-center justify-between border-t pt-3 text-xs"
        >
          <span class="text-foreground font-medium">{{ day.date | date: 'EEEE, MMM d' }}</span>
          <span>High {{ day.highF }}° / Low {{ day.lowF }}°</span>
          <span>{{ day.precipitationChance }}% precip</span>
        </div>
      }
    </div>
  `,
})
export class DtWeatherWidget {
  readonly snapshot = input.required<WeatherSnapshot>();
  readonly city = input.required<string>();

  protected readonly selectedDayIndex = signal(0);
  protected readonly selectedDay = computed(() => this.snapshot().daily[this.selectedDayIndex()]);

  protected iconFor(condition: WeatherSnapshot['current']['condition']): string {
    return WEATHER_ICON[condition];
  }

  protected conditionLabel(condition: string): string {
    return condition.replace('-', ' ');
  }
}
