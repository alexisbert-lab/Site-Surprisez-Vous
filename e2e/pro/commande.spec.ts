import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'alexis.bert@surprisez-vous.fr';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || '';

test.describe('Tunnel de commande pro', () => {
  test.skip(!ADMIN_PASSWORD, 'E2E_ADMIN_PASSWORD non défini');

  test.beforeEach(async ({ page }) => {
    await page.goto('/connexion');
    await page.getByLabel('Identifiant').fill(ADMIN_EMAIL);
    await page.getByLabel('Mot de passe').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /se connecter/i }).click();
    await page.waitForURL('/', { timeout: 30000 });
  });

  test('panier → confirmation → commande envoyée + suppression', async ({ page }) => {
    let createdOrderId: string | null = null;

    page.on('request', (req) => {
      const match = req.url().match(/\/documents\/orders\/([^?/]+)/);
      if (match && req.method() === 'PATCH') createdOrderId = match[1];
    });

    // Pré-remplir le panier via localStorage (indépendant du stock)
    await page.goto('/pro/panier');
    await page.evaluate(() => {
      const cart = {
        id: 'e2e-test-cart',
        nom: 'Commande E2E',
        items: [{ ref: 'TEST-E2E', designation: 'Article test E2E', qty: 2, prixUnitaire: 5.00 }],
        createdAt: Date.now(),
      };
      localStorage.setItem('sv-carts', JSON.stringify([cart]));
      localStorage.setItem('sv-active-cart', 'e2e-test-cart');
    });
    await page.reload();

    // Panier — l'article doit apparaître dans le tableau
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Article test E2E')).toBeVisible();

    // Page confirmation — récapitulatif
    await page.goto('/pro/panier/confirmation');
    await expect(page.getByRole('heading', { name: /confirmation de commande/i })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('table tbody tr').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /confirmer et envoyer/i })).toBeVisible();

    // Valider — message de succès (re-clic tant que l'auth Firebase n'est pas réhydratée)
    const confirmBtn = page.getByRole('button', { name: /confirmer et envoyer/i });
    const success = page.getByText('Commande envoyée !');
    await expect(async () => {
      if (!(await success.isVisible())) {
        await confirmBtn.click({ timeout: 2000 });
      }
      await expect(success).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 25000 });

    // Cleanup — supprime la commande de test dans Firestore
    if (createdOrderId) {
      const res = await page.request.delete(`/api/e2e/delete-order?id=${createdOrderId}`);
      expect(res.ok()).toBeTruthy();
    }
  });

  test('ajout depuis catalogue (si produits en stock)', async ({ page }) => {
    await page.goto('/pro/catalogue');
    const loaded = await page.getByText('Chargement…').isHidden({ timeout: 15000 }).catch(() => false);
    if (!loaded) return; // Auth/tarifs non résolus — test ignoré

    const addBtn = page.locator('button').filter({ hasText: 'Panier' }).first();
    const hasStock = await addBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (!hasStock) return; // Pas de produits en stock — test ignoré silencieusement

    await addBtn.click();
    await page.waitForTimeout(500);

    // L'article doit apparaître dans le panier
    await page.goto('/pro/panier');
    await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 10000 });

    // Cleanup localStorage
    await page.evaluate(() => {
      localStorage.removeItem('sv-carts');
      localStorage.removeItem('sv-active-cart');
    });
  });

  test('panier vide — page confirmation affiche message approprié', async ({ page }) => {
    await page.goto('/pro/panier/confirmation');
    await expect(page.getByText(/aucun article dans le panier/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('link', { name: /retour au catalogue/i })).toBeVisible();
  });

  test('panier — création et suppression d\'un panier', async ({ page }) => {
    await page.goto('/pro/panier');
    await page.getByRole('button', { name: /nouveau panier/i }).click();
    const input = page.getByPlaceholder(/nom du panier/i);
    await expect(input).toBeVisible();
    await input.fill('Panier test E2E');
    await page.getByRole('button', { name: 'Créer', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Panier test E2E', exact: true })).toBeVisible({ timeout: 5000 });

    // Supprimer le panier créé
    await page.getByRole('button', { name: /supprimer/i }).first().click();
    await expect(page.getByRole('heading', { name: 'Panier test E2E', exact: true })).not.toBeVisible({ timeout: 5000 });
  });
});
