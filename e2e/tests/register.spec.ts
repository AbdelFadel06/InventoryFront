import { expect, test } from '@playwright/test';
import { Api, SHOP_A, login } from './helpers';

test.describe('Caissier', () => {
  test.beforeEach(async ({ request }) => {
    const manager = await Api.as(request, 'manager');
    await manager.ensureCashierSession(await manager.shopId(SHOP_A));
  });

  test('enregistre une vente directe', async ({ page }) => {
    await login(page, 'caissier');
    await page.goto('/employee/caisse');

    await page.getByRole('button', { name: /Casserole 24 cm/ }).first().click();
    await page.getByRole('button', { name: 'Encaisser', exact: true }).click();

    const sale = page.waitForResponse(r => r.url().endsWith('/api/sales/') && r.request().method() === 'POST');
    await page.getByRole('button', { name: /✓ Encaisser/ }).click();
    expect((await sale).status()).toBe(201);
    await expect(page.getByText('Vente enregistrée !')).toBeVisible();
  });

  test('enregistre une dépense', async ({ page }) => {
    await login(page, 'caissier');
    await page.goto('/employee/caisse');

    await page.getByRole('button', { name: '+ Dépense' }).click();
    await page.getByPlaceholder(/^Libellé/).fill('Dépense de test E2E');
    await page.getByPlaceholder('Montant (F CFA)').fill('500');

    const expense = page.waitForResponse(r => r.url().endsWith('/api/expenses/') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
    expect((await expense).status()).toBe(201);
  });
});
