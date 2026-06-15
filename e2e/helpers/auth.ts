import { type Page } from '@playwright/test';

export async function loginPro(page: Page, identifier: string, password: string) {
  await page.goto('/connexion');
  await page.getByLabel('Identifiant').fill(identifier);
  await page.getByLabel('Mot de passe').fill(password);
  await page.getByRole('button', { name: /se connecter/i }).click();
}

export async function loginAdmin(page: Page, email: string, password: string) {
  await page.goto('/admin/connexion');
  await page.getByLabel(/email|identifiant/i).fill(email);
  await page.getByLabel(/mot de passe/i).fill(password);
  await page.getByRole('button', { name: /se connecter/i }).click();
}

export async function logout(page: Page) {
  // Cherche un bouton/lien de déconnexion dans le header ou sidebar
  const logoutBtn = page.getByRole('button', { name: /d[eé]connexion/i });
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click();
  }
}
