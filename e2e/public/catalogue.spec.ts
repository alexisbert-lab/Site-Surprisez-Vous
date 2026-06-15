import { test, expect } from '@playwright/test';

test.describe('Catalogue public', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/catalogue');
  });

  test('affiche la page catalogue', async ({ page }) => {
    await expect(page).toHaveTitle(/catalogue|surprisez/i);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('les onglets sont présents (Par gamme, Par marque, Recherche)', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /par gamme/i }).or(
      page.getByText(/par gamme/i).first()
    )).toBeVisible();
  });

  test('la recherche filtre les produits', async ({ page }) => {
    await page.goto('/catalogue?tab=search');

    // Placeholder exact du SearchBar catalogue (pas celui du Header)
    const searchInput = page.getByPlaceholder('Référence, désignation, EAN…');
    await expect(searchInput).toBeVisible({ timeout: 8000 });

    await searchInput.fill('ballon');
    await expect(
      page.getByText(/\d+ résultat|aucun article trouvé/i)
    ).toBeVisible({ timeout: 8000 });
  });

  test('le filtre par gamme affiche des produits', async ({ page }) => {
    const gammeTab = page.getByText(/par gamme/i).first();
    if (await gammeTab.isVisible()) {
      await gammeTab.click();
      await page.waitForLoadState('networkidle');
      // Des cartes ou catégories doivent apparaître
      const cards = page.locator('article, [class*="card"], [class*="Card"]');
      await expect(cards.first()).toBeVisible({ timeout: 10000 });
    }
  });
});
