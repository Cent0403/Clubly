import { FormEvent } from 'react';
import { TeamSettings } from '../../../types';

interface TeamSettingsSectionProps {
  active: boolean;
  settingsForm: TeamSettings;
  savingSettings: boolean;
  onSettingsFormChange: (updater: (current: TeamSettings) => TeamSettings) => void;
  onSaveTeamSettings: (event: FormEvent<HTMLFormElement>) => void;
  onTeamLogoFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function TeamSettingsSection({
  active,
  settingsForm,
  savingSettings,
  onSettingsFormChange,
  onSaveTeamSettings,
  onTeamLogoFileChange
}: TeamSettingsSectionProps) {
  return (
    <section className={active ? 'grid gap-6 xl:grid-cols-5' : 'hidden'}>
      <article className="card xl:col-span-2">
        <h3 className="text-xl font-bold">Detalles del equipo</h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Personaliza el nombre y el logo visibles en toda la plataforma.
        </p>

        <form className="mt-4 space-y-3" onSubmit={onSaveTeamSettings}>
          <div>
            <label className="mb-1 block text-xs font-medium">Nombre del equipo</label>
            <input
              className="input"
              value={settingsForm.teamName}
              onChange={(event) => onSettingsFormChange((current) => ({ ...current, teamName: event.target.value }))}
              placeholder="Nombre del equipo"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium">Logo del equipo</label>
            <input className="input" type="file" accept="image/*" onChange={onTeamLogoFileChange} />
          </div>

          {settingsForm.teamLogoUrl ? (
            <div className="space-y-2">
              <img
                src={settingsForm.teamLogoUrl}
                alt="Vista previa del logo"
                className="h-20 w-20 rounded-full object-cover"
              />
              <button
                className="btn-muted"
                type="button"
                onClick={() => onSettingsFormChange((current) => ({ ...current, teamLogoUrl: null }))}
              >
                Quitar logo
              </button>
            </div>
          ) : null}

          <button className="btn-primary w-full" type="submit" disabled={savingSettings}>
            {savingSettings ? 'Guardando personalizacion...' : 'Guardar personalizacion'}
          </button>
        </form>
      </article>

      <article className="card xl:col-span-3">
        <h3 className="text-xl font-bold">Vista previa</h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Asi se mostrara el encabezado de la plataforma para todos los usuarios.
        </p>

        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-700 dark:bg-[#171821]">
          {settingsForm.teamLogoUrl ? (
            <img
              src={settingsForm.teamLogoUrl}
              alt="Logo del equipo"
              className="h-14 w-14 rounded-full object-cover"
            />
          ) : null}
          <div>
            <p className="text-xl font-bold">{settingsForm.teamName || 'Clubly'}</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">Club Deportivo de Voleibol</p>
          </div>
        </div>
      </article>
    </section>
  );
}
