'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  type ThemeColors, DEFAULT_COLORS,
  type HeaderSettings, DEFAULT_HEADER,
  type FooterSettings, DEFAULT_FOOTER,
} from './firestore/site-settings';
import { api } from './api';

interface SiteThemeContextValue {
  colors: ThemeColors;
  header: HeaderSettings;
  footer: FooterSettings;
  refresh: () => Promise<void>;
}

const SiteThemeContext = createContext<SiteThemeContextValue>({
  colors: DEFAULT_COLORS,
  header: DEFAULT_HEADER,
  footer: DEFAULT_FOOTER,
  refresh: async () => {},
});

function applyColors(c: ThemeColors) {
  const root = document.documentElement;
  root.style.setProperty('--color-sv-primary', c.sv_primary);
  root.style.setProperty('--color-sv-primary-dark', c.sv_primary_dark);
  root.style.setProperty('--color-sv-primary-light', c.sv_primary_light);
  root.style.setProperty('--color-sv-orange', c.sv_orange);
  root.style.setProperty('--color-sv-orange-dark', c.sv_orange_dark);
  root.style.setProperty('--color-sv-orange-light', c.sv_orange_light);
  root.style.setProperty('--color-primary', c.sv_primary);
  root.style.setProperty('--color-primary-dark', c.sv_primary_dark);
  root.style.setProperty('--color-primary-light', c.sv_primary_light);
  root.style.setProperty('--color-secondary', c.sv_orange);
  root.style.setProperty('--color-secondary-dark', c.sv_orange_dark);
  root.style.setProperty('--color-secondary-light', c.sv_orange_light);
  root.style.setProperty('--color-accent', c.sv_orange);
  root.style.setProperty('--color-accent-alt', c.sv_primary);
}

interface SiteThemeProviderProps {
  children: React.ReactNode;
  initialColors: ThemeColors;
  initialHeader: HeaderSettings;
  initialFooter: FooterSettings;
}

export function SiteThemeProvider({ children, initialColors, initialHeader, initialFooter }: SiteThemeProviderProps) {
  const [colors, setColors] = useState<ThemeColors>(initialColors);
  const [header, setHeader] = useState<HeaderSettings>(initialHeader);
  const [footer, setFooter] = useState<FooterSettings>(initialFooter);

  const refresh = async () => {
    const settings = await api.getSiteSettings();
    setColors(settings.theme as unknown as ThemeColors);
    setHeader(settings.header as unknown as HeaderSettings);
    setFooter(settings.footer as unknown as FooterSettings);
    applyColors(settings.theme as unknown as ThemeColors);
  };

  useEffect(() => {
    applyColors(colors);
  }, [colors]);

  return (
    <SiteThemeContext.Provider value={{ colors, header, footer, refresh }}>
      {children}
    </SiteThemeContext.Provider>
  );
}

export const useSiteTheme = () => useContext(SiteThemeContext);
