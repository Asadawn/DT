import { dashboardAccentColor } from '../../shared/ui/chart/chart-colors';

export interface AqiBand {
  label: string;
  color: string;
}

export function aqiBand(aqi: number): AqiBand {
  if (aqi <= 50) return { label: 'Good', color: dashboardAccentColor() };
  if (aqi <= 100) return { label: 'Moderate', color: '#D97706' };
  return { label: 'Unhealthy', color: '#DC2626' };
}
