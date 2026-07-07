import { MonthCalendar } from '../../calendar/MonthCalendar';
import { CalendarEventFormState, CalendarSectionProps } from '../types';

export function CalendarSection({
  active,
  events,
  calendarForm,
  editingCalendarInstanceId,
  savingCalendarEvent,
  onCalendarFormChange,
  onCreateCalendarEvent,
  onEditCalendarEvent,
  onCancelEditCalendarEvent
}: CalendarSectionProps) {
  const isEditing = editingCalendarInstanceId !== null;

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
          />
          <textarea
            className="input min-h-24"
            placeholder="Descripcion"
            value={calendarForm.descripcion}
            onChange={(event) => onCalendarFormChange((current) => ({ ...current, descripcion: event.target.value }))}
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

          <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-700">
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
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
              Para cambiar repetición, crea un evento nuevo. En esta vista puedes ajustar la instancia seleccionada y los datos base.
            </div>
          ) : null}

          <label className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3 dark:border-slate-700">
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

          <textarea
            className="input min-h-24"
            placeholder="Notas"
            value={calendarForm.notas}
            onChange={(event) => onCalendarFormChange((current) => ({ ...current, notas: event.target.value }))}
          />

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
        emptyMessage="Todavía no hay días con eventos creados."
        selectedDayPanel={({ selectedDayEvents }) => {
          if (selectedDayEvents.length === 0) {
            return null;
          }

          return (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Editar evento</p>

              {selectedDayEvents.map(({ event, instance }) => (
                <article key={instance.id} className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950/40">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white">{event.titulo}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{instance.lugar || 'Sin lugar definido'}</p>
                    </div>
                    <button type="button" className="btn-primary px-3 py-2 text-xs" onClick={() => onEditCalendarEvent(event, instance.id)}>
                      Editar
                    </button>
                  </div>

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
                            {player.jersey_number ? `#${player.jersey_number} ${player.full_name}` : player.full_name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 dark:text-slate-400">Todavía no hay jugadores confirmados.</p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          );
        }}
      />
    </section>
  );
}