import { PlayerSummary, PlayerHistoryItem } from '../../types';
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

export interface MedalBadge {
  threshold: number;
  achieved: boolean;
}

export interface MedalGroup {
  category: string;
  description: string;
  currentStreak: number;
  badges: MedalBadge[];
}

const MEDAL_THRESHOLDS = [3, 6, 9, 12];

function matchQualifies(category: string, match: PlayerHistoryItem): boolean {
  switch (category) {
    case 'Recepción sin errores':
      return match.reception_zero === 0;
    case 'Bloqueo +3':
      return match.block_kill >= 3;
    case 'Remates +10':
      return match.attack_points >= 10;
    case 'Saque +5':
      return match.serve_aces >= 5;
    case 'Defensas +10':
      return match.defense_successes + match.block_kill + match.block_touch >= 10;
    case 'Armado +25 asistencias':
      return match.set_assists > 25;
    case 'Racha de partidos asistidos':
      return match.sets_played >= 1;
    default:
      return false;
  }
}

function buildStreak(category: string, history: PlayerHistoryItem[]): MedalGroup {
  const badges = MEDAL_THRESHOLDS.map((threshold) => ({ threshold, achieved: false }));
  let currentStreak = 0;
  let maxStreak = 0;

  for (const match of history) {
    if (matchQualifies(category, match)) {
      currentStreak += 1;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  badges.forEach((badge) => {
    if (maxStreak >= badge.threshold) {
      badge.achieved = true;
    }
  });

  return {
    category,
    description:
      category === 'Recepción sin errores'
        ? 'Partidos consecutivos sin recepciones fallidas.'
        : category === 'Bloqueo +3'
        ? 'Partidos consecutivos con al menos 3 bloqueos efectivos.'
        : category === 'Remates +10'
        ? 'Partidos consecutivos con 10 o más puntos de ataque.'
        : category === 'Saque +5'
        ? 'Partidos consecutivos con 5 o más aces de saque.'
        : category === 'Defensas +10'
        ? 'Partidos consecutivos con 10 o más acciones defensivas.'
        : category === 'Armado +25 asistencias'
        ? 'Partidos consecutivos con más de 25 asistencias de armado.'
        : 'Partidos consecutivos con al menos una asistencia de armado.',
    currentStreak,
    badges
  };
}

export function buildPlayerMedalGroups(history: PlayerHistoryItem[]): MedalGroup[] {
  if (history.length === 0) {
    return [];
  }

  return [
    buildStreak('Recepción sin errores', history),
    buildStreak('Bloqueo +3', history),
    buildStreak('Remates +10', history),
    buildStreak('Saque +5', history),
    buildStreak('Defensas +10', history),
    buildStreak('Armado +25 asistencias', history),
    buildStreak('Racha de partidos asistidos', history)
  ];
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
