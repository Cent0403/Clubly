import { MatchRatingRow, PlayerHistoryItem } from '../../../types';
import { MetricBars } from '../../charts/MetricBars';
import { HistorySectionProps } from '../types';

function formatPerformance(value: number | null | undefined) {
  return `${Math.max(Number(value ?? 0), 0).toFixed(2)}%`;
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
          <div className="card p-3">
          <p className="mb-3 font-semibold text-slate-700 dark:text-slate-300">ATAQUE</p>
          <div className="space-y-1">
            <div className="flex justify-between px-2">
              <span>Puntos directos</span>
              <span className="font-mono">
                {selectedMatch.attack_points}
              </span>
            </div>
            <div className="flex justify-between px-2 text-rose-500">
              <span>Errores</span>
              <span className="font-mono">
                {selectedMatch.attack_errors}
              </span>
            </div>
            <div className="flex justify-between px-2">
              <span>Intentos</span>
              <span className="font-mono">
                {selectedMatch.attack_attempts}
              </span>
            </div>
            <div className="flex justify-between px-2">
              <span>Puntos por set</span>
              <span className="font-mono text-emerald-500">{selectedMatch.attack_points_per_set.toFixed(2)}</span>
            </div>
            <div className="border-t border-slate-300 pt-1 dark:border-slate-700">
              <div className="flex justify-between px-2 font-semibold">
                <span>Eficiencia = (Puntos - Errores) / Intentos</span>
                <span className="text-sky-500">{formatPerformance(selectedMatch.attack_efficiency)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-3">
          <p className="mb-3 font-semibold text-slate-700 dark:text-slate-300">SAQUE</p>
          <div className="space-y-1">
            <div className="flex justify-between px-2">
              <span>Aces</span>
              <span className="font-mono">
                {selectedMatch.serve_aces}
              </span>
            </div>
            <div className="flex justify-between px-2 text-rose-500">
              <span>Errores</span>
              <span className="font-mono">
                {selectedMatch.serve_errors}
              </span>
            </div>
            <div className="flex justify-between px-2">
              <span>Intentos</span>
              <span className="font-mono">
                {selectedMatch.serve_attempts}
              </span>
            </div>
            <div className="flex justify-between px-2">
              <span>Porcentaje de aciertos</span>
              <span className="font-mono text-emerald-500">{formatPerformance(selectedMatch.serve_in_percentage)}</span>
            </div>
            <div className="border-t border-slate-300 pt-1 dark:border-slate-700">
              <div className="flex justify-between px-2 font-semibold">
                <span>Eficiencia = (Ace - Errores) / Intentos</span>
                <span className="text-sky-500">{formatPerformance(selectedMatch.serve_efficiency)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-3">
          <p className="mb-3 font-semibold text-slate-700 dark:text-slate-300">RECEPCIÓN</p>
          <div className="space-y-1">
            <div className="flex justify-between px-2">
              <span>Recepciones 3</span>
              <span className="font-mono">
                {selectedMatch.reception_three}
              </span>
            </div>
            <div className="flex justify-between px-2">
              <span>Recepciones 2</span>
              <span className="font-mono">
                {selectedMatch.reception_two}
              </span>
            </div>
            <div className="flex justify-between px-2">
              <span>Recepciones 1</span>
              <span className="font-mono">
                {selectedMatch.reception_one}
              </span>
            </div>
            <div className="flex justify-between px-2 text-rose-500">
              <span>Recepciones 0</span>
              <span className="font-mono">
                {selectedMatch.reception_zero}
              </span>
            </div>
            <div className="flex justify-between px-2">
              <span>Intentos</span>
              <span className="font-mono">{selectedMatch.reception_attempts}</span>
            </div>
            <div className="border-t border-slate-300 pt-1 dark:border-slate-700">
              <div className="flex justify-between px-2 font-semibold">
                <span>Eficiencia = (3x3 + 2x2 + 1x1) / (Intentos x 3)</span>
                <span className="text-sky-500">{formatPerformance(selectedMatch.reception_efficiency)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-3">
          <p className="mb-3 font-semibold text-slate-700 dark:text-slate-300">DEFENSA & BLOQUEO</p>
          <div className="space-y-1">
            <div className="flex justify-between px-2">
              <span>Defensas exitosas</span>
              <span className="font-mono">
                {selectedMatch.defense_successes}
              </span>
            </div>
            <div className="flex justify-between px-2 text-rose-500">
              <span>Defensas fallidas</span>
              <span className="font-mono">
                {selectedMatch.defense_failures}
              </span>
            </div>
            <div className="flex justify-between px-2">
              <span>Bloqueos 2</span>
              <span className="font-mono">
                {selectedMatch.block_kill}
              </span>
            </div>
            <div className="flex justify-between px-2">
              <span>Bloqueos 1</span>
              <span className="font-mono">
                {selectedMatch.block_touch}
              </span>
            </div>
            <div className="flex justify-between px-2 text-rose-500">
              <span>Bloqueos 0</span>
              <span className="font-mono">
                {selectedMatch.block_error}
              </span>
            </div>
            <div className="flex justify-between px-2">
              <span>Total de acciones de bloqueo</span>
              <span className="font-mono">
                {selectedMatch.block_total}
              </span>
            </div>
            <div className="border-t border-slate-300 pt-1 dark:border-slate-700">
              <div className="flex justify-between px-2 font-semibold">
                <span>Eficiencia Defensa = (Exitosas - Fallidas) / (Exitosas + Fallidas)</span>
                <span className="text-sky-500">{formatPerformance(selectedMatch.defense_efficiency)}</span>
              </div>
              <div className="flex justify-between px-2 font-semibold">
                <span>Eficiencia Bloqueo = ((Bloqueos 2 x 2) + Bloqueos 1) / (Total x 2)</span>
                <span className="text-sky-500">{formatPerformance(selectedMatch.block_efficiency)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-3">
          <p className="mb-3 font-semibold text-slate-700 dark:text-slate-300">ARMADO</p>
          <div className="space-y-1">
            <div className="flex justify-between px-2">
              <span>Asistencias</span>
              <span className="font-mono">
                {selectedMatch.set_assists}
              </span>
            </div>
            <div className="flex justify-between px-2 text-rose-500">
              <span>Errores</span>
              <span className="font-mono">
                {selectedMatch.set_errors}
              </span>
            </div>
            <div className="flex justify-between px-2">
              <span>Intentos</span>
              <span className="font-mono">
                {selectedMatch.set_attempts}
              </span>
            </div>
            <div className="border-t border-slate-300 pt-1 dark:border-slate-700">
              <div className="flex justify-between px-2 font-semibold">
                <span>Eficiencia = (Asistencias - Errores) / Intentos</span>
                <span className="text-sky-500">{formatPerformance(selectedMatch.setting_efficiency)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card-accent">
          <p className="mb-3 font-semibold accent-text dark:accent-text">EFICIENCIA GLOBAL DEL PARTIDO</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between px-2">
              <span>Suma de ataque, saque, recepción, armado, defensa y bloqueo dividida entre 4 (tope 100%)</span>
            </div>
            <div className="flex justify-between px-2 font-mono">
              <span>
                min(100, ({selectedMatch.attack_efficiency.toFixed(2)} + {selectedMatch.serve_efficiency.toFixed(2)} + {selectedMatch.reception_efficiency.toFixed(2)} + {selectedMatch.setting_efficiency.toFixed(2)} + {selectedMatch.defense_efficiency.toFixed(2)} + {selectedMatch.block_efficiency.toFixed(2)}) / 4)
              </span>
            </div>
            <div className="border-t-2 border-sky-300 pt-2 dark:border-sky-800">
              <div className="flex justify-between px-2 text-sm font-extrabold">
                <span>TOTAL</span>
                <span className="text-sky-600 dark:text-sky-400">{formatPerformance(selectedMatch.match_performance)}</span>
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
              <p className="shrink-0 text-lg font-extrabold text-sky-500">{formatPerformance(rating.match_performance ?? rating.overall_efficiency)}</p>
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
                  ? 'list-selected'
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
                <th className="px-3 py-3">Eficiencia</th>
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
            <div className="card p-4">
              <p className="font-semibold">{selectedMatch.match_date}</p>
              <p className="text-slate-600 dark:text-slate-300">vs {selectedMatch.opponent}</p>
              <p className="break-words text-slate-600 dark:text-slate-300">{selectedMatch.tournament}</p>
              <p className="mt-3 text-2xl font-extrabold text-sky-500">
                Eficiencia: {formatPerformance(selectedMatch.match_performance)}
              </p>
            </div>

            <MetricBars
              maxValue={100}
              formatter={(value) => `${value.toFixed(1)}%`}
              metrics={[
                { label: 'Recepcion', value: selectedMatch.reception_efficiency },
                { label: 'Saque', value: selectedMatch.serve_efficiency },
                { label: 'Defensa', value: selectedMatch.defense_efficiency },
                { label: 'Ataque', value: selectedMatch.attack_efficiency },
                { label: 'Bloqueo', value: selectedMatch.block_efficiency },
                { label: 'Armado', value: selectedMatch.setting_efficiency }
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
