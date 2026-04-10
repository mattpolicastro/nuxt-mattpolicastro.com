import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  slugify,
  formatDate,
  stripObsidianSyntax,
  createDraft,
  publishDraft,
  listDrafts,
  requireObsidian,
  createObsidianDraft,
  importFromObsidian,
} from './post-utils.js';

// ── Pure functions ──────────────────────────────────────────────

describe('slugify', () => {
  it('converts spaces to hyphens', () => {
    expect(slugify('My Post Title')).toBe('my-post-title');
  });

  it('strips punctuation', () => {
    expect(slugify('Hello, World!')).toBe('hello-world');
  });

  it('trims whitespace', () => {
    expect(slugify('  Leading and trailing  ')).toBe('leading-and-trailing');
  });

  it('collapses consecutive hyphens', () => {
    expect(slugify('multiple---hyphens')).toBe('multiple-hyphens');
  });

  it('lowercases', () => {
    expect(slugify('UPPERCASE')).toBe('uppercase');
  });

  it('is idempotent on clean input', () => {
    expect(slugify('already-a-slug')).toBe('already-a-slug');
  });

  it('preserves numbers', () => {
    expect(slugify('post with 123 numbers')).toBe('post-with-123-numbers');
  });

  it('handles empty string', () => {
    expect(slugify('')).toBe('');
  });
});

describe('formatDate', () => {
  it('extracts date portion from ISO string', () => {
    expect(formatDate(new Date('2026-04-09T15:30:00Z'))).toBe('2026-04-09');
  });

  it('handles midnight boundary', () => {
    expect(formatDate(new Date('2025-01-01T00:00:00Z'))).toBe('2025-01-01');
  });

  it('defaults to today', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(formatDate()).toBe(today);
  });
});

describe('stripObsidianSyntax', () => {
  it('converts embeds to TODO comments', () => {
    expect(stripObsidianSyntax('![[image.png]]')).toBe('<!-- TODO: embed removed: image.png -->');
  });

  it('handles embeds with spaces', () => {
    expect(stripObsidianSyntax('![[file with spaces.pdf]]')).toBe('<!-- TODO: embed removed: file with spaces.pdf -->');
  });

  it('converts wikilinks with alias', () => {
    expect(stripObsidianSyntax('[[page|alias]]')).toBe('alias');
  });

  it('converts plain wikilinks', () => {
    expect(stripObsidianSyntax('[[simple link]]')).toBe('simple link');
  });

  it('converts highlights to bold', () => {
    expect(stripObsidianSyntax('==highlighted text==')).toBe('**highlighted text**');
  });

  it('passes through standard markdown', () => {
    const md = 'Normal markdown **bold** text';
    expect(stripObsidianSyntax(md)).toBe(md);
  });

  it('handles no-op on clean content', () => {
    const clean = 'No obsidian syntax here';
    expect(stripObsidianSyntax(clean)).toBe(clean);
  });

  it('handles combined syntax', () => {
    const input = 'See ![[diagram.png]] and [[page|click here]] or [[other page]] with ==emphasis==';
    const expected = 'See <!-- TODO: embed removed: diagram.png --> and click here or other page with **emphasis**';
    expect(stripObsidianSyntax(input)).toBe(expected);
  });
});

// ── File system operations ──────────────────────────────────────

let tmpDir;
let draftsDir;
let postsDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'post-utils-'));
  draftsDir = path.join(tmpDir, 'drafts');
  postsDir = path.join(tmpDir, 'posts');
  fs.mkdirSync(draftsDir);
  fs.mkdirSync(postsDir);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true });
});

describe('createDraft', () => {
  it('creates file at correct slugified path', () => {
    const { slug, fileName } = createDraft('My Test Post', { draftsDir });
    expect(slug).toBe('my-test-post');
    expect(fileName).toBe('my-test-post.md');
    expect(fs.existsSync(path.join(draftsDir, fileName))).toBe(true);
  });

  it('generates correct frontmatter', () => {
    createDraft('Test Post', { draftsDir });
    const content = fs.readFileSync(path.join(draftsDir, 'test-post.md'), 'utf-8');
    expect(content).toContain('title: Test Post');
    expect(content).toMatch(/^date: ".+"$/m);
    expect(content).toContain('description:');
    expect(content).toContain('tags: []');
  });

  it('throws on empty title', () => {
    expect(() => createDraft('', { draftsDir })).toThrow('Please provide a title');
  });

  it('throws on duplicate slug', () => {
    createDraft('Duplicate', { draftsDir });
    expect(() => createDraft('Duplicate', { draftsDir })).toThrow('already exists');
  });
});

