/** Stable anchor shared by a blog post's archive card and its return links. */
export function archivePostId(path: string): string {
  return `post-${path.split('/').filter(Boolean).join('-')}`
}
