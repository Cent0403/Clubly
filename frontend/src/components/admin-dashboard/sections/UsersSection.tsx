import { FormEvent } from "react";
import {
  AdminUserItem,
  PlayerHistoryItem,
  PlayerItem,
  PlayerSummary,
  Role,
} from "../../../types";
import { MetricBars } from "../../charts/MetricBars";
import { USER_POSITIONS } from "../constants";
import { EditUserFormState, UserFormState } from "../types";
import { formatPosition, formatPositionOption, formatRole } from "../utils";
import { MedalsPanel } from "../../medals/MedalsPanel";

interface UsersSectionProps {
  active: boolean;
  userForm: UserFormState;
  creatingUser: boolean;
  onUserFormChange: (
    updater: (current: UserFormState) => UserFormState,
  ) => void;
  onCreateUser: (event: FormEvent<HTMLFormElement>) => void;
  selectedPlayerStatId: number | null;
  players: PlayerItem[];
  selectedPlayerSummary: PlayerSummary | null;
  selectedPlayerHistory: PlayerHistoryItem[];
  onSelectedPlayerStatChange: (playerId: number) => void;
  onLoadPlayerStats: () => void;
  editingUserId: number | null;
  editingUserForm: EditUserFormState;
  savingUserEdit: boolean;
  users: AdminUserItem[];
  filteredUsers: AdminUserItem[];
  userSearchTerm: string;
  userRoleFilter: "ALL" | Role;
  deletingUserId: number | null;
  onEditingUserFormChange: (
    updater: (current: EditUserFormState) => EditUserFormState,
  ) => void;
  onUpdateUser: (event: FormEvent<HTMLFormElement>) => void;
  onCancelEditUser: () => void;
  onUserSearchTermChange: (value: string) => void;
  onUserRoleFilterChange: (value: "ALL" | Role) => void;
  onLoadUserIntoEditForm: (user: AdminUserItem) => void;
  onDeleteUser: (user: AdminUserItem) => void;
}

