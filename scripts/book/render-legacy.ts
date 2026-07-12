import { rmSync, existsSync, mkdirSync, readFileSync, writeFileSync, cpSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync, SpawnSyncOptions } from 'node:child_process'
import { assembleLocale } from './build'

export type SpawnFn = (
  cmd: string,
  args: string[],
  opts: SpawnSyncOptions
) => { status: number | null; error?: Error }

const defaultSpawn: SpawnFn = (cmd, args, opts) => {
  const res = spawnSync(cmd, args, opts)
  return { status: res.status, error: res.error }
}

const defaultImage = 'audreyt/pandoc-plurality-book@sha256:6a73d724203283dad9d098d8bb44f7282972dec5862bb6c14034af496d232698'

export async function renderLegacyLocale(
  locale: 'en' | 'zh-TW',
  bookDate: string,
  outputRoot: string,
  spawnFn: SpawnFn = defaultSpawn
): Promise<void> {
  const localeFilename = locale === 'en' ? 'english' : 'traditional-mandarin'
  const legacyDir = join(outputRoot, 'legacy')
  mkdirSync(legacyDir, { recursive: true })
  const pdfPath = join(legacyDir, `Plurality-${localeFilename}.pdf`)
  const epubPath = join(legacyDir, `Plurality-${localeFilename}.epub`)

  // 1. Delete old target outputs first
  rmSync(pdfPath, { force: true })
  rmSync(epubPath, { force: true })

  // 2. Set up isolated work directory
  const workDir = join(outputRoot, '.legacy-work', locale)
  rmSync(workDir, { recursive: true, force: true })
  mkdirSync(workDir, { recursive: true })

  // 3. Find projectRoot dynamically (based on location of scripts/credits.json)
  const projectRoot = existsSync(join(outputRoot, 'scripts', 'credits.json')) ? outputRoot : process.cwd()

  // 4. Copy existing noto-emoji into cache dir inside work dir so they are resolved locally
  const cacheDir = join(workDir, 'emoji-cache')
  mkdirSync(cacheDir, { recursive: true })
  const srcNoto = join(projectRoot, 'noto-emoji')
  const destNoto = join(cacheDir, 'noto-emoji')
  if (existsSync(srcNoto)) {
    cpSync(srcNoto, destNoto, { recursive: true })
  }

  // 5. Assemble aggregate and pre.tex
  const creditsPath = join(projectRoot, 'scripts', 'credits.json')
  if (!existsSync(creditsPath)) {
    throw new Error(`Credits file missing: ${creditsPath}`)
  }
  const creditsValue = JSON.parse(readFileSync(creditsPath, 'utf8'))
  const { markdown, preTex } = assembleLocale(projectRoot, locale, bookDate, creditsValue)

  // Write aggregate and pre.tex in workDir
  const markdownPath = join(workDir, `${localeFilename}.md`)
  const preTexPath = join(workDir, 'pre.tex')
  writeFileSync(markdownPath, markdown)
  writeFileSync(preTexPath, preTex)

  // 6. Invoke Docker/Pandoc sequence
  const image = process.env.LEGACY_IMAGE || defaultImage
  const uid = process.getuid ? process.getuid() : 1000
  const gid = process.getgid ? process.getgid() : 1000

  // Conditionally omit --user on macOS to prevent dbus-run-session from failing with unknown user
  const isMac = process.platform === 'darwin'
  const userArgs = isMac ? [] : ['--user', `${uid}:${gid}`]

  const runSpawn = (args: string[]) => {
    const res = spawnFn('docker', args, { stdio: 'inherit' })
    if (res.error) throw res.error
    if (res.status !== 0) {
      throw new Error(`Docker command failed with exit code ${res.status}`)
    }
  }

  // Prepass 1
  runSpawn([
    'run', '--rm',
    '-v', `${projectRoot}:/data`,
    '-e', `SVG_FILTER_CACHE_DIR=dist/publication/.legacy-work/${locale}/emoji-cache`,
    image,
    `dist/publication/.legacy-work/${locale}/${localeFilename}.md`,
    '-o', `dist/publication/.legacy-work/${locale}/tmp.tex`,
    '--filter=/data/scripts/emoji_filter.js'
  ])

  // Prepass 2
  runSpawn([
    'run', '--rm',
    '-v', `${projectRoot}:/data`,
    '-e', `SVG_FILTER_CACHE_DIR=dist/publication/.legacy-work/${locale}/emoji-cache`,
    image,
    `dist/publication/.legacy-work/${locale}/${localeFilename}.md`,
    '-o', `dist/publication/.legacy-work/${locale}/tmp.tex`,
    '--filter=/data/scripts/emoji_filter.js'
  ])

  // PDF XeLaTeX
  const xelatexArgs = [
    'run', '--rm',
    '-v', `${projectRoot}:/data`,
    ...userArgs,
    '-e', `SVG_FILTER_CACHE_DIR=dist/publication/.legacy-work/${locale}/emoji-cache`,
    image,
    `dist/publication/.legacy-work/${locale}/${localeFilename}.md`,
    '-o', `dist/publication/.legacy-work/${locale}/tmp.pdf`,
    '--include-in-header=/data/scripts/xelatex-preamble.tex',
    `--include-before-body=dist/publication/.legacy-work/${locale}/pre.tex`,
    '--toc',
    '--toc-depth=2',
    '-s',
    '--pdf-engine=xelatex',
    '-V', 'CJKmainfont=Noto Sans CJK TC',
    '-V', `fontsize=${locale === 'en' ? '18pt' : '20pt'}`,
    '-V', 'documentclass=extreport',
    '-f', 'markdown-implicit_figures',
    '--filter=/data/scripts/emoji_filter.js'
  ]
  if (locale === 'zh-TW') {
    xelatexArgs.push('-M', 'lang=en-US')
  }
  runSpawn(xelatexArgs)

  // pdftk cover replacement
  runSpawn([
    'run', '--entrypoint', '/usr/bin/pdftk', '--rm',
    '-v', `${projectRoot}:/data`,
    ...userArgs,
    image,
    `A=/data/dist/publication/.legacy-work/${locale}/tmp.pdf`,
    `B=/data/scripts/cover-image${locale === 'en' ? '' : '.zh-tw'}.pdf`,
    'cat', 'B', 'A2-end',
    'output', `/data/dist/publication/legacy/Plurality-${localeFilename}.pdf`
  ])

  // EPUB
  const epubArgs = [
    'run', '--rm',
    '-v', `${projectRoot}:/data`,
    ...userArgs,
    '-e', `SVG_FILTER_CACHE_DIR=dist/publication/.legacy-work/${locale}/emoji-cache`,
    image,
    `dist/publication/.legacy-work/${locale}/${localeFilename}.md`,
    '-o', `dist/publication/legacy/Plurality-${localeFilename}.epub`,
    '--toc',
    '--toc-depth=2',
    '-s',
    '-f', 'markdown-implicit_figures',
    '--resource-path=/data',
    '--filter=/data/scripts/emoji_filter.js'
  ]
  if (locale === 'zh-TW') {
    epubArgs.push('--css=/data/scripts/epub-cjk.css')
  }
  runSpawn(epubArgs)

  // 7. Assert outputs exist
  if (!existsSync(pdfPath)) {
    throw new Error(`Expected legacy PDF output missing at ${pdfPath}`)
  }
  if (!existsSync(epubPath)) {
    throw new Error(`Expected legacy EPUB output missing at ${epubPath}`)
  }
}

