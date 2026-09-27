'use client';

import { useTheme } from '@/app/_lib/ThemeContext';
import {
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

export default function ThemeToggle({
  compact = false,
  className = '',
  showLabel = true,
}) {
  const { theme, changeTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const options = [
    { value: 'light', icon: SunIcon, label: 'Light' },
    { value: 'dark', icon: MoonIcon, label: 'Dark' },
    { value: 'system', icon: ComputerDesktopIcon, label: 'System' },
  ];

  // Prevent hydration mismatch while mounting
  if (!mounted) {
    return (
      <div
        className={`flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80 ${className}`}
      >
        <div className="h-7 w-20 bg-slate-200/60 dark:bg-slate-700/60 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {showLabel && !compact && (
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 px-1">
          Theme
        </span>
      )}

      <div
        role="group"
        aria-label="Theme selection"
        className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-inner"
      >
        {options.map(({ value, icon: Icon, label }) => {
          const isActive = theme === value;

          return (
            <button
              key={value}
              type="button"
              onClick={() => changeTheme(value)}
              title={`Switch to ${label} theme`}
              aria-pressed={isActive}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer active:scale-95 ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-blue-950 dark:text-blue-400 shadow-sm ring-1 ring-slate-900/5 dark:ring-white/10 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!compact && <span className="truncate">{label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
