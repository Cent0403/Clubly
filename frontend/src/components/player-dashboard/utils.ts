import { PlayerSummary } from '../../types';
import { POSITION_LABELS } from './constants';
import { RadarMetric, SummaryCard } from './types';

export function formatRole(role: string | null | undefined) {
  if (role === 'ADMIN') {
    return 'Admin';
  }

  if (role === 'PLAYER') {
    return 'Jugador';
  }

  return role ?? 'Sin rol';
}

export function formatPosition(position: string | null | undefined) {
  if (!position) {
    return 'Sin posición';
  }

  return POSITION_LABELS[position] ?? position;
}

export function buildRadarMetrics(summary: PlayerSummary | null): RadarMetric[] {
  return [
    { label: 'Recepcion', value: summary?.avg_reception ?? 0 },
    { label: 'Saque', value: summary?.avg_serve ?? 0 },
    { label: 'Defensa', value: summary?.avg_defense ?? 0 },
    { label: 'Ataque', value: summary?.avg_attack ?? 0 },
    { label: 'Bloqueo', value: summary?.avg_block ?? 0 },
    { label: 'Armado', value: summary?.avg_setting ?? 0 }
  ];
}

export function getBestFundament(metrics: RadarMetric[]) {
  return metrics.reduce(
    (best, metric) => (metric.value > best.value ? metric : best),
    metrics[0] ?? { label: 'Recepcion', value: 0 }
  );
}

export function getWorstFundament(metrics: RadarMetric[]) {
  return metrics.reduce(
    (worst, metric) => (metric.value < worst.value ? metric : worst),
    metrics[0] ?? { label: 'Recepcion', value: 0 }
  );
}

export function buildSummaryCards(summary: PlayerSummary | null, bestFundament: RadarMetric, worstFundament: RadarMetric): SummaryCard[] {
  return [
    { label: 'Eficiencia global', value: summary?.overall_score ?? 0, accent: 'text-sky-500' },
    { label: 'Partidos calificados', value: summary?.matches_rated ?? 0, accent: 'text-amber-500' },
    { label: 'Pts ataque/set', value: summary?.avg_attack_points_per_set ?? 0, accent: 'text-violet-500' },
    {
      label: `Mejor fundamento: ${bestFundament.label}`,
      value: bestFundament.value,
      accent: 'text-emerald-500'
    }
  ];
}
