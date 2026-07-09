import { MatchItem, PlayerItem, RatingItem } from '../../../types';
import { EVENT_FIELDS, FUNDAMENT_GROUPS } from '../constants';
import { MatchFormState } from '../types';
import { createDefaultRating } from '../constants';

interface MatchesSectionProps {
  active: boolean;
  editingMatchId: number | null;
  matchForm: MatchFormState;
  selectedMatchId: number | null;
  selectedMatch: MatchItem | null;
  matches: MatchItem[];
  players: PlayerItem[];
  filteredEvaluationPlayers: PlayerItem[];
  evaluationPlayerSearchTerm: string;
  selectedPlayers: number[];
  ratings: Record<number, RatingItem>;
  loadingMatchRatings: boolean;
  saving: boolean;
  onMatchFormChange: (updater: (current: MatchFormState) => MatchFormState) => void;
  onCreateMatch: (event: React.FormEvent<HTMLFormElement>) => void;
  onUpdateMatch: () => void;
  onClearMatchForm: () => void;
  onSelectedMatchChange: (matchId: number) => void;
  onEvaluationPlayerSearchTermChange: (value: string) => void;
  onTogglePlayer: (playerId: number) => void;
  onUpdateMinutesPlayed: (playerId: number, value: boolean) => void;
  onUpdateEventCount: (playerId: number, field: keyof Omit<RatingItem, 'playerId' | 'minutesPlayed'>, value: number) => void;
  onSaveEvaluation: () => void;
  onLoadMatchForEdit: () => void;
  onDeleteMatch: () => void;
  onClearSelection: () => void;
}

