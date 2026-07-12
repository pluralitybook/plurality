declare module '*/publication/vivliostyle.config.mjs' {
  const config: {
    title: string
    author: string
    language: string
    size: string
    theme: string
    cover: string
    entry: string[]
    toc: { sectionDepth: number }
    vfm: { footnote: string }
    output: Array<{ path: string; format: string }>
  }
  export default config
}
