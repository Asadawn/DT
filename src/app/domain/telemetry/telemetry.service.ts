import { Injectable } from '@angular/core';
import type { TimeRange, TimeSeries } from '../../shared/types/canonical.types';
import { simulateLatency } from '../../shared/utils/simulate-latency';
import { generateTelemetrySeries } from './telemetry.fixtures';

export interface TelemetryQuery {
  deviceId: string;
  metric: string;
  range: TimeRange;
}

export interface TelemetryResult {
  series: TimeSeries;
  labels: string[];
}

@Injectable({ providedIn: 'root' })
export class TelemetryService {
  async loadSeries(query: TelemetryQuery): Promise<TelemetryResult> {
    await simulateLatency(300);
    return generateTelemetrySeries(query.deviceId, query.metric, query.range);
  }
}

export function currentTimeRange(preset: NonNullable<TimeRange['preset']>): TimeRange {
  const to = new Date();
  const from = new Date(to);
  const granularity: TimeRange['granularity'] =
    preset === '6m' ? 'day' : preset === '30d' || preset === '7d' ? 'day' : 'hour';

  switch (preset) {
    case 'live':
    case '24h':
      from.setHours(from.getHours() - 24);
      break;
    case '6h':
      from.setHours(from.getHours() - 6);
      break;
    case '12h':
      from.setHours(from.getHours() - 12);
      break;
    case '7d':
      from.setDate(from.getDate() - 7);
      break;
    case '30d':
      from.setDate(from.getDate() - 30);
      break;
    case '6m':
      from.setMonth(from.getMonth() - 6);
      break;
  }

  return {
    preset,
    from: from.toISOString(),
    to: to.toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    granularity,
  };
}
