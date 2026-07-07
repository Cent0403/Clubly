import { useMemo, useState, type ReactNode } from 'react';
import { CalendarEvent, CalendarEventInstance } from '../../types';

type CalendarDayCell = {
  date: Date;
  key: string;
  inCurrentMonth: boolean;
  events: Array<{
    event: CalendarEvent;
    instance: CalendarEventInstance;
  }>;
};

interface MonthCalendarProps {
  events: CalendarEvent[];
  actionPanel?: ReactNode;
  selectedDayPanel?: (params: {
    selectedDayKey: string | null;
    selectedDayEvents: Array<{
      event: CalendarEvent;
      instance: CalendarEventInstance;
    }>;
  }) => ReactNode;
  emptyMessage: string;
}

function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseLocalDateTime(value: string): Date {
  const normalized = value.replace(' ', 'T');
  return new Date(normalized);
}

function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function getEventTypeColor(type: CalendarEvent['tipo_evento']): string {
  if (type === 'partido') {
    return 'bg-rose-500';
  }

  if (type === 'entreno') {
    return 'bg-sky-500';
  }

  if (type === 'entrega') {
    return 'bg-amber-500';
  }

  return 'bg-emerald-500';
}

function getEventTypeLabel(type: CalendarEvent['tipo_evento']): string {
  if (type === 'partido') {
    return 'Partido';
  }

  if (type === 'entreno') {
    return 'Entreno';
  }

  if (type === 'entrega') {
    return 'Entrega';
  }

  return 'Otro';
}

function formatDayLabel(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'short',
    day: 'numeric'
  }).format(date);
}

function formatMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    month: 'long',
    year: 'numeric'
  }).format(date);
}

