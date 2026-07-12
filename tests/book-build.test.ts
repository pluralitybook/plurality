import { describe, expect, test, beforeEach, afterEach } from 'vitest'
import { mkdirSync, mkdtempSync, readFileSync, unlinkSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { assembleChinese, assembleEnglish, validateCredits } from '../scripts/book/build'
import { generateManifest, parseChapter } from '../scripts/book/manifest'
import { prepareVivliostyle } from '../scripts/book/prepare-vivliostyle'
import { validateCandidate } from '../scripts/book/validate-candidate'
import { validateLegacy } from '../scripts/book/validate-legacy'
import { renderLocale, runOrchestrator } from '../scripts/book/render-candidate'
import { renderLegacyLocale, runLegacyOrchestrator } from '../scripts/book/render-legacy'
import { PDFDocument } from 'pdf-lib'
import AdmZip from 'adm-zip'
import config from '../publication/vivliostyle.config.mjs'

function fixtureRoot(locale = 'english'): string {
  const root = mkdtempSync(join(tmpdir(), 'plurality-book-'))
  const source = join(root, 'contents', locale)
  mkdirSync(source, { recursive: true })
  return root
}
const credits = { i18n: { en: { categories: { Writing: 'Writing' } }, zh: { categories: { Writing: '寫作' } } }, categories: [{ name: 'Writing', contributors: [{ name: 'Alice', pt: 2 }] }] }

describe('English book assembly', () => {
  test('preserves image and footnote transforms', () => {
    const root = fixtureRoot()
    writeFileSync(join(root, 'contents', 'english', '0-0-endorsements.md'), '# Endorse\n')
    writeFileSync(join(root, 'contents', 'english', '1-1-test.md'), '# Chapter\n[^note]\n![https://example.test/x](x.png)\n<img src="fig.png" alt="A[B]">\n')
    const result = assembleEnglish(root, '2024-01-02', credits)
    expect(result.markdown).toContain('[^1-1-note]')
    expect(result.markdown).toContain('![figure](x.png)')
    expect(result.markdown).toContain('![A\\[B\\]](fig.png){ width=100% }')
  })
})

test('assembles deterministic credits', () => {
  const root = fixtureRoot()
  writeFileSync(join(root, 'contents', 'english', '0-0-endorsements.md'), '# Endorsements\n')
  writeFileSync(join(root, 'contents', 'english', '1-1-test.md'), '# Chapter\n')
  const result = assembleEnglish(root, '2024-01-02', credits)
  expect(result.markdown).toContain('date: "2024-01-02"')
  expect(result.markdown).toContain('\\fontsize{2pt}{2.4pt}')
})

test('rejects malformed credits and dates', () => {
  expect(() => validateCredits({ categories: [] })).toThrow(/missing i18n\.en\.categories/)
  expect(() => validateCredits({ i18n: { en: { categories: {} } }, categories: [{ name: 'Writing', contributors: [{ name: 'Alice', pt: '2' }] }] })).toThrow(/contributor/)
  expect(() => assembleEnglish(fixtureRoot(), '2024-1-2', credits)).toThrow(/Invalid BOOK_DATE/)
})

test('propagates missing source files', () => {
  const root = fixtureRoot()
  expect(() => assembleEnglish(root, '2024-01-02', credits)).toThrow()
})

test('preserves zh-TW self-closing, footnote, and attribution behavior', () => {
  const root = fixtureRoot('traditional-mandarin')
  const source = join(root, 'contents', 'traditional-mandarin')
  writeFileSync(join(source, '0-0-名家推薦.md'), '# 推薦\n')
  writeFileSync(join(source, '1-1-test.md'), '# 章節\n[^note]\n<br>\n<img src="x.png">\n原文：A\n作者：B\n\n---\n譯者：C\n')
  const result = assembleChinese(root, '2024-01-02', credits)
  expect(result.markdown).toContain('[^1_1_-note]')
  expect(result.markdown).toContain('<br />')
  expect(result.markdown).toContain('![figure](x.png){ width=100% }')
  expect(result.markdown).not.toContain('原文：A')
  expect(result.markdown).not.toContain('作者：B')
})

describe('Manifest generation', () => {
  test('parses chapter attributes correctly', () => {
    const root = fixtureRoot('english')
    writeFileSync(join(root, 'contents', 'english', '1-1-chapter-one.md'), '# Chapter One Title\nContent here\n')
    const chapter = parseChapter(root, 'english', '1-1-chapter-one.md')
    expect(chapter.id).toBe('1-1')
    expect(chapter.slug).toBe('chapter-one')
    expect(chapter.title).toBe('Chapter One Title')
    expect(chapter.path).toBe('contents/english/1-1-chapter-one.md')
  })

  test('fails on missing H1', () => {
    const root = fixtureRoot('english')
    writeFileSync(join(root, 'contents', 'english', '1-1-chapter-one.md'), 'No H1 Title\n')
    expect(() => parseChapter(root, 'english', '1-1-chapter-one.md')).toThrow(/Missing H1/)
  })

  test('fails on duplicate chapter IDs', () => {
    const root = fixtureRoot('english')
    mkdirSync(join(root, 'contents', 'traditional-mandarin'), { recursive: true })
    writeFileSync(join(root, 'contents', 'english', '1-1-first.md'), '# First\n')
    writeFileSync(join(root, 'contents', 'english', '1-1-second.md'), '# Second\n')
    writeFileSync(join(root, 'contents', 'traditional-mandarin', '1-1-first.md'), '# First\n')
    expect(() => generateManifest(root, '2024-01-02', 'v1.0.0')).toThrow(/Duplicate chapter ID/)
  })

  test('fails on invalid date or revision', () => {
    const root = fixtureRoot('english')
    expect(() => generateManifest(root, '2024-1-2', 'v1.0.0')).toThrow(/Invalid BOOK_DATE/)
    expect(() => generateManifest(root, '2024-01-02', ' ')).toThrow(/Invalid sourceRevision/)
  })

  test('asserts manuscript paths, legacy/candidate output structures, and pre.tex files', () => {
    const root = fixtureRoot('english')
    mkdirSync(join(root, 'contents', 'traditional-mandarin'), { recursive: true })
    writeFileSync(join(root, 'contents', 'english', '1-1-first.md'), '# First\n')
    writeFileSync(join(root, 'contents', 'traditional-mandarin', '1-1-first.md'), '# First\n')
    const manifest = generateManifest(root, '2024-01-02', 'test-rev')
    expect(manifest.locales.en.manuscriptPath).toBe('en/Plurality-english.md')
    expect(manifest.locales.en.legacyOutputs.pdf).toBe('legacy/Plurality-english.pdf')
    expect(manifest.locales.en.vivliostyleOutputs.pdf).toBe('candidate/vivliostyle-en-candidate.pdf')
    expect(manifest.locales['zh-TW'].manuscriptPath).toBe('zh-TW/Plurality-traditional-mandarin.md')
    expect(manifest.locales['zh-TW'].legacyOutputs.pdf).toBe('legacy/Plurality-traditional-mandarin.pdf')
    expect(manifest.locales['zh-TW'].vivliostyleOutputs.pdf).toBe('candidate/vivliostyle-zh-TW-candidate.pdf')
  })
})

describe('Vivliostyle preparation', () => {
  test('strips LaTeX, unwraps HTML, rewrites relative image paths, and preserves footnotes', () => {
    const root = fixtureRoot('english')
    mkdirSync(join(root, 'scripts'), { recursive: true })
    writeFileSync(join(root, 'scripts', 'credits.json'), JSON.stringify(credits))
    
    // Create folders for relative paths to exist and prevent existsSync failures
    mkdirSync(join(root, 'figs'), { recursive: true })
    mkdirSync(join(root, 'home'), { recursive: true })
    mkdirSync(join(root, 'traditional-mandarin'), { recursive: true })
    mkdirSync(join(root, 'public'), { recursive: true })
    
    writeFileSync(join(root, 'figs', 'image.png'), '')
    writeFileSync(join(root, 'figs', 'other.png'), '')
    writeFileSync(join(root, 'home', 'index.png'), '')
    writeFileSync(join(root, 'traditional-mandarin', 'some.png'), '')
    writeFileSync(join(root, 'public', 'favicon.png'), '')
    
    writeFileSync(join(root, 'contents', 'english', '0-0-endorsements.md'), '# Endorsements\n')
    writeFileSync(join(root, 'contents', 'english', '1-1-test.md'), '# Title\n```{=latex}\n\\some-latex-command\n```\n```{=html}\n<div class="test">HTML content</div>\n```\n![Alt Text](figs/image.png)\n<img src="figs/other.png">\n![Home](home/index.png)\n![Traditional](traditional-mandarin/some.png)\n![Public](public/favicon.png)\n![Github](https://raw.githubusercontent.com/pluralitybook/plurality/main/figs/image.png)\n[^note]\n')
    
    const buildDir = join(root, 'dist', 'candidate', 'en')
    prepareVivliostyle(root, 'en', buildDir, '2024-01-02')
    
    const manuscript = readFileSync(join(buildDir, 'manuscript.md'), 'utf8')
    expect(manuscript).not.toContain('\\some-latex-command')
    expect(manuscript).not.toContain('```{=html}')
    expect(manuscript).toContain('<div class="test">HTML content</div>')
    expect(manuscript).toContain('![Alt Text](../../../figs/image.png)')
    expect(manuscript).toContain('![figure](../../../figs/other.png){ width=100% }')
    expect(manuscript).toContain('![Home](../../../home/index.png)')
    expect(manuscript).toContain('![Traditional](../../../traditional-mandarin/some.png)')
    expect(manuscript).toContain('![Public](../../../public/favicon.png)')
    expect(manuscript).toContain('![Github](../../../figs/image.png)')
    expect(manuscript).toContain('[^1-1-note]')
  })

  test('fails on missing local assets', () => {
    const root = fixtureRoot('english')
    mkdirSync(join(root, 'scripts'), { recursive: true })
    writeFileSync(join(root, 'scripts', 'credits.json'), JSON.stringify(credits))
    writeFileSync(join(root, 'contents', 'english', '0-0-endorsements.md'), '# Endorsements\n')
    writeFileSync(join(root, 'contents', 'english', '1-1-test.md'), '# Title\n![Alt Text](figs/missing.png)\n')
    const buildDir = join(root, 'dist', 'candidate', 'en')
    expect(() => prepareVivliostyle(root, 'en', buildDir, '2024-01-02')).toThrow(/Missing local asset/)
  })

  test('rejects unsafe BUILD_DIR outside project root', () => {
    const root = fixtureRoot('english')
    mkdirSync(join(root, 'scripts'), { recursive: true })
    writeFileSync(join(root, 'scripts', 'credits.json'), JSON.stringify(credits))
    expect(() => prepareVivliostyle(root, 'en', '/tmp/unsafe-dir', '2024-01-02')).toThrow(/outside project root/)
  })

  test('asserts vivliostyle config shape and output paths', () => {
    expect(config.toc.sectionDepth).toBe(2)
    expect(config.vfm.footnote).toBe('dpub')
    expect(config.cover).toBeDefined()
    
    const locale = process.env.BOOK_LOCALE || 'en'
    const pdfPath = config.output.find((o: { format: string }) => o.format === 'pdf')?.path
    expect(pdfPath).toContain(`vivliostyle-${locale}-candidate.pdf`)
  })
})

describe('Candidate validation', () => {
  beforeEach(() => {
    process.env.MIN_PDF_BYTES = '1'
    process.env.MIN_EPUB_BYTES = '1'
  })
  afterEach(() => {
    delete process.env.MIN_PDF_BYTES
    delete process.env.MIN_EPUB_BYTES
  })

  const mockCredits = { i18n: { en: { categories: { Writing: 'Writing' } }, zh: { categories: { Writing: '寫作' } } }, categories: [{ name: 'Writing', contributors: [{ name: 'Alice', pt: 2 }] }] }
  async function createMockPdf(path: string): Promise<void> {
    const doc = await PDFDocument.create()
    doc.addPage()
    const bytes = await doc.save()
    writeFileSync(path, bytes)
  }

  function createMockEpub(path: string, hasNav: boolean, hasFileRef: boolean, textContent = 'Plurality and Weyl'): void {
    const zip = new AdmZip()
    zip.addFile('mimetype', Buffer.from('application/epub+zip'))
    zip.addFile('META-INF/container.xml', Buffer.from('<container><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>'))
    
    const navProp = hasNav ? 'properties="nav"' : ''
    const fileRef = hasFileRef ? 'file://unsafe-link' : 'valid-link'
    
    zip.addFile('OEBPS/content.opf', Buffer.from(`
      <package version="3.0" unique-identifier="pub-id">
        <manifest>
          <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" ${navProp}/>
          <item id="chapter1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
        </manifest>
        <spine>
          <itemref idref="chapter1"/>
        </spine>
      </package>
    `))
    zip.addFile('OEBPS/nav.xhtml', Buffer.from('<html xmlns="http://www.w3.org/1999/xhtml"><body><nav><h1>TOC</h1></nav></body></html>'))
    zip.addFile('OEBPS/chapter1.xhtml', Buffer.from(`<html xmlns="http://www.w3.org/1999/xhtml"><body><h1>Chapter 1</h1><p>${textContent}</p><a href="${fileRef}">link</a></body></html>`))
    zip.writeZip(path)
  }

  test('fails on path collision', async () => {
    const root = fixtureRoot('english')
    mkdirSync(join(root, 'contents', 'traditional-mandarin'), { recursive: true })
    writeFileSync(join(root, 'contents', 'english', '1-1-first.md'), '# First\n')
    writeFileSync(join(root, 'contents', 'traditional-mandarin', '1-1-first.md'), '# First\n')
    const manifest = generateManifest(root, '2024-01-02', 'rev')
    // Intentionally collide paths for collision validation testing
    manifest.locales.en.vivliostyleOutputs.pdf = manifest.locales.en.legacyOutputs.pdf
    writeFileSync(join(root, 'manifest.json'), JSON.stringify(manifest))
    await expect(validateCandidate(root)).rejects.toThrow(/Path collision/)
  })

  test('fails on PDF bad magic', async () => {
    const root = fixtureRoot('english')
    mkdirSync(join(root, 'contents', 'traditional-mandarin'), { recursive: true })
    writeFileSync(join(root, 'contents', 'english', '1-1-first.md'), '# First\n')
    writeFileSync(join(root, 'contents', 'traditional-mandarin', '1-1-first.md'), '# First\n')
    
    const manifest = generateManifest(root, '2024-01-02', 'rev')
    mkdirSync(join(root, 'en'), { recursive: true })
    mkdirSync(join(root, 'zh-TW'), { recursive: true })
    mkdirSync(join(root, 'candidate'), { recursive: true })
    mkdirSync(join(root, 'legacy'), { recursive: true })
    
    writeFileSync(join(root, 'en', 'Plurality-english.md'), '')
    writeFileSync(join(root, 'zh-TW', 'Plurality-traditional-mandarin.md'), '')
    
    writeFileSync(join(root, 'candidate', 'vivliostyle-en-candidate.pdf'), 'NOTAPDF')
    createMockEpub(join(root, 'candidate', 'vivliostyle-en-candidate.epub'), true, false)
    await createMockPdf(join(root, 'candidate', 'vivliostyle-zh-TW-candidate.pdf'))
    createMockEpub(join(root, 'candidate', 'vivliostyle-zh-TW-candidate.epub'), true, false, '多元與唐鳳')
    
    writeFileSync(join(root, 'manifest.json'), JSON.stringify(manifest))
    await expect(validateCandidate(root)).rejects.toThrow(/Invalid PDF magic number/)
  })

  test('fails on tiny file sizes', async () => {
    const root = fixtureRoot('english')
    mkdirSync(join(root, 'contents', 'traditional-mandarin'), { recursive: true })
    writeFileSync(join(root, 'contents', 'english', '1-1-first.md'), '# First\n')
    writeFileSync(join(root, 'contents', 'traditional-mandarin', '1-1-first.md'), '# First\n')
    
    const manifest = generateManifest(root, '2024-01-02', 'rev')
    mkdirSync(join(root, 'en'), { recursive: true })
    mkdirSync(join(root, 'zh-TW'), { recursive: true })
    mkdirSync(join(root, 'candidate'), { recursive: true })
    
    writeFileSync(join(root, 'en', 'Plurality-english.md'), '')
    writeFileSync(join(root, 'zh-TW', 'Plurality-traditional-mandarin.md'), '')
    
    await createMockPdf(join(root, 'candidate', 'vivliostyle-en-candidate.pdf'))
    createMockEpub(join(root, 'candidate', 'vivliostyle-en-candidate.epub'), true, false)
    await createMockPdf(join(root, 'candidate', 'vivliostyle-zh-TW-candidate.pdf'))
    createMockEpub(join(root, 'candidate', 'vivliostyle-zh-TW-candidate.epub'), true, false, '多元與唐鳳')
    
    writeFileSync(join(root, 'manifest.json'), JSON.stringify(manifest))
    
    process.env.MIN_PDF_BYTES = '1000000'
    try {
      await expect(validateCandidate(root)).rejects.toThrow(/PDF file size too small/)
    } finally {
      delete process.env.MIN_PDF_BYTES
    }
  })

  test('fails on manifest source revision mismatch', async () => {
    const root = fixtureRoot('english')
    mkdirSync(join(root, 'contents', 'traditional-mandarin'), { recursive: true })
    writeFileSync(join(root, 'contents', 'english', '1-1-first.md'), '# First\n')
    writeFileSync(join(root, 'contents', 'traditional-mandarin', '1-1-first.md'), '# First\n')
    
    const manifest = generateManifest(root, '2024-01-02', 'rev')
    mkdirSync(join(root, 'en'), { recursive: true })
    mkdirSync(join(root, 'zh-TW'), { recursive: true })
    mkdirSync(join(root, 'candidate'), { recursive: true })
    
    writeFileSync(join(root, 'en', 'Plurality-english.md'), '')
    writeFileSync(join(root, 'zh-TW', 'Plurality-traditional-mandarin.md'), '')
    
    await createMockPdf(join(root, 'candidate', 'vivliostyle-en-candidate.pdf'))
    createMockEpub(join(root, 'candidate', 'vivliostyle-en-candidate.epub'), true, false)
    await createMockPdf(join(root, 'candidate', 'vivliostyle-zh-TW-candidate.pdf'))
    createMockEpub(join(root, 'candidate', 'vivliostyle-zh-TW-candidate.epub'), true, false, '多元與唐鳳')
    
    writeFileSync(join(root, 'manifest.json'), JSON.stringify(manifest))
    
    process.env.EXPECTED_SOURCE_REVISION = 'other-rev'
    try {
      await expect(validateCandidate(root)).rejects.toThrow(/source revision mismatch/)
    } finally {
      delete process.env.EXPECTED_SOURCE_REVISION
    }
  })

  test('accepts matching manifest source revision', async () => {
    const root = fixtureRoot('english')
    mkdirSync(join(root, 'contents', 'traditional-mandarin'), { recursive: true })
    writeFileSync(join(root, 'contents', 'english', '1-1-first.md'), '# First\n')
    writeFileSync(join(root, 'contents', 'traditional-mandarin', '1-1-first.md'), '# First\n')
    
    const manifest = generateManifest(root, '2024-01-02', 'rev')
    mkdirSync(join(root, 'en'), { recursive: true })
    mkdirSync(join(root, 'zh-TW'), { recursive: true })
    mkdirSync(join(root, 'candidate'), { recursive: true })
    
    writeFileSync(join(root, 'en', 'Plurality-english.md'), '')
    writeFileSync(join(root, 'zh-TW', 'Plurality-traditional-mandarin.md'), '')
    
    await createMockPdf(join(root, 'candidate', 'vivliostyle-en-candidate.pdf'))
    createMockEpub(join(root, 'candidate', 'vivliostyle-en-candidate.epub'), true, false)
    await createMockPdf(join(root, 'candidate', 'vivliostyle-zh-TW-candidate.pdf'))
    createMockEpub(join(root, 'candidate', 'vivliostyle-zh-TW-candidate.epub'), true, false, '多元與唐鳳')
    
    writeFileSync(join(root, 'manifest.json'), JSON.stringify(manifest))
    
    process.env.EXPECTED_SOURCE_REVISION = 'rev'
    try {
      await expect(validateCandidate(root)).resolves.toBeUndefined()
    } finally {
      delete process.env.EXPECTED_SOURCE_REVISION
    }
  })

  test('fails on missing EPUB navigation document', async () => {
    const root = fixtureRoot('english')
    mkdirSync(join(root, 'contents', 'traditional-mandarin'), { recursive: true })
    writeFileSync(join(root, 'contents', 'english', '1-1-first.md'), '# First\n')
    writeFileSync(join(root, 'contents', 'traditional-mandarin', '1-1-first.md'), '# First\n')
    
    const manifest = generateManifest(root, '2024-01-02', 'rev')
    mkdirSync(join(root, 'en'), { recursive: true })
    mkdirSync(join(root, 'zh-TW'), { recursive: true })
    mkdirSync(join(root, 'candidate'), { recursive: true })
    
    writeFileSync(join(root, 'en', 'Plurality-english.md'), '')
    writeFileSync(join(root, 'zh-TW', 'Plurality-traditional-mandarin.md'), '')
    
    await createMockPdf(join(root, 'candidate', 'vivliostyle-en-candidate.pdf'))
    // EPUB missing nav properties!
    createMockEpub(join(root, 'candidate', 'vivliostyle-en-candidate.epub'), false, false)
    await createMockPdf(join(root, 'candidate', 'vivliostyle-zh-TW-candidate.pdf'))
    createMockEpub(join(root, 'candidate', 'vivliostyle-zh-TW-candidate.epub'), true, false, '多元與唐鳳')
    
    writeFileSync(join(root, 'manifest.json'), JSON.stringify(manifest))
    await expect(validateCandidate(root)).rejects.toThrow(/missing navigation document/)
  })
})

describe('Legacy validation', () => {
  beforeEach(() => {
    process.env.MIN_PDF_BYTES = '1'
    process.env.MIN_EPUB_BYTES = '1'
  })
  afterEach(() => {
    delete process.env.MIN_PDF_BYTES
    delete process.env.MIN_EPUB_BYTES
  })

  async function createMockPdf(path: string): Promise<void> {
    const doc = await PDFDocument.create()
    doc.addPage()
    const bytes = await doc.save()
    writeFileSync(path, bytes)
  }

  function createMockEpub(path: string, hasNav: boolean, hasFileRef: boolean, textContent = 'Plurality and Weyl'): void {
    const zip = new AdmZip()
    zip.addFile('mimetype', Buffer.from('application/epub+zip'))
    zip.addFile('META-INF/container.xml', Buffer.from('<container><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>'))

    const navProp = hasNav ? 'properties="nav"' : ''
    const fileRef = hasFileRef ? 'file://unsafe-link' : 'valid-link'

    zip.addFile('OEBPS/content.opf', Buffer.from(`
      <package version="3.0" unique-identifier="pub-id">
        <manifest>
          <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" ${navProp}/>
          <item id="chapter1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
        </manifest>
        <spine>
          <itemref idref="chapter1"/>
        </spine>
      </package>
    `))
    zip.addFile('OEBPS/nav.xhtml', Buffer.from('<html xmlns="http://www.w3.org/1999/xhtml"><body><nav><h1>TOC</h1></nav></body></html>'))
    zip.addFile('OEBPS/chapter1.xhtml', Buffer.from(`<html xmlns="http://www.w3.org/1999/xhtml"><body><h1>Chapter 1</h1><p>${textContent}</p><a href="${fileRef}">link</a></body></html>`))
    zip.writeZip(path)
  }

  function baseManifest(root: string) {
    mkdirSync(join(root, 'contents', 'traditional-mandarin'), { recursive: true })
    writeFileSync(join(root, 'contents', 'english', '1-1-first.md'), '# First\n')
    writeFileSync(join(root, 'contents', 'traditional-mandarin', '1-1-first.md'), '# First\n')
    const manifest = generateManifest(root, '2024-01-02', 'rev')
    mkdirSync(join(root, 'legacy'), { recursive: true })
    return manifest
  }

  test('fails on PDF bad magic', async () => {
    const root = fixtureRoot('english')
    const manifest = baseManifest(root)

    writeFileSync(join(root, 'legacy', 'Plurality-english.pdf'), 'NOTAPDF')
    createMockEpub(join(root, 'legacy', 'Plurality-english.epub'), true, false)
    await createMockPdf(join(root, 'legacy', 'Plurality-traditional-mandarin.pdf'))
    createMockEpub(join(root, 'legacy', 'Plurality-traditional-mandarin.epub'), true, false, '多元與唐鳳')

    writeFileSync(join(root, 'manifest.json'), JSON.stringify(manifest))
    await expect(validateLegacy(root)).rejects.toThrow(/Invalid PDF magic number/)
  })

  test('fails on tiny file sizes', async () => {
    const root = fixtureRoot('english')
    const manifest = baseManifest(root)

    await createMockPdf(join(root, 'legacy', 'Plurality-english.pdf'))
    createMockEpub(join(root, 'legacy', 'Plurality-english.epub'), true, false)
    await createMockPdf(join(root, 'legacy', 'Plurality-traditional-mandarin.pdf'))
    createMockEpub(join(root, 'legacy', 'Plurality-traditional-mandarin.epub'), true, false, '多元與唐鳳')

    writeFileSync(join(root, 'manifest.json'), JSON.stringify(manifest))

    process.env.MIN_PDF_BYTES = '1000000'
    try {
      await expect(validateLegacy(root)).rejects.toThrow(/PDF file size too small/)
    } finally {
      delete process.env.MIN_PDF_BYTES
    }
  })

  test('fails on manifest source revision mismatch', async () => {
    const root = fixtureRoot('english')
    const manifest = baseManifest(root)

    await createMockPdf(join(root, 'legacy', 'Plurality-english.pdf'))
    createMockEpub(join(root, 'legacy', 'Plurality-english.epub'), true, false)
    await createMockPdf(join(root, 'legacy', 'Plurality-traditional-mandarin.pdf'))
    createMockEpub(join(root, 'legacy', 'Plurality-traditional-mandarin.epub'), true, false, '多元與唐鳳')

    writeFileSync(join(root, 'manifest.json'), JSON.stringify(manifest))

    process.env.EXPECTED_SOURCE_REVISION = 'other-rev'
    try {
      await expect(validateLegacy(root)).rejects.toThrow(/source revision mismatch/)
    } finally {
      delete process.env.EXPECTED_SOURCE_REVISION
    }
  })

  test('fails on missing EPUB navigation document', async () => {
    const root = fixtureRoot('english')
    const manifest = baseManifest(root)

    await createMockPdf(join(root, 'legacy', 'Plurality-english.pdf'))
    // EPUB missing nav properties!
    createMockEpub(join(root, 'legacy', 'Plurality-english.epub'), false, false)
    await createMockPdf(join(root, 'legacy', 'Plurality-traditional-mandarin.pdf'))
    createMockEpub(join(root, 'legacy', 'Plurality-traditional-mandarin.epub'), true, false, '多元與唐鳳')

    writeFileSync(join(root, 'manifest.json'), JSON.stringify(manifest))
    await expect(validateLegacy(root)).rejects.toThrow(/missing navigation document/)
  })

  test('accepts matching revision and well-formed legacy outputs', async () => {
    const root = fixtureRoot('english')
    const manifest = baseManifest(root)

    process.env.EXPECTED_SOURCE_REVISION = 'rev'
    try {
      await createMockPdf(join(root, 'legacy', 'Plurality-english.pdf'))
      createMockEpub(join(root, 'legacy', 'Plurality-english.epub'), true, false)
      await createMockPdf(join(root, 'legacy', 'Plurality-traditional-mandarin.pdf'))
      createMockEpub(join(root, 'legacy', 'Plurality-traditional-mandarin.epub'), true, false, '多元與唐鳳')

      writeFileSync(join(root, 'manifest.json'), JSON.stringify(manifest))
      await expect(validateLegacy(root)).resolves.toBeUndefined()
    } finally {
      delete process.env.EXPECTED_SOURCE_REVISION
    }
  })
})

describe('Candidate orchestrator', () => {
  test('removes old candidate outputs before prepare/build', async () => {
    const root = fixtureRoot('english')
    mkdirSync(join(root, 'scripts'), { recursive: true })
    writeFileSync(join(root, 'scripts', 'credits.json'), JSON.stringify(credits))
    writeFileSync(join(root, 'contents', 'english', '0-0-endorsements.md'), '# Endorsements\n')
    writeFileSync(join(root, 'contents', 'english', '1-1-test.md'), '# Title\n')

    const pdfPath = join(root, 'candidate', 'vivliostyle-en-candidate.pdf')
    const epubPath = join(root, 'candidate', 'vivliostyle-en-candidate.epub')
    mkdirSync(join(root, 'candidate'), { recursive: true })
    writeFileSync(pdfPath, 'old pdf')
    writeFileSync(epubPath, 'old epub')

    // Mock spawn to do nothing and succeed
    const mockSpawn = () => {
      writeFileSync(pdfPath, 'new pdf')
      writeFileSync(epubPath, 'new epub')
      return { status: 0 }
    }
    await renderLocale('en', '2024-01-02', root, mockSpawn)

    // Assert old files were removed and replaced with new outputs
    expect(readFileSync(pdfPath, 'utf8')).toBe('new pdf')
    expect(readFileSync(epubPath, 'utf8')).toBe('new epub')
  })

  test('propagates subprocess failure', async () => {
    const root = fixtureRoot('english')
    mkdirSync(join(root, 'scripts'), { recursive: true })
    writeFileSync(join(root, 'scripts', 'credits.json'), JSON.stringify(credits))
    writeFileSync(join(root, 'contents', 'english', '0-0-endorsements.md'), '# Endorsements\n')
    writeFileSync(join(root, 'contents', 'english', '1-1-test.md'), '# Title\n')

    // Mock spawn returning failure status
    const mockSpawnFailure = () => ({ status: 1 })
    await expect(renderLocale('en', '2024-01-02', root, mockSpawnFailure)).rejects.toThrow(/failed for en with exit code 1/)

    // Mock spawn throwing system error
    const mockSpawnError = () => ({ status: null, error: new Error('system error') })
    await expect(renderLocale('en', '2024-01-02', root, mockSpawnError)).rejects.toThrow(/system error/)
  })
})

describe('Legacy orchestrator', () => {
  test('asserts sequence, removes old outputs, and fails on no-output (no-fake artifacts)', async () => {
    const root = fixtureRoot('english')
    mkdirSync(join(root, 'scripts'), { recursive: true })
    writeFileSync(join(root, 'scripts', 'credits.json'), JSON.stringify(credits))
    writeFileSync(join(root, 'contents', 'english', '0-0-endorsements.md'), '# Endorsements\n')
    writeFileSync(join(root, 'contents', 'english', '1-1-test.md'), '# Title\n')
    writeFileSync(join(root, 'contents', 'english', '0-2-test.md'), '# Pre.tex source\n')

    const legacyDir = join(root, 'legacy')
    mkdirSync(legacyDir, { recursive: true })
    const pdfPath = join(legacyDir, 'Plurality-english.pdf')
    const epubPath = join(legacyDir, 'Plurality-english.epub')
    writeFileSync(pdfPath, 'old pdf')
    writeFileSync(epubPath, 'old epub')

    const commandsCalled: Array<{ cmd: string; args: string[] }> = []
    const mockSpawn = (cmd: string, args: string[]) => {
      commandsCalled.push({ cmd, args })
      return { status: 0 }
    }

    // Run renderLegacyLocale which should throw due to missing final outputs (no-fake artifacts)
    await expect(renderLegacyLocale('en', '2024-01-02', root, mockSpawn)).rejects.toThrow(/Expected legacy PDF output missing at/)

    // Assert old files were removed
    expect(existsSync(pdfPath)).toBe(false)
    expect(existsSync(epubPath)).toBe(false)

    // Assert sequence (no perl was called, only docker)
    expect(commandsCalled.length).toBe(5)
    commandsCalled.forEach(c => {
      expect(c.cmd).toBe('docker')
      expect(c.args).not.toContain('perl')
    })

    // Assert specific commands in sequence
    // Prepass 1 & 2
    expect(commandsCalled[0].args).toContain('--filter=/data/scripts/emoji_filter.js')
    expect(commandsCalled[0].args).toContain('dist/publication/.legacy-work/en/english.md')
    expect(commandsCalled[0].args).toContain('dist/publication/.legacy-work/en/tmp.tex')
    
    expect(commandsCalled[1].args).toContain('dist/publication/.legacy-work/en/tmp.tex')

    // XeLaTeX
    expect(commandsCalled[2].args).toContain('--pdf-engine=xelatex')
    expect(commandsCalled[2].args).toContain('dist/publication/.legacy-work/en/tmp.pdf')

    // pdftk
    expect(commandsCalled[3].args).toContain('--entrypoint')
    expect(commandsCalled[3].args).toContain('/usr/bin/pdftk')

    // epub
    expect(commandsCalled[4].args).toContain('dist/publication/legacy/Plurality-english.epub')
  })

  test('propagates subprocess failure', async () => {
    const root = fixtureRoot('english')
    mkdirSync(join(root, 'scripts'), { recursive: true })
    writeFileSync(join(root, 'scripts', 'credits.json'), JSON.stringify(credits))
    writeFileSync(join(root, 'contents', 'english', '0-0-endorsements.md'), '# Endorsements\n')
    writeFileSync(join(root, 'contents', 'english', '1-1-test.md'), '# Title\n')
    writeFileSync(join(root, 'contents', 'english', '0-2-test.md'), '# Pre.tex source\n')

    // Mock spawn returning failure status on the very first command
    const mockSpawnFailure = () => ({ status: 1 })
    await expect(renderLegacyLocale('en', '2024-01-02', root, mockSpawnFailure)).rejects.toThrow(/Docker command failed with exit code 1/)
  })
})

