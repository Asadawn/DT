import type { Device } from '../../domain/devices/device.types';
import { BuildingService } from '../../domain/buildings/building.service';
import { DeviceService } from '../../domain/devices/device.service';
import { TelemetryService } from '../../domain/telemetry/telemetry.service';
import type { TimeRange } from '../../shared/types/canonical.types';
import { dashboardAccentColor } from '../../shared/ui/chart/chart-colors';
import type { MultiSeriesLine } from '../../shared/ui/chart/multi-series-chart';

export const ANALYTICS_LINE_COLORS = [
  dashboardAccentColor(),
  '#2563EB',
  '#D97706',
  '#DB2777',
  '#7C3AED',
];

function deviceLabel(
  deviceService: DeviceService,
  buildingService: BuildingService,
  deviceId: string,
): string {
  const device = deviceService.device(deviceId);
  if (!device) return deviceId;
  const building = buildingService.building(device.buildingId);
  const floor = buildingService.floor(device.floorId);
  const location = [building?.name, floor?.name].filter(Boolean).join(' / ');
  return location ? `${device.name} — ${location}` : device.name;
}

export interface MultiSeriesResult {
  labels: string[];
  series: MultiSeriesLine[];
}

export async function loadMultiDeviceSeries(
  telemetryService: TelemetryService,
  deviceService: DeviceService,
  buildingService: BuildingService,
  deviceIds: string[],
  metric: string,
  range: TimeRange,
): Promise<MultiSeriesResult> {
  if (deviceIds.length === 0) return { labels: [], series: [] };
  const results = await Promise.all(
    deviceIds.map((deviceId) => telemetryService.loadSeries({ deviceId, metric, range })),
  );
  const labels = results[0]?.labels ?? [];
  const series: MultiSeriesLine[] = results.map((result, i) => ({
    label: deviceLabel(deviceService, buildingService, deviceIds[i]),
    values: result.series.points.map((p) => p.value),
    color: ANALYTICS_LINE_COLORS[i % ANALYTICS_LINE_COLORS.length],
  }));
  return { labels, series };
}

export async function loadMultiMetricSeries(
  telemetryService: TelemetryService,
  deviceService: DeviceService,
  buildingService: BuildingService,
  deviceIds: string[],
  metrics: string[],
  range: TimeRange,
): Promise<Record<string, MultiSeriesResult>> {
  if (deviceIds.length === 0) {
    return Object.fromEntries(metrics.map((m) => [m, { labels: [], series: [] }]));
  }
  const requests = metrics.flatMap((metric) =>
    deviceIds.map((deviceId) =>
      telemetryService
        .loadSeries({ deviceId, metric, range })
        .then((r) => ({ metric, deviceId, r })),
    ),
  );
  const results = await Promise.all(requests);
  const out: Record<string, MultiSeriesResult> = {};
  for (const metric of metrics) {
    const forMetric = results.filter((x) => x.metric === metric);
    const labels = forMetric[0]?.r.labels ?? [];
    const series: MultiSeriesLine[] = forMetric.map((x, i) => ({
      label: deviceLabel(deviceService, buildingService, x.deviceId),
      values: x.r.series.points.map((p) => p.value),
      color: ANALYTICS_LINE_COLORS[i % ANALYTICS_LINE_COLORS.length],
    }));
    out[metric] = { labels, series };
  }
  return out;
}

export function snapshotValues(devices: Device[], propertyKey: string): number[] {
  return devices.map((d) => {
    const value = d.properties.find((p) => p.key === propertyKey)?.value;
    return typeof value === 'number' ? value : 0;
  });
}

export function deviceNames(devices: Device[]): string[] {
  return devices.map((d) => d.name);
}

export function matchesLocationScope(
  device: Device,
  buildingId: string,
  floorId: string,
  spaceId: string,
): boolean {
  if (buildingId && device.buildingId !== buildingId) return false;
  if (floorId && device.floorId !== floorId) return false;
  if (spaceId && device.spaceId !== spaceId) return false;
  return true;
}

export interface AggregatedSeries {
  values: number[];
  delta: number | null;
  spark: number[];
}

export async function aggregateDeviceSeries(
  telemetryService: TelemetryService,
  deviceIds: string[],
  metric: string,
  range: TimeRange,
  mode: 'sum' | 'avg',
): Promise<AggregatedSeries> {
  if (deviceIds.length === 0) return { values: [], delta: null, spark: [] };
  const results = await Promise.all(
    deviceIds.map((deviceId) => telemetryService.loadSeries({ deviceId, metric, range })),
  );
  const pointCount = Math.max(...results.map((r) => r.series.points.length), 0);
  const values: number[] = [];
  for (let i = 0; i < pointCount; i++) {
    const atIndex = results
      .map((r) => r.series.points[i]?.value)
      .filter((v): v is number => typeof v === 'number');
    if (atIndex.length === 0) {
      values.push(0);
      continue;
    }
    const sum = atIndex.reduce((a, b) => a + b, 0);
    values.push(mode === 'sum' ? sum : sum / atIndex.length);
  }
  const mean = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const last = values[values.length - 1] ?? 0;
  const delta = mean !== 0 ? Math.round(((last - mean) / mean) * 1000) / 10 : null;
  const spark = values.slice(-12);
  return { values, delta, spark };
}
