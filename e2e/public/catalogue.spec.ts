import { test, expect } from '@playwright/test';

test.describe('Catalogue public', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/catalogue');
  });

  test('affiche la page catalogue', async ({ page }) => {
    await expect(page).toHaveTitle(/catalogue|surprisez/i);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('la recherche filtre les produits', async ({ page }) => {
    // Placeholder exact du SearchBar catalogue (pas celui du Header)
    const searchInput = page.getByPlaceholder('Référence, désignation, EAN…');
    await expect(searchInput).toBeVisible({ timeout: 8000 });

    await searchInput.fill('ballon');
    await expect(
      page.getByText(/\d+ articles?|aucun article/i).first()
    ).toBeVisible({ timeout: 8000 });
  });

  test('la recherche est reprise depuis le paramètre q', async ({ page }) => {
    await page.goto('/catalogue?q=ballon');
    await expect(page.getByPlaceholder('Référence, désignation, EAN…')).toHaveValue('ballon');
  });

  // Le référentiel d'attributs alimente le menu et les facettes. Tant que la feuille
  // n'est pas synchronisée, la page reste une grille simple : le test s'adapte.
  test('le menu des rayons ouvre une sous-catégorie', async ({ page }) => {
    const rayon = page.locator('nav button').filter({ hasText: /décoration|cadeaux|art de la table/i }).first();
    if (!(await rayon.isVisible().catch(() => false))) test.skip();

    await rayon.hover();
    const sousCat = page.locator('nav ul ul button:not([disabled])').first();
    await expect(sousCat).toBeVisible({ timeout: 5000 });
    await sousCat.click();

    // Le rayon choisi part dans l'URL et le fil d'Ariane apparaît.
    await expect(page).toHaveURL(/sous_categorie=/);
    await expect(page.getByRole('button', { name: /tous les rayons/i })).toBeVisible();
  });

  test('une facette se pose et se retire', async ({ page }) => {
    const filtres = page.getByText('Filtrer', { exact: true });
    if (!(await filtres.isVisible().catch(() => false))) test.skip();

    const option = page.locator('aside button').filter({ hasNotText: /réinitialiser/i }).nth(1);
    await option.click();

    // Une étiquette retirable apparaît à côté du compteur de résultats.
    const etiquette = page.locator('main button.rounded-full').first();
    await expect(etiquette).toBeVisible({ timeout: 5000 });
    await etiquette.click();
    await expect(etiquette).toBeHidden({ timeout: 5000 });
  });
});
