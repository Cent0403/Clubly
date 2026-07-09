import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { CalendarEventModal } from '../../calendar/CalendarEventModal';
import { MonthCalendar } from '../../calendar/MonthCalendar';
import { CalendarEvent } from '../../../types';
import { CalendarEventFormState, CalendarSectionProps } from '../types';

function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

function buildSurveyUrl(instanceId: number): string {
  const url = new URL(window.location.href);
  url.searchParams.set('section', 'calendario');
  url.searchParams.set('calendarInstanceId', String(instanceId));
  return url.toString();
}

export function CalendarSection({
  active,
  events,
  calendarForm,
  editingCalendarInstanceId,
  savingCalendarEvent,
  onCalendarFormChange,
  onCreateCalendarEvent,
  onEditCalendarEvent,
  onDeleteCalendarEvent,
  onCancelEditCalendarEvent
}: CalendarSectionProps) {
  const isEditing = editingCalendarInstanceId !== null;
  const [activePreview, setActivePreview] = useState<{
    event: CalendarEvent;
    instanceId: number;
  } | null>(null);

  useEffect(() => {
    const instanceIdParam = new URLSearchParams(window.location.search).get('calendarInstanceId');

    if (!instanceIdParam) {
      return;
    }

    const instanceId = Number(instanceIdParam);

    if (!Number.isFinite(instanceId)) {
      return;
    }

    for (const event of events) {
      const instance = event.instances.find((item) => item.id === instanceId);

      if (instance) {
        setActivePreview({ event, instanceId: instance.id });
        break;
      }
    }
  }, [events]);

  async function handleShareSurvey(
    eventTitle: string,
    instanceId: number,
    startAt: string,
    endAt: string,
    place: string | null
  ) {
    try {
      const surveyUrl = buildSurveyUrl(instanceId);
      const message = [
        `Encuesta de asistencia: ${eventTitle}`,
        `Horario: ${formatDateTime(startAt)} - ${formatDateTime(endAt)}`,
        `Lugar: ${place || 'Sin lugar definido'}`,
        '',
        `Responde aqui: ${surveyUrl}`
      ].join('\n');

      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      const popup = window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

      if (!popup) {
        await navigator.clipboard.writeText(message);
        toast.success('Mensaje copiado. Pegalo en WhatsApp.');
        return;
      }

      toast.success('Abriendo WhatsApp para compartir.');
    } catch {
      toast.error('No se pudo compartir por WhatsApp.');
    }
  }

  return (
    <section className={active ? 'space-y-6' : 'hidden'}>
      <article className="card xl:col-span-2">
        <h3 className="text-xl font-bold">{isEditing ? 'Editar evento de calendario' : 'Crear evento de calendario'}</h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          {isEditing
            ? 'Se editará la instancia seleccionada del calendario.'
            : 'Puedes crear un evento único o una serie repetitiva con encuesta de asistencia por instancia.'}
        </p>

        <form className="mt-4 space-y-3" onSubmit={onCreateCalendarEvent}>
          <input
            className="input"
            placeholder="Titulo del evento"
            value={calendarForm.titulo}
            onChange={(event) => onCalendarFormChange((current) => ({ ...current, titulo: event.target.value }))}
            required
            maxLength={80}
          />
          <textarea
            className="input min-h-24"
            placeholder="Descripcion"
            value={calendarForm.descripcion}
            onChange={(event) => onCalendarFormChange((current) => ({ ...current, descripcion: event.target.value }))}
            maxLength={500}
          />
          <div className="grid gap-3 md:grid-cols-2">
            <select
              className="input"
              value={calendarForm.tipoEvento}
              onChange={(event) =>
                onCalendarFormChange((current) => ({
                  ...current,
                  tipoEvento: event.target.value as CalendarEventFormState['tipoEvento']
                }))
              }
            >
              <option value="partido">Partido</option>
              <option value="entreno">Entreno</option>
              <option value="entrega">Entrega</option>
              <option value="otro">Otro</option>
            </select>
            <input
              className="input"
              placeholder="Lugar"
              value={calendarForm.lugar}
              onChange={(event) => onCalendarFormChange((current) => ({ ...current, lugar: event.target.value }))}
              maxLength={100}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm font-medium">
              Inicio
              <input
                className="input"
                type="datetime-local"
                value={calendarForm.fechaHoraInicio}
                onChange={(event) =>
                  onCalendarFormChange((current) => ({ ...current, fechaHoraInicio: event.target.value }))
                }
                required
              />
            </label>
            <label className="space-y-1 text-sm font-medium">
              Fin
              <input
                className="input"
                type="datetime-local"
                value={calendarForm.fechaHoraFin}
                onChange={(event) => onCalendarFormChange((current) => ({ ...current, fechaHoraFin: event.target.value }))}
                required
              />
            </label>
          </div>

          <label className="card p-3 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold">Evento repetitivo</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Genera varias instancias con la misma duración.</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={calendarForm.esRepetitivo}
              disabled={isEditing}
              onChange={(event) =>
                onCalendarFormChange((current) => ({ ...current, esRepetitivo: event.target.checked }))
              }
            />
          </label>

          {calendarForm.esRepetitivo && !isEditing ? (
            <div className="grid gap-3 md:grid-cols-2">
              <select
                className="input"
                value={calendarForm.frecuenciaRepeticion}
                onChange={(event) =>
                  onCalendarFormChange((current) => ({
                    ...current,
                    frecuenciaRepeticion: event.target.value as CalendarEventFormState['frecuenciaRepeticion']
                  }))
                }
              >
                <option value="semanal">Semanal</option>
                <option value="mensual">Mensual</option>
                <option value="diaria">Diaria</option>
              </select>
              <input
                className="input"
                type="date"
                value={calendarForm.fechaFinSerie}
                onChange={(event) => onCalendarFormChange((current) => ({ ...current, fechaFinSerie: event.target.value }))}
                required
              />
            </div>
          ) : null}

          {isEditing ? (
            <div className="card p-3 text-xs text-slate-600 dark:text-slate-300">
              Para cambiar repetición, crea un evento nuevo. En esta vista puedes ajustar la instancia seleccionada y los datos base.
            </div>
          ) : null}

          <label className="card p-3 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold">Activar encuesta de asistencia</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Si la desactivas, el jugador solo verá la información del evento.</p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={calendarForm.requiereAsistencia}
              onChange={(event) =>
                onCalendarFormChange((current) => ({ ...current, requiereAsistencia: event.target.checked }))
              }
            />
          </label>

          <button className="btn-primary w-full" type="submit" disabled={savingCalendarEvent}>
            {savingCalendarEvent ? 'Guardando evento...' : isEditing ? 'Guardar cambios' : 'Crear evento'}
          </button>

          {isEditing ? (
            <button className="btn-muted w-full" type="button" onClick={onCancelEditCalendarEvent}>
              Cancelar edición
            </button>
          ) : null}
        </form>
      </article>

      <MonthCalendar
        events={events}
        emptyMessage="Todavía no hay eventos creados en este día."
        selectedDayPanel={({ selectedDayEvents }) => {
          if (selectedDayEvents.length === 0) {
            return null;
          }

          return (
            <div className="card p-3 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Eventos del día</p>

              {selectedDayEvents.map(({ event, instance }) => (
                <button
                  key={instance.id}
                  type="button"
                  className="p-3 flex min-w-0 w-full items-center justify-between gap-3 overflow-hidden text-left"
                  onClick={() => setActivePreview({ event, instanceId: instance.id })}
                >
                  <div className="min-w-0 overflow-hidden">
                    <p className="max-w-full whitespace-normal break-all font-semibold text-slate-900 dark:text-white">{event.titulo}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {instance.requiere_asistencia ? `${instance.attending_players.length} asistencia(s) · ` : ''}
                      {instance.lugar || 'Sin lugar'}
                    </p>
                  </div>
                  <span className="btn-primary">
                    Ver
                  </span>
                </button>
              ))}
            </div>
          );
        }}
      />

      <CalendarEventModal
        open={Boolean(activePreview)}
        title={activePreview?.event.titulo ?? ''}
        subtitle={activePreview ? activePreview.event.descripcion || 'Sin descripcion' : undefined}
        onClose={() => setActivePreview(null)}
        footer={
          activePreview ? (
            <>
              <button
                type="button"
                className="btn-muted text-rose-600 dark:text-rose-300"
                onClick={() => {
                  onDeleteCalendarEvent(activePreview.event, activePreview.instanceId);
                  setActivePreview(null);
                }}
              >
                Eliminar
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  onEditCalendarEvent(activePreview.event, activePreview.instanceId);
                  setActivePreview(null);
                }}
              >
                Editar
              </button>
            </>
          ) : null
        }
      >
        {activePreview ? (() => {
          const instance = activePreview.event.instances.find((item) => item.id === activePreview.instanceId);

          if (!instance) {
            return null;
          }

          return (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="card p-3 min-w-0">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Hora</p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white break-words whitespace-normal">
                    {formatDateTime(instance.fecha_hora_inicio)} - {formatDateTime(instance.fecha_hora_fin)}
                  </p>
                </div>
                <div className="card p-3 min-w-0">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Lugar</p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white break-words whitespace-normal">{instance.lugar || 'Sin lugar definido'}</p>
                </div>
              </div>

              {instance.requiere_asistencia ? (
                <div className="card p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Asistirán {instance.attending_players.length}</p>
                    <button
                      type="button"
                      className="btn-muted px-3 py-1 text-xs"
                      onClick={() =>
                        void handleShareSurvey(
                          activePreview.event.titulo,
                          instance.id,
                          instance.fecha_hora_inicio,
                          instance.fecha_hora_fin,
                          instance.lugar
                        )
                      }
                    >
                      Compartir por WhatsApp
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {instance.attending_players.length > 0 ? (
                      instance.attending_players.map((player) => {
                        const label = player.jersey_number ? `#${player.jersey_number} ${player.full_name}` : player.full_name;

                        return (
                          <span key={player.jugador_id} className="badge-accent-soft" title={label} aria-label={label}>
                            {label}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-sm text-slate-500 dark:text-slate-400">Todavía no hay jugadores confirmados.</span>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })() : null}
      </CalendarEventModal>
    </section>
  );
}