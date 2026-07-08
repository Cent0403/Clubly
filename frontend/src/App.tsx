import { useEffect, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { api } from './lib/api';
import { getToastOptions } from './lib/toast';
import { useDarkMode } from './hooks/useDarkMode';
import { LoginForm } from './components/LoginForm';
import AdminDashboard from './components/AdminDashboard';
import { AuthUser, TeamSettings } from './types';
import { PlayerDashboard } from './components/PlayerDashboard';
import { SunIcon } from './components/icons/SunIcon';
import { MoonIcon } from './components/icons/MoonIcon';

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

  const shouldCenter = !user || !token;

  return (
    <main 
      className={`mx-auto min-h-screen max-w-screen-2xl p-4 md:p-6 flex flex-col ${
        shouldCenter ? 'justify-center items-center' : ''
      }`}
    >
      <Toaster
        position={isMobileViewport ? 'top-center' : 'top-right'}
        gutter={10}
        containerStyle={{ top: 14, right: 14, left: 14 }}
        toastOptions={getToastOptions(darkMode)}
      />
      
      {loadingSession ? (
        <div className="p-2 text-sm text-slate-600 dark:text-slate-300">Validando sesion...</div>
      ) : (
        <div className="w-full"> {/* Asegura que ocupe el ancho correcto */}
          {!user || !token ? (
            <LoginForm onSubmit={handleLogin} loading={loggingIn} teamSettings={teamSettings} />
          ) : user.role === 'ADMIN' ? (
            <AdminDashboard token={token} teamSettings={teamSettings} onTeamSettingsUpdated={setTeamSettings} onLogout={handleLogout} />
          ) : (
            <PlayerDashboard token={token} onLogout={handleLogout} />
          )}

          <button
            type="button"
            className="fixed bottom-6 right-6 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-xl transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200"
            onClick={toggleDarkMode}
            aria-label={darkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
          >
            {darkMode ? <SunIcon className="h-7 w-7" /> : <MoonIcon className="h-7 w-7" />}
          </button>
        </div>
      )}
    </main>
  );
}

export default App;
