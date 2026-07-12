import { rmSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync, SpawnSyncOptions } from 'node:child_process'
import { prepareVivliostyle } from './prepare-vivliostyle'
import { validateCandidate } from './validate-candidate'

export type SpawnFn = (
  cmd: string,
  args: string[],
  opts: SpawnSyncOptions
) => { status: number | null; error?: Error }

const defaultSpawn: SpawnFn = (cmd, args, opts) => {
  const res = spawnSync(cmd, args, opts)
  return { status: res.status, error: res.error }
}

export async function renderLocale(
  locale: 'en' | 'zh-TW',
  bookDate: string,
  outputRoot: string,
  spawnFn: SpawnFn = defaultSpawn
): Promise<void> {
  const buildDir = join(outputRoot, '.vivliostyle', locale)
  const prefix = `vivliostyle-${locale}-candidate`
  const pdfPath = join(outputRoot, 'candidate', `${prefix}.pdf`)
  const epubPath = join(outputRoot, 'candidate', `${prefix}.epub`)

  // 1. Remove old candidate outputs first to prevent stale output usage
  rmSync(pdfPath, { force: true })
  rmSync(epubPath, { force: true })

  // 2. Compile and prepare manuscript on the fly
  const projectRoot = existsSync(join(outputRoot, 'scripts', 'credits.json')) ? outputRoot : process.cwd()
  prepareVivliostyle(projectRoot, locale, buildDir, bookDate)

  // 3. Invoke local Vivliostyle build
  const env = {
    ...process.env,
    BOOK_LOCALE: locale,
    BUILD_DIR: buildDir,
    OUTPUT_ROOT: outputRoot,
    BOOK_DATE: bookDate,
  }

  const res = spawnFn('bunx', ['vivliostyle', 'build', '--config', 'publication/vivliostyle.config.mjs'], {
    env,
    stdio: 'inherit',
    shell: false,
  })

  if (res.error) throw res.error
  if (res.status !== 0) {
    throw new Error(`Vivliostyle build failed for ${locale} with exit code ${res.status}`)
  }

  if (!existsSync(pdfPath)) {
    throw new Error(`Expected PDF file not found at ${pdfPath}`)
  }
  if (!existsSync(epubPath)) {
    throw new Error(`Expected EPUB file not found at ${epubPath}`)
  }
}

export async function runOrchestrator(
  target: 'en' | 'zh-TW' | 'all',
  bookDate: string,
  outputRoot: string,
  spawnFn: SpawnFn = defaultSpawn
): Promise<void> {
  if (target === 'all') {
    await renderLocale('en', bookDate, outputRoot, spawnFn)
    await renderLocale('zh-TW', bookDate, outputRoot, spawnFn)
    // Run candidate validation
    await validateCandidate(outputRoot)
  } else {
    await renderLocale(target, bookDate, outputRoot, spawnFn)
  }
}

// Cast import.meta to read Bun-specific main property during direct script execution
const meta = import.meta as unknown as { main: boolean }
if (meta.main) {
  const target = process.argv[2] as 'en' | 'zh-TW' | 'all' | undefined
  if (!target || (target !== 'en' && target !== 'zh-TW' && target !== 'all')) {
    throw new Error('Usage: BOOK_DATE=YYYY-MM-DD bun scripts/book/render-candidate.ts <en|zh-TW|all>')
  }
  const bookDate = process.env.BOOK_DATE
  if (!bookDate || !/^\d{4}-\d{2}-\d{2}$/.test(bookDate)) {
    throw new Error('Valid BOOK_DATE (YYYY-MM-DD) environment variable is required')
  }
  const outputRoot = process.env.OUTPUT_ROOT || 'dist/publication'
  try {
    await runOrchestrator(target, bookDate, outputRoot)
    console.log('Candidate render process completed successfully.')
  } catch (err: unknown) {
    console.error('Candidate render process failed:', err)
    process.exit(1)
  }
}
