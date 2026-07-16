import { GlobalStats } from "../../../types";
import { MetricBars } from "../../charts/MetricBars";
import { TOP_RANKINGS, USER_POSITIONS } from "../constants";
import { formatPositionOption } from "../utils";

interface DashboardSectionProps {
  active: boolean;
  globalStats: GlobalStats | null;
  selectedPositionFilter: "ALL" | "SETTER" | "OUTSIDE" | "OPPOSITE" | "MIDDLE" | "LIBERO";
  onPositionFilterChange: (
    value: "ALL" | "SETTER" | "OUTSIDE" | "OPPOSITE" | "MIDDLE" | "LIBERO",
  ) => void;
}

export function DashboardSection({
  active,
  globalStats,
  selectedPositionFilter,
  onPositionFilterChange,
}: DashboardSectionProps) {
  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  return (
    <section
      className={active ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3" : "hidden"}
    >
      <article className="card xl:col-span-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-sky-500">
              Rendimiento de equipo
            </p>
            <h2 className="mt-2 text-2xl font-bold">Dashboard global</h2>
          </div>
          <select
            className="input w-full md:w-64"
            value={selectedPositionFilter}
            onChange={(event) =>
              onPositionFilterChange(
                event.target.value as DashboardSectionProps["selectedPositionFilter"],
              )
            }
          >
            <option value="ALL">Todas las posiciones</option>
            {USER_POSITIONS.filter((position) => position !== "").map(
              (position) => (
                <option key={position} value={position}>
                  {formatPositionOption(position)}
                </option>
              ),
            )}
          </select>
        </div>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Eficiencia global del roster:{" "}
          {formatPercent(globalStats?.teamOverview.team_overall_avg ?? 0)}
        </p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Puntos de ataque por set del equipo:{" "}
          {globalStats?.teamOverview.team_attack_points_per_set_avg?.toFixed(
            2,
          ) ?? "0.00"}
        </p>
        <div className="mt-4">
          <MetricBars
            maxValue={100}
            formatter={formatPercent}
            metrics={[
              {
                label: "Recepcion",
                value: globalStats?.teamOverview.team_reception_avg ?? 0,
              },
              {
                label: "Saque",
                value: globalStats?.teamOverview.team_serve_avg ?? 0,
              },
              {
                label: "Defensa",
                value: globalStats?.teamOverview.team_defense_avg ?? 0,
              },
              {
                label: "Ataque",
                value: globalStats?.teamOverview.team_attack_avg ?? 0,
              },
              {
                label: "Bloqueo",
                value: globalStats?.teamOverview.team_block_avg ?? 0,
              },
              {
                label: "Armado",
                value: globalStats?.teamOverview.team_setting_avg ?? 0,
              },
            ]}
          />
        </div>
      </article>

      {TOP_RANKINGS.map((ranking) => (
        <article key={ranking.key} className="card">
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-500">
            {ranking.title}
          </h3>
          <ol className="mt-3 space-y-2 text-sm">
            {(globalStats?.topPlayers[ranking.key] ?? []).map((item) => (
              <li
                key={item.full_name}
                className="card p-2 flex justify-between"
              >
                <span>{item.full_name}</span>
                <span className="font-semibold">{item.score.toFixed(2)}%</span>
              </li>
            ))}
            {(globalStats?.topPlayers[ranking.key] ?? []).length === 0 ? (
              <li className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-slate-600 dark:border-slate-700 dark:text-slate-300">
                Sin registros todavía.
              </li>
            ) : null}
          </ol>
        </article>
      ))}
    </section>
  );
}
