export function dashboardAccentColor(): string {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue('--dt-color-dashboard-accent')
    .trim();
  return value || '#52c695';
}
