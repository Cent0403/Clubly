import { FormEvent, useState } from "react";
import { TeamSettings } from "../types";
import DotLoader from "./loader/DotLoader";

interface LoginFormProps {
  onSubmit: (username: string, password: string) => Promise<void>;
  loading: boolean;
  teamSettings: TeamSettings;
}

export function LoginForm({ onSubmit, loading, teamSettings }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(username.trim(), password);
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-8 md:py-16">
      <div className="mb-6 text-center">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400 mt-4">
          CLUB DEPORTIVO DE VOLEIBOL
        </p>
        <div className="mx-auto mt-5 flex flex-col items-center justify-center rounded-2xl px-4 py-3">
          {teamSettings.teamLogoUrl ? (
            <img
              src={teamSettings.teamLogoUrl}
              alt="Logo del equipo"
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <span className="text-lg font-bold">C</span>
            </div>
          )}
          <div className="mt-3 text-center">
            <p className="text-md font-semibold text-slate-900 dark:text-white">
              {teamSettings.teamName}
            </p>
          </div>
        </div>
      </div>

      <section className="card p-8 text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Iniciar sesion
        </h2>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm text-left font-medium">
              Usuario
            </label>
            <input
              className="input"
              placeholder="Tu usuario"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-left font-medium">
              Contrasena
            </label>
            <input
              className="input"
              type="password"
              placeholder="******"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div className="text-center pt-6">
            <button
              className="btn-primary w-40 flex items-center justify-center gap-2"
              disabled={loading}
              type="submit"
            >
              {loading ? <DotLoader /> : "Entrar"}
            </button>
          </div>
        </form>
      </section>
      <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
          Clubly Voley
        </p>
      </div>
    </div>
  );
}