describe('publishDraft', () => {
  function writeDraft(slug, content) {
    fs.writeFileSync(path.join(draftsDir, `${slug}.md`), content);
  }

  const sampleDraft = `---
title: Test
date: "2026-01-01T00:00:00.000Z"
description: A test
tags: []
---

Hello world.
`;

  it('moves file from drafts to posts', () => {
    writeDraft('test', sampleDraft);
    publishDraft('test', undefined, { draftsDir, postsDir, projectRoot: tmpDir });
    expect(fs.existsSync(path.join(draftsDir, 'test.md'))).toBe(false);
    expect(fs.existsSync(path.join(postsDir, 'test.md'))).toBe(true);
  });

  it('updates date and preserves created', () => {
    writeDraft('test', sampleDraft);
    const before = new Date().toISOString();
    publishDraft('test', undefined, { draftsDir, postsDir, projectRoot: tmpDir });
    const content = fs.readFileSync(path.join(postsDir, 'test.md'), 'utf-8');
    expect(content).toContain('created: "2026-01-01T00:00:00.000Z"');
    expect(content).toMatch(/^date: ".+"$/m);
    const dateMatch = content.match(/^date: "([^"]+)"$/m);
    expect(new Date(dateMatch[1]).getTime()).toBeGreaterThanOrEqual(new Date(before).getTime());
  });

  it('sets future schedule date correctly', () => {
    writeDraft('test', sampleDraft);
    const result = publishDraft('test', '2099-01-01T00:00:00Z', { draftsDir, postsDir, projectRoot: tmpDir });
    expect(result.publishDate).toBe('2099-01-01T00:00:00.000Z');
    expect(result.isScheduled).toBe(true);
    const content = fs.readFileSync(path.join(postsDir, 'test.md'), 'utf-8');
    expect(content).toContain('date: "2099-01-01T00:00:00.000Z"');
  });

  it('rejects invalid schedule date', () => {
    writeDraft('test', sampleDraft);
    expect(() => publishDraft('test', 'not-a-date', { draftsDir, postsDir, projectRoot: tmpDir }))
      .toThrow('Invalid date');
  });

  it('catches bare URLs and throws', () => {
    const badDraft = sampleDraft.replace('Hello world.', 'Check [this](example.com)');
    writeDraft('test', badDraft);
    expect(() => publishDraft('test', undefined, { draftsDir, postsDir, projectRoot: tmpDir }))
      .toThrow('missing protocol');
    // Draft should NOT have been deleted (post was not created successfully)
    // The function writes then deletes then validates — but now validation is before the move
    // Actually, looking at the code: validation happens before writeFile now
  });

  it('passes valid link protocols', () => {
    const goodDraft = sampleDraft.replace(
      'Hello world.',
      '[a](https://example.com) [b](/path) [c](#anchor) [d](mailto:x@y.com)'
    );
    writeDraft('test', goodDraft);
    expect(() => publishDraft('test', undefined, { draftsDir, postsDir, projectRoot: tmpDir }))
      .not.toThrow();
  });

  it('throws on missing slug', () => {
    expect(() => publishDraft('', undefined, { draftsDir, postsDir, projectRoot: tmpDir }))
      .toThrow('Please provide a draft slug');
  });

  it('throws on non-existent draft', () => {
    expect(() => publishDraft('nope', undefined, { draftsDir, postsDir, projectRoot: tmpDir }))
      .toThrow('not found');
  });

  it('throws on duplicate post', () => {
    writeDraft('test', sampleDraft);
    fs.writeFileSync(path.join(postsDir, 'test.md'), 'existing');
    expect(() => publishDraft('test', undefined, { draftsDir, postsDir, projectRoot: tmpDir }))
      .toThrow('already exists');
  });
});

describe('listDrafts', () => {
  it('returns empty array when no drafts', () => {
    expect(listDrafts({ draftsDir })).toEqual([]);
  });

  it('returns title and slug for each draft', () => {
    fs.writeFileSync(path.join(draftsDir, 'my-post.md'), '---\ntitle: My Post\n---\n');
    const result = listDrafts({ draftsDir });
    expect(result).toEqual([{ title: 'My Post', slug: 'my-post' }]);
  });
});

// ── Obsidian operations ─────────────────────────────────────────

describe('requireObsidian', () => {
  it('throws when path is null', () => {
    expect(() => requireObsidian({ obsidianDraftsDir: null })).toThrow('vault not found');
  });

  it('throws when path does not exist', () => {
    expect(() => requireObsidian({ obsidianDraftsDir: '/nonexistent/path' })).toThrow('vault not found');
  });

  it('passes when path exists', () => {
    expect(() => requireObsidian({ obsidianDraftsDir: draftsDir })).not.toThrow();
  });
});

