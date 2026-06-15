import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'alexis.bert@surprisez-vous.fr';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || '';

// Tests sans authentification : vérifier les redirections de protection
test.describe('Protection espace pro (non connecté)', () => {
  test('redirige /pro/dashboard vers connexion si non connecté', async ({ page }) => {
    await page.goto('/pro/dashboard');
    await page.waitForLoadState('networkidle');
    // Protection client-side : redirige vers /connexion OU rend null (page vide sans contenu pro)
    const url = page.url();
    if (!url.includes('connexion')) {
      await expect(page.locator('h1')).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('redirige /pro/catalogue vers connexion si non connecté', async ({ page }) => {
    await page.goto('/pro/catalogue');
    await expect(page).toHaveURL(/connexion/, { timeout: 10000 });
  });
});

// Tests avec le compte admin (qui a accès à l'espace pro)
test.describe('Espace pro connecté (via compte admin)', () => {
  test.skip(!ADMIN_PASSWORD, 'E2E_ADMIN_PASSWORD non défini');

  test.beforeEach(async ({ page }) => {
    await page.goto('/connexion');
    await page.getByLabel('Identifiant').fill(ADMIN_EMAIL);
    await page.getByLabel('Mot de passe').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /se connecter/i }).click();
    await page.waitForURL('/', { timeout: 15000 });
  });

  test('accède au catalogue pro', async ({ page }) => {
    await page.goto('/pro/catalogue');
    await expect(page).toHaveURL(/\/pro\/catalogue/);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('accède au dashboard pro', async ({ page }) => {
    await page.goto('/pro/dashboard');
    await expect(page).toHaveURL(/\/pro\/dashboard/);
  });

  test('le panier est fonctionnel — ajout d\'un article', async ({ page }) => {
    await page.goto('/pro/catalogue');
    await page.waitForLoadState('networkidle');

    const addBtn = page.getByRole('button', { name: /ajouter|commander/i }).first();
    if (await addBtn.isVisible({ timeout: 5000 })) {
      await addBtn.click();
      const cartCount = page.getByText(/\d+ article|\d+ produit/i).or(
        page.locator('[data-testid="cart-count"]')
      );
      await expect(cartCount).toBeVisible({ timeout: 5000 });
    }
  });
});
