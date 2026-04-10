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
