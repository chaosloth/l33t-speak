import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'L33t Speak',
  description: 'Voice to Text for VS Code',
  base: '/',
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
  ],
  themeConfig: {
    logo: '/icon.png',
    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'Install', link: '/install' },
      { text: 'GitHub', link: 'https://github.com/chaosloth/l33t-speak' },
    ],
    sidebar: [
      {
        text: 'Getting Started',
        items: [
          { text: 'Installation', link: '/install' },
          { text: 'Quick Start', link: '/guide/' },
          { text: 'Configuration', link: '/guide/configuration' },
        ],
      },
      {
        text: 'Usage',
        items: [
          { text: 'Editor Dictation', link: '/guide/editor' },
          { text: 'Terminal & Claude Code', link: '/guide/terminal' },
          { text: 'Microphone Selection', link: '/guide/microphone' },
        ],
      },
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/chaosloth/l33t-speak' },
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Christopher Connolly',
    },
  },
})
