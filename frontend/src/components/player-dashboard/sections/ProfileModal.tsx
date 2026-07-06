import { FormEvent } from 'react';
import { ProfileFormState } from '../types';

interface ProfileModalProps {
  open: boolean;
  profileForm: ProfileFormState;
  savingProfile: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onProfileFormChange: (updater: (current: ProfileFormState) => ProfileFormState) => void;
}

export function ProfileModal({
  open,
  profileForm,
  savingProfile,
  onClose,
  onSubmit,
  onProfileFormChange
}: ProfileModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
      <div className="card w-full max-w-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-sky-500">Editar perfil</p>
            <h3 className="mt-1 text-xl font-bold">Actualiza tu nombre y contrasena</h3>
          </div>
          <button className="btn-muted" type="button" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
          <div>
            <label className="mb-1 block text-xs font-medium">Nombre completo</label>
            <input
              className="input"
              value={profileForm.fullName}
              onChange={(event) => onProfileFormChange((current) => ({ ...current, fullName: event.target.value }))}
              placeholder="Tu nombre completo"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Nueva contrasena</label>
            <input
              className="input"
              type="password"
              value={profileForm.password}
              onChange={(event) => onProfileFormChange((current) => ({ ...current, password: event.target.value }))}
              placeholder="Dejar vacio para no cambiar"
            />
          </div>

          <div className="md:col-span-2 flex flex-wrap gap-2">
            <button className="btn-primary" type="submit" disabled={savingProfile}>
              {savingProfile ? 'Guardando perfil...' : 'Guardar cambios'}
            </button>
            <button className="btn-muted" type="button" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
