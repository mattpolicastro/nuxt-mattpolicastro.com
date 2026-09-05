# mattpolicastro.com

A [Nuxt 3](https://nuxt.com) blog powered by [Nuxt Content](https://content.nuxt.com).

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

Browse to `http://localhost:3000`.

## Build

```bash
npm run build
npm run preview
```

## Post Management

This project uses a Hexo-style CLI for managing blog posts.

### Create a Draft

```bash
npm run post -- new "Your Post Title"
```

Creates a new draft post in `content/drafts/` with frontmatter scaffolding. The post title is automatically slugified to create the filename.

### Create a Draft in Obsidian

```bash
npm run post -- draft "Your Post Title"
```

Creates a new draft in the Obsidian vault (`Areas/Personal Website/Blog/Drafts/`) with blog frontmatter including `created` timestamp. The vault is auto-detected from Obsidian's config, or set `OBSIDIAN_VAULT` to override.

### Import from Obsidian

```bash
npm run post -- import              # list available drafts
npm run post -- import "slug"       # import a specific draft
```

Copies a draft from Obsidian into `content/drafts/`, stripping Obsidian-specific syntax (wikilinks, embeds, highlights) and ensuring frontmatter matches the blog schema. The Obsidian source is deleted after import.

### Publish a Draft

```bash
npm run post -- publish slug
npm run post -- publish slug --at "2026-04-15T09:00:00Z"
```

Moves a draft from `content/drafts/` to `content/posts/`, making it live on the site. Automatically commits the published post to git.

When published:
- The `date` field is updated to the publication timestamp (or the scheduled date with `--at`)
- The `created` field preserves the original draft creation date
- The post is automatically staged and committed with message `post: [title]`

Posts with a future `date` are hidden from the site until the next build after that date passes (hourly via cron).

### List All Drafts

```bash
npm run post -- list
```

Shows all draft posts with their titles and slugs.

### Preview a Draft Locally

Start the development server in one terminal:

```bash
npm run dev
```

Then, in another terminal, validate a draft and print its preview URL:

```bash
npm run post -- preview my-post
```

Draft previews are available at `http://localhost:3000/preview/my-post`. They
read from `content/drafts/` and are deliberately unavailable in production
builds, so previewing cannot publish a post.

## Project Structure

- **`content/posts/`** — Published blog posts
- **`content/drafts/`** — Work-in-progress posts
- **`components/`** — Vue components
- **`pages/`** — Nuxt pages
- **`composables/`** — Vue composables
- **`scripts/`** — Node utility scripts
- **`scripts/lib/`** — Shared library (post-utils.js)
- **`e2e/`** — Playwright E2E tests

## Chat transcripts in posts

Use `ChatTranscript` with one `ChatMessage` per turn. These components are
auto-imported by Nuxt Content, so no import is needed in a Markdown post.

```md
::chat-transcript
  :::chat-message{speaker="Claude"}

    …those phases won't mirror. Fixing it means either fetching the session file
    over Tailscale or running the import against that daemon with `--host`.

  :::
  :::chat-message{speaker="Me" align="end"}

    So does this actually land what I'd wanted?

  :::
  :::chat-message{speaker="Claude"}

    Honestly? Partly, and arguably the wrong half.

  :::
::
```

`speaker` is the visible label. Use `align="start"` (the default) or
`align="end"` to control placement for any speaker. Message bodies support
normal Markdown, including inline code and links.