export function MatchesSection({
  active,
  editingMatchId,
  matchForm,
  selectedMatchId,
  selectedMatch,
  matches,
  players,
  filteredEvaluationPlayers,
  evaluationPlayerSearchTerm,
  selectedPlayers,
  ratings,
  loadingMatchRatings,
  saving,
  onMatchFormChange,
  onCreateMatch,
  onUpdateMatch,
  onClearMatchForm,
  onSelectedMatchChange,
  onEvaluationPlayerSearchTermChange,
  onTogglePlayer,
  onUpdateMinutesPlayed,
  onUpdateEventCount,
  onSaveEvaluation,
  onLoadMatchForEdit,
  onDeleteMatch,
  onClearSelection
}: MatchesSectionProps) {
  return (
    <section className={active ? 'grid gap-6 xl:grid-cols-5' : 'hidden'}>
      <article className="card xl:col-span-2">
        <h3 className="text-xl font-bold">Crear partido</h3>
        {editingMatchId ? (
          <p className="mt-1 text-sm text-amber-500">Modo edicion activo para partido #{editingMatchId}</p>
        ) : null}
        <form className="mt-4 space-y-3" onSubmit={onCreateMatch}>
          <input
            className="input"
            type="date"
            value={matchForm.matchDate}
            onChange={(event) => onMatchFormChange((s) => ({ ...s, matchDate: event.target.value }))}
            required
          />
          <input
            className="input"
            placeholder="Rival"
            value={matchForm.opponent}
            onChange={(event) => onMatchFormChange((s) => ({ ...s, opponent: event.target.value }))}
            required
          />
          <input
            className="input"
            placeholder="Torneo"
            value={matchForm.tournament}
            onChange={(event) => onMatchFormChange((s) => ({ ...s, tournament: event.target.value }))}
            required
          />
          <input
            className="input"
            placeholder="Ubicacion"
            value={matchForm.location}
            onChange={(event) => onMatchFormChange((s) => ({ ...s, location: event.target.value }))}
          />
          <textarea
            className="input min-h-24"
            placeholder="Notas"
            value={matchForm.notes}
            onChange={(event) => onMatchFormChange((s) => ({ ...s, notes: event.target.value }))}
          />
          <button className="btn-primary w-full" type="submit">
            Guardar partido
          </button>
          <button className="btn-muted w-full" type="button" onClick={onUpdateMatch}>
            Actualizar partido en edicion
          </button>
          <button className="btn-muted w-full" type="button" onClick={onClearMatchForm}>
            Limpiar formulario
          </button>
        </form>
      </article>

      <article className="card xl:col-span-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-bold">Evaluacion por eventos</h3>
          <select
            className="input w-full md:w-72"
            value={selectedMatchId ?? ''}
            onChange={(event) => onSelectedMatchChange(Number(event.target.value))}
          >
            <option value="" disabled>
              Selecciona un partido
            </option>
            {matches.map((match) => (
              <option key={match.id} value={match.id}>
                {match.match_date} | {match.opponent} | {match.tournament}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            className="input w-full md:w-80"
            placeholder="Buscar jugador por nombre, usuario, posicion o camiseta"
            value={evaluationPlayerSearchTerm}
            onChange={(event) => onEvaluationPlayerSearchTermChange(event.target.value)}
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Mostrando {filteredEvaluationPlayers.length} de {players.length} jugadores
          </p>
        </div>

        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {selectedMatch
            ? `Partido del ${selectedMatch.match_date} contra ${selectedMatch.opponent}`
            : 'Selecciona un partido para iniciar evaluacion.'}
        </p>

        {loadingMatchRatings ? (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Cargando estadisticas del partido...</p>
        ) : null}

        <div className="mt-4 grid max-h-[34rem] gap-4 overflow-y-auto pr-1">
          {filteredEvaluationPlayers.map((player) => {
            const activePlayer = selectedPlayers.includes(player.player_id);
            const playerRating = ratings[player.player_id] ?? createDefaultRating(player.player_id);

            return (
              <div key={player.player_id} className="card p-3">
                <label className="flex items-center justify-between gap-3">
                  <span className="font-semibold">{player.full_name}</span>
                  <input
                    type="checkbox"
                    checked={activePlayer}
                    onChange={() => onTogglePlayer(player.player_id)}
                    className="h-4 w-4"
                  />
                </label>

                {activePlayer ? (
                  <>
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <input
                        id={`minutes-${player.player_id}`}
                        type="checkbox"
                        className="h-4 w-4"
                        checked={playerRating.minutesPlayed}
                        onChange={(event) => onUpdateMinutesPlayed(player.player_id, event.target.checked)}
                      />
                      <label htmlFor={`minutes-${player.player_id}`}>
                        Tuvo minutos en cancha (aplica base de juego 5.0)
                      </label>
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {FUNDAMENT_GROUPS.map((group) => (
                        <section key={group.title} className="card p-3">
                          <div className="mb-3">
                            <p className="text-sm font-semibold">{group.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{group.description}</p>
                          </div>

                          <div className="space-y-2">
                            {group.fields.map((fieldKey) => {
                              const field = EVENT_FIELDS.find((item) => item.key === fieldKey)!;

                              return (
                                <div key={field.key}>
                                  <label className="mb-1 block text-xs font-medium">{field.label}</label>
                                  <input
                                    className="input"
                                    type="number"
                                    step="1"
                                    min={0}
                                    value={playerRating[field.key]}
                                    onChange={(event) =>
                                      onUpdateEventCount(player.player_id, field.key, Number(event.target.value))
                                    }
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </section>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Selecciona este jugador para evaluarlo.</p>
                )}
              </div>
            );
          })}
          {filteredEvaluationPlayers.length === 0 ? (
            <p className="card p-4 text-sm text-slate-600 dark:text-slate-300">
              No hay jugadores que coincidan con la busqueda.
            </p>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button className="btn-primary" onClick={onSaveEvaluation} disabled={saving}>
            {saving ? 'Guardando stats...' : 'Guardar/actualizar stats'}
          </button>
          <button className="btn-muted" onClick={onLoadMatchForEdit}>
            Cargar partido al formulario
          </button>
          <button className="btn-muted" onClick={onDeleteMatch}>
            Eliminar partido seleccionado
          </button>
          <button className="btn-muted" onClick={onClearSelection}>
            Limpiar seleccion
          </button>
        </div>
      </article>
    </section>
  );
}
