import { MatchRatingRow, RatingItem, Role } from '../../types';
import { POSITION_LABELS, POSITION_OPTION_LABELS } from './constants';
import { UserFormState } from './types';

export function formatRole(role: Role) {
  return role === 'ADMIN' ? 'Admin' : 'Jugador';
}

export function formatPosition(position: string | null | undefined) {
  if (!position) {
    return 'Sin posición';
  }

  return POSITION_LABELS[position as keyof typeof POSITION_LABELS] ?? position;
}

export function formatPositionOption(position: UserFormState['position']) {
  return position === '' ? 'Posicion (opcional)' : POSITION_OPTION_LABELS[position];
}

export function mapMatchRatingRowToRating(row: MatchRatingRow): RatingItem {
  return {
    playerId: row.player_id,
    minutesPlayed: row.minutes_played === 1,
    attackPoints: row.attack_points,
    attackComplicated: row.attack_complicated,
    attackErrors: row.attack_errors,
    serveAces: row.serve_aces,
    serveComplicated: row.serve_complicated,
    servePasarlo: row.serve_pasarlo,
    serveErrors: row.serve_errors,
    blockPoints: row.block_points,
    blockTouches: row.block_touches,
    defenseSuccesses: row.defense_successes,
    receptionPerfect: row.reception_perfect,
    receptionGood: row.reception_good,
    receptionBad: row.reception_bad,
    receptionError: row.reception_error,
    setAssists: row.set_assists,
    setErrors: row.set_errors
  };
}
