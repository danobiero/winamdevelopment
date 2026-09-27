'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({
  theme: 'system',
  resolvedTheme: 'light',
  changeTheme: () => {},
});

export function ThemeProvider({ initialTheme = 'system', children }) {
  const [theme, setTheme] = useState(initialTheme);
  const [resolvedTheme, setResolvedTheme] = useState(() => {
    if (initialTheme === 'dark') return 'dark';
    if (initialTheme === 'light') return 'light';
    return 'light'; // Default before hydration
  });

  // Read stored preference on client mount if initialTheme was default
  useEffect(() => {
    try {
      const stored = localStorage.getItem('winam_theme');
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        setTheme(stored);
      }
    } catch {
      // Ignore localStorage read errors
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      let isDark = false;
      if (theme === 'dark') {
        isDark = true;
      } else if (theme === 'light') {
        isDark = false;
      } else {
        // System preference
        isDark = mediaQuery.matches;
      }

      setResolvedTheme(isDark ? 'dark' : 'light');

      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();

    // Listen for OS theme changes when in 'system' mode
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const changeTheme = (newTheme) => {
    if (!['light', 'dark', 'system'].includes(newTheme)) return;
    setTheme(newTheme);

    try {
      localStorage.setItem('winam_theme', newTheme);
    } catch {
      // Ignore localStorage write errors
    }

    // Persist via cookie for SSR support
    document.cookie = `theme=${newTheme}; path=/; max-age=31536000; SameSite=Lax`;
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
