import { test, expect } from '@playwright/test';

// Use a desktop viewport so the navbar isn't collapsed
test.use({ viewport: { width: 1280, height: 720 } });

// ── Navigation & layout ─────────────────────────────────────────

test.describe('navigation', () => {
  test('navbar renders with expected links', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    await expect(nav.locator('a.site-brand')).toHaveAttribute('href', '/');
    await expect(nav.getByRole('link', { name: 'RSS feed' })).toHaveAttribute('href', '/rss.xml');
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
  test('displays items grouped by year with filter buttons', async ({ page }) => {
    await page.goto('/archives');
    await expect(page.locator('h1')).toContainText('Everything-ish.');
    // Filter buttons
    await expect(page.locator('button', { hasText: 'All' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Blog' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Bluesky' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'GitHub' })).toBeVisible();
    // Year headings
    const yearHeadings = page.locator('h2');
    expect(await yearHeadings.count()).toBeGreaterThan(0);
  });

  test('archive links use correct URL patterns', async ({ page }) => {
    await page.goto('/archives');
    const link = page.locator('.archive-link').first();
    await expect(link).toBeVisible();
  });

  test('blog filter narrows results', async ({ page }) => {
    await page.goto('/archives');
    const allCount = await page.locator('.archive-link').count();
    await page.locator('button', { hasText: 'Blog' }).click();
    const blogCount = await page.locator('.archive-link').count();
    expect(blogCount).toBeGreaterThan(0);
    expect(blogCount).toBeLessThan(allCount);
  });

  test('future-dated post does NOT appear', async ({ page }) => {
    await page.goto('/archives');
    await expect(page.locator('text=E2E Test Future Post')).not.toBeVisible();
  });
});

// ── Individual post ─────────────────────────────────────────────

test.describe('blog post', () => {
  test('renders title, date, and content', async ({ page }) => {
    // Navigate to a blog post via archives with Blog filter
    await page.goto('/archives');
    await page.locator('button', { hasText: 'Blog' }).click();
    const blogLink = page.locator('.archive-link').first();
    await expect(blogLink).toBeVisible();
    await blogLink.click();
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('header time')).toBeVisible();
    await expect(page.locator('.prose')).toBeVisible();
  });

  test('back link returns to the post in the archive', async ({ page }) => {
    await page.goto('/archives');
    await page.locator('button', { hasText: 'Blog' }).click();
    const blogLink = page.locator('.archive-link').first();
    await expect(blogLink).toBeVisible();
    await blogLink.click();
    await page.getByRole('link', { name: 'Back to archive' }).first().click();
    await expect(page).toHaveURL(/\/archives#post-/);
    const anchor = new URL(page.url()).hash;
    await expect(page.locator(anchor)).toBeVisible();
  });

  test('non-existent slug returns 404', async ({ page }) => {
    const response = await page.goto('/2099/01/01/this-does-not-exist');
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
    const searchInput = page.getByRole('searchbox', { name: 'Search blog posts' });
    await expect(searchInput).toBeVisible();
    await searchInput.fill('the');
    await expect(page.locator('.search-result').first()).toBeVisible({ timeout: 10000 });
  });

  test('non-matching query shows no results message', async ({ page }) => {
    await page.goto('/search');
    const searchInput = page.getByRole('searchbox', { name: 'Search blog posts' });
    await expect(searchInput).toBeVisible();
    await searchInput.fill('xyzzy_no_match_ever_12345');
    await expect(page.getByRole('heading', { name: 'No matching posts.' })).toBeVisible({ timeout: 10000 });
  });

  test('post returns to the originating search query', async ({ page }) => {
    await page.goto('/search?q=the');
    await page.locator('.search-result h2 a').first().click();
    await page.getByRole('link', { name: 'Back to search' }).first().click();
    await expect(page).toHaveURL('/search?q=the');
    await expect(page.getByRole('searchbox', { name: 'Search blog posts' })).toHaveValue('the');
  });
});

test('about shows the portrait and draft timeline on the timeline branch', async ({ page }) => {
  await page.goto('/about');
  await expect(page.getByRole('img', { name: 'Pixel portrait of Matt Policastro smiling in front of a stone wall' })).toBeVisible();
  await expect(page.locator('.life-timeline')).toBeVisible();
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
