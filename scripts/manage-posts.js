#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

const DRAFTS_DIR = path.join(projectRoot, 'content', 'drafts');
const POSTS_DIR = path.join(projectRoot, 'content', 'posts');

// Ensure directories exist
if (!fs.existsSync(DRAFTS_DIR)) {
  fs.mkdirSync(DRAFTS_DIR, { recursive: true });
}

function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function formatDate(date = new Date()) {
  return date.toISOString().split('T')[0];
}

function createDraft(title) {
  if (!title) {
    console.error('Error: Please provide a title');
    console.error('Usage: npm run post -- new "My Post Title"');
    process.exit(1);
  }

  const slug = slugify(title);
  const now = new Date();
  const timestamp = now.toISOString();
  const fileName = `${slug}.md`;
  const filePath = path.join(DRAFTS_DIR, fileName);

  if (fs.existsSync(filePath)) {
    console.error(`Error: Draft "${fileName}" already exists`);
    process.exit(1);
  }

  const template = `---
title: ${title}
date: "${timestamp}"
description: 
tags: []
---

`;

  fs.writeFileSync(filePath, template);
  console.log(`✨ Draft created: content/drafts/${fileName}`);
  console.log(`📝 Open it and add your content, then run: npm run post -- publish "${slug}"`);
}

function publishDraft(slug) {
  if (!slug) {
    console.error('Error: Please provide a draft slug');
    console.error('Usage: npm run post -- publish "my-post-slug"');
    process.exit(1);
  }

  const draftPath = path.join(DRAFTS_DIR, `${slug}.md`);

  if (!fs.existsSync(draftPath)) {
    console.error(`Error: Draft "${slug}.md" not found in content/drafts`);
    process.exit(1);
  }

  // Read the draft
  let content = fs.readFileSync(draftPath, 'utf-8');

  // Extract the original date from the draft
  const dateMatch = content.match(/^date: "([^"]+)"$/m);
  const originalDate = dateMatch ? dateMatch[1] : null;

  // Update to published date
  const today = new Date();
  const publishDate = today.toISOString();
  content = content.replace(/^date: ".*?"$/m, `date: "${publishDate}"`);

  // Add created field if original date exists
  if (originalDate) {
    content = content.replace(
      /^date: ".*?"$/m,
      `date: "${publishDate}"\ncreated: "${originalDate}"`
    );
  }

  // Write to posts folder
  const postPath = path.join(POSTS_DIR, `${slug}.md`);
  if (fs.existsSync(postPath)) {
    console.error(`Error: Post "${slug}.md" already exists in content/posts`);
    process.exit(1);
  }

  fs.writeFileSync(postPath, content);
  fs.unlinkSync(draftPath);

  console.log(`🚀 Draft published!`);
  console.log(`   Moved: content/drafts/${slug}.md → content/posts/${slug}.md`);
  if (originalDate) {
    console.log(`   Created: ${originalDate}`);
    console.log(`   Published: ${publishDate}`);
  }

  // Check for bare URLs in markdown links (missing protocol)
  const bareUrlPattern = /\[([^\]]+)\]\((?!https?:\/\/|\/|#|mailto:)([^)]+)\)/g;
  const bareUrls = [...content.matchAll(bareUrlPattern)];
  if (bareUrls.length > 0) {
    console.error(`\n❌ Found links with missing protocol:`);
    bareUrls.forEach(m => console.error(`   [${m[1]}](${m[2]}) — did you mean https://${m[2]}?`));
    // Restore the draft
    fs.writeFileSync(draftPath, fs.readFileSync(postPath, 'utf-8'));
    fs.unlinkSync(postPath);
    console.error(`\n   Draft restored. Fix the links and try again.`);
    process.exit(1);
  }

  // Extract title from content for commit message
  const titleMatch = content.match(/^title: (.+)$/m);
  const title = titleMatch ? titleMatch[1] : slug;

  // Commit the published post
  try {
    execSync(`cd "${projectRoot}" && git add content/posts/${slug}.md && git commit -m "post: ${title}"`, {
      stdio: 'pipe',
    });
    console.log(`   ✓ Committed to git`);
  } catch (error) {
    console.warn(`   ⚠ Git commit failed (continue without auto-commit if desired)`);
  }
}

// Get command and arguments
const command = process.argv[2];
const arg = process.argv[3];

switch (command) {
  case 'new':
    createDraft(arg);
    break;
  case 'publish':
    publishDraft(arg);
    break;
  case 'list':
    const drafts = fs.readdirSync(DRAFTS_DIR);
    if (drafts.length === 0) {
      console.log('📭 No drafts found');
    } else {
      console.log('📋 Drafts:');
      drafts.forEach(f => {
        const content = fs.readFileSync(path.join(DRAFTS_DIR, f), 'utf-8');
        const titleMatch = content.match(/^title: (.+)$/m);
        const title = titleMatch ? titleMatch[1] : 'Untitled';
        const slug = f.replace('.md', '');
        console.log(`  • ${title} (${slug})`);
      });
    }
    break;
  default:
    console.log('Post Management (Hexo-style)');
    console.log('');
    console.log('Commands:');
    console.log('  npm run post -- new "Your Post Title"');
    console.log('  npm run post -- publish slug');
    console.log('  npm run post -- list');
}
