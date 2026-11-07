import { expect, type APIRequestContext, type Page } from '@playwright/test';

export const SHOP_A = 'Boutique Test A';
export const SHOP_B = 'Boutique Test B';

const password = () => process.env.E2E_PASSWORD as string;

/** Mot de passe des comptes créés par les tests : le serveur exige qu'il soit robuste. */
const NEW_ACCOUNT_PASSWORD = `E2e-${Date.now().toString(36)}-Xq7!`;

export const accountEmail = (name: string) => `${name}@shopm.test`;

/** Adresse unique, à un domaine distinct des comptes permanents, pour pouvoir nettoyer. */
export const uniqueEmail = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}@e2e.shopm.test`;

/** Connexion par l'écran, et choix de la boutique pour un manager multi-boutiques. */
export async function login(page: Page, name: string, shop?: string) {
  await page.goto('/login');
  await page.getByPlaceholder('prenom.nom@email.com').fill(accountEmail(name));
  await page.getByPlaceholder('••••••••').fill(password());
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).not.toHaveURL(/\/login/);

  if (shop) {
    await page.getByRole('button', { name: new RegExp(shop) }).first().click();
    await expect(page.getByText('Choisir une boutique')).toBeHidden();
  }
}

interface Identity {
  first_name: string;
  last_name?: string;
  email: string;
  role?: string;
}

/** Remplit le formulaire de création, puis attend la réponse du serveur. */
export async function submitCreateUserForm(page: Page, user: Identity, shop?: string) {
  await page.locator('input[name="first_name"]').fill(user.first_name);
  await page.locator('input[name="last_name"]').fill(user.last_name ?? 'E2E');
  await page.locator('input[name="email"]').fill(user.email);
  await page.locator('input[name="password"]').fill(NEW_ACCOUNT_PASSWORD);
  await page.locator('input[name="password_confirm"]').fill(NEW_ACCOUNT_PASSWORD);
  if (user.role) await page.locator('select[name="role"]').selectOption(user.role);
  if (shop) await page.locator('select[name="shop"]').selectOption({ label: shop });

  const response = page.waitForResponse(
    r => r.url().includes('/api/users/') && r.request().method() === 'POST',
  );
  await page.getByRole('button', { name: "Créer l'utilisateur" }).click();
  expect((await response).status()).toBe(201);
}

/** Accès direct à l'API, pour préparer et nettoyer les données de test. */
export class Api {
  private constructor(private request: APIRequestContext, private token: string) {}

  static async as(request: APIRequestContext, name: string) {
    const response = await request.post('/api/token/', {
      data: { email: accountEmail(name), password: password() },
    });
    expect(response.status(), `connexion API de ${name}`).toBe(200);
    return new Api(request, (await response.json()).access);
  }

  private options(shopId?: number, data?: unknown) {
    return {
      headers: {
        Authorization: `Bearer ${this.token}`,
        ...(shopId ? { 'X-Active-Shop': String(shopId) } : {}),
      },
      ...(data !== undefined ? { data } : {}),
    };
  }

  async get(path: string, shopId?: number) {
    return this.request.get(`/api${path}`, this.options(shopId));
  }

  async post(path: string, data: unknown, shopId?: number) {
    return this.request.post(`/api${path}`, this.options(shopId, data));
  }

  async patch(path: string, data: unknown) {
    return this.request.patch(`/api${path}`, this.options(undefined, data));
  }

  async shopId(name: string): Promise<number> {
    const response = await this.get('/shops/');
    const body = await response.json();
    const shop = (body.results ?? body).find((s: { name: string }) => s.name === name);
    expect(shop, `boutique ${name}`).toBeTruthy();
    return shop.id;
  }

  async findUser(email: string) {
    const response = await this.get(`/users/?search=${encodeURIComponent(email)}`);
    const body = await response.json();
    return (body.results ?? body).find((u: { email: string }) => u.email === email);
  }

  async createUser(email: string, firstName: string, shopId: number) {
    const response = await this.post('/users/', {
      email, password: NEW_ACCOUNT_PASSWORD, password_confirm: NEW_ACCOUNT_PASSWORD,
      first_name: firstName, last_name: 'E2E', role: 'EMPLOYEE', shop: shopId,
    }, shopId);
    expect(response.status(), await response.text()).toBe(201);
  }

  async deleteUsers(emails: string[]) {
    for (const email of emails) {
      const user = await this.findUser(email);
      if (user) await this.request.delete(`/api/users/${user.id}/`, this.options());
    }
  }

  /** Ouvre la session de caisse du jour pour le caissier, si elle n'existe pas encore. */
  async ensureCashierSession(shopId: number) {
    const active = await (await this.get('/cashier-sessions/active/', shopId)).json();
    if (active?.id) return;
    const cashier = await this.findUser(accountEmail('caissier'));
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Porto-Novo' }).format(new Date());
    const response = await this.post('/cashier-sessions/', {
      shop: shopId, cashier: cashier.id, period_type: 'daily', start_date: today, end_date: today,
    }, shopId);
    expect(response.status(), await response.text()).toBe(201);
  }
}
