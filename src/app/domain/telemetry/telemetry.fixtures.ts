import type { TimeRange, TimeSeries, TimeSeriesPoint } from '../../shared/types/canonical.types';
import { seededRandom } from '../../shared/utils/seeded-random';

interface MetricProfile {
  unit: string;
  baseline: number;
  amplitude: number;
  decimals: number;
}

const METRIC_PROFILES: Record<string, MetricProfile> = {
  temperature: { unit: '°F', baseline: 71, amplitude: 4, decimals: 1 },
  humidity: { unit: '%', baseline: 42, amplitude: 8, decimals: 0 },
  activePower: { unit: 'kW', baseline: 60, amplitude: 25, decimals: 1 },
  energy: { unit: 'kWh', baseline: 450, amplitude: 120, decimals: 0 },
  voltage: { unit: 'V', baseline: 220, amplitude: 8, decimals: 1 },
  current: { unit: 'A', baseline: 180, amplitude: 90, decimals: 1 },
  powerFactor: { unit: '', baseline: 0.93, amplitude: 0.04, decimals: 2 },
  frequency: { unit: 'Hz', baseline: 60, amplitude: 0.15, decimals: 2 },
  reactivePower: { unit: 'kVAR', baseline: 18, amplitude: 10, decimals: 2 },
  apparentPower: { unit: 'kVA', baseline: 65, amplitude: 27, decimals: 2 },
  co2: { unit: 'ppm', baseline: 600, amplitude: 150, decimals: 0 },
  co: { unit: 'ppm', baseline: 2, amplitude: 1.5, decimals: 1 },
  aqi: { unit: '', baseline: 42, amplitude: 20, decimals: 0 },
  iaq: { unit: '', baseline: 45, amplitude: 20, decimals: 0 },
  tvoc: { unit: 'ppb', baseline: 150, amplitude: 100, decimals: 0 },
  eco2: { unit: 'ppm', baseline: 600, amplitude: 150, decimals: 0 },
  pm1: { unit: 'µg/m³', baseline: 7, amplitude: 4, decimals: 1 },
  pm25: { unit: 'µg/m³', baseline: 11, amplitude: 6, decimals: 1 },
  pm10: { unit: 'µg/m³', baseline: 17, amplitude: 8, decimals: 1 },
  load: { unit: 'W', baseline: 250, amplitude: 100, decimals: 0 },
  detections: { unit: '', baseline: 8, amplitude: 6, decimals: 0 },
  occupancyMinutes: { unit: 'min', baseline: 240, amplitude: 120, decimals: 0 },
  flowRate: { unit: 'L/min', baseline: 6, amplitude: 4, decimals: 1 },
  totalVolume: { unit: 'L', baseline: 850, amplitude: 200, decimals: 0 },
};

const RANGE_SHAPE: Record<
  TimeRange['preset'] & string,
  { points: number; stepMs: number; label: (i: number, count: number) => string }
> = {
  live: { points: 24, stepMs: 60 * 60_000, label: hourLabel },
  '6h': { points: 24, stepMs: 15 * 60_000, label: hourMinuteLabel },
  '12h': { points: 24, stepMs: 30 * 60_000, label: hourMinuteLabel },
  '24h': { points: 24, stepMs: 60 * 60_000, label: hourLabel },
  '7d': { points: 7, stepMs: 24 * 60 * 60_000, label: dayLabel },
  '30d': { points: 30, stepMs: 24 * 60 * 60_000, label: dayLabel },
  '6m': { points: 26, stepMs: 7 * 24 * 60 * 60_000, label: weekLabel },
};

function hourLabel(index: number, count: number): string {
  const d = new Date(Date.now() - (count - 1 - index) * 60 * 60_000);
  return d.toLocaleTimeString(undefined, { hour: 'numeric' });
}

function hourMinuteLabel(index: number, count: number): string {
  const shape = RANGE_SHAPE['6h'];
  const d = new Date(Date.now() - (count - 1 - index) * shape.stepMs);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function dayLabel(index: number, count: number): string {
  const d = new Date(Date.now() - (count - 1 - index) * 24 * 60 * 60_000);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function weekLabel(index: number, count: number): string {
  const d = new Date(Date.now() - (count - 1 - index) * 7 * 24 * 60 * 60_000);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export interface GeneratedSeries {
  series: TimeSeries;
  labels: string[];
}

export function generateTelemetrySeries(
  deviceId: string,
  metric: string,
  range: TimeRange,
): GeneratedSeries {
  const profile = METRIC_PROFILES[metric] ?? { unit: '', baseline: 50, amplitude: 15, decimals: 0 };
  const shape = RANGE_SHAPE[range.preset ?? '24h'] ?? RANGE_SHAPE['24h'];
  const dateBucket = range.from.slice(0, 10);
  const rng = seededRandom(`${deviceId}:${metric}:${range.preset ?? '24h'}:${dateBucket}`);

  const points: TimeSeriesPoint[] = [];
  const labels: string[] = [];

  for (let i = 0; i < shape.points; i++) {
    const timestamp = new Date(Date.now() - (shape.points - 1 - i) * shape.stepMs).toISOString();
    labels.push(shape.label(i, shape.points));

    const isMissing = rng() < 0.04;
    if (isMissing) {
      points.push({ timestamp, value: null, quality: 'missing' });
      continue;
    }

    const wave = Math.sin((i / shape.points) * Math.PI * 2 + rng() * 0.5) * profile.amplitude;
    const jitter = (rng() - 0.5) * profile.amplitude * 0.3;
    const raw = Math.max(0, profile.baseline + wave + jitter);
    points.push({
      timestamp,
      value: Number(raw.toFixed(profile.decimals)),
      quality: 'good',
    });
  }

  return {
    series: { metric, unit: profile.unit, deviceId, points },
    labels,
  };
}
