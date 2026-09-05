export interface PostReturnContext {
  postPath: string
  to: string
  label: string
}

/** Only known internal listing pages can override the archive fallback. */
export function postReturnContext(
  postPath: string,
  from: { path: string; fullPath: string; matched: readonly unknown[] },
): PostReturnContext | null {
  if (!from.matched.length) return null
  if (from.path === '/search') {
    return { postPath, to: from.fullPath, label: 'Back to search' }
  }
  if (from.path === '/') {
    return { postPath, to: '/', label: 'Back to home' }
  }
  return null
}
