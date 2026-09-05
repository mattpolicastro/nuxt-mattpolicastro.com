#!/usr/bin/env node

// ============================================================
// Feed sync — fetch Bluesky + GitHub activity, append new items
// to JSONL archives. Run with --seed for deep backfill.
// ============================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const DATA_DIR = path.join(projectRoot, 'data');

const SEED = process.argv.includes('--seed');

// ---- JSONL helpers ──────────────────────────────────────────

function readArchive(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs.readFileSync(filePath, 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line));
}

function appendItems(filePath, items) {
  if (items.length === 0) return;
  const lines = items.map(item => JSON.stringify(item)).join('\n') + '\n';
  fs.appendFileSync(filePath, lines);
}

// ---- Bluesky fetch ─────────────────────────────────────────

const BLUESKY_HANDLE = 'mattpolicastro.com';
const BSKY_BASE = 'https://public.api.bsky.app';

function atUriToWebUrl(uri, handle) {
  const rkey = uri.split('/').at(-1) ?? '';
  return `https://bsky.app/profile/${handle}/post/${rkey}`;
}

function extractQuote(embed) {
  if (!embed) return undefined;
  let recordView;
  if (embed.$type === 'app.bsky.embed.record#view') {
    recordView = embed;
  } else if (embed.$type === 'app.bsky.embed.recordWithMedia#view') {
    recordView = embed.record;
  }
  if (!recordView) return undefined;
  const record = recordView.record;
  if (record.$type !== 'app.bsky.embed.record#viewRecord') return undefined;
  return {
    url: atUriToWebUrl(record.uri, record.author.handle),
    author: record.author.displayName
      ? `${record.author.displayName} (@${record.author.handle})`
      : `@${record.author.handle}`,
    text: record.value?.text ?? '',
  };
}

function extractImages(embed) {
  if (!embed) return undefined;
  let imagesEmbed;
  if (embed.$type === 'app.bsky.embed.images#view') {
    imagesEmbed = embed;
  } else if (embed.$type === 'app.bsky.embed.recordWithMedia#view') {
    const media = embed.media;
    if (media.$type === 'app.bsky.embed.images#view') imagesEmbed = media;
  }
  if (!imagesEmbed?.images?.length) return undefined;
  return imagesEmbed.images.map(img => ({ url: img.thumb, alt: img.alt }));
}

function extractVideo(embed, postUrl) {
  if (!embed) return undefined;
  let videoEmbed;
  if (embed.$type === 'app.bsky.embed.video#view') {
    videoEmbed = embed;
  } else if (embed.$type === 'app.bsky.embed.recordWithMedia#view') {
    const media = embed.media;
    if (media.$type === 'app.bsky.embed.video#view') videoEmbed = media;
  }
  if (!videoEmbed) return undefined;
  return { thumbnailUrl: videoEmbed.thumbnail, url: postUrl };
}

async function fetchBlueskyPosts() {
  const items = [];
  let cursor = undefined;
  const maxPages = SEED ? 7 : 1; // ~30 per page, seed gets ~200
  const limit = 30;

  for (let page = 0; page < maxPages; page++) {
    const url = new URL(`${BSKY_BASE}/xrpc/app.bsky.feed.getAuthorFeed`);
    url.searchParams.set('actor', BLUESKY_HANDLE);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('filter', 'posts_no_replies');
    if (cursor) url.searchParams.set('cursor', cursor);

    const response = await fetch(url.toString());
    if (!response.ok) {
      console.warn(`[Bluesky] HTTP ${response.status}`);
      break;
    }

    const data = await response.json();
    const posts = data.feed
      .filter(({ reason, post }) => !reason && !post.record.reply)
      .map(({ post }) => {
        const postUrl = atUriToWebUrl(post.uri, post.author.handle);
        const quote = extractQuote(post.embed);
        const images = extractImages(post.embed);
        const video = extractVideo(post.embed, postUrl);
        return {
          platform: 'bluesky',
          type: quote ? 'quote_post' : 'skeet',
          date: post.record.createdAt,
          content: post.record.text,
          url: postUrl,
          ...(quote && { quote }),
          ...(images && { images }),
          ...(video && { video }),
        };
      });

    items.push(...posts);
    cursor = data.cursor;
    if (!cursor || posts.length === 0) break;
  }

  return items;
}

// ---- GitHub fetch ───────────────────────────────────────────

const GITHUB_USERNAME = 'mattpolicastro';
const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

function githubHeaders() {
  const headers = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (GITHUB_TOKEN) headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
  return headers;
}

/** Fetch full PR title from the pulls API (events API truncates it). */
async function hydratePrTitle(repoName, prNumber) {
  try {
    const url = `${GITHUB_API_BASE}/repos/${repoName}/pulls/${prNumber}`;
    const response = await fetch(url, { headers: githubHeaders() });
    if (response.ok) {
      const pr = await response.json();
      return pr.title;
    }
  } catch {}
  return null;
}

/** Upstream contributions (issues/PRs on other people's repos) are surfaced; own-repo issues are not. */
function isOwnRepo(repoName) {
  return repoName.toLowerCase().startsWith(`${GITHUB_USERNAME.toLowerCase()}/`);
}

/** Public events omit the commit list — fetch it from the compare API. */
async function hydratePushCommits(repoName, before, head) {
  try {
    const url = `${GITHUB_API_BASE}/repos/${repoName}/compare/${before}...${head}`;
    const response = await fetch(url, { headers: githubHeaders() });
    if (response.ok) {
      const cmp = await response.json();
      return (cmp.commits ?? []).map(c => ({ message: c.commit.message }));
    }
  } catch {}
  return [];
}

