import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, basename } from 'node:path'

export interface ChapterManifest {
  id: string
  slug: string
  title: string
  path: string
}

export interface LocaleManifest {
  language: string
  title: string
  manuscriptPath: string
  legacyOutputs: {
    pdf: string
    epub: string
  }
  vivliostyleOutputs: {
    pdf: string
    epub: string
  }
  chapters: ChapterManifest[]
}

export interface BookManifest {
  schemaVersion: string
  sourceRevision: string
  publicationDate: string
  locales: Record<'en' | 'zh-TW', LocaleManifest>
}

const readUtf8 = (path: string): string => readFileSync(path, 'utf8')

export function parseChapter(root: string, localeDir: string, name: string): ChapterManifest {
  const fullPath = join(root, 'contents', localeDir, name)
  const content = readUtf8(fullPath)
  const h1Match = content.match(/^#\s+(.+)$/m)
  if (!h1Match) throw new Error(`Missing H1 in chapter file: ${join('contents', localeDir, name)}`)
  const title = h1Match[1].trim()

  const match = name.match(/^([1-7](?:-\d+)?)-(.*)\.md$/)
  if (!match) throw new Error(`Invalid chapter filename format: ${name}`)
  const id = match[1]
  const slug = match[2]

  return {
    id,
    slug,
    title,
    path: join('contents', localeDir, name),
  }
}

export function generateManifest(root: string, bookDate: string, sourceRevision: string): BookManifest {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(bookDate)) throw new Error(`Invalid BOOK_DATE: ${bookDate}`)
  if (!sourceRevision || sourceRevision.trim() === '') throw new Error('Invalid sourceRevision: cannot be empty')

  const locales: Record<'en' | 'zh-TW', LocaleManifest> = {
    en: {
      language: 'en',
      title: 'Plurality',
      manuscriptPath: 'en/Plurality-english.md',
      legacyOutputs: {
        pdf: 'legacy/Plurality-english.pdf',
        epub: 'legacy/Plurality-english.epub',
      },
      vivliostyleOutputs: {
        pdf: 'candidate/vivliostyle-en-candidate.pdf',
        epub: 'candidate/vivliostyle-en-candidate.epub',
      },
      chapters: [],
    },
    'zh-TW': {
      language: 'zh-TW',
      title: '多元宇宙',
      manuscriptPath: 'zh-TW/Plurality-traditional-mandarin.md',
      legacyOutputs: {
        pdf: 'legacy/Plurality-traditional-mandarin.pdf',
        epub: 'legacy/Plurality-traditional-mandarin.epub',
      },
      vivliostyleOutputs: {
        pdf: 'candidate/vivliostyle-zh-TW-candidate.pdf',
        epub: 'candidate/vivliostyle-zh-TW-candidate.epub',
      },
      chapters: [],
    },
  }

  const localeConfigs = [
    { key: 'en' as const, dir: 'english' },
    { key: 'zh-TW' as const, dir: 'traditional-mandarin' },
  ]

  for (const config of localeConfigs) {
    const dirPath = join(root, 'contents', config.dir)
    const files = readdirSync(dirPath).filter((name) => /^[1-7].*\.md$/.test(name)).sort()

    const ids = new Set<string>()
    const chapters: ChapterManifest[] = []

    for (const file of files) {
      const chapter = parseChapter(root, config.dir, file)
      if (ids.has(chapter.id)) throw new Error(`Duplicate chapter ID "${chapter.id}" in locale ${config.key}`)
      ids.add(chapter.id)
      chapters.push(chapter)
    }

    locales[config.key].chapters = chapters
  }

  return {
    schemaVersion: '1.0.0',
    sourceRevision,
    publicationDate: bookDate,
    locales,
  }
}

export function writeManifest(root: string, outputDir: string, bookDate: string, sourceRevision: string): void {
  const manifest = generateManifest(root, bookDate, sourceRevision)
  writeFileSync(join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
}

// Cast import.meta to read Bun-specific main property during direct script execution
const meta = import.meta as unknown as { main: boolean }
if (meta.main) {
  const [outputDir] = process.argv.slice(2)
  if (!outputDir) throw new Error('Usage: BOOK_DATE=YYYY-MM-DD SOURCE_REVISION=rev bun scripts/book/manifest.ts OUTPUT_DIR')
  const bookDate = process.env.BOOK_DATE
  if (!bookDate) throw new Error('BOOK_DATE is required')
  const sourceRevision = process.env.SOURCE_REVISION ?? process.env.GITHUB_SHA
  if (!sourceRevision) throw new Error('SOURCE_REVISION or GITHUB_SHA is required')
  writeManifest(process.cwd(), outputDir, bookDate, sourceRevision)
}
