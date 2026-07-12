import { join } from 'node:path'

const locale = process.env.BOOK_LOCALE || 'en'
const buildDir = process.env.BUILD_DIR || `dist/candidate/${locale}`
const outputRoot = process.env.OUTPUT_ROOT || join(buildDir, '..')

const isZh = locale === 'zh-TW'
const title = isZh ? '多元宇宙' : 'Plurality'
const author = isZh ? '衛谷倫、唐鳳、⿻社群' : 'E. Glen Weyl, Audrey Tang and ⿻ Community'
const language = isZh ? 'zh-TW' : 'en'
const cover = isZh ? 'scripts/cover-image.zh-tw.png' : 'scripts/cover-image.png'

export default {
  title,
  author,
  language,
  size: 'A4',
  theme: 'publication/book.css',
  cover,
  viteConfigFile: false,
  entry: [
    join(buildDir, 'manuscript.md')
  ],
  toc: {
    sectionDepth: 2
  },
  vfm: {
    footnote: 'dpub'
  },
  output: [
    {
      path: join(outputRoot, 'candidate', `vivliostyle-${locale}-candidate.pdf`),
      format: 'pdf'
    },
    {
      path: join(outputRoot, 'candidate', `vivliostyle-${locale}-candidate.epub`),
      format: 'epub'
    }
  ]
}
