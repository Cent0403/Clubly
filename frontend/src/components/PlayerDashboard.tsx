import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { PlayerHistoryItem, PlayerItem, PlayerSummary, MatchRatingRow } from '../types';
import { MetricBars } from './charts/MetricBars';
import { RadarChart } from './charts/RadarChart';

interface PlayerDashboardProps {
  token: string;
}

const PLAYER_SECTIONS = [
  { key: 'resumen', label: 'Resumen' },
  { key: 'rendimiento', label: 'Rendimiento' },
  { key: 'historial', label: 'Historial' },
  { key: 'top', label: 'Top' }
] as const;

type PlayerSectionKey = (typeof PLAYER_SECTIONS)[number]['key'];

const POSITION_LABELS: Record<string, string> = {
  SETTER: 'Colocador',
  OUTSIDE: 'Latero',
  OPPOSITE: 'Opuesto',
  MIDDLE: 'Central',
  LIBERO: 'Libero',
  DEFENSIVE_SPECIALIST: 'Especialista en defensa'
};

function formatRole(role: string | null | undefined) {
  if (role === 'ADMIN') {
    return 'Admin';
  }

  if (role === 'PLAYER') {
    return 'Jugador';
  }

  return role ?? 'Sin rol';
}

function formatPosition(position: string | null | undefined) {
  if (!position) {
    return 'Sin posición';
  }

  return POSITION_LABELS[position] ?? position;
}