export function UsersSection({
  active,
  userForm,
  creatingUser,
  onUserFormChange,
  onCreateUser,
  selectedPlayerStatId,
  players,
  selectedPlayerSummary,
  selectedPlayerHistory,
  onSelectedPlayerStatChange,
  onLoadPlayerStats,
  editingUserId,
  editingUserForm,
  savingUserEdit,
  users,
  filteredUsers,
  userSearchTerm,
  userRoleFilter,
  deletingUserId,
  onEditingUserFormChange,
  onUpdateUser,
  onCancelEditUser,
  onUserSearchTermChange,
  onUserRoleFilterChange,
  onLoadUserIntoEditForm,
  onDeleteUser,
}: UsersSectionProps) {
  return (
    <>
      <section className={active ? "grid gap-6 xl:grid-cols-5" : "hidden"}>
        <article className="card xl:col-span-2">
          <h3 className="text-xl font-bold">Crear usuario</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Crear cuentas y asignar rol de Admin o Jugador.
          </p>
          <form className="mt-4 space-y-3" onSubmit={onCreateUser}>
            <input
              className="input"
              placeholder="Username"
              value={userForm.username}
              onChange={(event) =>
                onUserFormChange((s) => ({
                  ...s,
                  username: event.target.value,
                }))
              }
              required
            />
            <input
              className="input"
              type="password"
              placeholder="Password"
              value={userForm.password}
              onChange={(event) =>
                onUserFormChange((s) => ({
                  ...s,
                  password: event.target.value,
                }))
              }
              required
            />
            <input
              className="input"
              placeholder="Nombre completo"
              value={userForm.fullName}
              onChange={(event) =>
                onUserFormChange((s) => ({
                  ...s,
                  fullName: event.target.value,
                }))
              }
              required
            />
            <select
              className="input"
              value={userForm.role}
              onChange={(event) =>
                onUserFormChange((s) => ({
                  ...s,
                  role: event.target.value as Role,
                }))
              }
            >
              <option value="PLAYER">Jugador</option>
              <option value="ADMIN">Administrador</option>
            </select>

            {userForm.role === "PLAYER" ? (
              <>
                <input
                  className="input"
                  type="number"
                  min={1}
                  placeholder="Numero de camiseta (opcional)"
                  value={userForm.jerseyNumber}
                  onChange={(event) =>
                    onUserFormChange((s) => ({
                      ...s,
                      jerseyNumber: event.target.value,
                    }))
                  }
                />
                <select
                  className="input"
                  value={userForm.position}
                  onChange={(event) =>
                    onUserFormChange((s) => ({
                      ...s,
                      position: event.target.value as UserFormState["position"],
                    }))
                  }
                >
                  {USER_POSITIONS.map((position) => (
                    <option key={position || "NONE"} value={position}>
                      {formatPositionOption(position)}
                    </option>
                  ))}
                </select>
              </>
            ) : null}

            <button
              className="btn-primary w-full"
              type="submit"
              disabled={creatingUser}
            >
              {creatingUser ? "Creando usuario..." : "Crear usuario"}
            </button>
          </form>
        </article>

        <article className="card xl:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-bold">
              Estadisticas jugador por jugador
            </h3>
            <div className="flex gap-2">
              <select
                className="input w-full md:w-72"
                value={selectedPlayerStatId ?? ""}
                onChange={(event) =>
                  onSelectedPlayerStatChange(Number(event.target.value))
                }
              >
                <option value="" disabled>
                  Selecciona un jugador
                </option>
                {players.map((player) => (
                  <option key={player.player_id} value={player.player_id}>
                    {player.full_name}
                  </option>
                ))}
              </select>
              <button className="btn-muted" onClick={onLoadPlayerStats}>
                Ver stats
              </button>
            </div>
          </div>

          {selectedPlayerSummary ? (
            <>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="card p-4">
                  <p className="text-sm font-semibold">
                    {selectedPlayerSummary.full_name}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Eficiencia global:{" "}
                    {selectedPlayerSummary.overall_score.toFixed(2)}%
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Partidos calificados: {selectedPlayerSummary.matches_rated}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Puntos de ataque por set:{" "}
                    {selectedPlayerSummary.avg_attack_points_per_set.toFixed(2)}
                  </p>
                </div>

                <div>
                  <MetricBars
                    maxValue={100}
                    formatter={(value) => `${value.toFixed(1)}%`}
                    metrics={[
                      {
                        label: "Recepcion",
                        value: selectedPlayerSummary.avg_reception,
                      },
                      {
                        label: "Saque",
                        value: selectedPlayerSummary.avg_serve,
                      },
                      {
                        label: "Defensa",
                        value: selectedPlayerSummary.avg_defense,
                      },
                      {
                        label: "Ataque",
                        value: selectedPlayerSummary.avg_attack,
                      },
                      {
                        label: "Bloqueo",
                        value: selectedPlayerSummary.avg_block,
                      },
                      {
                        label: "Armado",
                        value: selectedPlayerSummary.avg_setting,
                      },
                    ]}
                  />
                </div>
              </div>

              <div className="mt-4">
                <MedalsPanel history={selectedPlayerHistory} />
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              Selecciona un jugador y presiona &quot;Ver stats&quot;.
            </p>
          )}

          {selectedPlayerHistory.length > 0 ? (
            <div className="mt-4 max-h-56 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-white/90 dark:bg-slate-900/90">
                  <tr className="text-slate-600 dark:text-slate-300">
                    <th className="px-2 py-2">Fecha</th>
                    <th className="px-2 py-2">Rival</th>
                    <th className="px-2 py-2">Torneo</th>
                    <th className="px-2 py-2">Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPlayerHistory.map((item) => (
                    <tr
                      key={item.match_id}
                      className="border-t border-slate-200 dark:border-slate-800"
                    >
                      <td className="px-2 py-2">{item.match_date}</td>
                      <td className="px-2 py-2">{item.opponent}</td>
                      <td className="px-2 py-2">{item.tournament}</td>
                      <td className="px-2 py-2 font-semibold text-sky-500">
                        {item.match_performance.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </article>
      </section>

      <section className={active ? "grid gap-6 xl:grid-cols-5" : "hidden"}>
        <article className="card xl:col-span-2">
          <h3 className="text-xl font-bold">Editar usuario/jugador</h3>

          {editingUserId ? (
            <form className="mt-3 space-y-3" onSubmit={onUpdateUser}>
              <input
                className="input"
                placeholder="Username"
                value={editingUserForm.username}
                onChange={(event) =>
                  onEditingUserFormChange((current) => ({
                    ...current,
                    username: event.target.value,
                  }))
                }
                required
              />
              <input
                className="input"
                placeholder="Nombre completo"
                value={editingUserForm.fullName}
                onChange={(event) =>
                  onEditingUserFormChange((current) => ({
                    ...current,
                    fullName: event.target.value,
                  }))
                }
                required
              />
              <input
                className="input"
                type="password"
                placeholder="Nueva password (opcional)"
                value={editingUserForm.password}
                onChange={(event) =>
                  onEditingUserFormChange((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
              />
              <select
                className="input"
                value={editingUserForm.role}
                onChange={(event) =>
                  onEditingUserFormChange((current) => ({
                    ...current,
                    role: event.target.value as Role,
                  }))
                }
              >
                <option value="PLAYER">Jugador</option>
                <option value="ADMIN">Admin</option>
              </select>

              {editingUserForm.role === "PLAYER" ? (
                <>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    placeholder="Numero de camiseta"
                    value={editingUserForm.jerseyNumber}
                    onChange={(event) =>
                      onEditingUserFormChange((current) => ({
                        ...current,
                        jerseyNumber: event.target.value,
                      }))
                    }
                  />
                  <select
                    className="input"
                    value={editingUserForm.position}
                    onChange={(event) =>
                      onEditingUserFormChange((current) => ({
                        ...current,
                        position: event.target
                          .value as EditUserFormState["position"],
                      }))
                    }
                  >
                    {USER_POSITIONS.map((position) => (
                      <option key={position || "NONE"} value={position}>
                        {formatPositionOption(position)}
                      </option>
                    ))}
                  </select>
                </>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <button
                  className="btn-primary"
                  type="submit"
                  disabled={savingUserEdit}
                >
                  {savingUserEdit ? "Actualizando..." : "Actualizar usuario"}
                </button>
                <button
                  className="btn-muted"
                  type="button"
                  onClick={onCancelEditUser}
                >
                  Cancelar edicion
                </button>
              </div>
            </form>
          ) : (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Selecciona un usuario en la lista para editar toda su informacion.
            </p>
          )}
        </article>

        <article className="card xl:col-span-3">
          <h3 className="text-xl font-bold">Usuarios registrados</h3>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            <input
              className="input md:col-span-2"
              placeholder="Buscar por nombre, username o posicion"
              value={userSearchTerm}
              onChange={(event) => onUserSearchTermChange(event.target.value)}
            />
            <select
              className="input"
              value={userRoleFilter}
              onChange={(event) =>
                onUserRoleFilterChange(event.target.value as "ALL" | Role)
              }
            >
              <option value="ALL">Todos los roles</option>
              <option value="PLAYER">Solo jugadores</option>
              <option value="ADMIN">Solo Admin</option>
            </select>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Mostrando {filteredUsers.length} de {users.length} usuarios
          </p>
          <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
            {filteredUsers.map((user) => (
              <div key={user.id} className="card p-3 text-sm">
                <p className="font-semibold">{user.full_name}</p>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  @{user.username} | {formatRole(user.role)}
                  {user.role === "PLAYER"
                    ? ` | #${user.jersey_number ?? "-"} | ${formatPosition(user.position)}`
                    : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    className="btn-muted"
                    type="button"
                    onClick={() => onLoadUserIntoEditForm(user)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn-muted"
                    type="button"
                    onClick={() => onDeleteUser(user)}
                    disabled={deletingUserId === user.id}
                  >
                    {deletingUserId === user.id ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </div>
            ))}
            {filteredUsers.length === 0 ? (
              <p className="card p-3 text-sm text-slate-600 dark:text-slate-300">
                No hay usuarios que coincidan con los filtros actuales.
              </p>
            ) : null}
          </div>
        </article>
      </section>
    </>
  );
}
