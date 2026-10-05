import { seededRandom } from '../../shared/utils/seeded-random';
import type { DailyForecast, WeatherCondition, WeatherSnapshot } from './weather.types';

function pickCondition(rng: () => number, baseline: number): WeatherCondition {
  const roll = rng();
  if (baseline > 75) return roll < 0.6 ? 'sunny' : roll < 0.85 ? 'partly-cloudy' : 'cloudy';
  if (baseline > 55) {
    const pool: WeatherCondition[] = ['sunny', 'partly-cloudy', 'cloudy', 'rainy', 'foggy'];
    return pool[Math.floor(roll * pool.length)];
  }
  const pool: WeatherCondition[] = [
    'cloudy',
    'rainy',
    'heavy-rain',
    'snowy',
    'thunderstorm',
    'foggy',
  ];
  return pool[Math.floor(roll * pool.length)];
}

export function generateWeather(buildingId: string, cityBaseline: number): WeatherSnapshot {
  const rng = seededRandom(`${buildingId}:weather`);
  const today = new Date();
  const daily: DailyForecast[] = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const swing = (rng() - 0.5) * 12;
    const high = Math.round(cityBaseline + swing + 4);
    const low = Math.round(high - 10 - rng() * 6);
    daily.push({
      date: date.toISOString(),
      condition: pickCondition(rng, high),
      highF: high,
      lowF: low,
      precipitationChance: Math.round(rng() * 100),
    });
  }

  return {
    current: { tempF: daily[0].highF - 2, condition: daily[0].condition },
    daily,
  };
}

export const CITY_BASELINE_TEMP_F: Record<string, number> = {
  'Seattle, WA': 62,
  'Austin, TX': 84,
  'Chicago, IL': 58,
};