export function PlayerDashboard({ token }: PlayerDashboardProps) {
  const [activeSection, setActiveSection] = useState<PlayerSectionKey>('resumen');
  const [profile, setProfile] = useState<PlayerItem | null>(null);
  const [profileForm, setProfileForm] = useState({ fullName: '', password: '' });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [summary, setSummary] = useState<PlayerSummary | null>(null);
  const [history, setHistory] = useState<PlayerHistoryItem[]>([]);
  const [topPlayers, setTopPlayers] = useState<PlayerItem[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<PlayerHistoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchRatings, setMatchRatings] = useState<MatchRatingRow[]>([]);
  const [matchRatingsLoading, setMatchRatingsLoading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      setProfileError(null);
      setProfileMessage(null);

      try {
        const [statsData, profileData, topPlayersData] = await Promise.all([
          api.getMyStats(token),
          api.getMyProfile(token),
          api.getTopPlayers(token)
        ]);
        setSummary(statsData.summary);
        setHistory(statsData.history);
        setTopPlayers(topPlayersData.players);
        setSelectedMatch(statsData.history[0] ?? null);
        setProfile(profileData.player);
        setProfileForm((current) => ({ ...current, fullName: profileData.player.full_name }));
      } catch (requestError) {
        setError((requestError as Error).message);
      } finally {
        setLoading(false);
      }
    }

    void fetchData();
  }, [token]);

  useEffect(() => {
    async function fetchMatchRatings() {
      if (!selectedMatch) {
        setMatchRatings([]);
        return;
      }

      setMatchRatingsLoading(true);
      try {
        const data = await api.getMatchRatings(token, selectedMatch.match_id);
        setMatchRatings(data.ratings.sort((a, b) => b.match_performance - a.match_performance));
      } catch (err) {
        setMatchRatings([]);
      } finally {
        setMatchRatingsLoading(false);
      }
    }

    void fetchMatchRatings();
  }, [selectedMatch, token]);

  const radarMetrics = useMemo(
    () => [
      { label: 'Recepcion', value: summary?.avg_reception ?? 0 },
      { label: 'Saque', value: summary?.avg_serve ?? 0 },
      { label: 'Defensa', value: summary?.avg_defense ?? 0 },
      { label: 'Ataque', value: summary?.avg_attack ?? 0 },
      { label: 'Bloqueo', value: summary?.avg_block ?? 0 },
      { label: 'Armado', value: summary?.avg_setting ?? 0 }
    ],
    [summary]
  );

  const bestFundament = useMemo(() => {
    return radarMetrics.reduce(
      (best, metric) => (metric.value > best.value ? metric : best),
      radarMetrics[0] ?? { label: 'Recepcion', value: 0 }
    );
  }, [radarMetrics]);

  const worstFundament = useMemo(() => {
    return radarMetrics.reduce(
      (worst, metric) => (metric.value < worst.value ? metric : worst),
      radarMetrics[0] ?? { label: 'Recepcion', value: 0 }
    );
  }, [radarMetrics]);

  const summaryCards = [
    { label: 'Nota actual', value: summary?.overall_score ?? 0, accent: 'text-sky-500' },
    { label: 'Partidos calificados', value: summary?.matches_rated ?? 0, accent: 'text-amber-500' },
    {
      label: `Mejor fundamento: ${bestFundament.label}`,
      value: bestFundament.value,
      accent: 'text-emerald-500'
    },
    {
      label: `Peor fundamento: ${worstFundament.label}`,
      value: worstFundament.value,
      accent: 'text-rose-500'
    }
  ];

  async function handleUpdateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileError(null);
    setProfileMessage(null);

    const nextFullName = profileForm.fullName.trim();
    const nextPassword = profileForm.password.trim();
    const fullNameChanged = nextFullName.length > 0 && nextFullName !== (profile?.full_name ?? '');

    if (!fullNameChanged && nextPassword.length === 0) {
      setProfileError('No hay cambios para guardar en el perfil.');
      return;
    }

    setSavingProfile(true);

    try {
      const response = await api.updateMyProfile(token, {
        fullName: fullNameChanged ? nextFullName : undefined,
        password: nextPassword.length > 0 ? nextPassword : undefined
      });

      setProfile(response.player);
      setSummary((current) => (current ? { ...current, full_name: response.player.full_name } : current));
      setProfileForm({ fullName: response.player.full_name, password: '' });
      setProfileMessage('Perfil actualizado correctamente.');
      setIsProfileModalOpen(false);
    } catch (updateError) {
      setProfileError((updateError as Error).message);
    } finally {
      setSavingProfile(false);
    }
  }

  if (loading) {
    return <div className="card">Cargando dashboard de jugador...</div>;
  }

  if (error) {
    return <div className="card text-rose-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="relative -mx-4 px-4 md:mx-0 md:px-0">
        <section className="card">
          <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
            {PLAYER_SECTIONS.map((section) => {
              const isActive = activeSection === section.key;

              return (
                <button
                  key={section.key}
                  type="button"
                  className={`${isActive ? 'btn-primary' : 'btn-muted'} shrink-0`}
                  onClick={() => setActiveSection(section.key)}
                  aria-pressed={isActive}
                >
                  {section.label}
                </button>
              );
            })}
          </div>
        </section>
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-1 text-slate-500 md:hidden">
          <span className="text-xs font-bold">‹</span>
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1 text-slate-500 md:hidden">
          <span className="text-xs font-bold">›</span>
        </div>
      </div>

      <section className={activeSection === 'resumen' ? 'grid gap-6 xl:grid-cols-5' : 'hidden'}>
        <article className="card xl:col-span-3">
          <p className="text-xs uppercase tracking-[0.18em] text-sky-500">Perfil del jugador</p>
          <h2 className="mt-2 text-2xl font-bold">{profile?.full_name ?? summary?.full_name}</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Edita tu nombre y contrasena desde el modal.</p>

          <div className="mt-4">
            <button
              className="btn-primary"
              type="button"
              onClick={() => {
                setProfileError(null);
                setProfileMessage(null);
                setProfileForm((current) => ({ ...current, fullName: profile?.full_name ?? current.fullName, password: '' }));
                setIsProfileModalOpen(true);
              }}
            >
              Editar perfil
            </button>
          </div>

          {profileMessage ? <p className="mt-3 text-sm font-medium text-emerald-500">{profileMessage}</p> : null}
          {profileError ? <p className="mt-3 text-sm font-medium text-rose-500">{profileError}</p> : null}
        </article>

        <article className="card xl:col-span-2">
          <p className="text-xs uppercase tracking-[0.18em] text-sky-500">Informacion de cuenta</p>
          <div className="mt-4 space-y-2 text-sm">
            <p>
              <span className="font-semibold">Usuario:</span> {profile?.username ?? summary?.username}
            </p>
            <p>
              <span className="font-semibold">Rol:</span> {formatRole('PLAYER')}
            </p>
            <p>
              <span className="font-semibold">Numero de camiseta:</span>{' '}
              {profile?.jersey_number !== null && profile?.jersey_number !== undefined ? profile.jersey_number : 'No asignado'}
            </p>
            <p>
              <span className="font-semibold">Posicion:</span> {formatPosition(profile?.position)}
            </p>
            <p>
              <span className="font-semibold">Nota global actual:</span>{' '}
              {profile?.overall_score !== undefined ? profile.overall_score.toFixed(2) : (summary?.overall_score ?? 0).toFixed(2)}
            </p>
          </div>
        </article>
        
      </section>

      <section className={activeSection === 'resumen' ? 'grid gap-4 md:grid-cols-2 xl:grid-cols-4' : 'hidden'}>
        {summaryCards.map((card) => (
          <article key={card.label} className="card">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{card.label}</p>
            <p className={`mt-2 text-3xl font-extrabold ${card.accent}`}>
              {typeof card.value === 'number' ? card.value.toFixed(2) : card.value}
            </p>
          </article>
        ))}
      </section>

      <section className={activeSection === 'rendimiento' ? 'grid gap-6 xl:grid-cols-5' : 'hidden'}>
        <article className="card xl:col-span-2">
          <p className="text-xs uppercase tracking-[0.18em] text-sky-500">Perfil</p>
          <h2 className="mt-2 text-2xl font-bold">{summary?.full_name}</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Usuario: {summary?.username}</p>

          <div className="mt-5 space-y-3">
            <MetricBars metrics={radarMetrics} />
          </div>
        </article>

        <article className="card flex min-h-[360px] flex-col xl:col-span-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-sky-500">Fundamentos</p>
              <h3 className="text-xl font-bold">Mapa de rendimiento</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">Escala de 0 a 10</p>
          </div>

          <div className="flex flex-1 items-center justify-center py-4">
            <RadarChart metrics={radarMetrics} />
          </div>
        </article>
      </section>

      <section className={activeSection === 'historial' ? 'grid gap-6 xl:grid-cols-5' : 'hidden'}>
        <article className="card xl:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-sky-500">Historial</p>
              <h3 className="text-xl font-bold">Partidos evaluados</h3>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {history.length} registros
            </span>
          </div>

          <div className="mt-4 space-y-3 md:hidden">
            {history.map((match) => (
              <button
                key={match.match_id}
                type="button"
                className={`w-full rounded-2xl border p-3 text-left transition ${
                  selectedMatch?.match_id === match.match_id
                    ? 'border-sky-500 bg-sky-50 dark:border-sky-400 dark:bg-slate-800'
                    : 'border-slate-200 bg-white/70 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:bg-slate-800'
                }`}
                onClick={() => setSelectedMatch(match)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{match.match_date}</p>
                    <p className="text-sm text-slate-700 dark:text-slate-200">vs {match.opponent}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 break-words">{match.tournament}</p>
                  </div>
                  <p className="shrink-0 text-base font-bold text-sky-500">{(Math.min(Number(match.match_performance ?? 0), 10)).toFixed(2)}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4 hidden max-h-80 overflow-auto rounded-2xl border border-slate-200 dark:border-slate-800 md:block">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="sticky top-0 bg-white/95 dark:bg-slate-900/95">
                <tr className="text-slate-600 dark:text-slate-300">
                  <th className="px-3 py-3">Fecha</th>
                  <th className="px-3 py-3">Rival</th>
                  <th className="px-3 py-3">Torneo</th>
                  <th className="px-3 py-3">Rendimiento</th>
                </tr>
              </thead>
              <tbody>
                {history.map((match) => (
                  <tr
                    key={match.match_id}
                    className={`cursor-pointer border-t border-slate-200 transition hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800 ${
                      selectedMatch?.match_id === match.match_id ? 'bg-slate-100 dark:bg-slate-800' : ''
                    }`}
                    onClick={() => setSelectedMatch(match)}
                  >
                    <td className="px-3 py-3">{match.match_date}</td>
                    <td className="px-3 py-3">{match.opponent}</td>
                    <td className="px-3 py-3 break-words">{match.tournament}</td>
                      <td className="px-3 py-3 font-semibold text-sky-500">{(Math.min(Number(match.match_performance ?? 0), 10)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="card xl:col-span-2">
          <p className="text-xs uppercase tracking-[0.18em] text-sky-500">Detalle</p>
          <h3 className="text-xl font-bold">Desglose del partido</h3>
          {selectedMatch ? (
            <div className="mt-4 space-y-4 text-sm">
              <div className="rounded-2xl bg-slate-100 p-4 dark:bg-slate-800">
                <p className="font-semibold">{selectedMatch.match_date}</p>
                <p className="text-slate-600 dark:text-slate-300">vs {selectedMatch.opponent}</p>
                <p className="break-words text-slate-600 dark:text-slate-300">{selectedMatch.tournament}</p>
                <p className="mt-3 text-2xl font-extrabold text-sky-500">
                  Nota: {Math.min(Number(selectedMatch.match_performance ?? 0), 10).toFixed(2)}/10
                </p>
              </div>

              <MetricBars
                metrics={[
                  { label: 'Recepcion', value: selectedMatch.reception },
                  { label: 'Saque', value: selectedMatch.serve },
                  { label: 'Defensa', value: selectedMatch.defense },
                  { label: 'Ataque', value: selectedMatch.attack },
                  { label: 'Bloqueo', value: selectedMatch.block_score },
                  { label: 'Armado', value: selectedMatch.setting_score }
                ]}
              />
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              Selecciona un partido del historial para ver su desglose exacto.
            </p>
          )}
        </article>
        

        <article className="card xl:col-span-3">
          <p className="text-xs uppercase tracking-[0.18em] text-sky-500">Acciones</p>
          <h3 className="text-xl font-bold">Punto por punto</h3>
          {selectedMatch ? (
            <div className="mt-4 space-y-3 text-xs">
              <div className="rounded-2xl border border-slate-200 p-3 dark:border-slate-700">
                <p className="mb-3 font-semibold text-slate-700 dark:text-slate-300">ATAQUE</p>
                <div className="space-y-1">
                  <div className="flex justify-between px-2">
                    <span>Puntos anotados × 1.0</span>
                    <span className="font-mono">
                      {selectedMatch.attack_points} × 1.0 = <span className="font-semibold text-emerald-500">{(selectedMatch.attack_points * 1.0).toFixed(2)}</span>
                    </span>
                  </div>
                  <div className="flex justify-between px-2">
                    <span>Ataques complicados × 0.4</span>
                    <span className="font-mono">
                      {selectedMatch.attack_complicated} × 0.4 = <span className="font-semibold text-emerald-500">{(selectedMatch.attack_complicated * 0.4).toFixed(2)}</span>
                    </span>
                  </div>
                  <div className="flex justify-between px-2 text-rose-500">
                    <span>Errores × 0.5</span>
                    <span className="font-mono">
                      {selectedMatch.attack_errors} × 0.5 = <span className="font-semibold">-{(selectedMatch.attack_errors * 0.5).toFixed(2)}</span>
                    </span>
                  </div>
                  <div className="border-t border-slate-300 pt-1 dark:border-slate-700">
                    <div className="flex justify-between px-2 font-semibold">
                      <span>Nota Ataque (1-10)</span>
                      <span className="text-sky-500">{selectedMatch.attack.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-3 dark:border-slate-700">
                <p className="mb-3 font-semibold text-slate-700 dark:text-slate-300">SAQUE</p>
                <div className="space-y-1">
                  <div className="flex justify-between px-2">
                    <span>Aces × 1.0</span>
                    <span className="font-mono">
                      {selectedMatch.serve_aces} × 1.0 = <span className="font-semibold text-emerald-500">{(selectedMatch.serve_aces * 1.0).toFixed(2)}</span>
                    </span>
                  </div>
                  <div className="flex justify-between px-2">
                    <span>Saques complicados × 0.6</span>
                    <span className="font-mono">
                      {selectedMatch.serve_complicated} × 0.6 = <span className="font-semibold text-emerald-500">{(selectedMatch.serve_complicated * 0.6).toFixed(2)}</span>
                    </span>
                  </div>
                  <div className="flex justify-between px-2">
                    <span>Pasarlos × 0.2</span>
                    <span className="font-mono">
                      {selectedMatch.serve_pasarlo} × 0.2 = <span className="font-semibold text-emerald-500">{(selectedMatch.serve_pasarlo * 0.2).toFixed(2)}</span>
                    </span>
                  </div>
                  <div className="flex justify-between px-2 text-rose-500">
                    <span>Errores × 0.5</span>
                    <span className="font-mono">
                      {selectedMatch.serve_errors} × 0.5 = <span className="font-semibold">-{(selectedMatch.serve_errors * 0.5).toFixed(2)}</span>
                    </span>
                  </div>
                  <div className="border-t border-slate-300 pt-1 dark:border-slate-700">
                    <div className="flex justify-between px-2 font-semibold">
                      <span>Nota Saque (1-10)</span>
                      <span className="text-sky-500">{selectedMatch.serve.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-3 dark:border-slate-700">
                <p className="mb-3 font-semibold text-slate-700 dark:text-slate-300">RECEPCIÓN</p>
                <div className="space-y-1">
                  <div className="flex justify-between px-2">
                    <span>Perfectas × 1.0</span>
                    <span className="font-mono">
                      {selectedMatch.reception_perfect} × 1.0 = <span className="font-semibold text-emerald-500">{(selectedMatch.reception_perfect * 1.0).toFixed(2)}</span>
                    </span>
                  </div>
                  <div className="flex justify-between px-2">
                    <span>Buenas × 0.5</span>
                    <span className="font-mono">
                      {selectedMatch.reception_good} × 0.5 = <span className="font-semibold text-emerald-500">{(selectedMatch.reception_good * 0.5).toFixed(2)}</span>
                    </span>
                  </div>
                  <div className="flex justify-between px-2">
                    <span>Malas × 0.25</span>
                    <span className="font-mono">
                      {selectedMatch.reception_bad} × 0.25 = <span className="font-semibold text-emerald-500">{(selectedMatch.reception_bad * 0.25).toFixed(2)}</span>
                    </span>
                  </div>
                  <div className="flex justify-between px-2 text-rose-500">
                    <span>Errores × 0.75</span>
                    <span className="font-mono">
                      {selectedMatch.reception_error} × 0.75 = <span className="font-semibold">-{(selectedMatch.reception_error * 0.75).toFixed(2)}</span>
                    </span>
                  </div>
                  <div className="border-t border-slate-300 pt-1 dark:border-slate-700">
                    <div className="flex justify-between px-2 font-semibold">
                      <span>Nota Recepción (1-10)</span>
                      <span className="text-sky-500">{selectedMatch.reception.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-3 dark:border-slate-700">
                <p className="mb-3 font-semibold text-slate-700 dark:text-slate-300">DEFENSA & BLOQUEO</p>
                <div className="space-y-1">
                  <div className="flex justify-between px-2">
                    <span>Defensas × 0.4</span>
                    <span className="font-mono">
                      {selectedMatch.defense_successes} × 0.4 = <span className="font-semibold text-emerald-500">{(selectedMatch.defense_successes * 0.4).toFixed(2)}</span>
                    </span>
                  </div>
                  <div className="flex justify-between px-2">
                    <span>Bloqueos × 1.0</span>
                    <span className="font-mono">
                      {selectedMatch.block_points} × 1.0 = <span className="font-semibold text-emerald-500">{(selectedMatch.block_points * 1.0).toFixed(2)}</span>
                    </span>
                  </div>
                  <div className="flex justify-between px-2">
                    <span>Toques en bloqueo × 0.2</span>
                    <span className="font-mono">
                      {selectedMatch.block_touches} × 0.2 = <span className="font-semibold text-emerald-500">{(selectedMatch.block_touches * 0.2).toFixed(2)}</span>
                    </span>
                  </div>
                  <div className="border-t border-slate-300 pt-1 dark:border-slate-700">
                    <div className="flex justify-between px-2 font-semibold">
                      <span>Nota Bloqueo (1-10)</span>
                      <span className="text-sky-500">{selectedMatch.block_score.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between px-2 font-semibold">
                      <span>Nota Defensa (1-10)</span>
                      <span className="text-sky-500">{selectedMatch.defense.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-3 dark:border-slate-700">
                <p className="mb-3 font-semibold text-slate-700 dark:text-slate-300">ARMADO</p>
                <div className="space-y-1">
                  <div className="flex justify-between px-2">
                    <span>Armadas × 0.4</span>
                    <span className="font-mono">
                      {selectedMatch.set_assists} × 0.4 = <span className="font-semibold text-emerald-500">{(selectedMatch.set_assists * 0.4).toFixed(2)}</span>
                    </span>
                  </div>
                  <div className="flex justify-between px-2 text-rose-500">
                    <span>Errores × 0.2</span>
                    <span className="font-mono">
                      {selectedMatch.set_errors} × 0.2 = <span className="font-semibold">-{(selectedMatch.set_errors * 0.2).toFixed(2)}</span>
                    </span>
                  </div>
                  <div className="border-t border-slate-300 pt-1 dark:border-slate-700">
                    <div className="flex justify-between px-2 font-semibold">
                      <span>Nota Armado (1-10)</span>
                      <span className="text-sky-500">{selectedMatch.setting_score.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border-2 border-sky-500 bg-sky-50 p-3 dark:bg-slate-900/50">
                <p className="mb-3 font-semibold text-sky-700 dark:text-sky-400">NOTA FINAL DEL PARTIDO</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between px-2">
                    <span>(Recepción + Saque + Defensa + Ataque + Bloqueo + Armado) / 4 + 5</span>
                  </div>
                  <div className="flex justify-between px-2 font-mono">
                    <span>({selectedMatch.reception.toFixed(2)} + {selectedMatch.serve.toFixed(2)} + {selectedMatch.defense.toFixed(2)} + {selectedMatch.attack.toFixed(2)} + {selectedMatch.block_score.toFixed(2)} + {selectedMatch.setting_score.toFixed(2)}) / 4 + 5</span>
                  </div>
                  <div className="border-t-2 border-sky-300 pt-2 dark:border-sky-800">
                    <div className="flex justify-between px-2 text-sm font-extrabold">
                      <span>TOTAL</span>
                      <span className="text-sky-600 dark:text-sky-400">{Math.min(Number(selectedMatch.match_performance ?? 0), 10).toFixed(2)}/10</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              Selecciona un partido para ver el desglose detallado de cada acción.
            </p>
          )}
        </article>
        <article className="card xl:col-span-2">
          <p className="text-xs uppercase tracking-[0.18em] text-sky-500">Top</p>
          <h3 className="text-xl font-bold">Top del partido</h3>
          {matchRatingsLoading ? (
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">Cargando top del partido...</p>
          ) : matchRatings.length > 0 ? (
            <div className="mt-4 max-h-full space-y-2 overflow-y-auto pr-1">
              {matchRatings.map((r, idx) => (
                <div
                  key={r.player_id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800/60"
                >
                  <div className="min-w-0">
                    <p className="font-semibold">#{idx + 1} {r.full_name}</p>
                    <p className="break-words text-xs text-slate-600 dark:text-slate-300">{r.minutes_played ? 'Tuvo minutos' : 'No jugó'}</p>
                  </div>
                  <p className="shrink-0 text-lg font-extrabold text-sky-500">{(Math.min(Number(r.match_performance ?? 0), 10)).toFixed(2)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">Selecciona un partido para ver el top de ese partido.</p>
          )}
        </article>
      </section>

      <section className={activeSection === 'top' ? 'grid gap-6 xl:grid-cols-5' : 'hidden'}>
        <article className="card xl:col-span-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-sky-500">Ranking general</p>
              <h3 className="text-xl font-bold">Top jugadores por nota general</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Ordenado de mayor a menor según la nota global
            </p>
          </div>

          <div className="mt-4 max-h-[34rem] space-y-2 overflow-y-auto pr-1">
            {topPlayers.map((player, index) => (
              <div
                key={player.player_id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800/60"
              >
                <div className="min-w-0">
                  <p className="font-semibold">#{index + 1} {player.full_name}</p>
                  <p className="break-words text-xs text-slate-600 dark:text-slate-300">
                    @{player.username} | {formatPosition(player.position)}
                  </p>
                </div>
                <p className="shrink-0 text-lg font-extrabold text-sky-500">{player.overall_score.toFixed(2)}</p>
              </div>
            ))}

            {topPlayers.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
                No hay jugadores para mostrar en el ranking.
              </p>
            ) : null}
          </div>
        </article>
      </section>

      {isProfileModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="card w-full max-w-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-sky-500">Editar perfil</p>
                <h3 className="mt-1 text-xl font-bold">Actualiza tu nombre y contrasena</h3>
              </div>
              <button className="btn-muted" type="button" onClick={() => setIsProfileModalOpen(false)}>
                Cerrar
              </button>
            </div>

            <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={handleUpdateProfile}>
              <div>
                <label className="mb-1 block text-xs font-medium">Nombre completo</label>
                <input
                  className="input"
                  value={profileForm.fullName}
                  onChange={(event) => setProfileForm((current) => ({ ...current, fullName: event.target.value }))}
                  placeholder="Tu nombre completo"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Nueva contrasena</label>
                <input
                  className="input"
                  type="password"
                  value={profileForm.password}
                  onChange={(event) => setProfileForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Dejar vacio para no cambiar"
                />
              </div>

              <div className="md:col-span-2 flex flex-wrap gap-2">
                <button className="btn-primary" type="submit" disabled={savingProfile}>
                  {savingProfile ? 'Guardando perfil...' : 'Guardar cambios'}
                </button>
                <button className="btn-muted" type="button" onClick={() => setIsProfileModalOpen(false)}>
                  Cancelar
                </button>
              </div>
            </form>

            {profileError ? <p className="mt-3 text-sm font-medium text-rose-500">{profileError}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
