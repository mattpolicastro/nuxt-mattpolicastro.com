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

### Publish a Draft

```bash
npm run post -- publish slug
```

Moves a draft from `content/drafts/` to `content/posts/`, making it live on the site. Automatically commits the published post to git.

When published:
- The `date` field is updated to the publication timestamp
- The `created` field preserves the original draft creation date
- The post is automatically staged and committed with message `post: [title]`

Example:
```bash
npm run post -- publish "my-post-title"
```

### List All Drafts

```bash
npm run post -- list
```

Shows all draft posts with their titles and slugs.

## Project Structure

- **`content/posts/`** — Published blog posts
- **`content/drafts/`** — Work-in-progress posts
- **`components/`** — Vue components
- **`pages/`** — Nuxt pages
- **`composables/`** — Vue composables
- **`scripts/`** — Node utility scripts