function formatDateTime(value: string): string {
  const date = parseLocalDateTime(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function formatAttendeeLabel(name: string, jerseyNumber: number | null): string {
  return jerseyNumber ? `#${jerseyNumber} ${name}` : name;
}

function getDayKeyFromInstance(instance: CalendarEventInstance): string {
  const date = parseLocalDateTime(instance.fecha_hora_inicio);
  return toLocalDateKey(date);
}

function buildMonthCells(centerDate: Date, events: CalendarEvent[]): CalendarDayCell[] {
  const firstOfMonth = new Date(centerDate.getFullYear(), centerDate.getMonth(), 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() - startOffset);

  const instanceMap = new Map<string, Array<{ event: CalendarEvent; instance: CalendarEventInstance }>>();

  events.forEach((event) => {
    event.instances.forEach((instance) => {
      const key = getDayKeyFromInstance(instance);
      const current = instanceMap.get(key) ?? [];
      current.push({ event, instance });
      instanceMap.set(key, current);
    });
  });

  const cells: CalendarDayCell[] = [];

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    const key = toLocalDateKey(date);
    const eventsForDay = instanceMap.get(key) ?? [];

    cells.push({
      date,
      key,
      inCurrentMonth: date.getMonth() === centerDate.getMonth(),
      events: eventsForDay
    });
  }

  return cells;
}

export function MonthCalendar({ events, actionPanel, selectedDayPanel, emptyMessage }: MonthCalendarProps) {
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  const cells = useMemo(() => buildMonthCells(visibleMonth, events), [events, visibleMonth]);

  const selectedDay = useMemo(() => {
    if (!selectedDayKey) {
      return cells.find((cell) => isSameDay(cell.date, new Date()));
    }

    return cells.find((cell) => cell.key === selectedDayKey) ?? null;
  }, [cells, selectedDayKey]);

  const selectedDayEvents = selectedDay?.events ?? [];

  function shiftMonth(delta: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  function handleToday() {
    const today = new Date();
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDayKey(toLocalDateKey(today));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/80 px-3 py-3 shadow-sm backdrop-blur sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-4 dark:border-slate-800 dark:bg-slate-950/30">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Calendario</p>
          <h3 className="text-xl font-black capitalize tracking-tight text-slate-900 sm:text-2xl dark:text-white">
            {formatMonthLabel(visibleMonth)}
          </h3>
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          <button type="button" className="btn-muted px-3 py-2 text-sm sm:px-4 sm:py-2" onClick={() => shiftMonth(-1)}>
            Mes anterior
          </button>
          <button type="button" className="btn-muted px-3 py-2 text-sm sm:px-4 sm:py-2" onClick={handleToday}>
            Hoy
          </button>
          <button type="button" className="btn-muted px-3 py-2 text-sm sm:px-4 sm:py-2" onClick={() => shiftMonth(1)}>
            Mes siguiente
          </button>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.55fr_1fr]">
        <section className="rounded-3xl border border-slate-200 bg-white/80 p-3 shadow-sm backdrop-blur sm:p-4 dark:border-slate-800 dark:bg-slate-950/30">
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 sm:gap-2 sm:text-[11px] dark:text-slate-400">
            {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'].map((day) => (
              <div key={day} className="py-1 sm:py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1 sm:gap-2">
            {cells.map((cell) => {
              const isSelected = selectedDayKey === cell.key;
              const isToday = isSameDay(cell.date, new Date());
              const count = cell.events.length;
              const primaryEvent = cell.events[0];

              return (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => setSelectedDayKey(cell.key)}
                  className={`relative min-h-16 rounded-xl border p-1.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:min-h-20 sm:rounded-2xl sm:p-2 ${
                    cell.inCurrentMonth
                      ? 'bg-white dark:bg-slate-900/60'
                      : 'border-slate-200/60 bg-slate-50/60 text-slate-400 dark:border-slate-800 dark:bg-slate-900/20 dark:text-slate-600'
                  } ${isSelected ? 'border-slate-900 ring-2 ring-slate-900 dark:border-white dark:ring-white' : 'border-slate-200 dark:border-slate-800'} ${
                    isToday ? 'shadow-[0_0_0_1px_rgba(14,165,233,0.35)]' : ''
                  }`}
                >
                  {count > 0 ? (
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] font-black leading-none text-white sm:left-2 sm:top-2 sm:px-2 sm:text-[11px] dark:bg-white dark:text-slate-900">
                      {count}
                    </span>
                  ) : null}

                  <span className={`ml-auto block text-right text-xs font-semibold sm:text-sm ${isToday ? 'text-sky-600 dark:text-sky-400' : ''}`}>
                    {cell.date.getDate()}
                  </span>

                  {count > 0 ? (
                    <div className="mt-4 flex items-center justify-between gap-1 sm:mt-6 sm:gap-2">
                      <span className={`h-2 w-2 rounded-full sm:h-2.5 sm:w-2.5 ${getEventTypeColor(primaryEvent!.event.tipo_evento)}`} />
                      <span className="truncate text-[10px] font-medium text-slate-500 sm:text-[11px] dark:text-slate-400">
                        {getEventTypeLabel(primaryEvent!.event.tipo_evento)}
                      </span>
                    </div>
                  ) : null}

                  <span className="sr-only">{formatDayLabel(cell.date)}</span>
                </button>
              );
            })}
          </div>
        </section>

        <aside className="rounded-3xl border border-slate-200 bg-white/80 p-3 shadow-sm backdrop-blur sm:p-4 dark:border-slate-800 dark:bg-slate-950/30">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Día seleccionado</p>
              <h4 className="text-lg font-bold text-slate-900 sm:text-xl dark:text-white">
                {selectedDay ? formatDayLabel(selectedDay.date) : 'Sin día seleccionado'}
              </h4>
            </div>
            <div className="text-right text-[11px] text-slate-500 dark:text-slate-400">
              <p>{selectedDayEvents.length} eventos</p>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {selectedDayEvents.length > 0 ? (
              selectedDayEvents.map(({ event, instance }) => (
                <article key={instance.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${getEventTypeColor(event.tipo_evento)}`} />
                        <h5 className="font-semibold text-slate-900 dark:text-white">{event.titulo}</h5>
                      </div>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        {getEventTypeLabel(event.tipo_evento)}
                      </p>
                    </div>
                    {instance.requiere_asistencia ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        Encuesta
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{event.descripcion || 'Sin descripcion'}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {formatDateTime(instance.fecha_hora_inicio)} - {formatDateTime(instance.fecha_hora_fin)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{instance.lugar || 'Sin lugar definido'}</p>

                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                      Asistirán {instance.attending_players.length}
                    </p>
                    {instance.attending_players.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {instance.attending_players.map((player) => (
                          <span
                            key={player.jugador_id}
                            className="rounded-full bg-sky-100 px-2 py-1 text-[11px] font-semibold text-sky-700 dark:bg-sky-900/40 dark:text-sky-200"
                          >
                            {formatAttendeeLabel(player.full_name, player.jersey_number)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-slate-400">Nadie ha confirmado asistencia todavía.</p>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
                {emptyMessage}
              </div>
            )}
          </div>

          {selectedDayPanel ? <div className="mt-4">{selectedDayPanel({ selectedDayKey, selectedDayEvents })}</div> : null}

          {actionPanel ? <div className="mt-4">{actionPanel}</div> : null}
        </aside>
      </div>
    </div>
  );
}