async function fetchGitHubEvents() {
  const items = [];
  const maxPages = SEED ? 3 : 1;

  for (let page = 1; page <= maxPages; page++) {
    const url = new URL(`${GITHUB_API_BASE}/users/${GITHUB_USERNAME}/events/public`);
    url.searchParams.set('per_page', '100');
    url.searchParams.set('page', String(page));

    const response = await fetch(url.toString(), { headers: githubHeaders() });
    if (!response.ok) {
      console.warn(`[GitHub] HTTP ${response.status}`);
      break;
    }

    const events = await response.json();
    if (events.length === 0) break;

    for (const event of events) {
      if (event.type === 'PullRequestEvent') {
        const pr = event.payload.pull_request;
        const action = event.payload.action;
        // GitHub events API uses action:"merged" or action:"closed" + merged:true
        const isMerged = action === 'merged' || (action === 'closed' && pr?.merged);
        if (isMerged) {
          // Events API truncates PR details — hydrate from pulls API
          const repoName = event.repo.name;
          const prNumber = event.payload.number ?? pr?.number;
          const htmlUrl = pr?.html_url || `https://github.com/${repoName}/pull/${prNumber}`;
          const title = pr?.title || await hydratePrTitle(repoName, prNumber) || `#${prNumber}`;
          items.push({
            platform: 'github',
            type: 'pr_merged',
            date: event.created_at,
            title,
            content: `Merged PR in ${repoName}: "${title}"`,
            url: htmlUrl,
          });
        }
      } else if (event.type === 'PushEvent') {
        const repoName = event.repo.name;
        const commits = await hydratePushCommits(repoName, event.payload.before, event.payload.head);
        const count = commits.length;
        if (count === 0) continue;
        const branch = (event.payload.ref ?? '').replace('refs/heads/', '');
        const subjects = commits.map(c => c.message.split('\n')[0]);
        const noun = count === 1 ? 'commit' : 'commits';
        const compareUrl = `https://github.com/${repoName}/compare/${event.payload.before}...${event.payload.head}`;
        items.push({
          platform: 'github',
          type: 'push',
          date: event.created_at,
          title: subjects[0] ?? `${count} ${noun}`,
          content: [
            `Pushed ${count} ${noun} to ${repoName}${branch && branch !== 'main' ? ` (${branch})` : ''}`,
            ...subjects.slice(1).map(s => `• ${s}`),
          ].join('\n'),
          url: compareUrl,
        });
      } else if (event.type === 'CreateEvent' && event.payload.ref_type === 'repository') {
        items.push({
          platform: 'github',
          type: 'repo_created',
          date: event.created_at,
          title: event.repo.name,
          content: `Created a new repository: ${event.repo.name}`,
          url: `https://github.com/${event.repo.name}`,
        });
      } else if (event.type === 'IssuesEvent' && event.payload.action === 'opened' && !isOwnRepo(event.repo.name)) {
        const issue = event.payload.issue;
        items.push({
          platform: 'github',
          type: 'issue_opened',
          date: event.created_at,
          title: issue.title,
          content: `Opened issue in ${event.repo.name}: "${issue.title}"`,
          url: issue.html_url,
        });
      } else if (event.type === 'PullRequestEvent' && event.payload.action === 'opened' && !isOwnRepo(event.repo.name)) {
        const pr = event.payload.pull_request;
        items.push({
          platform: 'github',
          type: 'pr_opened',
          date: event.created_at,
          title: pr.title,
          content: `Opened PR in ${event.repo.name}: "${pr.title}"`,
          url: pr.html_url,
        });
      } else if (event.type === 'ReleaseEvent') {
        const release = event.payload.release;
        if (event.payload.action === 'published' && release) {
          const displayName = release.name || release.tag_name;
          items.push({
            platform: 'github',
            type: 'release',
            date: event.created_at,
            title: displayName,
            content: `Released ${displayName} in ${event.repo.name}`,
            url: release.html_url,
          });
        }
      }
    }
  }

  return items;
}

// ---- Main ──────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const bskyPath = path.join(DATA_DIR, 'bluesky.jsonl');
  const ghPath = path.join(DATA_DIR, 'github.jsonl');

  // Load existing URLs for dedup
  const existingBsky = new Set(readArchive(bskyPath).map(i => i.url));
  const existingGh = new Set(readArchive(ghPath).map(i => i.url));

  // Fetch live
  console.log(`Fetching Bluesky posts${SEED ? ' (seed mode)' : ''}...`);
  const bskyPosts = await fetchBlueskyPosts();
  const newBsky = bskyPosts.filter(p => !existingBsky.has(p.url));

  console.log(`Fetching GitHub events${SEED ? ' (seed mode)' : ''}...`);
  const ghEvents = await fetchGitHubEvents();
  const newGh = ghEvents.filter(e => !existingGh.has(e.url));

  // Append
  appendItems(bskyPath, newBsky);
  appendItems(ghPath, newGh);

  console.log(`Bluesky: ${newBsky.length} new (${existingBsky.size + newBsky.length} total)`);
  console.log(`GitHub: ${newGh.length} new (${existingGh.size + newGh.length} total)`);

  if (newBsky.length === 0 && newGh.length === 0) {
    console.log('No new items.');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
