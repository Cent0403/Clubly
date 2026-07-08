import { PLAYER_SECTIONS } from '../constants';
import { PlayerSectionKey } from '../types';
import { PlayerItem } from '../../../types';
import { LogoutIcon } from '../../icons/LogoutIcon';
import { formatPosition } from '../utils';

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

      <aside className="sidebar-aside">
        <div className="sidebar-scroll">
          <div className="sidebar-top">
            <div className="sidebar-card flex items-center gap-3">
              <p className="sidebar-profile-name">{profile?.full_name ?? 'Jugador'}</p>
              <p className="sidebar-profile-position">{formatPosition(profile?.position)}</p>
            </div>
            <nav className="sidebar-nav">
              {PLAYER_SECTIONS.map((section) => {
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
