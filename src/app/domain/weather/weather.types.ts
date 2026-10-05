export type WeatherCondition =
  | 'sunny'
  | 'partly-cloudy'
  | 'cloudy'
  | 'foggy'
  | 'rainy'
  | 'heavy-rain'
  | 'snowy'
  | 'thunderstorm';

export interface DailyForecast {
  date: string;
  condition: WeatherCondition;
  highF: number;
  lowF: number;
  precipitationChance: number;
}

export interface WeatherSnapshot {
  current: {
    tempF: number;
    condition: WeatherCondition;
  };
  daily: DailyForecast[];
}
