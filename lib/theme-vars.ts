import type { ThemeColors } from './firestore/site-settings';

/**
 * Variables CSS pilotées par `/admin/personnalisation`.
 *
 * Une seule source pour les deux applications : le layout serveur les pose sur
 * `<html>` (pas de flash aux couleurs par défaut) et le contexte de thème les
 * réécrit après un enregistrement, sans recharger la page.
 */
export function variablesTheme(c: ThemeColors): Record<string, string> {
  return {
    '--color-sv-primary': c.sv_primary,
    '--color-sv-primary-dark': c.sv_primary_dark,
    '--color-sv-primary-light': c.sv_primary_light,
    '--color-sv-orange': c.sv_orange,
    '--color-sv-orange-dark': c.sv_orange_dark,
    '--color-sv-orange-light': c.sv_orange_light,
    '--color-primary': c.sv_primary,
    '--color-primary-dark': c.sv_primary_dark,
    '--color-primary-light': c.sv_primary_light,
    '--color-secondary': c.sv_orange,
    '--color-secondary-dark': c.sv_orange_dark,
    '--color-secondary-light': c.sv_orange_light,
    '--color-accent': c.sv_orange,
    '--color-accent-alt': c.sv_primary,
    // Fonds : le gris des sections a sa propre variable, sinon la teinte
    // choisie pour la vitrine repeindrait aussi les tableaux du back-office.
    '--color-bg': c.bg_page,
    '--color-surface': c.bg_card,
    '--color-section-alt': c.bg_section_alt,
  };
}
