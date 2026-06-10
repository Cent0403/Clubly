import { FormEvent, useState } from 'react';

interface LoginFormProps {
  onSubmit: (username: string, password: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function LoginForm({ onSubmit, loading, error }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(username.trim(), password);
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8 md:py-16">
      <section className="card p-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Iniciar sesion</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Accede como administrador o jugador.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium">Usuario</label>
            <input
              className="input"
              placeholder="Tu usuario"
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
