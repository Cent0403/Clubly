import {
  AdminUserItem,
  GlobalStats,
  LoginResponse,
  MatchItem,
  MatchRatingRow,
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

function clampScore(value: unknown, fallback = 0): number {
  return Math.max(0, Math.min(10, toNumber(value, fallback)));
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

function normalizePlayer(player: PlayerItem): PlayerItem {
  return {
    ...player,
    player_id: toNumber(player.player_id),
    user_id: toNumber(player.user_id),
    jersey_number: player.jersey_number === null ? null : toNumber(player.jersey_number),
    overall_score: toNumber(player.overall_score, 5)
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
      team_overall_avg: toNumber(stats.teamOverview?.team_overall_avg, 5),
      team_reception_avg: clampScore(stats.teamOverview?.team_reception_avg, 0),
      team_serve_avg: clampScore(stats.teamOverview?.team_serve_avg, 0),
      team_defense_avg: clampScore(stats.teamOverview?.team_defense_avg, 0),
      team_attack_avg: clampScore(stats.teamOverview?.team_attack_avg, 0),
      team_block_avg: clampScore(stats.teamOverview?.team_block_avg, 0),
      team_setting_avg: clampScore(stats.teamOverview?.team_setting_avg, 0),
      roster_size: toNumber(stats.teamOverview?.roster_size, 0)
    },
    evolution: (stats.evolution ?? []).map((item) => ({
      ...item,
      match_id: toNumber(item.match_id),
      team_match_performance: toNumber(item.team_match_performance, 5)
    })),
    topPlayers: {
      reception: (stats.topPlayers?.reception ?? []).map((item) => ({
        ...item,
        score: clampScore(item.score, 0)
      })),
      serve: (stats.topPlayers?.serve ?? []).map((item) => ({
        ...item,
        score: clampScore(item.score, 0)
      })),
      defense: (stats.topPlayers?.defense ?? []).map((item) => ({
        ...item,
        score: clampScore(item.score, 0)
      })),
      attack: (stats.topPlayers?.attack ?? []).map((item) => ({
        ...item,
        score: clampScore(item.score, 0)
      })),
      block: (stats.topPlayers?.block ?? []).map((item) => ({
        ...item,
        score: clampScore(item.score, 0)
      })),
      setting: (stats.topPlayers?.setting ?? []).map((item) => ({
        ...item,
        score: clampScore(item.score, 0)
      }))
    }
  };
}

function normalizePlayerSummary(summary: PlayerSummary): PlayerSummary {
  return {
    ...summary,
    player_id: toNumber(summary.player_id),
    overall_score: toNumber(summary.overall_score, 5),
    avg_reception: clampScore(summary.avg_reception, 0),
    avg_serve: clampScore(summary.avg_serve, 0),
    avg_defense: clampScore(summary.avg_defense, 0),
    avg_attack: clampScore(summary.avg_attack, 0),
    avg_block: clampScore(summary.avg_block, 0),
    avg_setting: clampScore(summary.avg_setting, 0),
    matches_rated: toNumber(summary.matches_rated, 0)
  };
}

function normalizePlayerHistory(item: PlayerHistoryItem): PlayerHistoryItem {
  return {
    ...item,
    match_id: toNumber(item.match_id),
    match_date: toDateInput(item.match_date),
    reception: clampScore(item.reception, 0),
    serve: clampScore(item.serve, 0),
    defense: clampScore(item.defense, 0),
    attack: clampScore(item.attack, 0),
    block_score: clampScore(item.block_score, 0),
    setting_score: clampScore(item.setting_score, 0),
    match_performance: toNumber(item.match_performance, 5)
  };
}

function normalizeMatchRatingRow(row: MatchRatingRow): MatchRatingRow {
  return {
    ...row,
    match_id: toNumber(row.match_id),
    player_id: toNumber(row.player_id),
    minutes_played: toNumber(row.minutes_played, 1),
    attack_points: toNumber(row.attack_points, 0),
    attack_errors: toNumber(row.attack_errors, 0),
    serve_aces: toNumber(row.serve_aces, 0),
    serve_errors: toNumber(row.serve_errors, 0),
    block_points: toNumber(row.block_points, 0),
    block_touches: toNumber(row.block_touches, 0),
    defense_successes: toNumber(row.defense_successes, 0),
    reception_perfect: toNumber(row.reception_perfect, 0),
    reception_good: toNumber(row.reception_good, 0),
    reception_bad: toNumber(row.reception_bad, 0),
    reception_error: toNumber(row.reception_error, 0),
    set_assists: toNumber(row.set_assists, 0),
    set_errors: toNumber(row.set_errors, 0),
    reception: toNumber(row.reception, 0),
    serve: toNumber(row.serve, 0),
    defense: toNumber(row.defense, 0),
    attack: toNumber(row.attack, 0),
    block_score: clampScore(row.block_score, 0),
    setting_score: clampScore(row.setting_score, 0),
    match_performance: toNumber(row.match_performance, 5)
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
        teamName: response.settings?.teamName || 'Volitics',
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
        teamName: response.settings?.teamName || 'Volitics',
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
  }
};
