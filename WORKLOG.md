## 2026-04-10

**What:** Built an Obsidian-to-blog draft workflow (draft/import/publish commands in manage-posts.js), added scheduled post support via date filtering across all content queries, and stood up full test infrastructure (49 Vitest unit tests + 17 Playwright E2E tests). Also fixed a search results rendering bug (dark cards on light background).

**Decisions:**
- Refactored manage-posts.js into lib/post-utils.js (exported, dependency-injected functions) + thin CLI wrapper for testability
- Obsidian vault path auto-detected from app config with OBSIDIAN_VAULT env var override — no hardcoded paths in version control
- E2E tests only run in CI when layout/style/config files change, skipped for content-only pushes and hourly cron rebuilds
- Scheduled posts use future `date` frontmatter + `.where('date', '<=', now)` filters — no separate scheduling system needed, hourly rebuilds handle the rest
- Obsidian drafts deleted on import to keep this repo as the canonical source

**Next:**
- 3 commits ready to push (Obsidian workflow, date filtering + search fix, test infrastructure)
- "The Hangover" draft started in Obsidian, ready to write
- queries-quandaries.md has local modifications (pre-existing)

---

## 2026-04-10 (cont.)

**What:** Archived Bluesky + GitHub feeds as JSONL with incremental sync, redesigned archives page as a unified activity timeline with platform filters and grouped layout.

**Decisions:**
- Feed data persisted in data/*.jsonl — adapters read from local files instead of live API calls at build time
- sync-feeds.js handles API fetching, dedup by URL, and append; runs in CI hourly (rebuild.yml commits + pushes, triggering deploy)
- GitHub events API truncates PR details — added hydration step via pulls API using GITHUB_TOKEN
- Homepage capped to 30 most recent Bluesky posts; archives shows everything
- Archives condensed list format: year → month → items, with adjacent GitHub PRs from the same repo collapsed under a repo name header
- `--seed` flag on sync-feeds.js for one-time deep backfill (paginated)

**Next:**
- 6 commits ahead of origin, ready to push
- queries-quandaries.md still has local modifications (pre-existing)

---

## 2026-08-25 — Mida.so A/B testing

- Added `plugins/mida.ts` injecting the Mida optimize.js tag at prerender (replaces the React-only `mida-nextjs` package, which just emits the same script tag).
- Key via `NUXT_PUBLIC_MIDA_PROJECT_KEY`: repo secret, local `.env`, documented in `.env.example` alongside the GrowthBook key.
- Anti-flicker snippet and EU CDN not enabled; add if using visual-editor tests.
- First Mida test launched same day.
- Feed now records pushes (hydrated via compare API), new repos, and upstream issues/PRs; GitHubAdapter collapses same-repo same-day pushes. Archive seeded 17 -> 29 items.
- Removed the unused GrowthBook A/A stub and dependency.
