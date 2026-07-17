#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  createDraft,
  publishDraft,
  listDrafts,
  createObsidianDraft,
  importFromObsidian,
  backupToObsidian,
  setBlueskyFeature,
  listFeaturedBluesky,
} from './lib/post-utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

const draftsDir = path.join(projectRoot, 'content', 'drafts');
const postsDir = path.join(projectRoot, 'content', 'posts');
const dataDir = path.join(projectRoot, 'data');

// Auto-detect Obsidian vault
const obsidianVault = process.env.OBSIDIAN_VAULT || (() => {
  try {
    const configPath = path.join(process.env.HOME, 'Library/Application Support/obsidian/obsidian.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const vault = Object.values(config.vaults).find(v => v.open)?.path;
    if (vault) return vault;
  } catch {}
  return null;
})();
const obsidianDraftsDir = obsidianVault
  ? path.join(obsidianVault, 'Areas/Personal Website/Blog/Drafts')
  : null;

// Ensure directories exist
if (!fs.existsSync(draftsDir)) {
  fs.mkdirSync(draftsDir, { recursive: true });
}

// Parse args
const args = process.argv.slice(2);
const command = args[0];
const arg = args[1];
const atIndex = args.indexOf('--at');
const scheduleAt = atIndex !== -1 ? args[atIndex + 1] : undefined;

try {
  switch (command) {
    case 'new': {
      const { slug } = createDraft(arg, { draftsDir });
      console.log(`✨ Draft created: content/drafts/${slug}.md`);
      console.log(`📝 Open it and add your content, then run: npm run post -- publish "${slug}"`);
      break;
    }
    case 'publish': {
      const result = publishDraft(arg, scheduleAt, { draftsDir, postsDir, projectRoot });
      console.log(result.isScheduled ? `📅 Draft scheduled!` : `🚀 Draft published!`);
      console.log(`   Moved: content/drafts/${arg}.md → content/posts/${arg}.md`);
      if (result.originalDate) {
        console.log(`   Created: ${result.originalDate}`);
        console.log(`   ${result.isScheduled ? 'Scheduled' : 'Published'}: ${result.publishDate}`);
      }
      console.log(result.committed ? `   ✓ Committed to git` : `   ⚠ Git commit failed`);
      break;
    }
    case 'list': {
      const drafts = listDrafts({ draftsDir });
      if (drafts.length === 0) {
        console.log('📭 No drafts found');
      } else {
        console.log('📋 Drafts:');
        drafts.forEach(d => console.log(`  • ${d.title} (${d.slug})`));
      }
      break;
    }
    case 'import': {
      const result = importFromObsidian(arg, { obsidianDraftsDir, draftsDir });
      if (result.list) {
        if (result.list.length === 0) {
          console.log('📭 No drafts in Obsidian');
        } else {
          console.log('📋 Obsidian drafts:');
          result.list.forEach(name => console.log(`  • ${name}`));
          console.log(`\nImport one with: npm run post -- import "slug"`);
        }
      } else {
        console.log(`✨ Imported: ${result.match} → content/drafts/${result.destSlug}.md`);
        console.log(`   Removed from Obsidian`);
        if (result.embeds.length > 0) {
          console.log(`\n⚠ ${result.embeds.length} embed(s) removed — check TODOs in the file:`);
          result.embeds.forEach(e => console.log(`  ${e}`));
        }
      }
      break;
    }
    case 'draft': {
      const { fileName } = createObsidianDraft(arg, { obsidianDraftsDir });
      console.log(`✨ Obsidian draft created: ${fileName}`);
      break;
    }
    case 'backup': {
      const { copied, skipped, total } = backupToObsidian({ postsDir, obsidianDraftsDir });
      console.log(`📦 Backed up ${total} posts to Obsidian`);
      if (copied > 0) console.log(`   ${copied} copied`);
      if (skipped > 0) console.log(`   ${skipped} unchanged`);
      break;
    }
    case 'feature':
    case 'unfeature': {
      const show = command === 'feature';
      const result = setBlueskyFeature(arg, show, { dataDir });
      const preview = result.content.replace(/\n/g, ' ').slice(0, 60);
      console.log(show
        ? `⭐ Featured on homepage: "${preview}${result.content.length > 60 ? '…' : ''}"`
        : `➖ Unfeatured: "${preview}${result.content.length > 60 ? '…' : ''}"`);
      console.log(`   ${result.url}`);
      console.log(`   ⚠ Commit data/bluesky.jsonl to publish the change.`);
      break;
    }
    case 'featured': {
      const featured = listFeaturedBluesky({ dataDir });
      if (featured.length === 0) {
        console.log('📭 No featured Bluesky posts');
      } else {
        console.log('⭐ Featured Bluesky posts:');
        featured.forEach(f => {
          const preview = f.content.replace(/\n/g, ' ').slice(0, 60);
          console.log(`  • ${preview}${f.content.length > 60 ? '…' : ''}`);
          console.log(`    ${f.url}`);
        });
      }
      break;
    }
    default:
      console.log('Post Management (Hexo-style)');
      console.log('');
      console.log('Commands:');
      console.log('  npm run post -- new "Your Post Title"');
      console.log('  npm run post -- publish slug [--at "2026-04-15T09:00:00Z"]');
      console.log('  npm run post -- list');
      console.log('  npm run post -- draft "Title"       Create draft in Obsidian');
      console.log('  npm run post -- import              List Obsidian drafts');
      console.log('  npm run post -- import "slug"       Import from Obsidian');
      console.log('  npm run post -- backup              Sync posts to Obsidian');
      console.log('  npm run post -- feature <bsky-url>  Keep a Bluesky post on the homepage feed');
      console.log('  npm run post -- unfeature <bsky-url>  Remove homepage feature flag');
      console.log('  npm run post -- featured            List featured Bluesky posts');
  }
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