export async function runLegacyOrchestrator(
  target: 'en' | 'zh-TW' | 'all',
  bookDate: string,
  outputRoot: string,
  spawnFn: SpawnFn = defaultSpawn
): Promise<void> {
  if (target === 'all') {
    await renderLegacyLocale('en', bookDate, outputRoot, spawnFn)
    await renderLegacyLocale('zh-TW', bookDate, outputRoot, spawnFn)
  } else {
    await renderLegacyLocale(target, bookDate, outputRoot, spawnFn)
  }
}

const meta = import.meta as unknown as { main: boolean }
if (meta.main) {
  const target = process.argv[2] as 'en' | 'zh-TW' | 'all' | undefined
  if (!target || (target !== 'en' && target !== 'zh-TW' && target !== 'all')) {
    throw new Error('Usage: BOOK_DATE=YYYY-MM-DD bun scripts/book/render-legacy.ts <en|zh-TW|all>')
  }
  const bookDate = process.env.BOOK_DATE
  if (!bookDate || !/^\d{4}-\d{2}-\d{2}$/.test(bookDate)) {
    throw new Error('Valid BOOK_DATE (YYYY-MM-DD) environment variable is required')
  }
  const outputRoot = process.env.OUTPUT_ROOT || 'dist/publication'
  try {
    await runLegacyOrchestrator(target, bookDate, outputRoot)
    console.log('Legacy render process completed successfully.')
  } catch (err: unknown) {
    console.error('Legacy render process failed:', err)
    process.exit(1)
  }
}
