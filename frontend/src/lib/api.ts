import {
  AdminUserItem,
  CalendarAttendancePayload,
  CalendarEvent,
  CreateCalendarEventPayload,
  UpdateCalendarEventPayload,
  FinanceCategory,
  FinanceDebt,
  FinanceDebtPayment,
  FinanceOverview,
  FinanceTransaction,
  FinanceType,
  GlobalStats,
  LoginResponse,
  MatchItem,
  MatchRatingRow,
  PlayerFinanceDebtSummary,
  CreateUserPayload,
  TeamSettings,
  UpdateTeamSettingsPayload,
  UpdateMyProfilePayload,
  UpdateUserPayload,
  PlayerStatsResponse,
  PlayerItem,
  PlayerSummary,
  PlayerHistoryItem,
  RatingItem
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampPercentage(value: unknown, fallback = 0): number {
  return Math.max(0, Math.min(100, toNumber(value, fallback)));
}

function toDateInput(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toDateTimeInput(value: unknown): string {
  if (typeof value !== 'string' && !(value instanceof Date)) {
    return '';
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    // Preserve wall-clock time from API responses and avoid timezone shifts.
    const plainDateTimeMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/);
    if (plainDateTimeMatch) {
      return `${plainDateTimeMatch[1]}T${plainDateTimeMatch[2]}`;
    }
  }

  const normalizedValue = typeof value === 'string' ? value.replace(' ', 'T') : value;
  const date = normalizedValue instanceof Date ? normalizedValue : new Date(normalizedValue);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function normalizePlayer(player: PlayerItem): PlayerItem {
  return {
    ...player,
    player_id: toNumber(player.player_id),
    user_id: toNumber(player.user_id),
    jersey_number: player.jersey_number === null ? null : toNumber(player.jersey_number),
    overall_score: clampPercentage(player.overall_score, 0)
  };
}

function normalizeAdminUser(user: AdminUserItem): AdminUserItem {
  return {
    ...user,
    id: toNumber(user.id),
    player_id: user.player_id === null ? null : toNumber(user.player_id),
    jersey_number: user.jersey_number === null ? null : toNumber(user.jersey_number)
  };
}

function normalizeMatch(match: MatchItem): MatchItem {
  return {
    ...match,
    id: toNumber(match.id),
    match_date: toDateInput(match.match_date),
    participant_count:
      match.participant_count === undefined ? undefined : toNumber(match.participant_count, 0)
  };
}

function normalizeGlobalStats(stats: GlobalStats): GlobalStats {
  return {
    teamOverview: {
      team_overall_avg: clampPercentage(stats.teamOverview?.team_overall_avg, 0),
      team_reception_avg: clampPercentage(stats.teamOverview?.team_reception_avg, 0),
      team_serve_avg: clampPercentage(stats.teamOverview?.team_serve_avg, 0),
      team_defense_avg: clampPercentage(stats.teamOverview?.team_defense_avg, 0),
      team_attack_avg: clampPercentage(stats.teamOverview?.team_attack_avg, 0),
      team_block_avg: clampPercentage(stats.teamOverview?.team_block_avg, 0),
      team_setting_avg: clampPercentage(stats.teamOverview?.team_setting_avg, 0),
      team_attack_points_per_set_avg: toNumber(stats.teamOverview?.team_attack_points_per_set_avg, 0),
      roster_size: toNumber(stats.teamOverview?.roster_size, 0)
    },
    evolution: (stats.evolution ?? []).map((item) => ({
      ...item,
      match_id: toNumber(item.match_id),
      team_match_performance: clampPercentage(item.team_match_performance, 0)
    })),
    topPlayers: {
      reception: (stats.topPlayers?.reception ?? []).map((item) => ({
        ...item,
        score: clampPercentage(item.score, 0)
      })),
      serve: (stats.topPlayers?.serve ?? []).map((item) => ({
        ...item,
        score: clampPercentage(item.score, 0)
      })),
      defense: (stats.topPlayers?.defense ?? []).map((item) => ({
        ...item,
        score: clampPercentage(item.score, 0)
      })),
      attack: (stats.topPlayers?.attack ?? []).map((item) => ({
        ...item,
        score: clampPercentage(item.score, 0)
      })),
      block: (stats.topPlayers?.block ?? []).map((item) => ({
        ...item,
        score: clampPercentage(item.score, 0)
      })),
      setting: (stats.topPlayers?.setting ?? []).map((item) => ({
        ...item,
        score: clampPercentage(item.score, 0)
      }))
    }
  };
}

function normalizePlayerSummary(summary: PlayerSummary): PlayerSummary {
  return {
    ...summary,
    player_id: toNumber(summary.player_id),
    overall_score: clampPercentage(summary.overall_score, 0),
    avg_attack_points_per_set: toNumber(summary.avg_attack_points_per_set, 0),
    avg_reception: clampPercentage(summary.avg_reception, 0),
    avg_serve: clampPercentage(summary.avg_serve, 0),
    avg_defense: clampPercentage(summary.avg_defense, 0),
    avg_attack: clampPercentage(summary.avg_attack, 0),
    avg_block: clampPercentage(summary.avg_block, 0),
    avg_setting: clampPercentage(summary.avg_setting, 0),
    matches_rated: toNumber(summary.matches_rated, 0)
  };
}

function normalizePlayerHistory(item: PlayerHistoryItem): PlayerHistoryItem {
  return {
    ...item,
    match_id: toNumber(item.match_id),
    match_date: toDateInput(item.match_date),
    overall_efficiency: clampPercentage(item.overall_efficiency, 0),
    attack_efficiency: clampPercentage(item.attack_efficiency, 0),
    attack_points_per_set: toNumber(item.attack_points_per_set, 0),
    serve_in_percentage: clampPercentage(item.serve_in_percentage, 0),
    serve_efficiency: clampPercentage(item.serve_efficiency, 0),
    reception_efficiency: clampPercentage(item.reception_efficiency, 0),
    setting_efficiency: clampPercentage(item.setting_efficiency, 0),
    defense_efficiency: clampPercentage(item.defense_efficiency, 0),
    block_efficiency: clampPercentage(item.block_efficiency, 0),
    match_performance: clampPercentage(item.match_performance, 0),
    reception_attempts: toNumber(item.reception_attempts, 0),
    block_total: toNumber(item.block_total, 0),
    sets_played: toNumber(item.sets_played, 0),
    attack_points: toNumber(item.attack_points, 0),
    attack_errors: toNumber(item.attack_errors, 0),
    attack_attempts: toNumber(item.attack_attempts, 0),
    serve_aces: toNumber(item.serve_aces, 0),
    serve_errors: toNumber(item.serve_errors, 0),
    serve_attempts: toNumber(item.serve_attempts, 0),
    block_kill: toNumber(item.block_kill, 0),
    block_touch: toNumber(item.block_touch, 0),
    block_error: toNumber(item.block_error, 0),
    defense_successes: toNumber(item.defense_successes, 0),
    defense_failures: toNumber(item.defense_failures, 0),
    reception_three: toNumber(item.reception_three, 0),
    reception_two: toNumber(item.reception_two, 0),
    reception_one: toNumber(item.reception_one, 0),
    reception_zero: toNumber(item.reception_zero, 0),
    set_assists: toNumber(item.set_assists, 0),
    set_errors: toNumber(item.set_errors, 0),
    set_attempts: toNumber(item.set_attempts, 0)
  };
}

function normalizeMatchRatingRow(row: MatchRatingRow): MatchRatingRow {
  return {
    ...row,
    match_id: toNumber(row.match_id),
    player_id: toNumber(row.player_id),
    minutes_played: toNumber(row.minutes_played, 1),
    sets_played: toNumber(row.sets_played, 0),
    attack_points: toNumber(row.attack_points, 0),
    attack_errors: toNumber(row.attack_errors, 0),
    attack_attempts: toNumber(row.attack_attempts, 0),
    serve_aces: toNumber(row.serve_aces, 0),
    serve_errors: toNumber(row.serve_errors, 0),
    serve_attempts: toNumber(row.serve_attempts, 0),
    reception_three: toNumber(row.reception_three, 0),
    reception_two: toNumber(row.reception_two, 0),
    reception_one: toNumber(row.reception_one, 0),
    reception_zero: toNumber(row.reception_zero, 0),
    reception_attempts: toNumber(row.reception_attempts, 0),
    defense_successes: toNumber(row.defense_successes, 0),
    defense_failures: toNumber(row.defense_failures, 0),
    set_assists: toNumber(row.set_assists, 0),
    set_errors: toNumber(row.set_errors, 0),
    set_attempts: toNumber(row.set_attempts, 0),
    block_kill: toNumber(row.block_kill, 0),
    block_touch: toNumber(row.block_touch, 0),
    block_error: toNumber(row.block_error, 0),
    block_total: toNumber(row.block_total, 0),
    attack_efficiency: clampPercentage(row.attack_efficiency, 0),
    attack_points_per_set: toNumber(row.attack_points_per_set, 0),
    serve_in_percentage: clampPercentage(row.serve_in_percentage, 0),
    serve_efficiency: clampPercentage(row.serve_efficiency, 0),
    reception_efficiency: clampPercentage(row.reception_efficiency, 0),
    setting_efficiency: clampPercentage(row.setting_efficiency, 0),
    defense_efficiency: clampPercentage(row.defense_efficiency, 0),
    block_efficiency: clampPercentage(row.block_efficiency, 0),
    overall_efficiency: clampPercentage(row.overall_efficiency, 0),
    match_performance: clampPercentage(row.match_performance, 0)
  };
}

function normalizeFinanceCategory(category: FinanceCategory): FinanceCategory {
  return {
    ...category,
    id: toNumber(category.id),
    type: category.type === 'expense' ? 'expense' : 'income'
  };
}

function normalizeFinanceTransaction(transaction: FinanceTransaction): FinanceTransaction {
  return {
    ...transaction,
    id: toNumber(transaction.id),
    category_id: transaction.category_id === null ? null : toNumber(transaction.category_id),
    amount: toNumber(transaction.amount, 0),
    type: transaction.type === 'expense' ? 'expense' : 'income',
    transaction_date: toDateInput(transaction.transaction_date)
  };
}

function normalizeFinanceDebt(debt: FinanceDebt): FinanceDebt {
  return {
    ...debt,
    id: toNumber(debt.id),
    player_id: toNumber(debt.player_id),
    amount_due: toNumber(debt.amount_due, 0),
    amount_paid: toNumber(debt.amount_paid, 0),
    amount_pending: toNumber(debt.amount_pending, 0),
    due_date: debt.due_date ? toDateInput(debt.due_date) : null
  };
}

function normalizeFinanceDebtPayment(payment: FinanceDebtPayment): FinanceDebtPayment {
  return {
    ...payment,
    id: toNumber(payment.id),
    debt_id: toNumber(payment.debt_id),
    amount_paid: toNumber(payment.amount_paid, 0),
    payment_date: toDateInput(payment.payment_date)
  };
}

function normalizeCalendarEvent(event: CalendarEvent): CalendarEvent {
  return {
    ...event,
    id: toNumber(event.id),
    es_repetitivo: Boolean(event.es_repetitivo),
    fecha_inicio_serie: toDateInput(event.fecha_inicio_serie),
    fecha_fin_serie: event.fecha_fin_serie ? toDateInput(event.fecha_fin_serie) : null,
    creado_en: toDateTimeInput(event.creado_en),
    actualizado_en: toDateTimeInput(event.actualizado_en),
    instances: (event.instances ?? []).map((instance) => ({
      ...instance,
      id: toNumber(instance.id),
      event_id: toNumber(instance.event_id),
      fecha_hora_inicio: toDateTimeInput(instance.fecha_hora_inicio),
      fecha_hora_fin: toDateTimeInput(instance.fecha_hora_fin),
      requiere_asistencia: Boolean(instance.requiere_asistencia),
      attendance_counts: {
        asistira: toNumber(instance.attendance_counts?.asistira, 0),
        no_asistira: toNumber(instance.attendance_counts?.no_asistira, 0),
        pendiente: toNumber(instance.attendance_counts?.pendiente, 0),
        tarde: toNumber(instance.attendance_counts?.tarde, 0),
        responded: toNumber(instance.attendance_counts?.responded, 0)
      },
      attending_players: (instance.attending_players ?? []).map((player) => ({
        ...player,
        jugador_id: toNumber(player.jugador_id),
        jersey_number: player.jersey_number === null ? null : toNumber(player.jersey_number)
      })),
      my_response: instance.my_response
        ? {
            estado_asistencia: instance.my_response.estado_asistencia,
            comentario: instance.my_response.comentario,
            respondido_en: instance.my_response.respondido_en ? toDateTimeInput(instance.my_response.respondido_en) : null
          }
        : instance.my_response ?? null
    }))
  };
}

function normalizeFinanceOverview(overview: FinanceOverview): FinanceOverview {
  return {
    totalIncome: toNumber(overview.totalIncome, 0),
    totalExpense: toNumber(overview.totalExpense, 0),
    balance: toNumber(overview.balance, 0),
    totalDebtDue: toNumber(overview.totalDebtDue, 0),
    totalDebtPaid: toNumber(overview.totalDebtPaid, 0),
    totalDebtPending: toNumber(overview.totalDebtPending, 0),
    debtCount: toNumber(overview.debtCount, 0),
    debtStatusCount: {
      pending: toNumber(overview.debtStatusCount?.pending, 0),
      partiallyPaid: toNumber(overview.debtStatusCount?.partiallyPaid, 0),
      paid: toNumber(overview.debtStatusCount?.paid, 0)
    }
  };
}

function normalizePlayerFinanceDebtSummary(summary: PlayerFinanceDebtSummary): PlayerFinanceDebtSummary {
  return {
    totalDue: toNumber(summary.totalDue, 0),
    totalPaid: toNumber(summary.totalPaid, 0),
    totalPending: toNumber(summary.totalPending, 0),
    debtCount: toNumber(summary.debtCount, 0),
    pendingCount: toNumber(summary.pendingCount, 0),
    upcomingCount: toNumber(summary.upcomingCount, 0),
    nextDueDate: summary.nextDueDate ? toDateInput(summary.nextDueDate) : null
  };
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {})
    }
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message ?? 'Request failed');
  }

  return (await response.json()) as T;
}

