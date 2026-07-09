import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { AttendanceStatus } from "../../../types";
import { CalendarEventModal } from "../../calendar/CalendarEventModal";
import { MonthCalendar } from "../../calendar/MonthCalendar";
import { CalendarSectionProps } from "../types";

function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function buildSurveyUrl(instanceId: number): string {
  const url = new URL(window.location.href);
  url.searchParams.set("section", "calendario");
  url.searchParams.set("calendarInstanceId", String(instanceId));
  return url.toString();
}

interface DraftState {
  estadoAsistencia: AttendanceStatus;
  comentario: string;
}

export function CalendarSection({
  active,
  events,
  savingAttendanceInstanceId,
  onSubmitAttendance,
}: CalendarSectionProps) {
  const [drafts, setDrafts] = useState<Record<number, DraftState>>({});
  const [pendingDeepLinkInstanceId, setPendingDeepLinkInstanceId] = useState<
    number | null
  >(() => {
    const instanceIdParam = new URLSearchParams(window.location.search).get(
      "calendarInstanceId",
    );

    if (!instanceIdParam) {
      return null;
    }

    const instanceId = Number(instanceIdParam);
    return Number.isFinite(instanceId) ? instanceId : null;
  });
  const [activePreview, setActivePreview] = useState<{
    event: import("../../../types").CalendarEvent;
    instanceId: number;
  } | null>(null);

  useEffect(() => {
    if (pendingDeepLinkInstanceId === null) {
      return;
    }

    for (const event of events) {
      const instance = event.instances.find(
        (item) => item.id === pendingDeepLinkInstanceId,
      );

      if (instance) {
        setActivePreview({ event, instanceId: instance.id });
        setPendingDeepLinkInstanceId(null);

        const url = new URL(window.location.href);
        url.searchParams.delete("calendarInstanceId");
        window.history.replaceState(
          {},
          "",
          `${url.pathname}${url.search}${url.hash}`,
        );

        break;
      }
    }
  }, [events, pendingDeepLinkInstanceId]);

  useEffect(() => {
    setDrafts((current) => {
      const nextDrafts = { ...current };

      events.forEach((event) => {
        event.instances.forEach((instance) => {
          if (!nextDrafts[instance.id]) {
            nextDrafts[instance.id] = {
              estadoAsistencia:
                instance.my_response?.estado_asistencia ?? "pendiente",
              comentario: instance.my_response?.comentario ?? "",
            };
          }
        });
      });

      return nextDrafts;
    });
  }, [events]);

  async function handleShareSurvey(
    eventTitle: string,
    instanceId: number,
    startAt: string,
    endAt: string,
    place: string | null,
  ) {
    try {
      const surveyUrl = buildSurveyUrl(instanceId);
      const message = [
        `Encuesta de asistencia: ${eventTitle}`,
        `Horario: ${formatDateTime(startAt)} - ${formatDateTime(endAt)}`,
        `Lugar: ${place || "Sin lugar definido"}`,
        "",
        `Responde aqui: ${surveyUrl}`,
      ].join("\n");

      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      const popup = window.open(whatsappUrl, "_blank", "noopener,noreferrer");

      if (!popup) {
        await navigator.clipboard.writeText(message);
        toast.success("Mensaje copiado. Pegalo en WhatsApp.");
        return;
      }

      toast.success("Abriendo WhatsApp para compartir.");
    } catch {
      toast.error("No se pudo compartir por WhatsApp.");
    }
  }

  return (
    <section className={active ? "card" : "hidden"}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-amber-500">
            Calendario del equipo
          </p>
          <h2 className="mt-1 text-2xl font-bold">Tus eventos y asistencia</h2>
        </div>
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          {events.length} eventos
        </p>
      </div>

      <div className="mt-5">
        <MonthCalendar
          events={events}
          emptyMessage="Todavía no hay eventos creados en este día."
          selectedDayPanel={({ selectedDayEvents }) => {
            if (selectedDayEvents.length === 0) {
              return (
                <div className="card p-4 text-sm text-slate-600 dark:text-slate-300">
                  Selecciona un día con eventos para responder asistencia.
                </div>
              );
            }

            return (
              <div className="card p-3 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Eventos del día
                </p>

                {selectedDayEvents.map(({ event, instance }) => {
                  return (
                    <button
                      key={instance.id}
                      type="button"
                      className="p-3 flex w-full items-center justify-between gap-3 overflow-hidden text-left"
                      onClick={() =>
                        setActivePreview({ event, instanceId: instance.id })
                      }
                    >
                      <div className="min-w-0">
                        <p className="max-w-full whitespace-normal break-all font-semibold text-slate-900 dark:text-white">
                          {event.titulo}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {instance.requiere_asistencia
                            ? `${instance.attending_players.length} asistencia(s) · `
                            : ""}
                          {instance.lugar || "Sin lugar"}
                        </p>
                      </div>
                      <span className="btn-primary">Ver</span>
                    </button>
                  );
                })}
              </div>
            );
          }}
        />
      </div>

      <CalendarEventModal
        open={Boolean(activePreview)}
        title={activePreview?.event.titulo ?? ""}
        subtitle={
          activePreview
            ? activePreview.event.descripcion || "Sin descripcion"
            : undefined
        }
        onClose={() => setActivePreview(null)}
      >
        {activePreview
          ? (() => {
              const instance = activePreview.event.instances.find(
                (item) => item.id === activePreview.instanceId,
              );

              if (!instance) {
                return null;
              }

              const draft = drafts[instance.id] ?? {
                estadoAsistencia:
                  instance.my_response?.estado_asistencia ?? "pendiente",
                comentario: instance.my_response?.comentario ?? "",
              };
              const canRespond =
                instance.requiere_asistencia &&
                instance.estado_instancia !== "cancelado";
              const saving = savingAttendanceInstanceId === instance.id;

              return (
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="card p-3 min-w-0">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                        Horario
                      </p>
                      <p className="mt-1 font-semibold text-slate-900 dark:text-white break-words whitespace-normal">
                        {formatDateTime(instance.fecha_hora_inicio)} -{" "}
                        {formatDateTime(instance.fecha_hora_fin)}
                      </p>
                    </div>
                    <div className="card p-3 min-w-0">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                        Lugar
                      </p>
                      <p className="mt-1 font-semibold text-slate-900 dark:text-white break-words whitespace-normal">
                        {instance.lugar || "Sin lugar definido"}
                      </p>
                    </div>
                  </div>

                  {instance.requiere_asistencia ? (
                    <div className="card p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                          Asistirán {instance.attending_players.length}
                        </p>
                        <button
                          type="button"
                          className="btn-muted px-3 py-1 text-xs"
                          onClick={() =>
                            void handleShareSurvey(
                              activePreview.event.titulo,
                              instance.id,
                              instance.fecha_hora_inicio,
                              instance.fecha_hora_fin,
                              instance.lugar,
                            )
                          }
                        >
                          Compartir por WhatsApp
                        </button>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {instance.attending_players.length > 0 ? (
                          instance.attending_players.map((player) => {
                            const label = player.jersey_number
                              ? `#${player.jersey_number} ${player.full_name}`
                              : player.full_name;

                            return (
                              <span
                                key={player.jugador_id}
                                className="badge-accent-soft"
                                title={label}
                                aria-label={label}
                              >
                                {label}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            Todavía no hay jugadores confirmados.
                          </span>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {instance.requiere_asistencia ? (
                    canRespond ? (
                      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950/40">
                        <select
                          className="input"
                          value={draft.estadoAsistencia}
                          onChange={(event) =>
                            setDrafts((current) => ({
                              ...current,
                              [instance.id]: {
                                ...draft,
                                estadoAsistencia: event.target
                                  .value as AttendanceStatus,
                              },
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
                                comentario: event.target.value,
                              },
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
                              comentario: draft.comentario.trim(),
                            })
                          }
                        >
                          {saving ? "Guardando..." : "Guardar respuesta"}
                        </button>
                      </div>
                    ) : (
                      <p className="rounded-xl border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
                        Esta instancia fue cancelada.
                      </p>
                    )
                  ) : null}
                </div>
              );
            })()
          : null}
      </CalendarEventModal>
    </section>
  );
}
