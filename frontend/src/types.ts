export type Role = "ADMIN" | "PLAYER";
export type PlayerPosition =
  "SETTER" | "OUTSIDE" | "OPPOSITE" | "MIDDLE" | "LIBERO";

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

export interface TeamSettings {
  teamName: string;
  teamLogoUrl: string | null;
}

export interface UpdateTeamSettingsPayload {
  teamName?: string;
  teamLogoUrl?: string | null;
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
  secondary_position: string | null;
  overall_score: number;
}

export interface TopPlayersResponse {
  players: PlayerItem[];
}

export interface AdminUserItem {
  id: number;
  username: string;
  full_name: string;
  role: Role;
  player_id: number | null;
  jersey_number: number | null;
  position: string | null;
  secondary_position: string | null;
}

export interface RatingItem {
  playerId: number;
  minutesPlayed: boolean;
  setsPlayed: number;
  attackPoints: number;
  attackErrors: number;
  attackAttempts: number;
  serveAces: number;
  serveErrors: number;
  serveAttempts: number;
  receptionThree: number;
  receptionTwo: number;
  receptionOne: number;
  receptionZero: number;
  defenseSuccesses: number;
  defenseFailures: number;
  setAssists: number;
  setErrors: number;
  setAttempts: number;
  blockKill: number;
  blockTouch: number;
  blockError: number;
}

export interface MatchRatingRow {
  match_id: number;
  player_id: number;
  full_name: string;
  minutes_played: number;
  sets_played: number;
  attack_points: number;
  attack_errors: number;
  attack_attempts: number;
  serve_aces: number;
  serve_errors: number;
  serve_attempts: number;
  reception_three: number;
  reception_two: number;
  reception_one: number;
  reception_zero: number;
  reception_attempts: number;
  defense_successes: number;
  defense_failures: number;
  set_assists: number;
  set_errors: number;
  set_attempts: number;
  block_kill: number;
  block_touch: number;
  block_error: number;
  block_total: number;
  attack_efficiency: number;
  attack_points_per_set: number;
  serve_in_percentage: number;
  serve_efficiency: number;
  reception_efficiency: number;
  setting_efficiency: number;
  defense_efficiency: number;
  block_efficiency: number;
  overall_efficiency: number;
  match_performance: number;
}

export interface CreateUserPayload {
  username: string;
  password: string;
  fullName: string;
  role: Role;
  jerseyNumber?: number;
  position?: PlayerPosition;
  secondaryPosition?: PlayerPosition;
}

export interface UpdateUserPayload {
  username?: string;
  password?: string;
  fullName?: string;
  role?: Role;
  jerseyNumber?: number | null;
  position?: PlayerPosition | null;
  secondaryPosition?: PlayerPosition | null;
}

export interface UpdateMyProfilePayload {
  fullName?: string;
  password?: string;
  jerseyNumber?: number | null;
}

export type CalendarEventType = "partido" | "entreno" | "entrega" | "otro";
export type CalendarFrequency = "diaria" | "semanal" | "mensual";
export type AttendanceStatus =
  "asistira" | "no_asistira" | "pendiente" | "tarde";

export interface CalendarAttendanceCounts {
  asistira: number;
  no_asistira: number;
  pendiente: number;
  tarde: number;
  responded: number;
}

export interface CalendarAttendingPlayer {
  jugador_id: number;
  full_name: string;
  username: string;
  jersey_number: number | null;
  estado_asistencia: AttendanceStatus;
  comentario: string | null;
  respondido_en: string | null;
}

export interface CalendarAttendanceResponse {
  estado_asistencia: AttendanceStatus;
  comentario: string | null;
  respondido_en: string | null;
}

export interface CalendarEventInstance {
  id: number;
  event_id: number;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  requiere_asistencia: boolean;
  estado_instancia: "programado" | "cancelado" | "completado";
  lugar: string | null;
  notas: string | null;
  attendance_counts: CalendarAttendanceCounts;
  attending_players: CalendarAttendingPlayer[];
  my_response?: CalendarAttendanceResponse | null;
}

export interface CalendarEvent {
  id: number;
  titulo: string;
  descripcion: string | null;
  tipo_evento: CalendarEventType;
  es_repetitivo: boolean;
  frecuencia_repeticion: CalendarFrequency | null;
  fecha_inicio_serie: string;
  fecha_fin_serie: string | null;
  creado_en: string;
  actualizado_en: string;
  instances: CalendarEventInstance[];
}

export interface CreateCalendarEventPayload {
  titulo: string;
  descripcion?: string;
  tipoEvento: CalendarEventType;
  esRepetitivo: boolean;
  frecuenciaRepeticion?: CalendarFrequency | null;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  fechaFinSerie?: string | null;
  requiereAsistencia?: boolean;
  lugar?: string | null;
  notas?: string | null;
}

export type UpdateCalendarEventPayload = CreateCalendarEventPayload & {
  estadoInstancia?: "programado" | "cancelado" | "completado";
};

export interface CalendarAttendancePayload {
  estadoAsistencia: AttendanceStatus;
  comentario?: string;
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
  avg_attack_points_per_set: number;
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
  match_performance: number;
  overall_efficiency: number;
  attack_efficiency: number;
  attack_points_per_set: number;
  serve_in_percentage: number;
  serve_efficiency: number;
  reception_efficiency: number;
  setting_efficiency: number;
  defense_efficiency: number;
  block_efficiency: number;
  reception_attempts: number;
  block_total: number;
  sets_played: number;
  attack_points: number;
  attack_errors: number;
  attack_attempts: number;
  serve_aces: number;
  serve_errors: number;
  serve_attempts: number;
  block_kill: number;
  block_touch: number;
  block_error: number;
  defense_successes: number;
  defense_failures: number;
  reception_three: number;
  reception_two: number;
  reception_one: number;
  reception_zero: number;
  set_assists: number;
  set_errors: number;
  set_attempts: number;
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
    team_attack_points_per_set_avg: number;
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

export type FinanceType = "income" | "expense";

export interface FinanceCategory {
  id: number;
  name: string;
  type: FinanceType;
  created_at: string;
}

export interface FinanceTransaction {
  id: number;
  category_id: number | null;
  category_name: string | null;
  amount: number;
  type: FinanceType;
  description: string | null;
  transaction_date: string;
  created_at: string;
}

export interface FinanceDebt {
  id: number;
  player_id: number;
  player_name: string;
  amount_due: number;
  amount_paid: number;
  amount_pending: number;
  description: string | null;
  status: "pending" | "partially_paid" | "paid";
  due_date: string | null;
  created_at: string;
}

export interface FinanceDebtPayment {
  id: number;
  debt_id: number;
  amount_paid: number;
  payment_date: string;
}

export interface FinanceOverview {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  totalDebtDue: number;
  totalDebtPaid: number;
  totalDebtPending: number;
  debtCount: number;
  debtStatusCount: {
    pending: number;
    partiallyPaid: number;
    paid: number;
  };
}

export interface PlayerFinanceDebtSummary {
  totalDue: number;
  totalPaid: number;
  totalPending: number;
  debtCount: number;
  pendingCount: number;
  upcomingCount: number;
  nextDueDate: string | null;
}
