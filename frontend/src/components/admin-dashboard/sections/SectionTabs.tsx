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

      <aside className="sidebar-aside">
        <div className="sidebar-scroll">
          <div className="sidebar-top">
            <div className="sidebar-card flex items-center gap-3">
              {teamSettings.teamLogoUrl ? (
                <img src={teamSettings.teamLogoUrl} alt="Logo del equipo" className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <div className="sidebar-brand-fallback">
                  <span className="text-sm font-bold">C</span>
                </div>
              )}
              <div>
                <p className="sidebar-header-label">Equipo</p>
                <p className="sidebar-header-title">{teamSettings.teamName}</p>
              </div>
            </div>
            <nav className="sidebar-nav">
              {ADMIN_SECTIONS.map((section) => {
                const isActive = activeSection === section.key;

                return (
                  <button
                    key={section.key}
                    type="button"
                    className={`sidebar-item ${isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}
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
              className="sidebar-logout"
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
