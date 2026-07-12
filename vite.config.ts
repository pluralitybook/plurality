import { defineConfig } from 'vite-plus'

export default defineConfig({
  run: {
    // Task outputs depend on env vars (BOOK_DATE, OUTPUT_ROOT, SOURCE_REVISION, ...) that
    // aren't tracked as cache inputs, so caching is disabled to preserve the plain
    // "always execute" semantics the previous package.json scripts had.
    cache: false,
    tasks: {
      typecheck: { command: 'tsc --noEmit' },
      test: { command: 'vitest run' },
      check: { command: ['tsc --noEmit', 'vitest run'] },
      'docs:dev': { command: 'vitepress dev docs' },
      'docs:build': { command: 'vitepress build docs' },
      'docs:preview': { command: 'vitepress preview docs' },
      'book:assemble': { command: 'bun scripts/book/build.ts all dist/publication' },
      'book:manifest': { command: 'bun scripts/book/manifest.ts dist/publication' },
      'book:candidate:prepare': { command: 'bun scripts/book/prepare-vivliostyle.ts' },
      'book:candidate:en': { command: 'bun scripts/book/render-candidate.ts en' },
      'book:candidate:zh-TW': { command: 'bun scripts/book/render-candidate.ts zh-TW' },
      'book:candidate:all': { command: 'bun scripts/book/render-candidate.ts all' },
      'book:candidate:validate': { command: 'bun scripts/book/validate-candidate.ts dist/publication' },
      'book:legacy:en': { command: 'bun scripts/book/render-legacy.ts en' },
      'book:legacy:zh-TW': { command: 'bun scripts/book/render-legacy.ts zh-TW' },
      'book:legacy:all': { command: 'bun scripts/book/render-legacy.ts all' },
      'book:legacy:validate': { command: 'bun scripts/book/validate-legacy.ts dist/publication' },
    },
  },
})
