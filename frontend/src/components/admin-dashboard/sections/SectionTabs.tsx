import { ADMIN_SECTIONS } from '../constants';
import { AdminSectionKey } from '../types';
import { TeamSettings } from '../../../types';
import { LogoutIcon } from '../../icons/LogoutIcon';

interface SectionTabsProps {
  activeSection: AdminSectionKey;
  onSelectSection: (section: AdminSectionKey) => void;
  teamSettings: TeamSettings;
  onLogout: () => void;
}

export function SectionTabs({ activeSection, onSelectSection, teamSettings, onLogout }: SectionTabsProps) {
  return (
    <div>
      <section className="card md:hidden">
        <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2">
          {ADMIN_SECTIONS.map((section) => {
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
            <div className="flex items-center gap-3 rounded-3xl bg-slate-900/5 p-4 dark:bg-slate-900/40">
              {teamSettings.teamLogoUrl ? (
                <img src={teamSettings.teamLogoUrl} alt="Logo del equipo" className="h-12 w-12 rounded-2xl object-cover" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <span className="text-sm font-bold">C</span>
                </div>
              )}
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Equipo</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{teamSettings.teamName}</p>
              </div>
            </div>
            <nav className="space-y-2">
              {ADMIN_SECTIONS.map((section) => {
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
