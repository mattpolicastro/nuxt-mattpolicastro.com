import { queryCollection } from '@nuxt/content/server'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import { toHtml } from 'hast-util-to-html'

// TODO: Set this to your actual production URL (no trailing slash).
const SITE_URL = 'https://mattpolicastro.com'
const SITE_TITLE = 'Matt Policastro'
const SITE_DESCRIPTION = 'Writing on development, tools, and whatever else catches my attention.'

/** Escape the five XML special characters. */
function xmlEscape(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Build the canonical post URL from a date string and slug. */
function postUrl(date: string, slug: string): string {
  const [year = '', month = '', day = ''] = date.slice(0, 10).split('-')
  return `${SITE_URL}/${year}/${month.padStart(2, '0')}/${day.padStart(2, '0')}/${slug}`
}

/** Format a date string as RFC 2822 for the <pubDate> element. */
function rfc2822(dateStr: string): string {
  // Parse date-only strings as noon UTC to avoid off-by-one day issues.
  const normalized = dateStr.length === 10 ? `${dateStr}T12:00:00Z` : dateStr
  return new Date(normalized).toUTCString()
}

/** Strip YAML frontmatter from markdown source. */
function stripFrontmatter(md: string): string {
  const match = md.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/)
  return match ? md.slice(match[0].length) : md
}

/** Convert markdown to HTML. */
async function markdownToHtml(md: string): Promise<string> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })

  const tree = processor.parse(md)
  const hast = await processor.run(tree)
  return toHtml(hast)
}

export default defineEventHandler(async (event) => {
  const posts = await queryCollection(event, 'posts')
    .where('date', '<=', new Date().toISOString())
    .order('date', 'DESC')
    .all()

  const contentDir = resolve('content/posts')

  const items = (await Promise.all(
    posts.map(async (post) => {
      const slug = post.path.split('/').at(-1) ?? ''
      const url = postUrl(post.date, slug)
      const title = xmlEscape(post.title)
      const description = xmlEscape(post.description ?? post.title)

      let contentEncoded = ''
      try {
        const raw = await readFile(resolve(contentDir, `${slug}.md`), 'utf-8')
        const body = stripFrontmatter(raw)
        const html = await markdownToHtml(body)
        contentEncoded = `\n      <content:encoded><![CDATA[${html}]]></content:encoded>`
      }
      catch {
        // Fall back to description-only if the file can't be read
      }

      return `
    <item>
      <title>${title}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${rfc2822(post.date)}</pubDate>
      <description>${description}</description>${contentEncoded}
    </item>`
    })
  )).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${xmlEscape(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${xmlEscape(SITE_DESCRIPTION)}</description>
    <language>en-us</language>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`

  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  return xml
})
