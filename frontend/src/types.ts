export type Role = 'ADMIN' | 'PLAYER';

export interface AuthUser {
  id: number;
  username: string;
  fullName: string;
  role: Role;
  playerId: number | null;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface MatchItem {
  id: number;
  match_date: string;
  opponent: string;
  tournament: string;
  location: string | null;
  notes: string | null;
  participant_count?: number;
}

export interface PlayerItem {
  player_id: number;
  user_id: number;
  username: string;
  full_name: string;
  jersey_number: number | null;
  position: string | null;
  overall_score: number;
}

export interface RatingItem {
  playerId: number;
  minutesPlayed: boolean;
  attackPoints: number;
  attackErrors: number;
  serveAces: number;
  serveErrors: number;
  blockPoints: number;
  blockTouches: number;
  defenseSuccesses: number;
  receptionPerfect: number;
  receptionGood: number;
  receptionBad: number;
  receptionError: number;
  setAssists: number;
  setErrors: number;
}

export interface MatchRatingRow {
  match_id: number;
  player_id: number;
  full_name: string;
  minutes_played: number;
  attack_points: number;
  attack_errors: number;
  serve_aces: number;
  serve_errors: number;
  block_points: number;
  block_touches: number;
  defense_successes: number;
  reception_perfect: number;
  reception_good: number;
  reception_bad: number;
  reception_error: number;
  set_assists: number;
  set_errors: number;
  reception: number;
  serve: number;
  defense: number;
  attack: number;
  block_score: number;
  setting_score: number;
  match_performance: number;
}

export interface CreateUserPayload {
  username: string;
  password: string;
  fullName: string;
  role: Role;
  jerseyNumber?: number;
  position?: 'SETTER' | 'OUTSIDE' | 'OPPOSITE' | 'MIDDLE' | 'LIBERO' | 'DEFENSIVE_SPECIALIST';
}

export interface UpdateMyProfilePayload {
  fullName?: string;
  password?: string;
}

export interface PlayerStatsResponse {
  summary: PlayerSummary;
  history: PlayerHistoryItem[];
}

export interface PlayerSummary {
  player_id: number;
  full_name: string;
  username: string;
  overall_score: number;
  avg_reception: number;
  avg_serve: number;
  avg_defense: number;
  avg_attack: number;
  avg_block: number;
  avg_setting: number;
  matches_rated: number;
}

export interface PlayerHistoryItem {
  match_id: number;
  match_date: string;
  opponent: string;
  tournament: string;
  reception: number;
  serve: number;
  defense: number;
  attack: number;
  block_score: number;
  setting_score: number;
  match_performance: number;
}

export interface GlobalStats {
  teamOverview: {
    team_overall_avg: number;
    team_reception_avg: number;
    team_serve_avg: number;
    team_defense_avg: number;
    team_attack_avg: number;
    team_block_avg: number;
    team_setting_avg: number;
    roster_size: number;
  };
  evolution: Array<{
    match_id: number;
    match_date: string;
    opponent: string;
    tournament: string;
    team_match_performance: number;
  }>;
  topPlayers: {
    reception: Array<{ full_name: string; score: number }>;
    serve: Array<{ full_name: string; score: number }>;
    defense: Array<{ full_name: string; score: number }>;
    attack: Array<{ full_name: string; score: number }>;
    block: Array<{ full_name: string; score: number }>;
    setting: Array<{ full_name: string; score: number }>;
  };
}
