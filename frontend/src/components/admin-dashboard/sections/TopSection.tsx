import { PlayerItem } from '../../../types';
import { formatPosition } from '../utils';

interface TopSectionProps {
  active: boolean;
  topPlayers: PlayerItem[];
}

export function TopSection({ active, topPlayers }: TopSectionProps) {
  return (
    <section className={active ? 'grid gap-6 xl:grid-cols-5' : 'hidden'}>
      <article className="card xl:col-span-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-sky-500">Ranking general</p>
            <h3 className="text-xl font-bold">Top jugadores por eficiencia global</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Ordenado de mayor a menor según la eficiencia global promedio
          </p>
        </div>

        <div className="mt-4 max-h-[34rem] space-y-2 overflow-y-auto pr-1">
          {topPlayers.map((player, index) => (
            <div key={player.player_id} className="card p-3 flex items-center justify-between">
              <div className="min-w-0">
                <p className="font-semibold">#{index + 1} {player.full_name}</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 break-words">
                  @{player.username} | {formatPosition(player.position)}
                </p>
              </div>
              <p className="shrink-0 text-lg font-extrabold text-sky-500">{player.overall_score.toFixed(2)}%</p>
            </div>
          ))}

          {topPlayers.length === 0 ? (
            <p className="card p-4 text-sm text-slate-600 dark:text-slate-300">
              No hay jugadores para mostrar en el ranking.
            </p>
          ) : null}
        </div>
      </article>
    </section>
  );
}
