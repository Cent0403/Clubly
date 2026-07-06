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
    setsPlayed: row.sets_played,
    attackPoints: row.attack_points,
    attackErrors: row.attack_errors,
    attackAttempts: row.attack_attempts,
    serveAces: row.serve_aces,
    serveErrors: row.serve_errors,
    serveAttempts: row.serve_attempts,
    blockKill: row.block_kill,
    blockTouch: row.block_touch,
    blockError: row.block_error,
    defenseSuccesses: row.defense_successes,
    defenseFailures: row.defense_failures,
    receptionThree: row.reception_three,
    receptionTwo: row.reception_two,
    receptionOne: row.reception_one,
    receptionZero: row.reception_zero,
    setAssists: row.set_assists,
    setErrors: row.set_errors,
    setAttempts: row.set_attempts
  };
}
