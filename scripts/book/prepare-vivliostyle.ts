import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, relative, resolve, isAbsolute } from 'node:path'
import { assembleLocale } from './build'

export function prepareVivliostyle(root: string, locale: 'en' | 'zh-TW', buildDir: string, bookDate: string): void {
  if (!locale || (locale !== 'en' && locale !== 'zh-TW')) {
    throw new Error(`Invalid BOOK_LOCALE: ${locale}`)
  }
  if (!buildDir || buildDir.trim() === '') {
    throw new Error('BUILD_DIR must be specified')
  }

  const resolvedRoot = resolve(root)
  const resolvedBuildDir = resolve(buildDir)
  const rel = relative(resolvedRoot, resolvedBuildDir)
  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error(`Unsafe BUILD_DIR: ${buildDir} is outside project root`)
  }

  const creditsPath = join(root, 'scripts', 'credits.json')
  if (!existsSync(creditsPath)) {
    throw new Error(`Credits file missing: ${creditsPath}`)
  }
  const creditsValue = JSON.parse(readFileSync(creditsPath, 'utf8'))

  // 1. Assemble raw manuscript
  const assembled = assembleLocale(root, locale, bookDate, creditsValue)
  let content = assembled.markdown

  // 2. Remove raw LaTeX fenced blocks
  content = content.replace(/^`{3,4}\{=latex\}[\s\S]*?^`{3,4}/gm, '')

  // 3. Unwrap raw HTML fenced blocks
  content = content.replace(/^`{3,4}\{=html\}\r?\n([\s\S]*?)^`{3,4}/gm, '$1')

  // 4. Resolve relative repository assets from the candidate source using computed path back to root
  const relPath = relative(buildDir, root)

  const isLocalRelativePath = (url: string): boolean => {
    if (!url) return false
    if (/^(?:https?:)?\/\//i.test(url)) return false
    if (/^data:/i.test(url)) return false
    if (url.startsWith('#')) return false
    if (url.startsWith('/')) return false
    return true
  }

  const rewriteUrl = (url: string): string => {
    // Rewrite raw.githubusercontent.com URLs for pluralitybook/plurality/<branch>/ to local repo relative paths
    let processed = url.replace(/^https:\/\/raw\.githubusercontent\.com\/pluralitybook\/plurality\/[^/]+\//i, '')
    
    if (isLocalRelativePath(processed)) {
      // Check if local asset exists relative to project root
      const fullAssetPath = join(root, processed)
      if (!existsSync(fullAssetPath)) {
        throw new Error(`Missing local asset: ${processed} (resolved to ${fullAssetPath})`)
      }
      return join(relPath, processed).replace(/\\/g, '/')
    }
    return url
  }

  // Markdown image link rewrite
  content = content.replace(/(!\[.*?\]\()([^)]+)(\))/g, (match, p1, p2, p3) => {
    return `${p1}${rewriteUrl(p2)}${p3}`
  })

  // HTML image tag src rewrite
  content = content.replace(/(<img\b[^>]*src=["'])([^"']+)(["'])/g, (match, p1, p2, p3) => {
    return `${p1}${rewriteUrl(p2)}${p3}`
  })
  // 5. Write out the candidate-ready manuscript
  mkdirSync(buildDir, { recursive: true })
  writeFileSync(join(buildDir, 'manuscript.md'), content)
}

// Cast import.meta to read Bun-specific main property during direct script execution
const meta = import.meta as unknown as { main: boolean }
if (meta.main) {
  const locale = process.env.BOOK_LOCALE as 'en' | 'zh-TW' | undefined
  if (!locale) throw new Error('BOOK_LOCALE is required (en|zh-TW)')
  const buildDir = process.env.BUILD_DIR
  if (!buildDir) throw new Error('BUILD_DIR is required')
  const bookDate = process.env.BOOK_DATE
  if (!bookDate) throw new Error('BOOK_DATE is required')
  prepareVivliostyle(process.cwd(), locale, buildDir, bookDate)
  console.log(`Vivliostyle preparation complete for ${locale} under ${buildDir}`)
}
