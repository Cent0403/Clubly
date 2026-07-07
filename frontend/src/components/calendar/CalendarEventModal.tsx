import { ReactNode } from 'react';

interface CalendarEventModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function CalendarEventModal({ open, title, subtitle, onClose, children, footer }: CalendarEventModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-sky-500">Calendario</p>
            <h3 className="mt-1 text-xl font-bold">{title}</h3>
            {subtitle ? <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{subtitle}</p> : null}
          </div>
          <button className="btn-muted" type="button" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <div className="mt-4">{children}</div>

        {footer ? <div className="mt-4 flex flex-wrap gap-2">{footer}</div> : null}
      </div>
    </div>
  );
}