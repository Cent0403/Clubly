import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import {
  GlobalStats,
  MatchItem,
  MatchRatingRow,
  PlayerHistoryItem,
  PlayerItem,
  PlayerSummary,
  RatingItem,
  Role
} from '../types';
import { MetricBars } from './charts/MetricBars';

interface AdminDashboardProps {
  token: string;
}

interface MatchFormState {
  matchDate: string;
  opponent: string;
  tournament: string;
  location: string;
  notes: string;
}

interface UserFormState {
  username: string;
  password: string;
  fullName: string;
  role: Role;
  jerseyNumber: string;
  position: '' | 'SETTER' | 'OUTSIDE' | 'OPPOSITE' | 'MIDDLE' | 'LIBERO' | 'DEFENSIVE_SPECIALIST';
}

const EMPTY_MATCH_FORM: MatchFormState = {
  matchDate: '',
  opponent: '',
  tournament: '',
  location: '',
  notes: ''
};

const EMPTY_USER_FORM: UserFormState = {
  username: '',
  password: '',
  fullName: '',
  role: 'PLAYER',
  jerseyNumber: '',
  position: ''
};

const USER_POSITIONS: Array<UserFormState['position']> = [
  '',
  'SETTER',
  'OUTSIDE',
  'OPPOSITE',
  'MIDDLE',
  'LIBERO',
  'DEFENSIVE_SPECIALIST'
];

const EVENT_FIELDS: Array<{ key: keyof Omit<RatingItem, 'playerId' | 'minutesPlayed'>; label: string }> = [
  { key: 'attackPoints', label: 'Ataque: puntos' },
  { key: 'attackErrors', label: 'Ataque: errores' },
  { key: 'serveAces', label: 'Saque: aces' },
  { key: 'serveErrors', label: 'Saque: errores' },
  { key: 'blockPoints', label: 'Bloqueo: puntos' },
  { key: 'blockTouches', label: 'Bloqueo: toques' },
  { key: 'defenseSuccesses', label: 'Defensa: exitosas' },
  { key: 'receptionPerfect', label: 'Recepcion: perfectas' },
  { key: 'receptionGood', label: 'Recepcion: buenas' },
  { key: 'receptionBad', label: 'Recepcion: malas' },
  { key: 'receptionError', label: 'Recepcion: errores' },
  { key: 'setAssists', label: 'Armado: asistencias' },
  { key: 'setErrors', label: 'Armado: errores' }
];

const FUNDAMENT_GROUPS = [
  {
    title: 'Recepcion',
    description: 'Perfectas, buenas, malas y error',
    fields: ['receptionPerfect', 'receptionGood', 'receptionBad', 'receptionError'] as const
  },
  {
    title: 'Ataque',
    description: 'Puntos y errores',
    fields: ['attackPoints', 'attackErrors'] as const
  },
  {
    title: 'Saque',
    description: 'Aces y errores',
    fields: ['serveAces', 'serveErrors'] as const
  },
  {
    title: 'Bloqueo',
    description: 'Puntos y toques',
    fields: ['blockPoints', 'blockTouches'] as const
  },
  {
    title: 'Defensa',
    description: 'Defensas exitosas',
    fields: ['defenseSuccesses'] as const
  },
  {
    title: 'Armado',
    description: 'Asistencias y errores',
    fields: ['setAssists', 'setErrors'] as const
  }
] as const;

const TOP_RANKINGS = [
  { key: 'reception', title: 'Top recepción' },
  { key: 'serve', title: 'Top saque' },
  { key: 'defense', title: 'Top defensa' },
  { key: 'attack', title: 'Top ataque' },
  { key: 'block', title: 'Top bloqueo' },
  { key: 'setting', title: 'Top armado' }
] as const;

function createDefaultRating(playerId: number): RatingItem {
  return {
    playerId,
    minutesPlayed: true,
    attackPoints: 0,
    attackErrors: 0,
    serveAces: 0,
    serveErrors: 0,
    blockPoints: 0,
    blockTouches: 0,
    defenseSuccesses: 0,
    receptionPerfect: 0,
    receptionGood: 0,
    receptionBad: 0,
    receptionError: 0,
    setAssists: 0,
    setErrors: 0
  };
}

