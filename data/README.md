# About timeline

Edit `life-timeline.json` and save. The Nuxt dev server refreshes the About page automatically; a static preview requires a rebuild.

- `title`: heading above the timeline.
- `threads`: labels and connection styles (`solid`, `dashed`, `dotted`).
- `entries`: one continuous array, kept oldest-first in the file. The page reverses it to display newest-first, with no section headings.
- The type filters show all entries or one thread; each filter's border matches that thread's connection style.
- Bike entries use `"thread": "bikes"`, with a shared 5×5 wheel glyph and their own dashed connections. The undated Hill and Dale ride took place before the November 2013 Mr. Pink build.
- Each entry has a stable, unique `id`, a freely editable `date` label, a `thread` matching a key in `threads`, `title`, `body`, and `featured` (true for a wider card).
- Use `null` or an empty string for `date` to omit uncertain timeframe/context text. The type glyph remains visible. Life events and moves share the `living` thread.
- Move entries to reorder them, duplicate one with a new ID to add a milestone, or delete it to remove one. Empty body text is supported.

This file contains public-facing copy only. Do not add private source notes: imported JSON can be included in the site's browser bundle. The research draft remains outside this repository.
