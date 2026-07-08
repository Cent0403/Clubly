import { ReactNode } from 'react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface CalendarEventModalProps {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  fullScreenOnMobile?: boolean;
  fullScreen?: boolean;
}

export function CalendarEventModal({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  fullScreenOnMobile = false,
  fullScreen = false
}: CalendarEventModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  const containerClassName = fullScreen
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-0 backdrop-blur-sm'
    : fullScreenOnMobile
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:p-4'
    : 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm';

  const modalClassName = fullScreen
    ? 'card h-full w-full overflow-x-hidden overflow-y-auto rounded-none'
    : fullScreenOnMobile
    ? 'card h-full w-full overflow-x-hidden overflow-y-auto rounded-none sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-3xl'
    : 'card w-full max-w-2xl max-h-[90vh] overflow-x-hidden overflow-y-auto';

  const modalContent = (
    <div className={containerClassName}>
      <div className={modalClassName}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.18em] text-sky-500">Calendario</p>
            <h3 className="mt-1 text-xl font-bold max-w-full whitespace-normal break-all overflow-hidden">{title}</h3>
            {subtitle ? <p className="mt-1 whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">{subtitle}</p> : null}
          </div>
          <button className="btn-muted shrink-0" type="button" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <div className="mt-4">{children}</div>

        {footer ? <div className="mt-4 flex flex-wrap gap-2">{footer}</div> : null}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}