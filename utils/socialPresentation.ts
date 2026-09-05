/** Keep quote-sized posts distinct from prose; links and multi-line posts stay body text. */
export function isSocialQuip(text: string): boolean {
  const trimmed = text.trim()
  return trimmed.length > 0 && Array.from(trimmed).length <= 90
    && trimmed.split(/\s+/).length <= 18
    && !/https?:\/\/|\n/.test(trimmed)
}
