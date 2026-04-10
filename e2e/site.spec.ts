import { test, expect } from '@playwright/test';

// Use a desktop viewport so the navbar isn't collapsed
test.use({ viewport: { width: 1280, height: 720 } });

// ── Navigation & layout ─────────────────────────────────────────

test.describe('navigation', () => {
  test('navbar renders with expected links', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    await expect(nav.locator('a.nav-link', { hasText: 'Home' })).toBeVisible();
    await expect(nav.locator('a.nav-link', { hasText: 'About' })).toBeVisible();
    await expect(nav.locator('a.nav-link', { hasText: 'Archives' })).toBeVisible();
  });

  test('nav links navigate correctly', async ({ page }) => {
    await page.goto('/');
    await page.locator('a.nav-link', { hasText: 'Archives' }).click();
    await expect(page).toHaveURL('/archives');
    await page.locator('a.nav-link', { hasText: 'About' }).click();
    await expect(page).toHaveURL('/about');
  });

  test('footer renders', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });
});

// ── Home page ───────────────────────────────────────────────────

test.describe('home page', () => {
  test('page loads with content', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#app-shell')).toBeVisible();
  });
});

// ── Archives ────────────────────────────────────────────────────

test.describe('archives', () => {
  test('displays posts grouped by year', async ({ page }) => {
    await page.goto('/archives');
    await expect(page.locator('h1')).toContainText('Archives');
    const yearHeadings = page.locator('h2');
    expect(await yearHeadings.count()).toBeGreaterThan(0);
  });

  test('post links use date-based URLs', async ({ page }) => {
    await page.goto('/archives');
    const postLink = page.locator('a.post-link').first();
    await expect(postLink).toBeVisible();
    const href = await postLink.getAttribute('href');
    expect(href).toMatch(/^\/\d{4}\/\d{2}\/\d{2}\/.+/);
  });

  test('clicking a post navigates to it', async ({ page }) => {
    await page.goto('/archives');
    const postLink = page.locator('a.post-link').first();
    await expect(postLink).toBeVisible();
    const href = await postLink.getAttribute('href');
    await postLink.click();
    await expect(page).toHaveURL(href!);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('future-dated post does NOT appear', async ({ page }) => {
    await page.goto('/archives');
    await expect(page.locator('h1')).toContainText('Archives');
    await expect(page.locator('text=E2E Test Future Post')).not.toBeVisible();
  });
});

// ── Individual post ─────────────────────────────────────────────

test.describe('blog post', () => {
  test('renders title, date, and content', async ({ page }) => {
    await page.goto('/archives');
    const postLink = page.locator('a.post-link').first();
    await expect(postLink).toBeVisible();
    await postLink.click();
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('time')).toBeVisible();
    await expect(page.locator('.prose')).toBeVisible();
  });

  test('back link navigates to home', async ({ page }) => {
    await page.goto('/archives');
    const postLink = page.locator('a.post-link').first();
    await expect(postLink).toBeVisible();
    await postLink.click();
    await page.locator('a', { hasText: '← Home' }).first().click();
    await expect(page).toHaveURL('/');
  });

  test('non-existent slug returns 404', async ({ page }) => {
    const response = await page.goto('/2099/01/01/this-does-not-exist');
    // Static server returns 404 for missing paths
    expect(response?.status()).toBe(404);
  });

  test('future-dated post returns 404 on direct access', async ({ page }) => {
    const response = await page.goto('/2099/01/01/e2e-future-post');
    expect(response?.status()).toBe(404);
  });
});

// ── Search ──────────────────────────────────────────────────────

test.describe('search', () => {
  test('search input is present', async ({ page }) => {
    await page.goto('/search');
    await expect(page.locator('input[type="search"]').last()).toBeVisible();
  });

  test('typing a query shows results', async ({ page }) => {
    await page.goto('/search');
    const searchInput = page.locator('.col-lg-7 input[type="search"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('the');
    await expect(page.locator('.card').first()).toBeVisible({ timeout: 10000 });
  });

  test('non-matching query shows no results message', async ({ page }) => {
    await page.goto('/search');
    const searchInput = page.locator('.col-lg-7 input[type="search"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('xyzzy_no_match_ever_12345');
    await expect(page.locator('text=No results for')).toBeVisible({ timeout: 10000 });
  });
});

// ── RSS ─────────────────────────────────────────────────────────

test.describe('RSS feed', () => {
  test('returns valid XML with items', async ({ request }) => {
    const response = await request.get('/rss.xml');
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('<rss');
    expect(body).toContain('<item>');
  });

  test('does not contain future-dated post', async ({ request }) => {
    const response = await request.get('/rss.xml');
    const body = await response.text();
    expect(body).not.toContain('E2E Test Future Post');
  });
});
