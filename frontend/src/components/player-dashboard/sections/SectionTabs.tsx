import { PLAYER_SECTIONS } from '../constants';
import { PlayerSectionKey } from '../types';
import { PlayerItem } from '../../../types';
import { LogoutIcon } from '../../icons/LogoutIcon';
import { formatPosition } from '../utils';
import { useState } from 'react';

interface SectionTabsProps {
  activeSection: PlayerSectionKey;
  onSelectSection: (section: PlayerSectionKey) => void;
  profile: PlayerItem | null;
  onLogout: () => void;
}

export function SectionTabs({ activeSection, onSelectSection, profile, onLogout }: SectionTabsProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="">
      <div className="flex items-center justify-between md:hidden mb-2">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            {profile?.full_name ? profile.full_name.charAt(0) : 'J'}
          </div>
          <div>
            <p className="text-sm font-semibold">{profile?.full_name ?? 'Jugador'}</p>
          </div>
        </div>
        <button type="button" className="btn" onClick={() => setMobileOpen(true)} aria-label="Abrir menú">
          Menu
        </button>
      </div>
      <aside className="sidebar-aside">
        <div className="sidebar-scroll">
          <div className="sidebar-top">
            <div className="sidebar-card flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">{profile?.full_name ? profile.full_name.charAt(0) : 'J'}</div>
              <div className="min-w-0">
                <p className="sidebar-profile-name">{profile?.full_name ?? 'Jugador'}</p>
                <p className="sidebar-profile-position">{formatPosition(profile?.position)}</p>
              </div>
            </div>
            <nav className="sidebar-nav">
              {PLAYER_SECTIONS.map((section) => {
                const isActive = activeSection === section.key;
                return (
                  <button
                    key={section.key}
                    type="button"
                    className={`sidebar-item flex items-center gap-2 ${isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}
                    onClick={() => onSelectSection(section.key)}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <section.icon className="h-5 w-5" />
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
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-slate-900/60 mobile-backdrop" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 bg-white dark:bg-[#171821] p-4 mobile-drawer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">{profile?.full_name ? profile.full_name.charAt(0) : 'J'}</div>
                <div className="min-w-0">
                  <p className="sidebar-profile-name">{profile?.full_name ?? 'Jugador'}</p>
                  <p className="sidebar-profile-position">{formatPosition(profile?.position)}</p>
                </div>
              </div>
              <button type="button" className="btn-muted" onClick={() => setMobileOpen(false)}>
                Cerrar
              </button>
            </div>

            <nav className="mt-4">
              {PLAYER_SECTIONS.map((section) => {
                const isActive = activeSection === section.key;

                return (
                  <button
                    key={section.key}
                    type="button"
                    className={`w-full text-left my-1 flex items-center gap-2 ${isActive ? 'btn-primary' : 'btn-muted'}`}
                    onClick={() => {
                      onSelectSection(section.key);
                      setMobileOpen(false);
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <section.icon className="h-5 w-5" />
                      {section.label}
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-4">
              <button type="button" className="sidebar-logout w-full" onClick={() => { setMobileOpen(false); onLogout(); }}>
                <LogoutIcon className="h-5 w-5" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
