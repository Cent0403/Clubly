import { PlayerHistoryItem } from "../../types";
import { buildPlayerMedalGroups } from "../player-dashboard/utils";
import {
  MedalLevel1Icon,
  MedalLevel2Icon,
  MedalLevel3Icon,
  MedalLevel4Icon,
} from "../icons/MedalIcons";

interface MedalsPanelProps {
  history: PlayerHistoryItem[];
}

export function MedalsPanel({ history }: MedalsPanelProps) {
  const groups = buildPlayerMedalGroups(history);

  if (groups.length === 0) {
    return (
      <div className="card p-2 text-sm text-slate-600 dark:text-slate-300">
        No hay suficientes datos para mostrar medallas.
      </div>
    );
  }

  function getIcon(threshold: number) {
    if (threshold === 3)
      return (
        <div className="h-10 w-10 bg-slate-100 p-2 dark:bg-slate-800 rounded-full flex items-center justify-center">
          <MedalLevel1Icon />
        </div>
      );
    if (threshold === 6)
      return (
        <div className="h-10 w-10 bg-slate-100 p-2 dark:bg-slate-800 rounded-full flex items-center justify-center">
          <MedalLevel2Icon />
        </div>
      );
    if (threshold === 9)
      return (
        <div className="h-10 w-10 bg-slate-100 p-2 dark:bg-slate-800 rounded-full flex items-center justify-center">
          <MedalLevel3Icon />
        </div>
      );
    return (
      <div className="h-10 w-10 bg-slate-100 p-2 dark:bg-slate-800 rounded-full flex items-center justify-center">
        <MedalLevel4Icon />
      </div>
    );
  }

  function getLevel(threshold: number) {
    if (threshold === 3) return "Nivel 1";
    if (threshold === 6) return "Nivel 2";
    if (threshold === 9) return "Nivel 3";
    return "Nivel 4";
  }

  return (
    <div className="card p-2 text-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-500">
          Rachas
        </span>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          {groups.length} categorías
        </span>
      </div>
      <div className="grid gap-2">
        {groups.map((group) => {
          // Buscamos la medalla más alta conseguida (empezando desde el final del array)
          const highestBadge = [...group.badges]
            .reverse()
            .find((badge) => badge.achieved);

          return (
            <div
              key={group.category}
              className="card p-2 flex flex-wrap items-center gap-2 text-[11px]"
            >
              <span className="font-semibold">{group.category}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                Racha {group.currentStreak}
              </span>

              <div className="flex items-center gap-1.5">
                {highestBadge ? (
                  <span
                    key={highestBadge.threshold}
                    className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300"
                  >
                    {getIcon(highestBadge.threshold)}
                    <span className="text-xs">
                      {getLevel(highestBadge.threshold)}
                    </span>
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    Sin medallas
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
