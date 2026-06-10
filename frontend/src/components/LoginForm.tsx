import { FormEvent, useState } from 'react';

interface LoginFormProps {
  onSubmit: (username: string, password: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function LoginForm({ onSubmit, loading, error }: LoginFormProps) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('shadows123@');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(username.trim(), password);
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl items-stretch gap-6 px-4 py-8 md:grid-cols-2 md:py-16">
      <section className="card relative overflow-hidden p-8">
        <div className="absolute -left-8 -top-8 h-36 w-36 rounded-full bg-sky-500/20 blur-2xl" />
        <div className="absolute -bottom-10 -right-8 h-40 w-40 rounded-full bg-amber-400/20 blur-2xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-500">Volitics Platform</p>
        <h1 className="mt-4 text-3xl font-extrabold leading-tight text-slate-900 dark:text-white">
          Estadisticas inteligentes para tu equipo de voleibol
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Administra partidos, evalua fundamentos y visualiza la evolucion del rendimiento con una interfaz
          moderna y simple.
        </p>
        <div className="mt-6 space-y-2 text-sm text-slate-700 dark:text-slate-200">
          <p>Demo admin: admin / shadows123@</p>
          <p>Los usuarios jugador ahora se crean desde el panel de administrador.</p>
        </div>
      </section>

      <section className="card p-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Iniciar sesion</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Accede como administrador o jugador.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium">Usuario</label>
            <input
              className="input"
              placeholder="admin"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Contrasena</label>
            <input
              className="input"
              type="password"
              placeholder="******"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          {error ? <p className="text-sm font-medium text-rose-500">{error}</p> : null}

          <button className="btn-primary w-full" disabled={loading} type="submit">
            {loading ? 'Ingresando...' : 'Entrar'}
          </button>
        </form>
      </section>
    </div>
  );
}
