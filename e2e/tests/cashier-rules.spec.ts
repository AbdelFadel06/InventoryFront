import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { Api, SHOP_A, accountEmail, login } from './helpers';

const PRODUCT = 'Poêle antiadhésive';

interface Context { shopId: number; productId: number }

/** Session du jour ouverte, boutique et produit retrouvés. */
async function prepare(request: APIRequestContext): Promise<Context> {
  const manager = await Api.as(request, 'manager');
  const shopId = await manager.shopId(SHOP_A);
  await manager.ensureCashierSession(shopId);
  return { shopId, productId: await manager.productId(PRODUCT, shopId) };
}

/** Vente faite par le caissier, renvoie son id et sa référence. */
async function cashierSale(request: APIRequestContext, ctx: Context) {
  const cashier = await Api.as(request, 'caissier');
  const response = await cashier.sell(ctx.productId, ctx.shopId);
  expect(response.status(), await response.text()).toBe(201);
  const { id } = await response.json();
  const sale = await (await cashier.get(`/sales/${id}/`, ctx.shopId)).json();
  return { id: sale.id as number, reference: sale.reference as string };
}

/** Ouvre le détail d'une vente depuis la liste des ventes. */
async function openSale(page: Page, path: string, reference: string) {
  await page.goto(path);
  await page.locator('tr', { hasText: reference }).getByRole('button', { name: 'Voir →' }).click();
  await expect(page.getByRole('button', { name: 'Fermer' })).toBeVisible();
  // Laisse le temps au contrôle « caissier du jour » de répondre avant de juger les boutons.
  await page.waitForLoadState('networkidle');
}

test.describe('Règles de caisse (API)', () => {
  test('seuls le caissier du jour et le manager encaissent', async ({ request }) => {
    const ctx = await prepare(request);
    for (const name of ['employe', 'magasinier', 'livreur']) {
      const response = await (await Api.as(request, name)).sell(ctx.productId, ctx.shopId);
      expect(response.status(), name).toBe(403);
    }
    expect((await (await Api.as(request, 'manager')).sell(ctx.productId, ctx.shopId)).status()).toBe(201);
  });

  test('ni le magasinier ni le livreur ne voient le rapport de la boutique', async ({ request }) => {
    const ctx = await prepare(request);
    for (const name of ['magasinier', 'livreur']) {
      const response = await (await Api.as(request, name)).get('/sales/daily_report/', ctx.shopId);
      expect(response.status(), name).toBe(403);
    }
  });

  test('un employé ne peut pas annuler, le manager doit donner un motif', async ({ request }) => {
    const ctx = await prepare(request);
    const sale = await cashierSale(request, ctx);

    const cashier = await Api.as(request, 'caissier');
    expect((await cashier.post(`/sales/${sale.id}/cancel/`, { reason: 'test' }, ctx.shopId)).status()).toBe(403);

    const manager = await Api.as(request, 'manager');
    expect((await manager.post(`/sales/${sale.id}/cancel/`, {}, ctx.shopId)).status()).toBe(400);
    expect((await (await manager.get(`/sales/${sale.id}/`, ctx.shopId)).json()).status).toBe('completed');
  });
});

test.describe('Signalement d\'une vente', () => {
  test('le caissier signale, le manager annule avec un motif', async ({ page, request }) => {
    const ctx = await prepare(request);
    const sale = await cashierSale(request, ctx);

    await login(page, 'caissier');
    await openSale(page, '/employee/ventes', sale.reference);
    await expect(page.getByRole('button', { name: 'Annuler la vente' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Signaler' }).click();
    await page.getByLabel('Motif').selectOption('wrong_amount');
    await page.getByLabel('Commentaire').fill('Test E2E : montant à vérifier');
    const reported = page.waitForResponse(r => r.url().includes(`/sales/${sale.id}/report_issue/`));
    await page.getByRole('button', { name: 'Envoyer le signalement' }).click();
    expect((await reported).ok()).toBe(true);

    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    await login(page, 'manager', SHOP_A);
    await expect(page.getByRole('button', { name: /signalées? à traiter/ })).toBeVisible();
    await page.goto('/manager/signalements');

    page.once('dialog', dialog => dialog.accept('Test E2E : erreur de caisse'));
    const cancelled = page.waitForResponse(r => r.url().includes(`/sales/${sale.id}/cancel/`));
    await page.locator('tr', { hasText: sale.reference }).getByRole('button', { name: 'Annuler la vente' }).click();
    expect((await cancelled).status()).toBe(200);

    const manager = await Api.as(request, 'manager');
    const after = await (await manager.get(`/sales/${sale.id}/`, ctx.shopId)).json();
    expect(after.status).toBe('cancelled');
    expect(after.cancel_reason).toBe('Test E2E : erreur de caisse');
    expect(after.open_issue).toBeFalsy();
  });

  test('le manager clôture un signalement sans annuler la vente', async ({ page, request }) => {
    const ctx = await prepare(request);
    const sale = await cashierSale(request, ctx);
    const cashier = await Api.as(request, 'caissier');
    const report = await cashier.post(`/sales/${sale.id}/report_issue/`, { reason: 'client_return', comment: '' }, ctx.shopId);
    expect(report.ok(), await report.text()).toBe(true);

    await login(page, 'manager', SHOP_A);
    await page.goto('/manager/signalements');
    page.once('dialog', dialog => dialog.accept('Test E2E : vérifié, rien à corriger'));
    const resolved = page.waitForResponse(r => r.url().includes('/resolve/'));
    await page.locator('tr', { hasText: sale.reference }).getByRole('button', { name: 'Clôturer' }).click();
    expect((await resolved).ok()).toBe(true);

    const manager = await Api.as(request, 'manager');
    const after = await (await manager.get(`/sales/${sale.id}/`, ctx.shopId)).json();
    expect(after.status).toBe('completed');
    expect(after.open_issue).toBeFalsy();
  });

  test('un employé qui n\'est pas à la caisse ne peut ni signaler ni annuler', async ({ page, request }) => {
    const ctx = await prepare(request);
    await (await Api.as(request, 'admin')).moveUser(accountEmail('employe'), ctx.shopId);
    const sale = await cashierSale(request, ctx);

    await login(page, 'employe');
    await openSale(page, '/employee/ventes', sale.reference);
    await expect(page.getByRole('button', { name: 'Signaler' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Annuler la vente' })).toHaveCount(0);
  });
});
