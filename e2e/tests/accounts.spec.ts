import { expect, test, type Page } from '@playwright/test';
import { Api, SHOP_A, SHOP_B, login, submitCreateUserForm, uniqueEmail } from './helpers';

/** Comptes créés pendant le test, supprimés ensuite par le Super Admin. */
let createdEmails: string[] = [];

test.beforeEach(() => { createdEmails = []; });

test.afterEach(async ({ request }) => {
  if (createdEmails.length === 0) return;
  const admin = await Api.as(request, 'admin');
  await admin.deleteUsers(createdEmails);
});

const newEmployee = (prefix: string) => {
  const email = uniqueEmail(prefix);
  createdEmails.push(email);
  return { email, first_name: `Test${Date.now()}` };
};

/** Ligne d'un compte dans « Mon équipe », après filtrage par la recherche. */
async function teamRow(page: Page, search: string) {
  await page.goto('/manager/users');
  await page.getByPlaceholder('Nom, email...').fill(search);
  const row = page.locator('tr', { hasText: search }).first();
  await expect(row).toBeVisible();
  return row;
}

async function openRowAction(page: Page, row: ReturnType<Page['locator']>, action: string) {
  await row.locator('[data-action-menu] button').first().click();
  await page.getByRole('button', { name: action, exact: true }).click();
}

test.describe('Manager', () => {
  test('crée un employé dans sa boutique', async ({ page, request }) => {
    const employee = newEmployee('boutique-a');
    await login(page, 'manager', SHOP_A);
    await page.goto('/manager/users/create');
    await submitCreateUserForm(page, employee);

    await expect(await teamRow(page, employee.first_name)).toBeVisible();

    const manager = await Api.as(request, 'manager');
    const created = await manager.findUser(employee.email);
    expect(created.role).toBe('EMPLOYEE');
    expect(created.shop).toBe(await manager.shopId(SHOP_A));
  });

  test('bascule sur sa deuxième boutique et y crée un employé', async ({ page, request }) => {
    const employee = newEmployee('boutique-b');
    await login(page, 'manager', SHOP_A);

    await page.getByRole('button', { name: SHOP_A }).first().click();
    await page.getByRole('button', { name: SHOP_B }).first().click();

    await page.goto('/manager/users/create');
    await submitCreateUserForm(page, employee);
    await expect(await teamRow(page, employee.first_name)).toBeVisible();

    const manager = await Api.as(request, 'manager');
    const created = await manager.findUser(employee.email);
    expect(created.shop).toBe(await manager.shopId(SHOP_B));
  });

  test('ne peut pas choisir le rôle Manager à la création', async ({ page }) => {
    await login(page, 'manager', SHOP_A);
    await page.goto('/manager/users/create');
    await expect(page.locator('select[name="role"]')).toBeVisible();
    const roles = await page.locator('select[name="role"] option').evaluateAll(
      options => options.map(option => (option as HTMLOptionElement).value),
    );
    expect(roles.sort()).toEqual(['EMPLOYEE', 'LIVREUR', 'MAGASINIER']);
  });

  test('modifie le nom et le rôle d\'un employé', async ({ page, request }) => {
    const manager = await Api.as(request, 'manager');
    const employee = newEmployee('edition');
    await manager.createUser(employee.email, employee.first_name, await manager.shopId(SHOP_A));
    const renamed = `${employee.first_name}Bis`;

    await login(page, 'manager', SHOP_A);
    await openRowAction(page, await teamRow(page, employee.first_name), 'Modifier');

    const modal = page.getByRole('heading', { name: /^Modifier —/ }).locator('xpath=../..');
    const roleSelect = modal.locator('select:has(option[value="MAGASINIER"])');
    await expect(roleSelect).toBeVisible();
    await expect(roleSelect.locator('option[value="SHOP_MANAGER"]')).toHaveCount(0);

    await modal.locator('input').first().fill(renamed);
    await roleSelect.selectOption('MAGASINIER');
    const saved = page.waitForResponse(r => r.url().includes('/api/users/') && r.request().method() === 'PATCH');
    await modal.getByRole('button', { name: 'Enregistrer' }).click();
    expect((await saved).status()).toBe(200);

    await expect(page.locator('tr', { hasText: renamed }).first()).toBeVisible();
    const updated = await manager.findUser(employee.email);
    expect(updated.first_name).toBe(renamed);
    expect(updated.role).toBe('MAGASINIER');
  });

  test('désactive puis réactive un employé', async ({ page, request }) => {
    const manager = await Api.as(request, 'manager');
    const employee = newEmployee('statut');
    await manager.createUser(employee.email, employee.first_name, await manager.shopId(SHOP_A));

    await login(page, 'manager', SHOP_A);
    const row = await teamRow(page, employee.first_name);
    await expect(row.getByText('Actif', { exact: true })).toBeVisible();

    await openRowAction(page, row, 'Désactiver');
    await expect(row.getByText('Inactif', { exact: true })).toBeVisible();

    await openRowAction(page, row, 'Activer');
    await expect(row.getByText('Actif', { exact: true })).toBeVisible();
  });

  test('ne peut ni promouvoir un employé par l\'API ni le passer manager', async ({ request }) => {
    const manager = await Api.as(request, 'manager');
    const employee = newEmployee('attaque');
    await manager.createUser(employee.email, employee.first_name, await manager.shopId(SHOP_A));
    const target = await manager.findUser(employee.email);

    for (const role of ['SUPER_ADMIN', 'SHOP_MANAGER']) {
      const response = await manager.patch(`/users/${target.id}/`, { role });
      expect(response.status(), role).toBe(400);
    }
    expect((await manager.findUser(employee.email)).role).toBe('EMPLOYEE');
  });
});

test.describe('Super Admin', () => {
  test('crée un compte Manager', async ({ page, request }) => {
    const email = uniqueEmail('manager');
    createdEmails.push(email);

    await login(page, 'admin');
    await page.goto('/admin/users/create');
    await submitCreateUserForm(page, { email, first_name: 'Nouveau', role: 'SHOP_MANAGER' }, SHOP_B);

    const admin = await Api.as(request, 'admin');
    const created = await admin.findUser(email);
    expect(created.role).toBe('SHOP_MANAGER');
    expect(created.shop).toBe(await admin.shopId(SHOP_B));
  });
});
