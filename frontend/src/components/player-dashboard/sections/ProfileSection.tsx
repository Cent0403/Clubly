import { ProfileSectionProps } from '../types';
import { formatPosition, formatRole } from '../utils';

export function ProfileSection({ active, summary, profile, onOpenProfileModal }: ProfileSectionProps) {
  if (!active) return null;
  return (
    <section className={active ? 'grid gap-6 xl:grid-cols-5' : 'hidden'}>
      <article className="card xl:col-span-5">
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
                <p className="pb-5">
                  <span className="font-semibold">Posicion:</span> {formatPosition(profile?.position)}
                </p>
                <button onClick={onOpenProfileModal} className="btn-primary ">
                  Editar Perfil
                </button>
              </div>
            </article>
      
    </section>
  );
}

