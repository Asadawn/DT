import { Injectable } from '@angular/core';
import { simulateLatency } from '../../shared/utils/simulate-latency';
import { CITY_BASELINE_TEMP_F, generateWeather } from './weather.fixtures';
import type { WeatherCondition, WeatherSnapshot } from './weather.types';

export const WEATHER_ICON: Record<WeatherCondition, string> = {
  sunny: '/assets/icons/sunny_mono.svg',
  'partly-cloudy': '/assets/icons/partly_cloudy_day.svg',
  cloudy: '/assets/icons/cloudy_mono.svg',
  foggy: '/assets/icons/foggy_mono.svg',
  rainy: '/assets/icons/rainy_mono.svg',
  'heavy-rain': '/assets/icons/heavy_rain_mono.svg',
  snowy: '/assets/icons/snowy_mono.svg',
  thunderstorm: '/assets/icons/thunderstorm_mono.svg',
};

@Injectable({ providedIn: 'root' })
export class WeatherService {
  async getForecast(buildingId: string, city: string): Promise<WeatherSnapshot> {
    await simulateLatency(300);
    const baseline = CITY_BASELINE_TEMP_F[city] ?? 68;
    return generateWeather(buildingId, baseline);
  }
}
