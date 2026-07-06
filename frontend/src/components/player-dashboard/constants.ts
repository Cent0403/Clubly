import { PlayerSection } from './types';

export const PLAYER_SECTIONS: PlayerSection[] = [
  { key: 'resumen', label: 'Resumen' },
  { key: 'rendimiento', label: 'Rendimiento' },
  { key: 'historial', label: 'Historial' },
  { key: 'finanzas', label: 'Finanzas' },
  { key: 'top', label: 'Top' }
];

export const POSITION_LABELS: Record<string, string> = {
  SETTER: 'Colocador',
  OUTSIDE: 'Latero',
  OPPOSITE: 'Opuesto',
  MIDDLE: 'Central',
  LIBERO: 'Libero'
};
