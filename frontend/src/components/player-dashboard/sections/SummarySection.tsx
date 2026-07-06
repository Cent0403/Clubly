import { SummarySectionProps } from '../types';
import { formatPosition, formatRole } from '../utils';

export function SummarySection({ active, profile, summary, onOpenProfileModal }: SummarySectionProps) {
  return (
    <section className={active ? 'grid gap-6 xl:grid-cols-5' : 'hidden'}>
      <article className="card xl:col-span-3">
        <p className="text-xs uppercase tracking-[0.18em] text-sky-500">Perfil del jugador</p>
        <h2 className="mt-2 text-2xl font-bold">{profile?.full_name ?? summary?.full_name}</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Edita tu nombre y contrasena desde el modal.</p>

        <div className="mt-4">
          <button className="btn-primary" type="button" onClick={onOpenProfileModal}>
            Editar perfil
          </button>
        </div>
      </article>

      <article className="card xl:col-span-2">
        <p className="text-xs uppercase tracking-[0.18em] text-sky-500">Informacion de cuenta</p>
        <div className="mt-4 space-y-2 text-sm">
          <p>
            <span className="font-semibold">Usuario:</span> {profile?.username ?? summary?.username}
          </p>
          <p>
            <span className="font-semibold">Rol:</span> {formatRole('PLAYER')}
          </p>
          <p>
            <span className="font-semibold">Numero de camiseta:</span>{' '}
            {profile?.jersey_number !== null && profile?.jersey_number !== undefined ? profile.jersey_number : 'No asignado'}
          </p>
          <p>
            <span className="font-semibold">Posicion:</span> {formatPosition(profile?.position)}
          </p>
          <p>
            <span className="font-semibold">Nota global actual:</span>{' '}
            {profile?.overall_score !== undefined ? profile.overall_score.toFixed(2) : (summary?.overall_score ?? 0).toFixed(2)}
          </p>
        </div>
      </article>
    </section>
  );
}
