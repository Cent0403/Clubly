import { useEffect, useState } from 'react';

export function useDarkMode() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const stored = localStorage.getItem('clubly_dark_mode');
    return stored ? stored === 'true' : true;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('clubly_dark_mode', String(darkMode));
  }, [darkMode]);

  return {
    darkMode,
    toggleDarkMode: () => setDarkMode((previous) => !previous)
  };
}
