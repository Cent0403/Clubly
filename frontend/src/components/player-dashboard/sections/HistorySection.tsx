import { MatchRatingRow, PlayerHistoryItem } from '../../../types';
import { MetricBars } from '../../charts/MetricBars';
import { HistorySectionProps } from '../types';

function formatPerformance(value: number | null | undefined) {
  return Math.min(Number(value ?? 0), 10).toFixed(2);
}

interface MatchActionsProps {
  selectedMatch: PlayerHistoryItem;
}

function MatchActions({ selectedMatch }: MatchActionsProps) {
  return (
    <article className="card xl:col-span-3">
      <p className="text-xs uppercase tracking-[0.18em] text-sky-500">Acciones</p>
      <h3 className="text-xl font-bold">Punto por punto</h3>
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
              <span>Armadas × 0.3</span>
              <span className="font-mono">
                {selectedMatch.set_assists} × 0.3 = <span className="font-semibold text-emerald-500">{(selectedMatch.set_assists * 0.3).toFixed(2)}</span>
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
                <span className="text-sky-600 dark:text-sky-400">{formatPerformance(selectedMatch.match_performance)}/10</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

interface MatchTopProps {
  selectedMatch: PlayerHistoryItem | null;
  matchRatingsLoading: boolean;
  matchRatings: MatchRatingRow[];
}

function MatchTop({ selectedMatch, matchRatingsLoading, matchRatings }: MatchTopProps) {
  return (
    <article className="card xl:col-span-2">
      <p className="text-xs uppercase tracking-[0.18em] text-sky-500">Top</p>
      <h3 className="text-xl font-bold">Top del partido</h3>
      {matchRatingsLoading ? (
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">Cargando top del partido...</p>
      ) : matchRatings.length > 0 ? (
        <div className="mt-4 max-h-full space-y-2 overflow-y-auto pr-1">
          {matchRatings.map((rating, idx) => (
            <div
              key={rating.player_id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800/60"
            >
              <div className="min-w-0">
                <p className="font-semibold">#{idx + 1} {rating.full_name}</p>
                <p className="break-words text-xs text-slate-600 dark:text-slate-300">{rating.minutes_played ? 'Tuvo minutos' : 'No jugó'}</p>
              </div>
              <p className="shrink-0 text-lg font-extrabold text-sky-500">{formatPerformance(rating.match_performance)}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">Selecciona un partido para ver el top de ese partido.</p>
      )}
    </article>
  );
}

export function HistorySection({
  active,
  history,
  selectedMatch,
  matchRatings,
  matchRatingsLoading,
  onSelectMatch
}: HistorySectionProps) {
  return (
    <section className={active ? 'grid gap-6 xl:grid-cols-5' : 'hidden'}>
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
              onClick={() => onSelectMatch(match)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{match.match_date}</p>
                  <p className="text-sm text-slate-700 dark:text-slate-200">vs {match.opponent}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 break-words">{match.tournament}</p>
                </div>
                <p className="shrink-0 text-base font-bold text-sky-500">{formatPerformance(match.match_performance)}</p>
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
                  onClick={() => onSelectMatch(match)}
                >
                  <td className="px-3 py-3">{match.match_date}</td>
                  <td className="px-3 py-3">{match.opponent}</td>
                  <td className="px-3 py-3 break-words">{match.tournament}</td>
                  <td className="px-3 py-3 font-semibold text-sky-500">{formatPerformance(match.match_performance)}</td>
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
                Nota: {formatPerformance(selectedMatch.match_performance)}/10
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

      {selectedMatch ? (
        <MatchActions selectedMatch={selectedMatch} />
      ) : (
        <article className="card xl:col-span-3">
          <p className="text-xs uppercase tracking-[0.18em] text-sky-500">Acciones</p>
          <h3 className="text-xl font-bold">Punto por punto</h3>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
            Selecciona un partido para ver el desglose detallado de cada acción.
          </p>
        </article>
      )}

      <MatchTop selectedMatch={selectedMatch} matchRatingsLoading={matchRatingsLoading} matchRatings={matchRatings} />
    </section>
  );
}
