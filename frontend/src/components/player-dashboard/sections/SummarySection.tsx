import { TOP_RANKINGS } from "../../admin-dashboard/constants";
import { SummarySectionProps } from "../types";

export function SummarySection({ active, globalStats }: SummarySectionProps) {
  return (
    <section className={active ? "grid gap-6 xl:grid-cols-5" : "hidden"}>
      <article className="card xl:col-span-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-sky-500">
              Top por fundamento
            </p>
            <h3 className="text-xl font-bold">Primeros 5 del equipo</h3>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Ranking global por recepción, saque, defensa, ataque, bloqueo y
            armado
          </p>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {TOP_RANKINGS.map((ranking) => (
            <article key={ranking.key} className="card p-4">
              <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-500">
                {ranking.title}
              </h4>
              <ol className="mt-3 space-y-2 text-sm">
                {(globalStats?.topPlayers[ranking.key] ?? []).map(
                  (item, index) => (
                    <li
                      key={`${ranking.key}-${item.full_name}`}
                      className="flex justify-between rounded-lg bg-slate-100 px-3 py-2 dark:bg-[#171821] "
                    >
                      <span>
                        #{index + 1} {item.full_name}
                      </span>
                      <span className="font-semibold">
                        {item.score.toFixed(2)}%
                      </span>
                    </li>
                  ),
                )}
                {(globalStats?.topPlayers[ranking.key] ?? []).length === 0 ? (
                  <li className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-slate-600 dark:border-slate-700 dark:text-slate-300">
                    Sin registros todavía.
                  </li>
                ) : null}
              </ol>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}
