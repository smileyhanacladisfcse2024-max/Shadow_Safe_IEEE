import React from 'react';
import { useLocation } from 'react-router-dom';

export const UNIFY_THEMES = false;

export type Theme = 'A' | 'B';

export const ROUTE_THEME: Record<string, Theme> = {
  '/journey': 'A',
  '/factors': 'A',
  '/reroute': 'A',
  '/privacy': 'A',
  '/guardians': 'B',
  '/havens': 'B',
};

export function getThemeForPath(pathname: string): Theme {
  if (UNIFY_THEMES) return 'A';
  for (const [path, theme] of Object.entries(ROUTE_THEME)) {
    if (pathname === path || pathname.startsWith(path + '/')) {
      return theme;
    }
  }
  return 'A'; // fallback for /share, 404, etc.
}

interface ThemeScopeProps {
  children: React.ReactNode;
}

export function ThemeScope({ children }: ThemeScopeProps) {
  const location = useLocation();
  const theme = getThemeForPath(location.pathname);

  return (
    <div data-theme={theme} className="w-full min-h-screen bg-surface text-on-surface flex flex-col">
      {children}
    </div>
  );
}
