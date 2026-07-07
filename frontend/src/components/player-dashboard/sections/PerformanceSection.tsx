import { MetricBars } from '../../charts/MetricBars';
import { RadarChart } from '../../charts/RadarChart';
import { PerformanceSectionProps } from '../types';
import { MedalsPanel } from '../MedalsPanel';

export function PerformanceSection({ active, summary, radarMetrics, history }: PerformanceSectionProps) {
  return (
    <section className={active ? 'grid gap-6 xl:grid-cols-5' : 'hidden'}>
      <article className="card xl:col-span-2">
        <p className="text-xs uppercase tracking-[0.18em] text-sky-500">Perfil</p>
        <h2 className="mt-2 text-2xl font-bold">{summary?.full_name}</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Usuario: {summary?.username}</p>

        <div className="mt-5 space-y-3">
          <MetricBars metrics={radarMetrics} maxValue={100} formatter={(value) => `${value.toFixed(1)}%`} />
        </div>
      </article>

      <article className="card flex min-h-[360px] flex-col xl:col-span-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-sky-500">Fundamentos</p>
            <h3 className="text-xl font-bold">Mapa de rendimiento</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">Escala de 0% a 100%</p>
        </div>

        <div className="flex flex-1 items-center justify-center py-4">
          <RadarChart metrics={radarMetrics} maxValue={100} />
        </div>
      </article>

      <article className="card xl:col-span-5">
        <MedalsPanel history={history} />
      </article>
    </section>
  );
}
