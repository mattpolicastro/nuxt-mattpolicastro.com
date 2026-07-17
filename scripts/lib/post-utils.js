import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function formatDate(date = new Date()) {
  return date.toISOString().split('T')[0];
}

export function stripObsidianSyntax(content) {
  return content
    .replace(/!\[\[([^\]]+)\]\]/g, '<!-- TODO: embed removed: $1 -->')
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/==([^=]+)==/g, '**$1**');
}

export function createDraft(title, { draftsDir }) {
  if (!title) {
    throw new Error('Please provide a title');
  }

  const slug = slugify(title);
  const fileName = `${slug}.md`;
  const filePath = path.join(draftsDir, fileName);

  if (fs.existsSync(filePath)) {
    throw new Error(`Draft "${fileName}" already exists`);
  }

  const timestamp = new Date().toISOString();
  const template = `---
title: ${title}
date: "${timestamp}"
description:
tags: []
---

`;

  fs.writeFileSync(filePath, template);
  return { slug, fileName };
}

export function publishDraft(slug, scheduleDate, { draftsDir, postsDir, projectRoot }) {
  if (!slug) {
    throw new Error('Please provide a draft slug');
  }

  const draftPath = path.join(draftsDir, `${slug}.md`);

  if (!fs.existsSync(draftPath)) {
    throw new Error(`Draft "${slug}.md" not found in drafts`);
  }

  let content = fs.readFileSync(draftPath, 'utf-8');

  const dateMatch = content.match(/^date: "([^"]+)"$/m);
  const originalDate = dateMatch ? dateMatch[1] : null;

  let publishDate;
  if (scheduleDate) {
    const parsed = new Date(scheduleDate);
    if (isNaN(parsed.getTime())) {
      throw new Error(`Invalid date "${scheduleDate}"`);
    }
    publishDate = parsed.toISOString();
  } else {
    publishDate = new Date().toISOString();
  }
  content = content.replace(/^date: ".*?"$/m, `date: "${publishDate}"`);

  if (originalDate) {
    content = content.replace(
      /^date: ".*?"$/m,
      `date: "${publishDate}"\ncreated: "${originalDate}"`
    );
  }

  const postPath = path.join(postsDir, `${slug}.md`);
  if (fs.existsSync(postPath)) {
    throw new Error(`Post "${slug}.md" already exists in posts`);
  }

  // Validate links before committing the move
  const bareUrlPattern = /\[([^\]]+)\]\((?!https?:\/\/|\/|#|mailto:)([^)]+)\)/g;
  const bareUrls = [...content.matchAll(bareUrlPattern)];
  if (bareUrls.length > 0) {
    const problems = bareUrls.map(m => `[${m[1]}](${m[2]})`);
    throw new Error(`Found links with missing protocol: ${problems.join(', ')}`);
  }

  fs.writeFileSync(postPath, content);
  fs.unlinkSync(draftPath);

  const isScheduled = scheduleDate && new Date(publishDate) > new Date();

  // Extract title for commit message
  const titleMatch = content.match(/^title: (.+)$/m);
  const title = titleMatch ? titleMatch[1] : slug;

  // Auto-commit
  let committed = false;
  try {
    execSync(`cd "${projectRoot}" && git add content/posts/${slug}.md && git commit -m "post: ${title}"`, {
      stdio: 'pipe',
    });
    committed = true;
  } catch {}

  return { publishDate, originalDate, isScheduled, committed, title };
}

export function requireObsidian({ obsidianDraftsDir }) {
  if (!obsidianDraftsDir || !fs.existsSync(obsidianDraftsDir)) {
    throw new Error('Obsidian vault not found. Set OBSIDIAN_VAULT to your vault path.');
  }
}

export function createObsidianDraft(title, { obsidianDraftsDir }) {
  requireObsidian({ obsidianDraftsDir });

  if (!title) {
    throw new Error('Please provide a title');
  }

  const now = new Date().toISOString();
  const fileName = `${title}.md`;
  const filePath = path.join(obsidianDraftsDir, fileName);

  if (fs.existsSync(filePath)) {
    throw new Error(`"${fileName}" already exists in Obsidian drafts`);
  }

  const template = `---\ntitle: ${title}\ndate: "${now}"\ncreated: "${now}"\ndescription: \ntags: []\n---\n\n`;

  fs.writeFileSync(filePath, template);
  return { fileName };
}

export function importFromObsidian(slug, { obsidianDraftsDir, draftsDir }) {
  requireObsidian({ obsidianDraftsDir });

  const files = fs.readdirSync(obsidianDraftsDir).filter(f => f.endsWith('.md'));

  // No arg: list available drafts
  if (!slug) {
    return { list: files.map(f => f.replace('.md', '')) };
  }

  // Find matching file
  const match = files.find(f => {
    const name = f.replace('.md', '');
    return name === slug || slugify(name) === slug;
  });

  if (!match) {
    throw new Error(`No Obsidian draft matching "${slug}". Available: ${files.map(f => f.replace('.md', '')).join(', ')}`);
  }

  const obsidianPath = path.join(obsidianDraftsDir, match);
  let content = fs.readFileSync(obsidianPath, 'utf-8');

  const hasFrontmatter = content.startsWith('---');
  const now = new Date().toISOString();
  const title = match.replace('.md', '');
  const destSlug = slugify(title);

  if (hasFrontmatter) {
    const parts = content.split(/^---$/m);
    if (parts.length >= 3) {
      const frontmatter = parts[1];
      const body = parts.slice(2).join('---');
      let fm = frontmatter;
      if (!fm.match(/^date:/m)) fm += `\ndate: "${now}"`;
      if (!fm.match(/^title:/m)) fm += `\ntitle: ${title}`;
      if (!fm.match(/^description:/m)) fm += `\ndescription: `;
      if (!fm.match(/^tags:/m)) fm += `\ntags: []`;
      content = `---${fm}\n---${stripObsidianSyntax(body)}`;
    }
  } else {
    content = `---\ntitle: ${title}\ndate: "${now}"\ndescription: \ntags: []\n---\n\n${stripObsidianSyntax(content)}`;
  }

  const destPath = path.join(draftsDir, `${destSlug}.md`);
  if (fs.existsSync(destPath)) {
    throw new Error(`Draft "${destSlug}.md" already exists in drafts`);
  }

  fs.writeFileSync(destPath, content);

  const embeds = content.match(/<!-- TODO: embed removed: .+? -->/g);

  // Remove from Obsidian
  fs.unlinkSync(obsidianPath);

  return { match, destSlug, embeds: embeds || [] };
}

export function backupToObsidian({ postsDir, obsidianDraftsDir }) {
  requireObsidian({ obsidianDraftsDir });

  // Posts go in a sibling "Posts" folder next to "Drafts"
  const obsidianPostsDir = path.join(path.dirname(obsidianDraftsDir), 'Posts');
  if (!fs.existsSync(obsidianPostsDir)) {
    fs.mkdirSync(obsidianPostsDir, { recursive: true });
  }

  const posts = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));
  let copied = 0;
  let skipped = 0;

  for (const file of posts) {
    const src = path.join(postsDir, file);
    const srcContent = fs.readFileSync(src, 'utf-8');

    // Use the title from frontmatter as the Obsidian filename
    const titleMatch = srcContent.match(/^title: (.+)$/m);
    const title = titleMatch ? titleMatch[1] : file.replace('.md', '');
    const destFile = `${title}.md`;
    const dest = path.join(obsidianPostsDir, destFile);

    if (fs.existsSync(dest)) {
      const destContent = fs.readFileSync(dest, 'utf-8');
      if (destContent === srcContent) {
        skipped++;
        continue;
      }
    }

    fs.writeFileSync(dest, srcContent);
    copied++;
  }

  return { copied, skipped, total: posts.length };
}

