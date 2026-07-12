import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import AdmZip from 'adm-zip'
import { PDFDocument } from 'pdf-lib'

interface Chapter {
  id: string
  slug: string
  title: string
  path: string
}

interface LocaleManifest {
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
  chapters: Chapter[]
}

interface BookManifest {
  schemaVersion: string
  sourceRevision: string
  publicationDate: string
  locales: Record<'en' | 'zh-TW', LocaleManifest>
}

async function getPdfPageCount(filePath: string): Promise<number> {
  const content = readFileSync(filePath)
  const pdfDoc = await PDFDocument.load(content)
  return pdfDoc.getPageCount()
}

export async function validateCandidate(outputDir: string): Promise<void> {
  const manifestPath = join(outputDir, 'manifest.json')
  if (!existsSync(manifestPath)) {
    throw new Error(`Manifest file missing: ${manifestPath}`)
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as BookManifest

  const expectedSourceRevision = process.env.EXPECTED_SOURCE_REVISION
  if (expectedSourceRevision && manifest.sourceRevision !== expectedSourceRevision) {
    throw new Error(`Manifest source revision mismatch: expected ${expectedSourceRevision}, got ${manifest.sourceRevision}`)
  }

  const minPdfBytes = parseInt(process.env.MIN_PDF_BYTES ?? '10000', 10)
  const minEpubBytes = parseInt(process.env.MIN_EPUB_BYTES ?? '10000', 10)

  const locales: Array<'en' | 'zh-TW'> = ['en', 'zh-TW']
  for (const locale of locales) {
    const data = manifest.locales[locale]
    if (!data) {
      throw new Error(`Missing locale data in manifest: ${locale}`)
    }

    const manuscript = join(outputDir, data.manuscriptPath)
    const pdfPath = join(outputDir, data.vivliostyleOutputs.pdf)
    const epubPath = join(outputDir, data.vivliostyleOutputs.epub)

    // Verify paths differ from legacy paths
    if (data.vivliostyleOutputs.pdf === data.legacyOutputs.pdf) {
      throw new Error(`Path collision: Candidate PDF and Legacy PDF have identical paths: ${data.vivliostyleOutputs.pdf}`)
    }
    if (data.vivliostyleOutputs.epub === data.legacyOutputs.epub) {
      throw new Error(`Path collision: Candidate EPUB and Legacy EPUB have identical paths: ${data.vivliostyleOutputs.epub}`)
    }

    // 1. Verify manifest paths resolve exactly
    if (!existsSync(manuscript)) {
      throw new Error(`Manuscript missing at manifest path: ${manuscript}`)
    }
    if (!existsSync(pdfPath)) {
      throw new Error(`Candidate PDF missing at manifest path: ${pdfPath}`)
    }
    if (!existsSync(epubPath)) {
      throw new Error(`Candidate EPUB missing at manifest path: ${epubPath}`)
    }

    // 2. PDF Validation: magic / size / page count
    const pdfBuf = readFileSync(pdfPath)
    if (pdfBuf.length < 4 || pdfBuf.toString('utf8', 0, 4) !== '%PDF') {
      throw new Error(`Invalid PDF magic number in: ${pdfPath}`)
    }
    if (pdfBuf.length < minPdfBytes) {
      throw new Error(`PDF file size too small (${pdfBuf.length} bytes, minimum ${minPdfBytes}): ${pdfPath}`)
    }
    const pageCount = await getPdfPageCount(pdfPath)
    if (pageCount < 1) {
      throw new Error(`Invalid PDF page count (${pageCount}) in: ${pdfPath}`)
    }

    // 3. EPUB Validation: ZIP structure & contents
    let zip: AdmZip
    try {
      zip = new AdmZip(epubPath)
    } catch (err: unknown) {
      throw new Error(`Failed to open EPUB as ZIP: ${epubPath}. Error: ${String(err)}`)
    }

    // Check mimetype file
    const mimetypeEntry = zip.getEntry('mimetype')
    if (!mimetypeEntry) {
      throw new Error(`EPUB missing mimetype entry: ${epubPath}`)
    }
    const mimetypeContent = mimetypeEntry.getData().toString('utf8').trim()
    if (mimetypeContent !== 'application/epub+zip') {
      throw new Error(`Invalid mimetype: ${mimetypeContent}`)
    }

    // Check container.xml
    const containerEntry = zip.getEntry('META-INF/container.xml')
    if (!containerEntry) {
      throw new Error(`EPUB missing container.xml: ${epubPath}`)
    }

    // Parse spine and content files from OPF
    const zipEntries = zip.getEntries()
    const opfEntry = zipEntries.find((entry) => entry.entryName.endsWith('.opf'))
    if (!opfEntry) {
      throw new Error(`EPUB missing OPF package file: ${epubPath}`)
    }
    const opfContent = opfEntry.getData().toString('utf8')

    // Verify EPUB navigation document/property is present in the OPF manifest
    const hasNav = opfContent.includes('properties="nav"') || opfContent.includes("properties='nav'") || opfContent.includes('media-type="application/x-dtbncx+xml"')
    if (!hasNav) {
      throw new Error(`EPUB missing navigation document (properties="nav" or toc.ncx) in OPF manifest: ${epubPath}`)
    }

    // Scan all textual EPUB entries for forbidden file:// references
    const textExtensions = ['.opf', '.xml', '.xhtml', '.html', '.css', '.ncx']
    for (const entry of zipEntries) {
      const isText = textExtensions.some((ext) => entry.entryName.toLowerCase().endsWith(ext))
      if (isText) {
        const text = entry.getData().toString('utf8')
        if (text.includes('file://')) {
          throw new Error(`Forbidden file:// reference found in EPUB file: ${entry.entryName} inside ${epubPath}`)
        }
      }
    }

    // Find content documents referenced in OPF (usually href="...html" or href="...xhtml")
    const hrefMatches = [...opfContent.matchAll(/href=["']([^"']+\.[x]?html?)["']/gi)]
    if (hrefMatches.length === 0) {
      throw new Error(`OPF package file defines no content documents: ${epubPath}`)
    }

    let hasLocaleText = false
    const localeKeywords = locale === 'en' ? ['Plurality', 'Weyl'] : ['多元', '唐鳳']

    for (const match of hrefMatches) {
      const href = match[1]
      // Find the entry in the ZIP file. The path in OPF is relative to the OPF directory
      const opfDir = opfEntry.entryName.includes('/')
        ? opfEntry.entryName.substring(0, opfEntry.entryName.lastIndexOf('/'))
        : ''
      const entryPath = opfDir ? `${opfDir}/${href}` : href
      const entry = zip.getEntry(entryPath)
      if (!entry) {
        throw new Error(`Content file listed in OPF does not exist in ZIP: ${entryPath}`)
      }

      const content = entry.getData().toString('utf8')
      if (content.trim() === '') {
        throw new Error(`Empty content file: ${entryPath}`)
      }

      for (const kw of localeKeywords) {
        if (content.includes(kw)) {
          hasLocaleText = true
        }
      }
    }

    if (!hasLocaleText) {
      throw new Error(`Locale-required keywords (${localeKeywords.join(', ')}) not found in content of EPUB: ${epubPath}`)
    }
  }

  console.log('Candidate outputs successfully validated against manifest specifications!')
}

// Cast import.meta to read Bun-specific main property during direct script execution
const meta = import.meta as unknown as { main: boolean }
if (meta.main) {
  const [outputDir] = process.argv.slice(2)
  const targetDir = outputDir || 'dist/publication'
  validateCandidate(targetDir).catch((err: unknown) => {
    console.error('Validation failed:', err)
    process.exit(1)
  })
}
