import { expect, test } from '@playwright/test';
import { login } from './helpers';

test.describe('Session', () => {
  test("un jeton d'accès expiré est renouvelé sans déconnexion", async ({ page }) => {
    await login(page, 'manager');
    const refreshTokenBefore = await page.evaluate(() => localStorage.getItem('refresh_token'));

    // Simule les 30 minutes écoulées : le jeton d'accès n'est plus valide.
    await page.evaluate(() => localStorage.setItem('access_token', 'jeton-expire'));
    const refreshed = page.waitForResponse(r => r.url().endsWith('/api/token/refresh/'));
    await page.reload();

    expect((await refreshed).status()).toBe(200);
    await expect(page).not.toHaveURL(/\/login/);
    const tokens = await page.evaluate(() => ({
      access: localStorage.getItem('access_token'),
      refresh: localStorage.getItem('refresh_token'),
    }));
    expect(tokens.access).not.toBe('jeton-expire');
    // Rotation : le serveur a fourni un nouveau jeton de renouvellement, et il est gardé.
    expect(tokens.refresh).not.toBe(refreshTokenBefore);
  });
});
