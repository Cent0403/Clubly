import { PlayerSection } from './types';
import { CalendarIcon, FinancesIcon, HistoryIcon, PerformanceIcon, ProfileIcon, SummaryIcon } from '../icons/SidebarIcons';

export const PLAYER_SECTIONS: PlayerSection[] = [
  { key: 'perfil', label: 'Perfil', icon: ProfileIcon },
  { key: 'resumen', label: 'Resumen', icon: SummaryIcon },
  { key: 'rendimiento', label: 'Rendimiento', icon: PerformanceIcon },
  { key: 'historial', label: 'Historial', icon: HistoryIcon },
  { key: 'calendario', label: 'Calendario', icon: CalendarIcon },
  { key: 'finanzas', label: 'Finanzas', icon: FinancesIcon },
];

export const POSITION_LABELS: Record<string, string> = {
  SETTER: 'Colocador',
  OUTSIDE: 'Latero',
  OPPOSITE: 'Opuesto',
  MIDDLE: 'Central',
  LIBERO: 'Libero'
};
