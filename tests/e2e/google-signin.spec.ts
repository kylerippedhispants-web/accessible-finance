import { expect, test, type Page } from '@playwright/test';

const googleLabel = 'Sign in with Google';
const fakeUserId = '11111111-1111-4111-8111-111111111111';
const tokenPart = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');

/** All provider traffic is fulfilled locally: no real Google consent or cloud writes. */
async function fakeGoogleProvider(page: Page, baseURL: string, outcome: 'cancel' | 'success') {
  const origin = new URL(baseURL).origin;
  const requests: Array<{ path: string; method: string; bearer?: string }> = [];
  const authorizationRequests: URL[] = [];
  const now = Math.floor(Date.now() / 1000);
  const accessToken = `${tokenPart({ alg: 'HS256', typ: 'JWT' })}.${tokenPart({ sub: fakeUserId, role: 'authenticated', aud: 'authenticated', iat: now, exp: now + 3600 })}.fake-signature-for-browser-test`;
  const refreshToken = 'fake-google-refresh-token-for-browser-test';
  const fakeUser = {
    id: fakeUserId, aud: 'authenticated', role: 'authenticated',
    email: 'google-test@example.invalid', email_confirmed_at: '2026-01-01T00:00:00Z',
    created_at: '2026-01-01T00:00:00Z',
    app_metadata: { provider: 'google', providers: ['google'] },
    user_metadata: { given_name: 'Taylor', full_name: 'Taylor Example' },
    identities: [{ id: fakeUserId, user_id: fakeUserId, provider: 'google' }],
  };
  await page.context().route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin === origin) return route.continue();
    if (!url.hostname.endsWith('.supabase.co')) return route.abort();
    requests.push({ path: url.pathname, method: request.method(), bearer: request.headers().authorization });
    if (url.pathname === '/auth/v1/authorize' && request.method() === 'GET') {
      authorizationRequests.push(url);
      const fragment = outcome === 'cancel'
        ? new URLSearchParams({ error: 'access_denied', error_description: 'private-provider-diagnostic' })
        : new URLSearchParams({ access_token: accessToken, refresh_token: refreshToken, token_type: 'bearer', expires_in: '3600', expires_at: String(now + 3600) });
      return route.fulfill({ status: 302, headers: { location: `${origin}/planner/dashboard#${fragment}` } });
    }
    if (url.pathname === '/auth/v1/user' && request.method() === 'GET') {
      return route.fulfill({ status: 200, json: fakeUser });
    }
    if (url.pathname === '/rest/v1/financial_plans' && request.method() === 'GET') {
      return route.fulfill({ status: 200, json: [] });
    }
    return route.fulfill({ status: 503, json: { message: 'Unexpected provider request blocked by the test.' } });
  });
  return { requests, authorizationRequests, accessToken, refreshToken };
}

async function openConfiguredPlanner(page: Page) {
  await page.goto('/planner/');
  await expect(page.locator('.auth-panel')).toBeVisible();
  const demoOnly = await page.getByRole('heading', { name: 'Cloud saving is unavailable here.', exact: true }).isVisible();
  test.skip(demoOnly, 'Google OAuth tests require the cloud-configured build; all Supabase traffic is mocked.');
  await expect(page.getByRole('button', { name: googleLabel, exact: true })).toBeVisible();
}

test('Google sign-in is absent when this deployment only supports Demo Mode', async ({ page, baseURL }) => {
  await fakeGoogleProvider(page, baseURL!, 'cancel');
  await page.goto('/planner/');
  await expect(page.locator('.auth-panel')).toBeVisible();
  const demoOnly = await page.getByRole('heading', { name: 'Cloud saving is unavailable here.', exact: true }).isVisible();
  test.skip(!demoOnly, 'This assertion covers the Demo-only build; configured behavior is tested below.');
  await expect(page.getByRole('button', { name: googleLabel, exact: true })).toHaveCount(0);
});

test('Google is offered for sign-in and signup, not email password recovery', async ({ page, baseURL }) => {
  await fakeGoogleProvider(page, baseURL!, 'cancel');
  await page.setViewportSize({ width: 320, height: 900 });
  await openConfiguredPlanner(page);
  await page.locator('.auth-tabs').getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByRole('button', { name: googleLabel, exact: true })).toBeVisible();
  await page.locator('.auth-tabs').getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByRole('button', { name: 'Forgot your password?', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Reset your password.', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: googleLabel, exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test('keyboard Google sign-in needs no password and a cancelled callback gives a safe retry', async ({ page, baseURL }) => {
  const provider = await fakeGoogleProvider(page, baseURL!, 'cancel');
  await page.setViewportSize({ width: 320, height: 900 });
  await openConfiguredPlanner(page);
  const google = page.getByRole('button', { name: googleLabel, exact: true });
  await google.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('alert')).toContainText(/cancelled|declined/i);
  await expect(google).toBeEnabled();
  expect(provider.authorizationRequests).toHaveLength(1);
  expect(provider.authorizationRequests[0].searchParams.get('provider')).toBe('google');
  expect(provider.authorizationRequests[0].searchParams.get('redirect_to')).toBe(`${new URL(baseURL!).origin}/planner/dashboard`);
  expect(provider.authorizationRequests[0].searchParams.has('access_type')).toBe(false);
  expect(provider.requests.every((request) => request.method === 'GET')).toBe(true);
  expect(page.url()).not.toMatch(/access_denied|error_description|private-provider-diagnostic/);
  await expect(page.locator('body')).not.toContainText('private-provider-diagnostic');
  await expect(page.locator('body')).not.toContainText('Enter a valid email address.');
  await expect(page.getByLabel('Password', { exact: true })).toHaveValue('');
});

test('successful Google callback opens onboarding without persisting tokens or writing a plan', async ({ page, baseURL }) => {
  const provider = await fakeGoogleProvider(page, baseURL!, 'success');
  await openConfiguredPlanner(page);
  await page.getByRole('button', { name: googleLabel, exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Build your first financial independence estimate.', exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/planner\/onboarding$/);
  expect(provider.requests.filter((request) => request.path === '/auth/v1/user')).toHaveLength(1);
  expect(provider.requests.some((request) => request.path === '/rest/v1/financial_plans' && request.bearer === `Bearer ${provider.accessToken}`)).toBe(true);
  expect(provider.requests.every((request) => request.method === 'GET')).toBe(true);
  const storedValues = await page.evaluate(() => [
    ...Object.values(localStorage), ...Object.values(sessionStorage),
  ].join('\n'));
  expect(storedValues).not.toContain(provider.accessToken);
  expect(storedValues).not.toContain(provider.refreshToken);
  expect(storedValues).not.toContain('google-test@example.invalid');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Welcome back.', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: googleLabel, exact: true })).toBeVisible();
});
