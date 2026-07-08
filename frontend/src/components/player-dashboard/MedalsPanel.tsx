import { PlayerHistoryItem } from '../../types';
import { buildPlayerMedalGroups } from './utils';

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
    if (threshold === 3) return '🥉';
    if (threshold === 6) return '🥈';
    if (threshold === 9) return '🥇';
    return '🏅';
  }

  return (
    <div className="card p-2 text-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-500">Rachas</span>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">{groups.length} categorías</span>
      </div>
      <div className="grid gap-2">
        {groups.map((group) => (
          <div key={group.category} className="card p-2 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="font-semibold">{group.category}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">Racha {group.currentStreak}</span>
            <div className="flex flex-wrap items-center gap-1">
              {group.badges.map((badge) => (
                <span
                  key={`${group.category}-${badge.threshold}`}
                  className={`inline-flex h-6 min-w-[2rem] items-center justify-center rounded-full border px-2 text-xs font-semibold ${
                    badge.achieved
                      ? 'border-transparent badge-accent'
                      : 'border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400'
                  }`}
                >
                  {getIcon(badge.threshold)} {badge.threshold}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