export function AdminDashboard({ token }: AdminDashboardProps) {
  const [players, setPlayers] = useState<PlayerItem[]>([]);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  const [ratings, setRatings] = useState<Record<number, RatingItem>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [matchForm, setMatchForm] = useState<MatchFormState>(EMPTY_MATCH_FORM);
  const [userForm, setUserForm] = useState<UserFormState>(EMPTY_USER_FORM);
  const [editingMatchId, setEditingMatchId] = useState<number | null>(null);
  const [loadingMatchRatings, setLoadingMatchRatings] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [selectedPlayerStatId, setSelectedPlayerStatId] = useState<number | null>(null);
  const [selectedPlayerSummary, setSelectedPlayerSummary] = useState<PlayerSummary | null>(null);
  const [selectedPlayerHistory, setSelectedPlayerHistory] = useState<PlayerHistoryItem[]>([]);
  const [loadingPlayerStats, setLoadingPlayerStats] = useState(false);

  const selectedMatch = useMemo(
    () => matches.find((match) => match.id === selectedMatchId) ?? null,
    [matches, selectedMatchId]
  );

  async function loadInitialData() {
    setLoading(true);
    setError(null);

    try {
      const [playersRes, matchesRes, statsRes] = await Promise.all([
        api.getPlayers(token),
        api.getMatches(token),
        api.getGlobalStats(token)
      ]);

      setPlayers(playersRes.players);
      setMatches(matchesRes.matches);
      setGlobalStats(statsRes);

      if (matchesRes.matches.length > 0 && !selectedMatchId) {
        setSelectedMatchId(matchesRes.matches[0].id);
      }
    } catch (loadError) {
      setError((loadError as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadInitialData();
  }, []);

  async function refreshGlobalStats() {
    const stats = await api.getGlobalStats(token);
    setGlobalStats(stats);
  }

  useEffect(() => {
    if (!selectedPlayerStatId && players.length > 0) {
      setSelectedPlayerStatId(players[0].player_id);
    }
  }, [players, selectedPlayerStatId]);

  useEffect(() => {
    async function loadSelectedMatchRatings(matchId: number) {
      setLoadingMatchRatings(true);

      try {
        const response = await api.getMatchRatings(token, matchId);

        if (response.ratings.length === 0) {
          setSelectedPlayers([]);
          setRatings({});
          return;
        }

        const nextSelectedPlayers: number[] = [];
        const nextRatings: Record<number, RatingItem> = {};

        response.ratings.forEach((row: MatchRatingRow) => {
          nextSelectedPlayers.push(row.player_id);
          nextRatings[row.player_id] = {
            playerId: row.player_id,
            minutesPlayed: row.minutes_played === 1,
            attackPoints: row.attack_points,
            attackErrors: row.attack_errors,
            serveAces: row.serve_aces,
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
        });

        setSelectedPlayers(nextSelectedPlayers);
        setRatings(nextRatings);
      } catch {
        setSelectedPlayers([]);
        setRatings({});
      } finally {
        setLoadingMatchRatings(false);
      }
    }

    if (!selectedMatchId) {
      setSelectedPlayers([]);
      setRatings({});
      return;
    }

    void loadSelectedMatchRatings(selectedMatchId);
  }, [selectedMatchId, token]);

  function togglePlayer(playerId: number) {
    setSelectedPlayers((current) =>
      current.includes(playerId) ? current.filter((id) => id !== playerId) : [...current, playerId]
    );

    setRatings((current) => {
      if (current[playerId]) {
        return current;
      }

      return {
        ...current,
        [playerId]: createDefaultRating(playerId)
      };
    });
  }

  function updateEventCount(playerId: number, field: keyof Omit<RatingItem, 'playerId' | 'minutesPlayed'>, value: number) {
    const sanitizedValue = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));

    setRatings((current) => ({
      ...current,
      [playerId]: {
        ...(current[playerId] ?? createDefaultRating(playerId)),
        [field]: sanitizedValue
      }
    }));
  }

  function updateMinutesPlayed(playerId: number, value: boolean) {
    setRatings((current) => ({
      ...current,
      [playerId]: {
        ...(current[playerId] ?? createDefaultRating(playerId)),
        minutesPlayed: value
      }
    }));
  }

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!userForm.username || !userForm.password || !userForm.fullName) {
      setError('Completa username, password y nombre completo para crear usuario.');
      return;
    }

    setCreatingUser(true);

    try {
      const response = await api.createUser(token, {
        username: userForm.username.trim(),
        password: userForm.password,
        fullName: userForm.fullName.trim(),
        role: userForm.role,
        jerseyNumber:
          userForm.role === 'PLAYER' && userForm.jerseyNumber
            ? Number(userForm.jerseyNumber)
            : undefined,
        position: userForm.role === 'PLAYER' && userForm.position ? userForm.position : undefined
      });

      setMessage('Usuario creado correctamente.');
      setUserForm(EMPTY_USER_FORM);

      if (response.user.role === 'PLAYER' && response.user.playerId) {
        setPlayers((current) => [
          ...current,
          {
            player_id: response.user.playerId as number,
            user_id: response.user.id,
            username: response.user.username,
            full_name: response.user.fullName,
            jersey_number: userForm.jerseyNumber ? Number(userForm.jerseyNumber) : null,
            position: userForm.position || null,
            overall_score: 5
          }
        ]);
      }

      if (response.user.role === 'PLAYER' && response.user.playerId) {
        setSelectedPlayerStatId(response.user.playerId);
        const playerStats = await api.getPlayerStats(token, response.user.playerId);
        setSelectedPlayerSummary(playerStats.summary);
        setSelectedPlayerHistory(playerStats.history);
      }
    } catch (createUserError) {
      setError((createUserError as Error).message);
    } finally {
      setCreatingUser(false);
    }
  }

  async function handleLoadPlayerStats() {
    if (!selectedPlayerStatId) {
      setError('Selecciona un jugador para consultar estadisticas.');
      return;
    }

    setLoadingPlayerStats(true);
    setError(null);

    try {
      const response = await api.getPlayerStats(token, selectedPlayerStatId);
      setSelectedPlayerSummary(response.summary);
      setSelectedPlayerHistory(response.history);
    } catch (playerStatsError) {
      setError((playerStatsError as Error).message);
    } finally {
      setLoadingPlayerStats(false);
    }
  }

  async function handleCreateMatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    try {
      const response = await api.createMatch(token, {
        ...matchForm,
        location: matchForm.location || undefined,
        notes: matchForm.notes || undefined
      });

      setMessage(`Partido creado (#${response.id})`);
      setMatchForm(EMPTY_MATCH_FORM);
      setMatches((current) => [
        {
          id: response.id,
          match_date: matchForm.matchDate,
          opponent: matchForm.opponent,
          tournament: matchForm.tournament,
          location: matchForm.location || null,
          notes: matchForm.notes || null,
          participant_count: 0
        },
        ...current
      ]);
      setSelectedMatchId(response.id);
    } catch (createError) {
      setError((createError as Error).message);
    }
  }

  async function handleUpdateMatch() {
    if (!editingMatchId) {
      setError('Primero carga un partido en el formulario para editar.');
      return;
    }

    setError(null);
    setMessage(null);

    try {
      await api.updateMatch(token, editingMatchId, {
        ...matchForm,
        location: matchForm.location || undefined,
        notes: matchForm.notes || undefined
      });

      setMessage('Partido actualizado correctamente.');
      setMatches((current) =>
        current.map((match) =>
          match.id === editingMatchId
            ? {
                ...match,
                match_date: matchForm.matchDate,
                opponent: matchForm.opponent,
                tournament: matchForm.tournament,
                location: matchForm.location || null,
                notes: matchForm.notes || null
              }
            : match
        )
      );
    } catch (updateError) {
      setError((updateError as Error).message);
    }
  }

  function handleLoadMatchForEdit() {
    if (!selectedMatch) {
      setError('Selecciona un partido para editar.');
      return;
    }

    setEditingMatchId(selectedMatch.id);
    setMatchForm({
      matchDate: selectedMatch.match_date,
      opponent: selectedMatch.opponent,
      tournament: selectedMatch.tournament,
      location: selectedMatch.location ?? '',
      notes: selectedMatch.notes ?? ''
    });
    setMessage(`Editando partido #${selectedMatch.id}`);
    setError(null);
  }

  async function handleDeleteMatch() {
    if (!selectedMatchId) {
      setError('Selecciona un partido para eliminar.');
      return;
    }

    const confirmDelete = window.confirm('Esta accion eliminara el partido, participantes y calificaciones asociadas.');
    if (!confirmDelete) {
      return;
    }

    setError(null);
    setMessage(null);

    try {
      await api.deleteMatch(token, selectedMatchId);
      setMessage('Partido eliminado correctamente.');
      setEditingMatchId(null);
      setMatchForm(EMPTY_MATCH_FORM);
      setSelectedMatchId(null);
      setSelectedPlayers([]);
      setRatings({});
      setMatches((current) => current.filter((match) => match.id !== selectedMatchId));
    } catch (deleteError) {
      setError((deleteError as Error).message);
    }
  }

  async function handleSaveEvaluation() {
    if (!selectedMatchId) {
      setError('Selecciona un partido antes de guardar la evaluacion.');
      return;
    }

    if (selectedPlayers.length === 0) {
      setError('Selecciona al menos un jugador.');
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await api.assignPlayers(token, selectedMatchId, selectedPlayers);

      const payload = selectedPlayers
        .map((playerId) => ratings[playerId])
        .filter(Boolean) as RatingItem[];

      await api.saveRatings(token, selectedMatchId, payload);

      setMessage('Participantes y evaluacion por eventos guardados correctamente.');

      const [matchRatings, updatedStats] = await Promise.all([
        api.getMatchRatings(token, selectedMatchId),
        api.getGlobalStats(token)
      ]);

      setGlobalStats(updatedStats);

      const nextSelectedPlayers = matchRatings.ratings.map((row) => row.player_id);
      const nextRatings: Record<number, RatingItem> = {};

      matchRatings.ratings.forEach((row) => {
        nextRatings[row.player_id] = {
          playerId: row.player_id,
          minutesPlayed: row.minutes_played === 1,
          attackPoints: row.attack_points,
          attackErrors: row.attack_errors,
          serveAces: row.serve_aces,
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
      });

      setSelectedPlayers(nextSelectedPlayers);
      setRatings(nextRatings);

      if (selectedPlayerStatId) {
        const playerStats = await api.getPlayerStats(token, selectedPlayerStatId);
        setSelectedPlayerSummary(playerStats.summary);
        setSelectedPlayerHistory(playerStats.history);
      }
    } catch (saveError) {
      setError((saveError as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="card">Cargando panel administrador...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article className="card xl:col-span-2">
          <p className="text-xs uppercase tracking-[0.2em] text-sky-500">Rendimiento de equipo</p>
          <h2 className="mt-2 text-2xl font-bold">Dashboard global</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Promedio general del roster: {globalStats?.teamOverview.team_overall_avg?.toFixed(2) ?? '0.00'}
          </p>
          <div className="mt-4">
            <MetricBars
              metrics={[
                { label: 'Recepcion', value: globalStats?.teamOverview.team_reception_avg ?? 0 },
                { label: 'Saque', value: globalStats?.teamOverview.team_serve_avg ?? 0 },
                { label: 'Defensa', value: globalStats?.teamOverview.team_defense_avg ?? 0 },
                { label: 'Ataque', value: globalStats?.teamOverview.team_attack_avg ?? 0 },
                { label: 'Bloqueo', value: globalStats?.teamOverview.team_block_avg ?? 0 },
                { label: 'Armado', value: globalStats?.teamOverview.team_setting_avg ?? 0 }
              ]}
            />
          </div>
        </article>

        {TOP_RANKINGS.map((ranking) => (
          <article key={ranking.key} className="card">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-500">{ranking.title}</h3>
            <ol className="mt-3 space-y-2 text-sm">
              {(globalStats?.topPlayers[ranking.key] ?? []).map((item) => (
                <li key={item.full_name} className="flex justify-between rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-800">
                  <span>{item.full_name}</span>
                  <span className="font-semibold">{item.score.toFixed(2)}</span>
                </li>
              ))}
            </ol>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-5">
        <article className="card xl:col-span-2">
          <h3 className="text-xl font-bold">Crear usuario</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            El administrador puede crear cuentas y asignar rol de Admin o Jugador.
          </p>
          <form className="mt-4 space-y-3" onSubmit={handleCreateUser}>
            <input
              className="input"
              placeholder="Username"
              value={userForm.username}
              onChange={(event) => setUserForm((s) => ({ ...s, username: event.target.value }))}
              required
            />
            <input
              className="input"
              type="password"
              placeholder="Password"
              value={userForm.password}
              onChange={(event) => setUserForm((s) => ({ ...s, password: event.target.value }))}
              required
            />
            <input
              className="input"
              placeholder="Nombre completo"
              value={userForm.fullName}
              onChange={(event) => setUserForm((s) => ({ ...s, fullName: event.target.value }))}
              required
            />
            <select
              className="input"
              value={userForm.role}
              onChange={(event) => setUserForm((s) => ({ ...s, role: event.target.value as Role }))}
            >
              <option value="PLAYER">Jugador</option>
              <option value="ADMIN">Administrador</option>
            </select>

            {userForm.role === 'PLAYER' ? (
              <>
                <input
                  className="input"
                  type="number"
                  min={1}
                  placeholder="Numero de camiseta (opcional)"
                  value={userForm.jerseyNumber}
                  onChange={(event) => setUserForm((s) => ({ ...s, jerseyNumber: event.target.value }))}
                />
                <select
                  className="input"
                  value={userForm.position}
                  onChange={(event) =>
                    setUserForm((s) => ({ ...s, position: event.target.value as UserFormState['position'] }))
                  }
                >
                  {USER_POSITIONS.map((position) => (
                    <option key={position || 'NONE'} value={position}>
                      {position || 'Posicion (opcional)'}
                    </option>
                  ))}
                </select>
              </>
            ) : null}

            <button className="btn-primary w-full" type="submit" disabled={creatingUser}>
              {creatingUser ? 'Creando usuario...' : 'Crear usuario'}
            </button>
          </form>
        </article>

        <article className="card xl:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-bold">Estadisticas jugador por jugador</h3>
            <div className="flex gap-2">
              <select
                className="input w-72"
                value={selectedPlayerStatId ?? ''}
                onChange={(event) => setSelectedPlayerStatId(Number(event.target.value))}
              >
                <option value="" disabled>
                  Selecciona un jugador
                </option>
                {players.map((player) => (
                  <option key={player.player_id} value={player.player_id}>
                    {player.full_name}
                  </option>
                ))}
              </select>
              <button className="btn-muted" onClick={handleLoadPlayerStats} disabled={loadingPlayerStats}>
                {loadingPlayerStats ? 'Cargando...' : 'Ver stats'}
              </button>
            </div>
          </div>

          {selectedPlayerSummary ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-800">
                <p className="text-sm font-semibold">{selectedPlayerSummary.full_name}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Nota general: {selectedPlayerSummary.overall_score.toFixed(2)}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Partidos calificados: {selectedPlayerSummary.matches_rated}
                </p>
              </div>

              <div>
                <MetricBars
                  metrics={[
                    { label: 'Recepcion', value: selectedPlayerSummary.avg_reception },
                    { label: 'Saque', value: selectedPlayerSummary.avg_serve },
                    { label: 'Defensa', value: selectedPlayerSummary.avg_defense },
                    { label: 'Ataque', value: selectedPlayerSummary.avg_attack },
                    { label: 'Bloqueo', value: selectedPlayerSummary.avg_block },
                    { label: 'Armado', value: selectedPlayerSummary.avg_setting }
                  ]}
                />
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              Selecciona un jugador y presiona "Ver stats".
            </p>
          )}

          {selectedPlayerHistory.length > 0 ? (
            <div className="mt-4 max-h-56 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-white/90 dark:bg-slate-900/90">
                  <tr className="text-slate-600 dark:text-slate-300">
                    <th className="px-2 py-2">Fecha</th>
                    <th className="px-2 py-2">Rival</th>
                    <th className="px-2 py-2">Torneo</th>
                    <th className="px-2 py-2">Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPlayerHistory.map((item) => (
                    <tr key={item.match_id} className="border-t border-slate-200 dark:border-slate-800">
                      <td className="px-2 py-2">{item.match_date}</td>
                      <td className="px-2 py-2">{item.opponent}</td>
                      <td className="px-2 py-2">{item.tournament}</td>
                      <td className="px-2 py-2 font-semibold text-sky-500">{item.match_performance.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-5">
        <article className="card xl:col-span-2">
          <h3 className="text-xl font-bold">Crear partido</h3>
          {editingMatchId ? (
            <p className="mt-1 text-sm text-amber-500">Modo edicion activo para partido #{editingMatchId}</p>
          ) : null}
          <form className="mt-4 space-y-3" onSubmit={handleCreateMatch}>
            <input
              className="input"
              type="date"
              value={matchForm.matchDate}
              onChange={(event) => setMatchForm((s) => ({ ...s, matchDate: event.target.value }))}
              required
            />
            <input
              className="input"
              placeholder="Rival"
              value={matchForm.opponent}
              onChange={(event) => setMatchForm((s) => ({ ...s, opponent: event.target.value }))}
              required
            />
            <input
              className="input"
              placeholder="Torneo"
              value={matchForm.tournament}
              onChange={(event) => setMatchForm((s) => ({ ...s, tournament: event.target.value }))}
              required
            />
            <input
              className="input"
              placeholder="Ubicacion"
              value={matchForm.location}
              onChange={(event) => setMatchForm((s) => ({ ...s, location: event.target.value }))}
            />
            <textarea
              className="input min-h-24"
              placeholder="Notas"
              value={matchForm.notes}
              onChange={(event) => setMatchForm((s) => ({ ...s, notes: event.target.value }))}
            />
            <button className="btn-primary w-full" type="submit">
              Guardar partido
            </button>
            <button className="btn-muted w-full" type="button" onClick={handleUpdateMatch}>
              Actualizar partido en edicion
            </button>
            <button
              className="btn-muted w-full"
              type="button"
              onClick={() => {
                setEditingMatchId(null);
                setMatchForm(EMPTY_MATCH_FORM);
              }}
            >
              Limpiar formulario
            </button>
          </form>
        </article>

        <article className="card xl:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-bold">Evaluacion por eventos</h3>
            <select
              className="input w-72"
              value={selectedMatchId ?? ''}
              onChange={(event) => setSelectedMatchId(Number(event.target.value))}
            >
              <option value="" disabled>
                Selecciona un partido
              </option>
              {matches.map((match) => (
                <option key={match.id} value={match.id}>
                  {match.match_date} | {match.opponent} | {match.tournament}
                </option>
              ))}
            </select>
          </div>

          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {selectedMatch
              ? `Partido: ${selectedMatch.match_date} vs ${selectedMatch.opponent}`
              : 'Selecciona un partido para iniciar evaluacion.'}
          </p>

          {loadingMatchRatings ? (
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Cargando estadisticas del partido...</p>
          ) : null}

          <div className="mt-4 grid max-h-[34rem] gap-4 overflow-y-auto pr-1">
            {players.map((player) => {
              const active = selectedPlayers.includes(player.player_id);
              const playerRating = ratings[player.player_id] ?? createDefaultRating(player.player_id);

              return (
                <div key={player.player_id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                  <label className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{player.full_name}</span>
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => togglePlayer(player.player_id)}
                      className="h-4 w-4"
                    />
                  </label>

                  {active ? (
                    <>
                      <div className="mt-3 flex items-center gap-2 text-sm">
                        <input
                          id={`minutes-${player.player_id}`}
                          type="checkbox"
                          className="h-4 w-4"
                          checked={playerRating.minutesPlayed}
                          onChange={(event) => updateMinutesPlayed(player.player_id, event.target.checked)}
                        />
                        <label htmlFor={`minutes-${player.player_id}`}>
                          Tuvo minutos en cancha (aplica base de juego 5.0)
                        </label>
                      </div>

                      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {FUNDAMENT_GROUPS.map((group) => (
                          <section key={group.title} className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/70">
                            <div className="mb-3">
                              <p className="text-sm font-semibold">{group.title}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{group.description}</p>
                            </div>

                            <div className="space-y-2">
                              {group.fields.map((fieldKey) => {
                                const field = EVENT_FIELDS.find((item) => item.key === fieldKey)!;

                                return (
                                  <div key={field.key}>
                                    <label className="mb-1 block text-xs font-medium">{field.label}</label>
                                    <input
                                      className="input"
                                      type="number"
                                      step="1"
                                      min={0}
                                      value={playerRating[field.key]}
                                      onChange={(event) =>
                                        updateEventCount(player.player_id, field.key, Number(event.target.value))
                                      }
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </section>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Selecciona este jugador para evaluarlo.</p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn-primary" onClick={handleSaveEvaluation} disabled={saving}>
              {saving ? 'Guardando stats...' : 'Guardar/actualizar stats'}
            </button>
            <button className="btn-muted" onClick={handleLoadMatchForEdit}>
              Cargar partido al formulario
            </button>
            <button className="btn-muted" onClick={handleDeleteMatch}>
              Eliminar partido seleccionado
            </button>
            <button
              className="btn-muted"
              onClick={() => {
                setSelectedPlayers([]);
                setRatings({});
              }}
            >
              Limpiar seleccion
            </button>
          </div>

          {message ? <p className="mt-3 text-sm font-medium text-emerald-500">{message}</p> : null}
          {error ? <p className="mt-3 text-sm font-medium text-rose-500">{error}</p> : null}
        </article>
      </section>
    </div>
  );
}
