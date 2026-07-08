import { PLAYER_SECTIONS } from '../constants';
import { PlayerSectionKey } from '../types';
import { PlayerItem } from '../../../types';
import { LogoutIcon } from '../../icons/LogoutIcon';

interface SectionTabsProps {
  activeSection: PlayerSectionKey;
  onSelectSection: (section: PlayerSectionKey) => void;
  profile: PlayerItem | null;
  onLogout: () => void;
}

export function SectionTabs({ activeSection, onSelectSection, profile, onLogout }: SectionTabsProps) {
  return (
    <div className="">
      <section className="card md:hidden">
        <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2">
          {PLAYER_SECTIONS.map((section) => {
            const isActive = activeSection === section.key;

            return (
              <button
                key={section.key}
                type="button"
                className={`${isActive ? 'btn-primary' : 'btn-muted'} shrink-0 whitespace-nowrap`}
                onClick={() => onSelectSection(section.key)}
                aria-pressed={isActive}
              >
                {section.label}
              </button>
            );
          })}
        </div>
      </section>

      <aside className="hidden md:block fixed inset-y-0 left-0 w-72 border-r border-slate-200/80 bg-white/95 p-4 shadow-glow backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="flex h-full flex-col">
          <div className="space-y-6 overflow-y-auto pb-6">
            <div className="rounded-3xl bg-slate-900/5 p-4 dark:bg-slate-900/40">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Perfil</p>
              <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{profile?.full_name ?? 'Jugador'}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">#{profile?.jersey_number ?? '--'}</p>
            </div>

            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Menú
            </div>

            <nav className="space-y-2">
              {PLAYER_SECTIONS.map((section) => {
                const isActive = activeSection === section.key;

                return (
                  <button
                    key={section.key}
                    type="button"
                    className={`w-full text-left rounded-3xl px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? 'bg-sky-500 text-white shadow-lg'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                    }`}
                    onClick={() => onSelectSection(section.key)}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {section.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-3xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              onClick={onLogout}
            >
              <LogoutIcon className="h-5 w-5" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
