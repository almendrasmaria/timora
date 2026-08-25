export interface DashboardNavItem {
  path: string;
  label: string;
  svgPath: string;
}

export const DASHBOARD_NAV: DashboardNavItem[] = [
  {
    path: 'inicio',
    label: 'Inicio',
    svgPath: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
  },
  {
    path: 'turnos',
    label: 'Turnos',
    svgPath: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  },
  {
    path: 'clientes',
    label: 'Clientes',
    svgPath: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
  },
  {
    path: 'config',
    label: 'Configuración',
    svgPath: 'M12 20h9 M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z',
  },
];

export type StatsPeriod = 'today' | 'week' | 'month';
export type AgendaView = 'list' | 'calendar';

export const STATS_PERIOD_OPTIONS: { value: StatsPeriod; label: string }[] = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Últimos 30 días' },
];

export function publicBookingUrl(slug: string): string {
  if (!slug) {
    return '';
  }

  if (typeof window === 'undefined') {
    return `/${slug}`;
  }

  return `${window.location.origin}/${slug}`;
}
