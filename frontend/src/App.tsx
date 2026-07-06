import { useEffect, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { api } from './lib/api';
import { getToastOptions } from './lib/toast';
import { useDarkMode } from './hooks/useDarkMode';
import { LoginForm } from './components/LoginForm';
import AdminDashboard from './components/AdminDashboard';
import { AuthUser, TeamSettings } from './types';
import { PlayerDashboard } from './components/PlayerDashboard';

function formatRole(role: AuthUser['role']) {
  return role === 'ADMIN' ? 'Admin' : 'Jugador';
}

function App() {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('clubly_token'));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(() => window.matchMedia('(max-width: 767px)').matches);
  const [teamSettings, setTeamSettings] = useState<TeamSettings>({
    teamName: 'Clubly',
    teamLogoUrl: null
  });

  useEffect(() => {
    async function loadTeamSettings() {
      try {
        const response = await api.getTeamSettings();
        setTeamSettings(response.settings);
      } catch {
        setTeamSettings({ teamName: 'Clubly', teamLogoUrl: null });
      }
    }

    void loadTeamSettings();
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const onMediaQueryChange = (event: MediaQueryListEvent) => {
      setIsMobileViewport(event.matches);
    };

    mediaQuery.addEventListener('change', onMediaQueryChange);
    setIsMobileViewport(mediaQuery.matches);

    return () => {
      mediaQuery.removeEventListener('change', onMediaQueryChange);
    };
  }, []);

  useEffect(() => {
    async function recoverSession() {
      if (!token) {
        setLoadingSession(false);
        return;
      }

      try {
        const response = await api.me(token);
        setUser(response.user);
      } catch {
        localStorage.removeItem('clubly_token');
        setToken(null);
      } finally {
        setLoadingSession(false);
      }
    }

    void recoverSession();
  }, [token]);

  async function handleLogin(username: string, password: string) {
    setLoggingIn(true);

    try {
      const response = await api.login(username, password);
      localStorage.setItem('clubly_token', response.token);
      setToken(response.token);
      setUser(response.user);
    } catch (loginError) {
      toast.error((loginError as Error).message);
    } finally {
      setLoggingIn(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('clubly_token');
    setUser(null);
    setToken(null);
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl p-4 md:p-6">
      <Toaster
        position={isMobileViewport ? 'top-center' : 'top-right'}
        gutter={10}
        containerStyle={{ top: 14, right: 14, left: 14 }}
        toastOptions={getToastOptions(darkMode)}
      />
      {loadingSession ? <div className="p-2 text-sm text-slate-600 dark:text-slate-300">Validando sesion...</div> : null}
      {loadingSession ? null : (
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex items-center gap-3">
          {teamSettings.teamLogoUrl ? (
            <img
              src={teamSettings.teamLogoUrl}
              alt="Logo del equipo"
              className="h-12 w-12 object-cover"
            />
          ) : null}

          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{teamSettings.teamName}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">Club Deportivo de Voleibol</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn-muted" onClick={toggleDarkMode}>
            {darkMode ? 'Modo claro' : 'Modo oscuro'}
          </button>

          {user ? (
            <>
              <span className="rounded-xl bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800">
                {user.fullName} ({formatRole(user.role)})
              </span>
              <button className="btn-primary" onClick={handleLogout}>
                Salir
              </button>
            </>
          ) : null}
        </div>
      </header>
      )}

      {loadingSession ? null : !user || !token ? (
        <LoginForm onSubmit={handleLogin} loading={loggingIn} />
      ) : user.role === 'ADMIN' ? (
        <AdminDashboard token={token} teamSettings={teamSettings} onTeamSettingsUpdated={setTeamSettings} />
      ) : (
        <PlayerDashboard token={token} />
      )}
    </main>
  );
}

export default App;