export const api = {
  getTeamSettings: async () => {
    const response = await request<{ settings: TeamSettings }>('/settings');
    return {
      settings: {
        teamName: response.settings?.teamName || 'Clubly',
        teamLogoUrl: response.settings?.teamLogoUrl ?? null
      }
    };
  },

  updateTeamSettings: async (token: string, payload: UpdateTeamSettingsPayload) => {
    const response = await request<{ message: string; settings: TeamSettings }>(
      '/settings',
      {
        method: 'PUT',
        body: JSON.stringify(payload)
      },
      token
    );

    return {
      message: response.message,
      settings: {
        teamName: response.settings?.teamName || 'Clubly',
        teamLogoUrl: response.settings?.teamLogoUrl ?? null
      }
    };
  },

  login: (username: string, password: string) =>
    request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),

  me: (token: string) => request<{ user: LoginResponse['user'] }>('/auth/me', {}, token),

  getPlayers: async (token: string) => {
    const response = await request<{ players: PlayerItem[] }>('/players', {}, token);
    return {
      players: response.players.map(normalizePlayer)
    };
  },

  getMatches: async (token: string) => {
    const response = await request<{ matches: MatchItem[] }>('/matches', {}, token);
    return {
      matches: response.matches.map(normalizeMatch)
    };
  },

  getCalendar: async (token: string) => {
    const response = await request<{ events: CalendarEvent[] }>('/calendar', {}, token);
    return {
      events: response.events.map(normalizeCalendarEvent)
    };
  },

  createCalendarEvent: (token: string, payload: CreateCalendarEventPayload) =>
    request<{ message: string; eventId: number; instancesCreated: number }>(
      '/calendar',
      {
        method: 'POST',
        body: JSON.stringify(payload)
      },
      token
    ),

  updateCalendarEvent: (token: string, instanceId: number, payload: UpdateCalendarEventPayload) =>
    request<{ message: string }>(
      `/calendar/instances/${instanceId}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload)
      },
      token
    ),

  deleteCalendarEvent: (token: string, instanceId: number) =>
    request<{ message: string }>(
      `/calendar/instances/${instanceId}`,
      {
        method: 'DELETE'
      },
      token
    ),

  saveCalendarAttendance: (token: string, instanceId: number, payload: CalendarAttendancePayload) =>
    request<{ message: string }>(
      `/calendar/instances/${instanceId}/attendance`,
      {
        method: 'POST',
        body: JSON.stringify(payload)
      },
      token
    ),

  createMatch: (
    token: string,
    payload: { matchDate: string; opponent: string; tournament: string; location?: string; notes?: string }
  ) =>
    request<{ id: number; message: string }>(
      '/matches',
      {
        method: 'POST',
        body: JSON.stringify(payload)
      },
      token
    ),

  updateMatch: (
    token: string,
    matchId: number,
    payload: { matchDate: string; opponent: string; tournament: string; location?: string; notes?: string }
  ) =>
    request<{ message: string }>(
      `/matches/${matchId}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload)
      },
      token
    ),

  deleteMatch: (token: string, matchId: number) =>
    request<{ message: string }>(
      `/matches/${matchId}`,
      {
        method: 'DELETE'
      },
      token
    ),

  assignPlayers: (token: string, matchId: number, playerIds: number[]) =>
    request<{ message: string }>(
      `/matches/${matchId}/players`,
      {
        method: 'POST',
        body: JSON.stringify({ playerIds })
      },
      token
    ),

  saveRatings: (token: string, matchId: number, ratings: RatingItem[]) =>
    request<{ message: string }>(
      `/matches/${matchId}/ratings`,
      {
        method: 'POST',
        body: JSON.stringify({ ratings })
      },
      token
    ),

  getMatchRatings: async (token: string, matchId: number) => {
    const response = await request<{ ratings: MatchRatingRow[] }>(`/matches/${matchId}/ratings`, {}, token);
    return {
      ratings: response.ratings.map(normalizeMatchRatingRow)
    };
  },

  getGlobalStats: async (token: string) => {
    const response = await request<GlobalStats>('/stats/global', {}, token);
    return normalizeGlobalStats(response);
  },

  getGlobalSummary: async (token: string) => {
    const response = await request<GlobalStats>('/stats/global-summary', {}, token);
    return normalizeGlobalStats(response);
  },

  getTopPlayers: async (token: string) => {
    const response = await request<{ players: PlayerItem[] }>('/stats/top', {}, token);
    return {
      players: response.players.map(normalizePlayer)
    };
  },

  createUser: (token: string, payload: CreateUserPayload) =>
    request<{ message: string; user: { id: number; username: string; fullName: string; role: 'ADMIN' | 'PLAYER'; playerId: number | null } }>(
      '/users',
      {
        method: 'POST',
        body: JSON.stringify(payload)
      },
      token
    ),

  getUsers: async (token: string) => {
    const response = await request<{ users: AdminUserItem[] }>('/users', {}, token);
    return {
      users: response.users.map(normalizeAdminUser)
    };
  },

  updateUser: async (token: string, userId: number, payload: UpdateUserPayload) => {
    const response = await request<{ message: string; user: AdminUserItem }>(
      `/users/${userId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload)
      },
      token
    );

    return {
      message: response.message,
      user: normalizeAdminUser(response.user)
    };
  },

  deleteUser: (token: string, userId: number) =>
    request<{ message: string }>(
      `/users/${userId}`,
      {
        method: 'DELETE'
      },
      token
    ),

  getMyStats: async (token: string) => {
    const response = await request<{ summary: PlayerSummary; history: PlayerHistoryItem[] }>('/stats/me', {}, token);
    return {
      summary: normalizePlayerSummary(response.summary),
      history: response.history.map(normalizePlayerHistory)
    };
  },

  getMyProfile: async (token: string) => {
    const response = await request<{ player: PlayerItem }>('/players/me', {}, token);
    return {
      player: normalizePlayer(response.player)
    };
  },

  updateMyProfile: async (token: string, payload: UpdateMyProfilePayload) => {
    const response = await request<{ message: string; player: PlayerItem }>(
      '/players/me',
      {
        method: 'PATCH',
        body: JSON.stringify(payload)
      },
      token
    );

    return {
      message: response.message,
      player: normalizePlayer(response.player)
    };
  },

  getPlayerStats: async (token: string, playerId: number) => {
    const response = await request<PlayerStatsResponse>(`/stats/player/${playerId}`, {}, token);
    return {
      summary: normalizePlayerSummary(response.summary),
      history: response.history.map(normalizePlayerHistory)
    };
  },

  getFinanceOverview: async (token: string) => {
    const response = await request<{ summary: FinanceOverview }>('/finance/overview', {}, token);
    return normalizeFinanceOverview(response.summary);
  },

  getFinanceCategories: async (token: string, type?: FinanceType) => {
    const query = type ? `?type=${type}` : '';
    const response = await request<{ categories: FinanceCategory[] }>(`/finance/categories${query}`, {}, token);
    return {
      categories: response.categories.map(normalizeFinanceCategory)
    };
  },

  createFinanceCategory: (token: string, payload: { name: string; type: FinanceType }) =>
    request<{ id: number; message: string }>(
      '/finance/categories',
      {
        method: 'POST',
        body: JSON.stringify(payload)
      },
      token
    ),

  updateFinanceCategory: (token: string, categoryId: number, payload: { name: string; type: FinanceType }) =>
    request<{ message: string }>(
      `/finance/categories/${categoryId}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload)
      },
      token
    ),

  getFinanceTransactions: async (token: string, filters?: { type?: FinanceType; from?: string; to?: string }) => {
    const queryParams = new URLSearchParams();
    if (filters?.type) {
      queryParams.set('type', filters.type);
    }
    if (filters?.from) {
      queryParams.set('from', filters.from);
    }
    if (filters?.to) {
      queryParams.set('to', filters.to);
    }

    const query = queryParams.toString();
    const response = await request<{ transactions: FinanceTransaction[] }>(
      `/finance/transactions${query ? `?${query}` : ''}`,
      {},
      token
    );

    return {
      transactions: response.transactions.map(normalizeFinanceTransaction)
    };
  },

  createFinanceTransaction: (
    token: string,
    payload: {
      categoryId?: number | null;
      amount: number;
      type: FinanceType;
      description?: string;
      transactionDate: string;
    }
  ) =>
    request<{ id: number; message: string }>(
      '/finance/transactions',
      {
        method: 'POST',
        body: JSON.stringify(payload)
      },
      token
    ),

  updateFinanceTransaction: (
    token: string,
    transactionId: number,
    payload: {
      categoryId?: number | null;
      amount: number;
      type: FinanceType;
      description?: string;
      transactionDate: string;
    }
  ) =>
    request<{ message: string }>(
      `/finance/transactions/${transactionId}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload)
      },
      token
    ),

  getPlayerDebts: async (token: string) => {
    const response = await request<{ debts: FinanceDebt[]; payments: FinanceDebtPayment[] }>('/finance/debts', {}, token);
    return {
      debts: response.debts.map(normalizeFinanceDebt),
      payments: response.payments.map(normalizeFinanceDebtPayment)
    };
  },

  createPlayerDebt: (
    token: string,
    payload: {
      playerId: number;
      amountDue: number;
      description?: string;
      dueDate?: string;
    }
  ) =>
    request<{ id: number; message: string }>(
      '/finance/debts',
      {
        method: 'POST',
        body: JSON.stringify(payload)
      },
      token
    ),

  updatePlayerDebt: (
    token: string,
    debtId: number,
    payload: {
      amountDue?: number;
      description?: string | null;
      dueDate?: string | null;
    }
  ) =>
    request<{ message: string }>(
      `/finance/debts/${debtId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(payload)
      },
      token
    ),

  createPlayerDebtPayment: (
    token: string,
    debtId: number,
    payload: {
      amountPaid: number;
      paymentDate: string;
    }
  ) =>
    request<{ message: string }>(
      `/finance/debts/${debtId}/payments`,
      {
        method: 'POST',
        body: JSON.stringify(payload)
      },
      token
    ),

  getMyDebts: async (token: string) => {
    const response = await request<{
      summary: PlayerFinanceDebtSummary;
      debts: FinanceDebt[];
      upcomingDebts: FinanceDebt[];
      payments: FinanceDebtPayment[];
    }>('/finance/my-debts', {}, token);

    return {
      summary: normalizePlayerFinanceDebtSummary(response.summary),
      debts: response.debts.map(normalizeFinanceDebt),
      upcomingDebts: response.upcomingDebts.map(normalizeFinanceDebt),
      payments: response.payments.map(normalizeFinanceDebtPayment)
    };
  }
};
