import { defineConfig } from 'vite-plus'

export default defineConfig({
  run: {
    tasks: {
      'vp:docs:build': { command: 'bun run docs:build' },
      'vp:check': { command: 'bun run check' },
      'vp:book': { command: 'bun run book:candidate:all' },
      'vp:book:legacy': { command: 'bun run book:legacy:all' },
    },
  },
})
