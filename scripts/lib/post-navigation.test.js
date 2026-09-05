import { describe, expect, it } from 'vitest'
import { postReturnContext } from '../../utils/postNavigation'

const post = '/2026/08/04/the-funk'
const from = (path, fullPath = path) => ({ path, fullPath, matched: [{}] })

describe('post return destination', () => {
  it('preserves the complete search query', () => {
    expect(postReturnContext(post, from('/search', '/search?q=banana%20bread'))).toEqual({
      postPath: post, to: '/search?q=banana%20bread', label: 'Back to search',
    })
  })
  it('returns homepage visitors to home', () => {
    expect(postReturnContext(post, from('/'))?.label).toBe('Back to home')
  })
  it('leaves archive visitors on the anchored archive fallback', () => {
    expect(postReturnContext(post, from('/archives'))).toBeNull()
  })
  it('does not mistake an initial direct visit for a homepage visit', () => {
    expect(postReturnContext(post, { path: '/', fullPath: '/', matched: [] })).toBeNull()
  })
  it('does not inherit unrelated page destinations', () => {
    expect(postReturnContext(post, from('/about'))).toBeNull()
    expect(postReturnContext(post, from('/2026/07/01/another-post'))).toBeNull()
  })
})
