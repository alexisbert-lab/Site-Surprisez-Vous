'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  type ThemeColors, DEFAULT_COLORS,
  type HeaderSettings, DEFAULT_HEADER,
  type FooterSettings, DEFAULT_FOOTER,
} from './firestore/site-settings';
import { api } from './api';
import { variablesTheme } from './theme-vars';

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
  Object.entries(variablesTheme(c)).forEach(([nom, valeur]) => root.style.setProperty(nom, valeur));
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

  // Les documents peuvent être partiels — c'est la règle en mode local, où le
  // fichier de fixtures ne contient que ce que l'éditeur a écrit. Sans ce
  // complément par les valeurs par défaut, une variable CSS repartirait vide.
  const refresh = async () => {
    const settings = await api.getSiteSettings();
    const couleurs = { ...DEFAULT_COLORS, ...settings.theme } as ThemeColors;
    setColors(couleurs);
    setHeader({ ...DEFAULT_HEADER, ...settings.header } as HeaderSettings);
    setFooter({ ...DEFAULT_FOOTER, ...settings.footer } as FooterSettings);
    applyColors(couleurs);
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
