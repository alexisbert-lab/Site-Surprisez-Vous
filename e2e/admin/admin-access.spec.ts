import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || '';

// Tests de protection (non connecté)
test.describe('Protection admin (non connecté)', () => {
  const protectedRoutes = [
    '/admin',
    '/admin/catalogue',
    '/admin/commandes',
    '/admin/crm',
    '/admin/statistiques',
    '/admin/tarifs',
    '/admin/revendeurs',
  ];

  for (const route of protectedRoutes) {
    test(`${route} redirige si non connecté`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/connexion/, { timeout: 10000 });
    });
  }
});

// Tests admin connecté
test.describe('Back-office admin', () => {
  test.skip(!ADMIN_PASSWORD, 'Identifiants E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD non définis');

  test.beforeEach(async ({ page }) => {
    // Connexion via la page publique (évite le spinner du layout admin)
    await page.goto('/connexion');
    await page.getByLabel('Identifiant').fill(ADMIN_EMAIL);
    await page.getByLabel('Mot de passe').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /se connecter/i }).click();
    // La page publique redirige les admins vers /
    await page.waitForURL('/', { timeout: 30000 });
  });

  test('tableau de bord admin accessible', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('page catalogue admin se charge', async ({ page }) => {
    await page.goto('/admin/catalogue');
    await expect(page).toHaveURL(/\/admin\/catalogue/);
    // Des produits ou une table doivent s'afficher
    await expect(
      page.locator('table, [class*="product"], [class*="Product"]').first().or(
        page.getByText(/aucun produit|chargement/i)
      )
    ).toBeVisible({ timeout: 15000 });
  });

  test('page commandes se charge', async ({ page }) => {
    await page.goto('/admin/commandes');
    await expect(page).toHaveURL(/\/admin\/commandes/);
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15000 });
  });

  test('page CRM se charge', async ({ page }) => {
    await page.goto('/admin/crm');
    await expect(page).toHaveURL(/\/admin\/crm/);
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 15000 });
  });

  test('page statistiques se charge', async ({ page }) => {
    await page.goto('/admin/statistiques');
    await expect(page).toHaveURL(/\/admin\/statistiques/);
    await expect(page.locator('h1, [class*="stat"]').first()).toBeVisible({ timeout: 15000 });
  });

  test('sidebar admin est visible', async ({ page }) => {
    await page.goto('/admin');
    // La sidebar doit contenir des liens de navigation
    await expect(page.locator('aside').first()).toBeVisible();
  });
});
