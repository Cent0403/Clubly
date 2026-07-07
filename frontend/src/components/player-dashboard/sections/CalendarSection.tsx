import { useEffect, useState } from 'react';
import { AttendanceStatus } from '../../../types';
import { MonthCalendar } from '../../calendar/MonthCalendar';
import { CalendarSectionProps } from '../types';

interface DraftState {
  estadoAsistencia: AttendanceStatus;
  comentario: string;
}

export function CalendarSection({
  active,
  events,
  savingAttendanceInstanceId,
  onSubmitAttendance
}: CalendarSectionProps) {
  const [drafts, setDrafts] = useState<Record<number, DraftState>>({});

  useEffect(() => {
    setDrafts((current) => {
      const nextDrafts = { ...current };

      events.forEach((event) => {
        event.instances.forEach((instance) => {
          if (!nextDrafts[instance.id]) {
            nextDrafts[instance.id] = {
              estadoAsistencia: instance.my_response?.estado_asistencia ?? 'pendiente',
              comentario: instance.my_response?.comentario ?? ''
            };
          }
        });
      });

      return nextDrafts;
    });
  }, [events]);

  return (
    <section className={active ? 'card' : 'hidden'}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-amber-500">Calendario del equipo</p>
          <h2 className="mt-1 text-2xl font-bold">Tus eventos y asistencia</h2>
  
        </div>
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{events.length} eventos</p>
      </div>

      <div className="mt-5">
        <MonthCalendar
          events={events}
          emptyMessage="Todavía no hay días con eventos publicados para tu calendario."
          selectedDayPanel={({ selectedDayEvents }) => {
            if (selectedDayEvents.length === 0) {
              return (
                <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
                  Selecciona un día con eventos para responder asistencia.
                </div>
              );
            }

            return (
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Responder asistencia
                </p>

                {selectedDayEvents.map(({ event, instance }) => {
                  const draft = drafts[instance.id] ?? {
                    estadoAsistencia: instance.my_response?.estado_asistencia ?? 'pendiente',
                    comentario: instance.my_response?.comentario ?? ''
                  };
                  const canRespond = instance.requiere_asistencia && instance.estado_instancia !== 'cancelado';
                  const saving = savingAttendanceInstanceId === instance.id;

                  return (
                    <article key={instance.id} className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950/40">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white">{event.titulo}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{instance.lugar || 'Sin lugar definido'}</p>
                        </div>
                        {instance.my_response ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                            {instance.my_response.estado_asistencia}
                          </span>
                        ) : null}
                      </div>

                      {canRespond ? (
                        <div className="mt-3 space-y-3">
                          <select
                            className="input"
                            value={draft.estadoAsistencia}
                            onChange={(event) =>
                              setDrafts((current) => ({
                                ...current,
                                [instance.id]: {
                                  ...draft,
                                  estadoAsistencia: event.target.value as AttendanceStatus
                                }
                              }))
                            }
                          >
                            <option value="pendiente">Pendiente</option>
                            <option value="asistira">Asistiré</option>
                            <option value="no_asistira">No asistiré</option>
                            <option value="tarde">Llegaré tarde</option>
                          </select>
                          <textarea
                            className="input min-h-20"
                            placeholder="Comentario opcional"
                            value={draft.comentario}
                            onChange={(event) =>
                              setDrafts((current) => ({
                                ...current,
                                [instance.id]: {
                                  ...draft,
                                  comentario: event.target.value
                                }
                              }))
                            }
                          />
                          <button
                            type="button"
                            className="btn-primary w-full"
                            disabled={saving}
                            onClick={() =>
                              void onSubmitAttendance(instance.id, {
                                estadoAsistencia: draft.estadoAsistencia,
                                comentario: draft.comentario.trim()
                              })
                            }
                          >
                            {saving ? 'Guardando...' : 'Guardar respuesta'}
                          </button>
                        </div>
                      ) : (
                        <p className="mt-3 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
                          {instance.estado_instancia === 'cancelado'
                            ? 'Esta instancia fue cancelada.'
                            : 'La encuesta de asistencia no está activa para esta instancia.'}
                        </p>
                      )}

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
                  );
                })}
              </div>
            );
          }}
        />
      </div>
    </section>
  );
}