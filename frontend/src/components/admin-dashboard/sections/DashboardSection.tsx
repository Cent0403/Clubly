import { GlobalStats } from '../../../types';
import { MetricBars } from '../../charts/MetricBars';
import { TOP_RANKINGS } from '../constants';

interface DashboardSectionProps {
  active: boolean;
  globalStats: GlobalStats | null;
}

export function DashboardSection({ active, globalStats }: DashboardSectionProps) {
  return (
    <section className={active ? 'grid gap-4 md:grid-cols-2 xl:grid-cols-3' : 'hidden'}>
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
  );
}