describe('createObsidianDraft', () => {
  it('creates file with correct frontmatter', () => {
    const { fileName } = createObsidianDraft('My Draft', { obsidianDraftsDir: draftsDir });
    expect(fileName).toBe('My Draft.md');
    const content = fs.readFileSync(path.join(draftsDir, fileName), 'utf-8');
    expect(content).toContain('title: My Draft');
    expect(content).toMatch(/^date: ".+"$/m);
    expect(content).toMatch(/^created: ".+"$/m);
  });

  it('uses original title as filename (not slugified)', () => {
    createObsidianDraft('Title With Spaces', { obsidianDraftsDir: draftsDir });
    expect(fs.existsSync(path.join(draftsDir, 'Title With Spaces.md'))).toBe(true);
  });

  it('throws on empty title', () => {
    expect(() => createObsidianDraft('', { obsidianDraftsDir: draftsDir })).toThrow('Please provide a title');
  });

  it('throws on duplicate', () => {
    createObsidianDraft('Dup', { obsidianDraftsDir: draftsDir });
    expect(() => createObsidianDraft('Dup', { obsidianDraftsDir: draftsDir })).toThrow('already exists');
  });
});

describe('importFromObsidian', () => {
  let obsidianDir;

  beforeEach(() => {
    obsidianDir = path.join(tmpDir, 'obsidian-drafts');
    fs.mkdirSync(obsidianDir);
  });

  it('lists available drafts when no slug given', () => {
    fs.writeFileSync(path.join(obsidianDir, 'Post One.md'), 'content');
    fs.writeFileSync(path.join(obsidianDir, 'Post Two.md'), 'content');
    const result = importFromObsidian(undefined, { obsidianDraftsDir: obsidianDir, draftsDir });
    expect(result.list).toEqual(['Post One', 'Post Two']);
  });

  it('imports file with frontmatter, strips Obsidian syntax in body only', () => {
    const content = '---\ntitle: Test\ndate: "2026-01-01T00:00:00Z"\ntags: []\n---\n\nSee [[link]] here.';
    fs.writeFileSync(path.join(obsidianDir, 'Test.md'), content);
    const result = importFromObsidian('Test', { obsidianDraftsDir: obsidianDir, draftsDir });
    const imported = fs.readFileSync(path.join(draftsDir, 'test.md'), 'utf-8');
    expect(imported).toContain('title: Test');
    expect(imported).toContain('See link here.');
    expect(imported).not.toContain('[[');
    expect(result.destSlug).toBe('test');
  });

  it('wraps content without frontmatter', () => {
    fs.writeFileSync(path.join(obsidianDir, 'Bare Post.md'), 'Just some text with [[a link]].');
    importFromObsidian('bare-post', { obsidianDraftsDir: obsidianDir, draftsDir });
    const imported = fs.readFileSync(path.join(draftsDir, 'bare-post.md'), 'utf-8');
    expect(imported).toMatch(/^---$/m);
    expect(imported).toContain('title: Bare Post');
    expect(imported).toContain('Just some text with a link.');
  });

  it('adds missing required frontmatter fields', () => {
    fs.writeFileSync(path.join(obsidianDir, 'Partial.md'), '---\ntitle: Partial\n---\n\nBody.');
    importFromObsidian('Partial', { obsidianDraftsDir: obsidianDir, draftsDir });
    const imported = fs.readFileSync(path.join(draftsDir, 'partial.md'), 'utf-8');
    expect(imported).toMatch(/^date:/m);
    expect(imported).toMatch(/^tags:/m);
  });

  it('deletes source file after import', () => {
    fs.writeFileSync(path.join(obsidianDir, 'Delete Me.md'), 'content');
    importFromObsidian('delete-me', { obsidianDraftsDir: obsidianDir, draftsDir });
    expect(fs.existsSync(path.join(obsidianDir, 'Delete Me.md'))).toBe(false);
  });

  it('flags embeds', () => {
    fs.writeFileSync(path.join(obsidianDir, 'Embeds.md'), 'Text ![[image.png]] more ![[doc.pdf]]');
    const result = importFromObsidian('Embeds', { obsidianDraftsDir: obsidianDir, draftsDir });
    expect(result.embeds).toHaveLength(2);
  });

  it('matches by slugified name', () => {
    fs.writeFileSync(path.join(obsidianDir, 'My Cool Post.md'), 'content');
    const result = importFromObsidian('my-cool-post', { obsidianDraftsDir: obsidianDir, draftsDir });
    expect(result.match).toBe('My Cool Post.md');
  });

  it('throws on non-existent draft', () => {
    expect(() => importFromObsidian('nope', { obsidianDraftsDir: obsidianDir, draftsDir }))
      .toThrow('No Obsidian draft matching');
  });
});
