import { PLAYER_SECTIONS } from '../constants';
import { PlayerSectionKey } from '../types';

interface SectionTabsProps {
  activeSection: PlayerSectionKey;
  onSelectSection: (section: PlayerSectionKey) => void;
}

export function SectionTabs({ activeSection, onSelectSection }: SectionTabsProps) {
  return (
    <div className="relative -mx-4 px-4 md:mx-0 md:px-0">
      <section className="card">
        <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
          {PLAYER_SECTIONS.map((section) => {
            const isActive = activeSection === section.key;

            return (
              <button
                key={section.key}
                type="button"
                className={`${isActive ? 'btn-primary' : 'btn-muted'} shrink-0`}
                onClick={() => onSelectSection(section.key)}
                aria-pressed={isActive}
              >
                {section.label}
              </button>
            );
          })}
        </div>
      </section>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-1 text-slate-500 md:hidden">
        <span className="text-xs font-bold">‹</span>
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1 text-slate-500 md:hidden">
        <span className="text-xs font-bold">›</span>
      </div>
    </div>
  );
}