// Match a Bluesky post by its full URL or just its rkey (last path segment).
function matchesBsky(item, urlOrKey) {
  return item.url === urlOrKey || item.url.split('/').at(-1) === urlOrKey;
}

/**
 * Toggle the homepage curation flag on a Bluesky post in data/bluesky.jsonl.
 * Rewrites only the matched line (others are passed through verbatim), so it
 * plays nicely with the append-only feed sync.
 */
export function setBlueskyFeature(urlOrKey, show, { dataDir }) {
  if (!urlOrKey) {
    throw new Error('Please provide a Bluesky post URL or rkey');
  }

  const file = path.join(dataDir, 'bluesky.jsonl');
  if (!fs.existsSync(file)) {
    throw new Error('data/bluesky.jsonl not found');
  }

  const lines = fs.readFileSync(file, 'utf-8').split('\n').filter(Boolean);
  let matched = null;
  const out = lines.map(line => {
    const item = JSON.parse(line);
    if (!matchesBsky(item, urlOrKey)) return line;
    matched = item;
    if (show) item.show = true;
    else delete item.show;
    return JSON.stringify(item);
  });

  if (!matched) {
    throw new Error(`No Bluesky post found matching "${urlOrKey}"`);
  }

  fs.writeFileSync(file, out.join('\n') + '\n');
  return { url: matched.url, content: matched.content, show: !!show };
}

export function listFeaturedBluesky({ dataDir }) {
  const file = path.join(dataDir, 'bluesky.jsonl');
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line))
    .filter(item => item.show)
    .map(item => ({ url: item.url, content: item.content }));
}

export function listDrafts({ draftsDir }) {
  const files = fs.readdirSync(draftsDir).filter(f => f.endsWith('.md'));
  return files.map(f => {
    const content = fs.readFileSync(path.join(draftsDir, f), 'utf-8');
    const titleMatch = content.match(/^title: (.+)$/m);
    return {
      title: titleMatch ? titleMatch[1] : 'Untitled',
      slug: f.replace('.md', ''),
    };
  });
}
