import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'alexis.bert@surprisez-vous.fr';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD || '';

test.describe('Page de connexion', () => {
  test('affiche le formulaire de connexion', async ({ page }) => {
    await page.goto('/connexion');
    await expect(page.getByLabel('Identifiant')).toBeVisible();
    await expect(page.getByLabel('Mot de passe')).toBeVisible();
    await expect(page.getByRole('button', { name: /se connecter/i })).toBeVisible();
  });

  test('affiche erreur avec identifiants incorrects', async ({ page }) => {
    await page.goto('/connexion');
    await page.getByLabel('Identifiant').fill('mauvais-identifiant');
    await page.getByLabel('Mot de passe').fill('mauvais-mdp');
    await page.getByRole('button', { name: /se connecter/i }).click();

    await expect(
      page.getByText(/identifiant ou mot de passe incorrect|erreur/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('le bouton est désactivé pendant la connexion', async ({ page }) => {
    await page.goto('/connexion');
    await page.getByLabel('Identifiant').fill('test@example.fr');
    await page.getByLabel('Mot de passe').fill('password');

    // Intercepte la requête Firebase pour ralentir
    await page.route('**/identitytoolkit.googleapis.com/**', (route) => {
      setTimeout(() => route.continue(), 2000);
    });

    await page.getByRole('button', { name: /se connecter/i }).click();
    await expect(page.getByRole('button', { name: 'Connexion...', exact: true })).toBeDisabled();
  });

  test('lien "Créer un compte" est présent', async ({ page }) => {
    await page.goto('/connexion');
    await expect(
      page.getByRole('link', { name: /créer un compte/i }).or(
        page.getByRole('link', { name: /faire une demande/i })
      ).first()
    ).toBeVisible();
  });
});

test.describe('Connexion admin', () => {
  test.skip(!ADMIN_PASSWORD, 'E2E_ADMIN_PASSWORD non défini');

  test('connexion admin réussie — quitte la page /connexion', async ({ page }) => {
    await page.goto('/connexion');
    await page.getByLabel('Identifiant').fill(ADMIN_EMAIL);
    await page.getByLabel('Mot de passe').fill(ADMIN_PASSWORD);
    await page.getByRole('button', { name: /se connecter/i }).click();

    // La page publique redirige les admins vers /
    await expect(page).toHaveURL('/', { timeout: 30000 });
  });
});
