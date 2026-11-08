import { expect, test } from '@playwright/test';
import { accountEmail, login } from './helpers';

// Chaque test remet la case qu'il a changée dans son état d'origine.
test.describe('Écran des permissions (Super Admin)', () => {
  test('coche puis décoche une case de rôle, visible au journal', async ({ page }) => {
    await login(page, 'admin');
    await page.goto('/admin/permissions');

    const cell = page.getByRole('checkbox', { name: 'Voir les dépenses — Livreur' });
    await expect(cell).not.toBeChecked();

    const saved = page.waitForResponse(r => r.url().endsWith('/api/access/roles/') && r.request().method() === 'PUT');
    await cell.check();
    expect((await saved).status()).toBe(200);
    await expect(cell).toBeChecked();

    await page.getByRole('tab', { name: 'Journal' }).click();
    await expect(page.getByText(/Rôle Livreur · Voir les dépenses : non → oui/).first()).toBeVisible();

    await page.getByRole('tab', { name: 'Par rôle' }).click();
    const reverted = page.waitForResponse(r => r.url().endsWith('/api/access/roles/') && r.request().method() === 'PUT');
    await page.getByRole('checkbox', { name: 'Voir les dépenses — Livreur' }).uncheck();
    expect((await reverted).status()).toBe(200);
  });

  test('ajoute puis retire une exception pour une personne', async ({ page }) => {
    await login(page, 'admin');
    await page.goto('/admin/permissions');
    await page.getByRole('tab', { name: 'Par personne' }).click();

    // La liste des comptes s'affiche ; la recherche la filtre, un clic ouvre les droits de la personne.
    await expect(page.getByRole('row').nth(1)).toBeVisible();
    await page.getByPlaceholder('Nom ou email…').fill(accountEmail('employe'));
    await page.getByText(accountEmail('employe'), { exact: true }).click();

    const right = page.getByLabel(/^Annuler une vente \(avec motif\) pour /);
    await expect(right).toHaveValue('inherit');

    const granted = page.waitForResponse(r => /\/api\/access\/users\/\d+\/$/.test(r.url()) && r.request().method() === 'PUT');
    await right.selectOption('grant');
    expect((await granted).status()).toBe(200);
    await expect(page.getByText('1 exception')).toBeVisible();

    const cleared = page.waitForResponse(r => /\/api\/access\/users\/\d+\/$/.test(r.url()) && r.request().method() === 'PUT');
    await right.selectOption('inherit');
    expect((await cleared).status()).toBe(200);
    await expect(page.getByText('Aucune exception : mêmes droits que son rôle')).toBeVisible();
  });

  test('affiche les interrupteurs, tous sur les anciennes règles', async ({ page }) => {
    await login(page, 'admin');
    await page.goto('/admin/permissions');
    await page.getByRole('tab', { name: 'Interrupteurs' }).click();
    const switches = page.getByRole('switch');
    await expect(switches).toHaveCount(6);
    for (const s of await switches.all()) await expect(s).toHaveAttribute('aria-checked', 'false');
  });
});
