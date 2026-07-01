export interface DashboardNavItem {
  path: string;
  label: string;
  icon: 'home' | 'calendar' | 'users' | 'settings';
}

export const DASHBOARD_NAV: DashboardNavItem[] = [
  { path: 'inicio', label: 'Inicio', icon: 'home' },
  { path: 'turnos', label: 'Turnos', icon: 'calendar' },
  { path: 'clientes', label: 'Clientes', icon: 'users' },
  { path: 'config', label: 'Configuración', icon: 'settings' },
];

export type StatsPeriod = 'today' | 'week' | 'month';
export type AgendaView = 'list' | 'calendar';

export const STATS_PERIOD_OPTIONS: { value: StatsPeriod; label: string }[] = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mes' },
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
