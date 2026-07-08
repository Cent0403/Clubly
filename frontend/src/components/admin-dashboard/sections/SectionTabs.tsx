import { ADMIN_SECTIONS } from '../constants';
import { useState } from 'react';
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
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div>
      <div className="flex items-center justify-between md:hidden mb-2">
        <div className="flex items-center gap-3">
          {teamSettings.teamLogoUrl ? (
            <img src={teamSettings.teamLogoUrl} alt="Logo" className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">C</div>
          )}
          <div>
            <p className="text-sm font-semibold">{teamSettings.teamName}</p>
          </div>
        </div>
        <button type="button" className="btn" onClick={() => setMobileOpen(true)} aria-label="Abrir menú">
          Menu
        </button>
      </div>
      {/* horizontal pill menu removed in favor of drawer menu on mobile */}

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
                {teamSettings.teamLogoUrl ? (
                  <img src={teamSettings.teamLogoUrl} alt="Logo" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">C</div>
                )}
                <div>
                  <p className="sidebar-header-label">Equipo</p>
                  <p className="sidebar-header-title">{teamSettings.teamName}</p>
                </div>
              </div>
              <button type="button" className="btn-muted" onClick={() => setMobileOpen(false)}>
                Cerrar
              </button>
            </div>

            <nav className="mt-4">
              {ADMIN_SECTIONS.map((section) => {
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
                    <section.icon className="h-5 w-5" />
                    {section.label}
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
