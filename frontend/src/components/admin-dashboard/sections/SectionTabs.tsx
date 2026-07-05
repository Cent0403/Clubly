import { ADMIN_SECTIONS } from '../constants';
import { AdminSectionKey } from '../types';

interface SectionTabsProps {
  activeSection: AdminSectionKey;
  onSelectSection: (section: AdminSectionKey) => void;
}

export function SectionTabs({ activeSection, onSelectSection }: SectionTabsProps) {
  return (
    <section className="card">
      <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
        {ADMIN_SECTIONS.map((section) => {
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
  );
}
