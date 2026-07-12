import { defineConfig } from 'vitepress'

const page = (path: string) => `/${path.replace(/\.md$/, '').split('/').map(encodeURIComponent).join('/')}`

export default defineConfig({
  title: 'Plurality Docs',
  description: 'Documentation for the Plurality book project and its community.',
  lang: 'en-US',
  cleanUrls: true,
  lastUpdated: true,
  head: [['link', { rel: 'icon', href: '/assets/favicon.png' }]],
  sitemap: { hostname: 'https://docs.plurality.net' },
  srcDir: '.',
  appearance: true,
  themeConfig: {
    logo: { src: '/assets/plurality%20logo.png', alt: 'Plurality' },
    nav: [
      { text: 'Start here', link: '/' },
      { text: 'Contribute', link: page('contributing/Getting started.md') },
      { text: 'Style guide', link: page('style guide/Book structure.md') },
      { text: 'Governance', link: page('governance/Governance introduction.md') },
    ],
    sidebar: [
      {
        text: 'Start here',
        items: [
          { text: 'Welcome', link: '/' },
          { text: 'About the book', link: page('home/About the Plurality book.md') },
          { text: 'About the project', link: page('home/About the Plurality project.md') },
          { text: 'Get involved', link: page('home/Get involved.md') },
        ],
      },
      {
        text: 'Contributing to the project',
        items: [
          { text: 'Introduction', link: page('contributing/Getting started.md') },
          { text: 'Beginners contribution guide', link: page('contributing/Beginners contribution guide.md') },
          { text: 'Content and edits', link: page('contributing/Contributing content and edits.md') },
          { text: 'Translations', link: page('contributing/Contributing translations.md') },
          { text: 'Figures and images', link: page('contributing/Contributing figures.md') },
          { text: 'Citations and references', link: page('contributing/Contributing citations.md') },
          { text: 'Contributing in other ways', link: page('contributing/Contributing in other ways.md') },
          { text: 'Contributing to the docs', link: page('contributing/Contributing to the docs.md') },
          { text: 'Pull Requests', link: page('contributing/Pull requests.md') },
        ],
      },
      {
        text: 'Book style guide',
        items: [
          { text: 'Book structure', link: page('style guide/Book structure.md') },
          { text: 'Punctuation and grammar', link: page('style guide/Punctuation and grammar.md') },
          { text: 'Figures', link: page('style guide/Images and figures.md') },
          { text: 'Citations and referencing', link: page('style guide/Citations and referencing.md') },
        ],
      },
      {
        text: 'Governance of the project',
        items: [
          { text: 'Introduction', link: page('governance/Governance introduction.md') },
          { text: 'Plural Credits', link: page('governance/Plural credits.md') },
          { text: 'Gov4Git', link: page('governance/Gov4Git.md') },
          { text: 'Plural Management Protocol', link: page('governance/Plural management protocol.md') },
        ],
      },
    ],
    outline: { level: [2, 3] },
    editLink: { pattern: 'https://github.com/pluralitybook/plurality/edit/main/docs/:path' },
    search: { provider: 'local' },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/pluralitybook/plurality' },
      { icon: 'discord', link: 'https://discord.gg/YWSDRqdW5n' },
    ],
    docFooter: { prev: 'Previous', next: 'Next' },
  },
  markdown: {
    toc: { level: [2, 3] },
  },
  srcExclude: ['_README.md'],
  ignoreDeadLinks: false,
})
